import fs from 'fs';
import path from 'path';

import os from 'os';
import { requireSupabaseAdmin, TABLES } from './supabase';

const DATA_DIR = path.join(os.tmpdir(), 'bazi-ziwei-data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function saveChart(id: string, data: any): void {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, `${id}.json`), JSON.stringify(data, null, 2), 'utf-8');
}

export function getChart(id: string): any | null {
  const file = path.join(DATA_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

/**
 * Persist chart inputs in Supabase as well as the local temp cache. Vercel
 * functions do not share a durable filesystem, so payment and generation may
 * run on a different instance from the function that created the chart.
 */
export async function saveChartPersistent(id: string, data: any): Promise<void> {
  saveChart(id, data);

  const db = requireSupabaseAdmin();
  const { error } = await db
    .from(TABLES.chartCache)
    .upsert(
      {
        chart_id: id,
        chart_data: data,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'chart_id' },
    );

  if (error) throw new Error(`Failed to persist chart: ${error.message}`);
}

export async function getChartPersistent(id: string): Promise<any | null> {
  const local = getChart(id);
  if (local) return local;

  const db = requireSupabaseAdmin();
  const { data, error } = await db
    .from(TABLES.chartCache)
    .select('chart_data')
    .eq('chart_id', id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load chart: ${error.message}`);
  if (!data?.chart_data) return null;

  // Warm the current instance for the other chart-rendering endpoints.
  saveChart(id, data.chart_data);
  return data.chart_data;
}

export function saveAnalysis(id: string, key: string, data: any): void {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, `${id}-${key}.json`), JSON.stringify(data, null, 2), 'utf-8');
}

export function getAnalysis(id: string, key: string): any | null {
  const file = path.join(DATA_DIR, `${id}-${key}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

export function cleanupOldFiles(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): void {
  ensureDir();
  const now = Date.now();
  for (const file of fs.readdirSync(DATA_DIR)) {
    const filePath = path.join(DATA_DIR, file);
    try {
      if (now - fs.statSync(filePath).mtimeMs > maxAgeMs) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // file may have been deleted concurrently — skip
    }
  }
}
