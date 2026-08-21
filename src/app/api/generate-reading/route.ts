export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireSupabaseAdmin, TABLES } from "@/lib/supabase";
import { getChartPersistent, saveChartPersistent } from "@/lib/storage";
import { runChart } from "@/lib/chart";
import { generateAnalysis, isLLMConfigured } from "@/lib/llm";
import fs from "fs";
import path from "path";
import { isUnauthorized, requireAuthenticatedUser } from "@/lib/auth";

/**
 * POST /api/generate-reading
 *
 * Generates a full Bazi+Ziwei combined reading using DeepSeek API.
 * Requires the user to have unlocked this chart.
 *
 * Body: chartId plus either a Supabase bearer session or a claimed one-time
 * claimToken tied to that exact chart.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chartId, claimToken } = body;

    if (!chartId || typeof chartId !== "string" || !/^[a-zA-Z0-9_-]{1,64}$/.test(chartId)) {
      return NextResponse.json({ error: "A valid chartId is required" }, { status: 400 });
    }

    const db = requireSupabaseAdmin();

    // Normal account sessions remain supported. The seamless Gumroad flow has
    // no Supabase login session, so a claimed one-time token may authorize only
    // the exact chart attached to that purchase.
    let authUser: Awaited<ReturnType<typeof requireAuthenticatedUser>> | null = null;
    try {
      authUser = await requireAuthenticatedUser(request);
    } catch (error) {
      if (!isUnauthorized(error)) throw error;
    }

    let normalizedEmail = authUser?.email || "";
    let claimAuthorized = false;
    if (!authUser) {
      if (typeof claimToken !== "string" || !/^[a-f0-9]{64}$/.test(claimToken)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: claim, error: claimError } = await db
        .from(TABLES.claimTokens)
        .select("email, chart_id, status, expires_at")
        .eq("token", claimToken)
        .eq("chart_id", chartId)
        .eq("status", "claimed")
        .maybeSingle();

      if (claimError) throw new Error(`Failed to verify claim: ${claimError.message}`);
      if (!claim?.email || new Date(claim.expires_at) < new Date()) {
        return NextResponse.json({ error: "Invalid or expired claim token" }, { status: 401 });
      }

      normalizedEmail = claim.email.toLowerCase().trim();
      claimAuthorized = true;
    }

    // Verify user has unlocked this chart
    const userResult = authUser
      ? await db
          .from(TABLES.users)
          .select("id, unlocked_charts, report_unlocks_remaining")
          .eq("email", normalizedEmail)
          .eq("auth_user_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : await db
          .from(TABLES.users)
          .select("id, unlocked_charts, report_unlocks_remaining")
          .eq("email", normalizedEmail)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

    if (userResult.error) throw new Error(`Failed to verify entitlement: ${userResult.error.message}`);
    const user = userResult.data;

    const unlockedCharts: string[] = user?.unlocked_charts || [];
    const hasMoreUnlocks = (user?.report_unlocks_remaining || 0) > 0;

    if (!user || (!claimAuthorized && !unlockedCharts.includes(chartId) && !hasMoreUnlocks)) {
      return NextResponse.json(
        { error: "Chart not unlocked. Please complete payment first." },
        { status: 403 }
      );
    }

    // Check Supabase cache first
    const { data: cached, error: cacheLookupError } = await db
      .from(TABLES.chartCache)
      .select("analysis_text, chart_data")
      .eq("chart_id", chartId)
      .maybeSingle();
    if (cacheLookupError) throw new Error(`Failed to load chart cache: ${cacheLookupError.message}`);

    if (cached?.analysis_text) {
      await consumeUnlockIfNeeded(db, user, chartId, unlockedCharts);
      return NextResponse.json({ analysis: cached.analysis_text, source: "cache", chartId });
    }

    // Server data is authoritative. Never accept client-supplied chart text.
    let data: any = cached?.chart_data || await getChartPersistent(chartId);
    if (!data) {
      const birthInfo = normalizeBirthInfo(body.birthInfo);
      if (!birthInfo) {
        return NextResponse.json({ error: "Chart data not found" }, { status: 404 });
      }

      const recomputed = runChart(birthInfo);
      data = {
        birthInfo,
        chart: recomputed.json,
        chartText: recomputed.text,
        createdAt: Date.now(),
      };
      await saveChartPersistent(chartId, data);
    }
    const textForLLM = data.chartText;

    if (!isLLMConfigured()) {
      const { generateAnalysisText } = await import("@/lib/analysis");
      const analysisChart = data.chart;
      const analysisBirthInfo = data.birthInfo;
      const text = generateAnalysisText(analysisChart, analysisBirthInfo);
      await consumeUnlockIfNeeded(db, user, chartId, unlockedCharts);
      return NextResponse.json({ analysis: text, source: "algorithm", chartId });
    }

    // Load system prompt (skill-style: 3-phase analysis)
    const promptPath = path.join(process.cwd(), "prompts", "zonghe-yinzheng-prompt.md");
    let systemPrompt: string;
    if (fs.existsSync(promptPath)) {
      systemPrompt = fs.readFileSync(promptPath, "utf-8");
    } else {
      systemPrompt = `You are a master of Chinese astrology — BaZi and Zi Wei Dou Shu. Analyze this chart and produce a comprehensive reading with sections: Overview, Career & Wealth, Relationships, Health, Life Cycles, and Guidance. Write warmly and authoritatively.`;
    }

    // Build user message: birth info + chart data (for skill-style 3-phase analysis)
    const bi = data.birthInfo;
    const userMessage = [
      `## 出生信息`,
      `- 性別：${bi.gender === 'male' ? '男' : '女'}`,
      `- 出生日期：${bi.year}年${bi.month}月${bi.day}日 ${String(bi.hour).padStart(2, '0')}:${String(bi.minute).padStart(2, '0')}`,
      `- 曆法：${bi.isLunar ? '農曆' : '公曆'}`,
      ``,
      `## 算法層命盤數據`,
      textForLLM,
    ].join('\n');

    const analysis = await generateAnalysis(systemPrompt, userMessage, { maxTokens: 8192 });

    // Cache result in Supabase
    const { error: cacheWriteError } = await db
      .from(TABLES.chartCache)
      .upsert(
        { chart_id: chartId, analysis_text: analysis, created_at: new Date().toISOString() },
        { onConflict: "chart_id" }
      );
    if (cacheWriteError) throw new Error(`Failed to cache reading: ${cacheWriteError.message}`);

    // Consume one unlock if chart wasn't already unlocked
    await consumeUnlockIfNeeded(db, user, chartId, unlockedCharts);

    return NextResponse.json({ analysis, source: "deepseek", chartId });
  } catch (error: any) {
    if (isUnauthorized(error)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("generate-reading error:", error);
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
  }
}

function normalizeBirthInfo(value: any) {
  if (!value || typeof value !== "object") return null;
  const year = Number(value.year);
  const month = Number(value.month);
  const day = Number(value.day);
  const hour = Number(value.hour);
  const minute = Number(value.minute);
  const gender = value.gender;

  if (
    !Number.isInteger(year) || year < 1900 || year > 2100 ||
    !Number.isInteger(month) || month < 1 || month > 12 ||
    !Number.isInteger(day) || day < 1 || day > 31 ||
    !Number.isInteger(hour) || hour < 0 || hour > 23 ||
    !Number.isInteger(minute) || minute < 0 || minute > 59 ||
    (gender !== "male" && gender !== "female")
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
    hour,
    minute,
    gender: gender as "male" | "female",
    isLunar: value.isLunar === true,
  };
}

/**
 * Consume one report_unlocks_remaining if this chart isn't already in
 * the user's unlocked_charts. Called after a successful read.
 */
async function consumeUnlockIfNeeded(
  db: ReturnType<typeof requireSupabaseAdmin>,
  user: any,
  chartId: string,
  unlockedCharts: string[],
) {
  if (!user) return;
  if (unlockedCharts.includes(chartId)) return; // already consumed for this chart
  if ((user.report_unlocks_remaining || 0) <= 0) return; // no unlocks to consume

  unlockedCharts.push(chartId);
  const { error } = await db
    .from(TABLES.users)
    .update({
      unlocked_charts: unlockedCharts,
      report_unlocks_remaining: (user.report_unlocks_remaining || 1) - 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) throw new Error(`Failed to consume unlock: ${error.message}`);
}
