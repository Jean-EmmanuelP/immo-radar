// Persistent deal store using /tmp JSON files.
// Survives across requests within the same Vercel function instance.
// Each city gets its own file with a TTL timestamp.

import fs from 'fs';
import path from 'path';
import type { Deal } from './types';

const CACHE_DIR = path.join('/tmp', 'immo-radar-cache');
const CACHE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function cityFile(city: string): string {
  const slug = city.toLowerCase().replace(/\s+/g, '-');
  return path.join(CACHE_DIR, `${slug}.json`);
}

interface CachedData {
  deals: Deal[];
  scannedAt: number;
}

function readCity(city: string): CachedData | null {
  const file = cityFile(city);
  if (!fs.existsSync(file)) return null;
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw) as CachedData;
  } catch {
    return null;
  }
}

function writeCity(city: string, deals: Deal[]) {
  ensureCacheDir();
  const data: CachedData = { deals, scannedAt: Date.now() };
  fs.writeFileSync(cityFile(city), JSON.stringify(data));
}

/** Check if a city's cache is still fresh (< 48h) */
export function isCacheFresh(city: string): boolean {
  const cached = readCity(city);
  if (!cached) return false;
  return Date.now() - cached.scannedAt < CACHE_TTL_MS;
}

/** Get the cache age in human-readable French */
export function getCacheAge(city: string): string | null {
  const cached = readCity(city);
  if (!cached) return null;
  const ageMs = Date.now() - cached.scannedAt;
  const hours = Math.floor(ageMs / (60 * 60 * 1000));
  if (hours < 1) return 'il y a moins d\'1 heure';
  if (hours === 1) return 'il y a 1 heure';
  if (hours < 24) return `il y a ${hours} heures`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} jour${days > 1 ? 's' : ''}`;
}

export function getAllDeals(): Deal[] {
  ensureCacheDir();
  const allDeals: Deal[] = [];
  try {
    const files = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(CACHE_DIR, file), 'utf-8');
        const data = JSON.parse(raw) as CachedData;
        if (Date.now() - data.scannedAt < CACHE_TTL_MS) {
          allDeals.push(...data.deals);
        }
      } catch {
        // skip corrupt files
      }
    }
  } catch {
    // cache dir doesn't exist yet
  }
  return allDeals.sort((a, b) => b.score - a.score);
}

export function getDealsByCity(city: string): Deal[] {
  const cached = readCity(city);
  if (!cached) return [];
  return [...cached.deals].sort((a, b) => b.score - a.score);
}

export function replaceCityDeals(city: string, newDeals: Deal[]): void {
  writeCity(city, newDeals);
}
