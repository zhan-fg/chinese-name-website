import { supabaseAdmin } from "./supabase";

const FREE_USES = 3;
const MAX_FREE_ACCOUNTS_PER_IP = 2;
const DAILY_LIMIT = 50;

interface UserRow {
  id: string;
  anonymous_id: string;
  email: string | null;
  free_uses_remaining: number;
  credits_remaining: number;
  subscription_status: string;
  subscription_end: string | null;
  stripe_customer_id: string | null;
  ip_address: string | null;
  daily_uses: number | null;
  daily_date: string | null;
  created_at: string;
  updated_at: string;
}

let _dailyColumnsExist: boolean | null = null;
async function dailyColumnsReady(): Promise<boolean> {
  if (_dailyColumnsExist !== null) return _dailyColumnsExist;
  try {
    const { error } = await supabaseAdmin.from("users").select("daily_uses").limit(1);
    _dailyColumnsExist = !error;
  } catch {
    _dailyColumnsExist = false;
  }
  return _dailyColumnsExist;
}

function toRow(data: Record<string, unknown> | null, hasDaily: boolean): UserRow {
  const d = (data || {}) as Record<string, unknown>;
  return {
    id: (d.id as string) || "",
    anonymous_id: (d.anonymous_id as string) || "",
    email: (d.email as string) || null,
    free_uses_remaining: (d.free_uses_remaining as number) ?? 0,
    credits_remaining: (d.credits_remaining as number) ?? 0,
    subscription_status: (d.subscription_status as string) || "none",
    subscription_end: (d.subscription_end as string) || null,
    stripe_customer_id: (d.stripe_customer_id as string) || null,
    ip_address: (d.ip_address as string) || null,
    daily_uses: hasDaily ? ((d.daily_uses as number) ?? 0) : 0,
    daily_date: hasDaily ? ((d.daily_date as string) || null) : null,
    created_at: (d.created_at as string) || "",
    updated_at: (d.updated_at as string) || "",
  };
}

export async function ensureUser(anonymousId: string, ip?: string): Promise<UserRow> {
  const hasDaily = await dailyColumnsReady();

  const { data: row } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("anonymous_id", anonymousId)
    .single();

  if (row) return toRow(row as Record<string, unknown>, hasDaily);

  // New user
  let freeUses = FREE_USES;
  if (ip) {
    try {
      const { count } = await supabaseAdmin
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gt("free_uses_remaining", 0);
      if (count && count >= MAX_FREE_ACCOUNTS_PER_IP) freeUses = 0;
    } catch {}
  }

  const ins: Record<string, unknown> = {
    anonymous_id: anonymousId,
    free_uses_remaining: freeUses,
    credits_remaining: 0,
    subscription_status: "none",
  };
  if (hasDaily) {
    ins.daily_uses = 0;
    ins.daily_date = new Date().toISOString().slice(0, 10);
  }

  const { data: created, error } = await supabaseAdmin
    .from("users")
    .insert(ins)
    .select("*")
    .single();

  if (error || !created) {
    console.error("Failed to create user:", error);
    throw new Error("Cannot create user: " + (error?.message || "unknown"));
  }

  if (ip) {
    try {
      await supabaseAdmin.from("users").update({ ip_address: ip }).eq("id", (created as Record<string, unknown>).id);
    } catch {}
  }

  return toRow(created as Record<string, unknown>, hasDaily);
}

export async function getAvailableUses(anonymousId: string, ip?: string): Promise<{
  freeRemaining: number;
  creditsRemaining: number;
  totalRemaining: number;
  isSubscriber: boolean;
  dailyRemaining?: number;
}> {
  const u = await ensureUser(anonymousId, ip);
  const isSubscriber = u.subscription_status === "active";

  if (isSubscriber && u.daily_date !== null) {
    const today = new Date().toISOString().slice(0, 10);
    const used = u.daily_date === today ? (u.daily_uses ?? 0) : 0;
    const remaining = Math.max(0, DAILY_LIMIT - used);
    return {
      freeRemaining: u.free_uses_remaining,
      creditsRemaining: u.credits_remaining,
      totalRemaining: remaining > 0 ? 999_999 : 0,
      isSubscriber,
      dailyRemaining: remaining,
    };
  }

  return {
    freeRemaining: u.free_uses_remaining,
    creditsRemaining: u.credits_remaining,
    totalRemaining: u.free_uses_remaining + u.credits_remaining + (isSubscriber ? 999_999 : 0),
    isSubscriber,
  };
}

export async function deductUse(anonymousId: string): Promise<void> {
  const u = await ensureUser(anonymousId);

  if (u.subscription_status === "active") {
    if (u.daily_date !== null) {
      const today = new Date().toISOString().slice(0, 10);
      const newDaily = u.daily_date === today ? (u.daily_uses ?? 0) + 1 : 1;
      if (newDaily > DAILY_LIMIT) throw new Error(`Daily limit reached (${DAILY_LIMIT}/day)`);
      const { error } = await supabaseAdmin
        .from("users")
        .update({ daily_uses: newDaily, daily_date: today, updated_at: new Date().toISOString() })
        .eq("id", u.id);
      if (error) throw new Error(`Subscriber deduction failed: ${error.message}`);
    }
    return;
  }

  if (u.free_uses_remaining > 0) {
    const { error } = await supabaseAdmin
      .from("users")
      .update({ free_uses_remaining: u.free_uses_remaining - 1, updated_at: new Date().toISOString() })
      .eq("id", u.id)
      .eq("free_uses_remaining", u.free_uses_remaining);
    if (error) throw new Error(`Deduction failed: ${error.message}`);
  } else if (u.credits_remaining > 0) {
    const { error } = await supabaseAdmin
      .from("users")
      .update({ credits_remaining: u.credits_remaining - 1, updated_at: new Date().toISOString() })
      .eq("id", u.id)
      .eq("credits_remaining", u.credits_remaining);
    if (error) throw new Error(`Deduction failed: ${error.message}`);
  }
}

export async function addCredits(stripeCustomerId: string, amount: number): Promise<void> {
  const { error } = await supabaseAdmin.rpc("add_credits", { p_stripe_customer_id: stripeCustomerId, p_amount: amount });
  if (error) {
    const { data: user } = await supabaseAdmin.from("users").select("id, credits_remaining").eq("stripe_customer_id", stripeCustomerId).single();
    if (user) await supabaseAdmin.from("users").update({ credits_remaining: (user.credits_remaining || 0) + amount, updated_at: new Date().toISOString() }).eq("id", user.id);
  }
}

export async function addCreditsByAnonymousId(anonymousId: string, amount: number): Promise<void> {
  const { data: user } = await supabaseAdmin.from("users").select("id, credits_remaining").eq("anonymous_id", anonymousId).single();
  if (!user) return;
  await supabaseAdmin.from("users").update({ credits_remaining: (user.credits_remaining || 0) + amount, updated_at: new Date().toISOString() }).eq("id", user.id);
}

export async function setSubscriptionStatus(stripeCustomerId: string, status: "active" | "cancelled" | "past_due", subscriptionEnd?: string): Promise<void> {
  await supabaseAdmin.from("users").update({ subscription_status: status, subscription_end: subscriptionEnd || null, updated_at: new Date().toISOString() }).eq("stripe_customer_id", stripeCustomerId);
}

export async function linkStripeCustomer(anonymousId: string, stripeCustomerId: string, email?: string): Promise<void> {
  await supabaseAdmin.from("users").update({ stripe_customer_id: stripeCustomerId, email: email || undefined, updated_at: new Date().toISOString() }).eq("anonymous_id", anonymousId);
}
