import path from 'path';
import fs from 'fs';
import os from 'os';

const TMP = os.tmpdir();
const TEMPLATE_PATH = path.join(process.cwd(), 'templates', 'report-zonghe-poster.html');
const DEBUG = process.env.DEBUG === '1';

function log(msg: string) {
  if (DEBUG) console.error(`[chart.ts] ${msg}`);
}

// ─── Calculator modules (copied from calculator/dist/ by prebuild) ───

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createChart } = require('./calculator/yiqi-core/index');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getZhiCangGanFull } = require('./calculator/yiqi-core/bazi');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { enrichBazi } = require('./calculator/bazi-enrich/enrich');

export interface ChartResult {
  json: any;
  text: string;
}

interface BirthInfo {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: 'male' | 'female';
  isLunar?: boolean;
  timeZone?: number;
}

export function runChart(birthInfo: BirthInfo): ChartResult {
  log(`runChart: ${JSON.stringify(birthInfo)}`);

  const internalBirthInfo = {
    year: birthInfo.year,
    month: birthInfo.month,
    day: birthInfo.day,
    hour: birthInfo.hour,
    minute: birthInfo.minute,
    isLunar: birthInfo.isLunar ?? false,
    gender: birthInfo.gender,
    timeZone: birthInfo.timeZone ?? 8,
  };

  // Step 1: Yiqi core — 四柱+紫微+大运+流年
  const chart = createChart(internalBirthInfo);

  // 附加地支藏干(含十神)
  const dm = chart.bazi.dayMaster;
  const z = chart.bazi.siZhu;
  chart.bazi.cangGan = {
    year: getZhiCangGanFull(z.year.zhi, dm),
    month: getZhiCangGanFull(z.month.zhi, dm),
    day: getZhiCangGanFull(z.day.zhi, dm),
    hour: getZhiCangGanFull(z.hour.zhi, dm),
  };

  // 补 endAge 字段
  if (chart.bazi.dayun && Array.isArray(chart.bazi.dayun)) {
    for (const d of chart.bazi.dayun) {
      if (d.startAge !== undefined && d.endAge === undefined) {
        d.endAge = d.startAge + 9;
      }
    }
  }

  // Step 2: enrichBazi 补层 — 格局/旺衰/调候/刑冲合害/盖头
  const siZhuForEnrich: Record<string, any> = {
    '年': chart.bazi.siZhu.year,
    '月': chart.bazi.siZhu.month,
    '日': chart.bazi.siZhu.day,
    '时': chart.bazi.siZhu.hour,
  };
  chart.bazi.enrichment = enrichBazi(siZhuForEnrich);

  // Step 3: dump-text — 写 chart 到 /tmp, 用 dump-text.js 生成文本
  const tmpJson = path.join(TMP, `.chart-${Date.now()}.json`);
  fs.writeFileSync(tmpJson, JSON.stringify(chart), 'utf-8');

  let text: string;
  try {
    // dump-text.js is a CLI script — we exec it once for text output
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require('child_process');
    const calcDir = path.join(process.cwd(), 'calculator');
    text = execSync(`node dist/dump-text.js --input=${tmpJson}`, {
      cwd: calcDir,
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024,
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (e: any) {
    const stderr = e.stderr?.toString() || '';
    const stdout = e.stdout?.toString() || '';
    console.error('[dump-text] failed:', stderr.slice(-500));
    throw new Error(stderr.trim() || stdout.trim() || e.message || 'dump-text failed');
  } finally {
    try { fs.unlinkSync(tmpJson); } catch {}
  }

  return { json: chart, text };
}

export function renderPosterHTML(
  chartJson: any,
  analysisJson: any,
  currentYear: number
): string {
  const tmpChart = path.join(TMP, `.poster-chart-${Date.now()}.json`);
  const tmpAnalysis = path.join(TMP, `.poster-analysis-${Date.now()}.json`);

  fs.writeFileSync(tmpChart, JSON.stringify(chartJson), 'utf-8');
  fs.writeFileSync(tmpAnalysis, JSON.stringify(analysisJson), 'utf-8');

  let html: string;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { execSync } = require('child_process');
    const calcDir = path.join(process.cwd(), 'calculator');
    html = execSync(
      `node dist/render.js --chart=${tmpChart} --analysis=${tmpAnalysis} --template=${TEMPLATE_PATH} --currentYear=${currentYear}`,
      {
        cwd: calcDir,
        encoding: 'utf-8',
        maxBuffer: 1024 * 1024,
        timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );
  } catch (e: any) {
    const stderr = e.stderr?.toString() || '';
    console.error('[render] failed:', stderr.slice(-500));
    throw new Error(stderr.trim() || e.message || 'render failed');
  } finally {
    try { fs.unlinkSync(tmpChart); } catch {}
    try { fs.unlinkSync(tmpAnalysis); } catch {}
  }

  const htmlStart = html.indexOf('<!DOCTYPE');
  return htmlStart >= 0 ? html.slice(htmlStart) : html;
}
