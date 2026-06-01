/**
 * Bazi (八字) / Four Pillars of Destiny calculation
 *
 * Calculates the Four Pillars (年柱 月柱 日柱 时柱) from a birth date,
 * then analyzes the Five Elements balance to determine which elements
 * need supplementation in a name.
 */

// ============================================================
// Constants
// ============================================================

const HEAVENLY_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// Stem Five Elements (天干五行)
const STEM_ELEMENT: Record<string, string> = {
  甲: "木", 乙: "木",
  丙: "火", 丁: "火",
  戊: "土", 己: "土",
  庚: "金", 辛: "金",
  壬: "水", 癸: "水",
};

// Branch Five Elements (地支五行)
const BRANCH_ELEMENT: Record<string, string> = {
  寅: "木", 卯: "木",
  巳: "火", 午: "火",
  辰: "土", 戌: "土", 丑: "土", 未: "土",
  申: "金", 酉: "金",
  亥: "水", 子: "水",
};

// Hidden stems in each branch (地支藏干) — main qi only
const BRANCH_HIDDEN_STEM: Record<string, string> = {
  子: "癸", 丑: "己", 寅: "甲", 卯: "乙",
  辰: "戊", 巳: "丙", 午: "丁", 未: "己",
  申: "庚", 酉: "辛", 戌: "戊", 亥: "壬",
};

// Sexagenary cycle names (六十甲子)
function sexagenaryName(stemIdx: number, branchIdx: number): string {
  return HEAVENLY_STEMS[stemIdx % 10] + EARTHLY_BRANCHES[branchIdx % 12];
}

// ============================================================
// Solar terms (节气) — approximate dates for month pillar
// ============================================================

interface SolarTerm {
  name: string;
  month: number;  // 1=Jan, 12=Dec
  day: number;
}

// Approximate solar term dates (modern Gregorian, ±1 day accuracy)
// The month pillar changes at 节 (jie), not 气 (qi)
const JIE_TERMS: SolarTerm[] = [
  { name: "立春", month: 2, day: 4 },   // Start of 寅月 (Month 1)
  { name: "惊蛰", month: 3, day: 6 },   // Start of 卯月 (Month 2)
  { name: "清明", month: 4, day: 5 },   // Start of 辰月 (Month 3)
  { name: "立夏", month: 5, day: 6 },   // Start of 巳月 (Month 4)
  { name: "芒种", month: 6, day: 6 },   // Start of 午月 (Month 5)
  { name: "小暑", month: 7, day: 7 },   // Start of 未月 (Month 6)
  { name: "立秋", month: 8, day: 8 },   // Start of 申月 (Month 7)
  { name: "白露", month: 9, day: 8 },   // Start of 酉月 (Month 8)
  { name: "寒露", month: 10, day: 8 },  // Start of 戌月 (Month 9)
  { name: "立冬", month: 11, day: 8 },  // Start of 亥月 (Month 10)
  { name: "大雪", month: 12, day: 7 },  // Start of 子月 (Month 11)
  { name: "小寒", month: 1, day: 6 },   // Start of 丑月 (Month 12)
];

// ============================================================
// Hour to branch mapping
// ============================================================

// Hour-to-branch: (hour+1)%24/2 → branch index 0=子, 1=丑, ..., 11=亥
// Used inline in getHourPillar()

// ============================================================
// Core calculation
// ============================================================

export interface Pillar {
  stem: string;
  branch: string;
  fullName: string; // e.g. "甲子"
}

export interface BaziResult {
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar;
  dayMaster: string; // 日主 (the day stem)
  dayMasterElement: string; // e.g. "木"
  elementCounts: Record<string, number>; // 金木水火土 counts
  weakElements: string[]; // elements needing supplementation
  strongElements: string[]; // overrepresented elements
  birthInfo: {
    year: number;
    month: number;
    day: number;
    hour: number;
    location: string;
  };
}

/**
 * Julian Day Number at midnight UTC
 * Uses the Fliegel-Van Flandern algorithm
 */
function julianDay(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
}

/**
 * Get lunar month index (0-11, where 0=寅月) based on Gregorian date
 */
