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
// Lazily loaded to surface clear errors if prebuild didn't run.

let _createChart: any;
let _getZhiCangGanFull: any;
let _enrichBazi: any;

function loadCalcModules() {
  if (_createChart) return; // already loaded
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _createChart = require('./calculator/yiqi-core/index').createChart;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _getZhiCangGanFull = require('./calculator/yiqi-core/bazi').getZhiCangGanFull;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _enrichBazi = require('./calculator/bazi-enrich/enrich').enrichBazi;
  } catch (e: any) {
    const cwd = process.cwd();
    const files = [
      'src/lib/calculator/yiqi-core/index.js',
      'src/lib/calculator/yiqi-core/bazi.js',
      'src/lib/calculator/bazi-enrich/enrich.js',
    ];
    const missing = files.filter(f => !fs.existsSync(path.join(cwd, f)));
    throw new Error(
      `Calculator modules not found. Run 'npm run copy-calc-deps' first. ` +
      `cwd=${cwd} missing=${missing.join(',') || 'none (other error)'} error=${e.message}`
    );
  }
}

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
  loadCalcModules();
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
  const chart = _createChart(internalBirthInfo);

  // 附加地支藏干(含十神)
  const dm = chart.bazi.dayMaster;
  const z = chart.bazi.siZhu;
  chart.bazi.cangGan = {
    year: _getZhiCangGanFull(z.year.zhi, dm),
    month: _getZhiCangGanFull(z.month.zhi, dm),
    day: _getZhiCangGanFull(z.day.zhi, dm),
    hour: _getZhiCangGanFull(z.hour.zhi, dm),
  };

  // 补 endAge 字段
  if (chart.bazi.dayun && Array.isArray(chart.bazi.dayun)) {
    for (const d of chart.bazi.dayun) {
      if (d.startAge !== undefined && d.endAge === undefined) {
        d.endAge = d.startAge + 9;
      }
    }
  }

  // Step 2: enrichBazi 补层
  chart.bazi.enrichment = _enrichBazi({
    '年': chart.bazi.siZhu.year,
    '月': chart.bazi.siZhu.month,
    '日': chart.bazi.siZhu.day,
    '时': chart.bazi.siZhu.hour,
  });

  // Step 3: dump-text (secondary — text formatting via child process)
  const tmpJson = path.join(TMP, `.chart-${Date.now()}.json`);
  fs.writeFileSync(tmpJson, JSON.stringify(chart), 'utf-8');

  let text: string;
  try {
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
    // dump-text is secondary — if it fails, return chart without text
    console.error('[dump-text] failed (non-fatal):', (e.stderr || e.message || '').toString().slice(-300));
    text = JSON.stringify(chart);
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