function getLunarMonthIndex(year: number, month: number, day: number): number {
  // Compare with solar terms
  for (let i = JIE_TERMS.length - 1; i >= 0; i--) {
    const term = JIE_TERMS[i];
    const termMonth = term.month;
    const termDay = term.day;

    // Adjust for cross-year terms (小寒 is in January but belongs to previous lunar year)
    if (termMonth === month) {
      if (day >= termDay) return i;
    } else if (
      (month === termMonth + 1 && day < termDay) ||
      // Handle wrap-around: if month is Jan and term is in Feb
      (termMonth === 2 && month === 1)
    ) {
      // actually let me simplify this
    }
  }

  // Simpler approach: compare dates
  const dateVal = month * 100 + day;

  for (let i = 0; i < JIE_TERMS.length; i++) {
    const term = JIE_TERMS[i];
    const termVal = term.month * 100 + term.day;

    if (dateVal >= termVal) {
      // Check if next term is later
      const nextIdx = (i + 1) % JIE_TERMS.length;
      const nextTerm = JIE_TERMS[nextIdx];
      const nextVal = nextTerm.month * 100 + nextTerm.day;

      // Handle year boundary
      if (nextIdx === 0) {
        // Next term is 小寒 (Jan 6), which is in next year
        return i;
      }

      if (dateVal < nextVal) return i;
    }
  }

  // Default: if after 大雪 (Dec 7) and before 小寒 (Jan 6), it's 子月
  return 10; // 子月
}

/**
 * Year stem and branch indices based on year number
 * Sexagenary cycle: (year - 4) % 60
 */
function getYearPillar(year: number): Pillar {
  const cycleIdx = ((year - 4) % 60 + 60) % 60;
  const stemIdx = cycleIdx % 10;
  const branchIdx = cycleIdx % 12;
  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
    fullName: sexagenaryName(stemIdx, branchIdx),
  };
}

/**
 * Month pillar: month stem depends on year stem
 * Rule: 甲己之年丙作首 (Year Stem 甲/己 → Month 1 Stem 丙)
 */
function getMonthPillar(yearStem: string, month: number, day: number): Pillar {
  const lunarMonthIdx = getLunarMonthIndex(yearStem === "甲" || yearStem === "己" ? 2025 : 2025, month, day);

  // The lunar month index 0=寅月 maps to branch idx 2
  const branchIdx = (lunarMonthIdx + 2) % 12;

  // Month stem: based on year stem
  // 甲己 → 丙寅(2), 乙庚 → 戊寅(4), 丙辛 → 庚寅(6), 丁壬 → 壬寅(8), 戊癸 → 甲寅(0)
  const yearStemIdx = HEAVENLY_STEMS.indexOf(yearStem);
  const monthStemBase = [2, 4, 6, 8, 0][Math.floor(yearStemIdx / 2)];
  const stemIdx = (monthStemBase + lunarMonthIdx) % 10;

  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
    fullName: sexagenaryName(stemIdx, branchIdx),
  };
}

/**
 * Day pillar using Julian Day Number
 * Day Stem = (JD + 9) % 10
 * Day Branch = (JD + 1) % 12
 */
function getDayPillar(year: number, month: number, day: number): Pillar {
  const jd = julianDay(year, month, day);
  const stemIdx = Math.floor(((jd + 9) % 10 + 10) % 10);
  const branchIdx = Math.floor(((jd + 1) % 12 + 12) % 12);

  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
    fullName: sexagenaryName(stemIdx, branchIdx),
  };
}

/**
 * Hour pillar: hour branch from time, stem from day stem
 * Rule: 甲己还加甲 (Day Stem 甲/己 → Hour 1 Stem 甲)
 */
function getHourPillar(dayStem: string, hour: number): Pillar {
  // Hour to branch index
  // 23-0 → 子(0), 1-2 → 丑(1), etc.
  // Use Chinese time: 23:00 is the start of 子时
  const adjustedHour = (hour + 1) % 24; // Shift so 23→0 maps to idx 0
  const branchIdx = Math.floor(adjustedHour / 2);

  // Hour stem: based on day stem
  const dayStemIdx = HEAVENLY_STEMS.indexOf(dayStem);
  const hourStemBase = [0, 2, 4, 6, 8][Math.floor(dayStemIdx / 2)];
  const stemIdx = (hourStemBase + branchIdx) % 10;

  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
    fullName: sexagenaryName(stemIdx, branchIdx),
  };
}

// ============================================================
// Element analysis
// ============================================================

/**
 * Analyze the Five Elements balance from the Bazi
 */
function analyzeElements(pillars: Pillar[]): {
  dayMaster: string;
  dayMasterElement: string;
  elementCounts: Record<string, number>;
  weakElements: string[];
  strongElements: string[];
  summary: string;
} {
  const counts: Record<string, number> = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };

  for (const pillar of pillars) {
    // Stem element
    const sElem = STEM_ELEMENT[pillar.stem];
    if (sElem) counts[sElem]++;

    // Branch element
    const bElem = BRANCH_ELEMENT[pillar.branch];
    if (bElem) counts[bElem]++;

    // Hidden stem element (counts as 0.5 weight, rounded up later)
    const hStem = BRANCH_HIDDEN_STEM[pillar.branch];
    if (hStem) {
      const hElem = STEM_ELEMENT[hStem];
      if (hElem) counts[hElem] += 0.5;
    }
  }

  // Find weak and strong elements
  const dayMaster = pillars[2].stem; // Day stem = 日主
  const dayMasterElement = STEM_ELEMENT[dayMaster] || "?";

  // An element is "weak" if count is 0 or very low (≤1)
  const weakElements = Object.entries(counts)
    .filter(([, count]) => count <= 1)
    .map(([elem]) => elem);

  // An element is "strong" if count ≥ 3.5
  const strongElements = Object.entries(counts)
    .filter(([, count]) => count >= 3.5)
    .map(([elem]) => elem);

  // Build summary
  const desc = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([elem, count]) => {
      const n = count % 1 === 0 ? count.toString() : count.toFixed(1);
      return `${elem}(${n})`;
    })
    .join(" ");

  let summary = `八字五行统计: ${desc}。日主${dayMaster}(${dayMasterElement})`;
  if (weakElements.length > 0) {
    summary += `。五行偏弱: ${weakElements.join("、")}`;
  }
  if (strongElements.length > 0) {
    summary += `。五行偏旺: ${strongElements.join("、")}`;
  }
  if (weakElements.length === 0 && strongElements.length === 0) {
    summary += "。五行较为均衡";
  }

  return { dayMaster, dayMasterElement, elementCounts: counts as Record<string, number>, weakElements, strongElements, summary };
}

// ============================================================
// Public API
// ============================================================

export interface BirthData {
  year: number;
  month: number;  // 1-12
  day: number;
  hour: number;   // 0-23
  minute?: number;
  location?: string;
}

export function calculateBazi(birth: BirthData): BaziResult {
  const { year, month, day, hour } = birth;

  const yearPillar = getYearPillar(year);
  const monthPillar = getMonthPillar(yearPillar.stem, month, day);
  const dayPillar = getDayPillar(year, month, day);
  const hourPillar = getHourPillar(dayPillar.stem, hour);

  const analysis = analyzeElements([yearPillar, monthPillar, dayPillar, hourPillar]);

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster: analysis.dayMaster,
    dayMasterElement: analysis.dayMasterElement,
    elementCounts: analysis.elementCounts,
    weakElements: analysis.weakElements,
    strongElements: analysis.strongElements,
    birthInfo: {
      year,
      month,
      day,
      hour,
      location: birth.location || "Unknown",
    },
  };
}

/**
 * Format Bazi as a human-readable prompt string for the AI
 */
export function formatBaziForPrompt(bazi: BaziResult): string {
  const p = (s: string) => s || "";

  return `BIRTH DATA: ${bazi.birthInfo.year}-${String(bazi.birthInfo.month).padStart(2, "0")}-${String(bazi.birthInfo.day).padStart(2, "0")} ${String(bazi.birthInfo.hour).padStart(2, "0")}:00${bazi.birthInfo.location ? `, born in ${bazi.birthInfo.location}` : ""}

FOUR PILLARS (四柱八字):
  年柱 Year:  ${p(bazi.yearPillar.fullName)} (${p(bazi.yearPillar.stem)}${p(bazi.yearPillar.branch)})
  月柱 Month: ${p(bazi.monthPillar.fullName)} (${p(bazi.monthPillar.stem)}${p(bazi.monthPillar.branch)})
  日柱 Day:   ${p(bazi.dayPillar.fullName)} (${p(bazi.dayPillar.stem)}${p(bazi.dayPillar.branch)})
  时柱 Hour:  ${p(bazi.hourPillar.fullName)} (${p(bazi.hourPillar.stem)}${p(bazi.hourPillar.branch)})

DAY MASTER (日主): ${p(bazi.dayMaster)} — ${bazi.dayMasterElement} element

ELEMENT ANALYSIS:
${Object.entries(bazi.elementCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([elem, count]) => `  ${elem}: ${count}`)
  .join("\n")}

${bazi.weakElements.length > 0
  ? `WEAK ELEMENTS (need supplementing in the name): ${bazi.weakElements.join(", ")}`
  : "All elements are relatively balanced."}
${bazi.strongElements.length > 0
  ? `STRONG ELEMENTS: ${bazi.strongElements.join(", ")}`
  : ""}`;
}
