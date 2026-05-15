// Browser-side localStorage cache for instant load.
// Deals are stored per city with a timestamp.

import type { Deal } from './types';

const CACHE_PREFIX = 'immo-radar:';
const CACHE_TTL_MS = 48 * 60 * 60 * 1000; // 48h

interface CachedDeals {
  deals: Deal[];
  cachedAt: number;
}

export function getLocalDeals(city: string): Deal[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${city.toLowerCase()}`);
    if (!raw) return null;
    const cached: CachedDeals = JSON.parse(raw);
    if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(`${CACHE_PREFIX}${city.toLowerCase()}`);
      return null;
    }
    return cached.deals;
  } catch {
    return null;
  }
}

export function setLocalDeals(city: string, deals: Deal[]): void {
  if (typeof window === 'undefined') return;
  try {
    const data: CachedDeals = { deals, cachedAt: Date.now() };
    localStorage.setItem(`${CACHE_PREFIX}${city.toLowerCase()}`, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export function getLocalCacheAge(city: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${city.toLowerCase()}`);
    if (!raw) return null;
    const cached: CachedDeals = JSON.parse(raw);
    const ageMs = Date.now() - cached.cachedAt;
    const mins = Math.floor(ageMs / 60000);
    if (mins < 1) return 'à l\'instant';
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  } catch {
    return null;
  }
}

/** Get all cached cities from localStorage */
export function getAllLocalDeals(): Deal[] {
  if (typeof window === 'undefined') return [];
  const all: Deal[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(CACHE_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const cached: CachedDeals = JSON.parse(raw);
      if (Date.now() - cached.cachedAt < CACHE_TTL_MS) {
        all.push(...cached.deals);
      }
    }
  } catch {
    // ignore
  }
  return all.sort((a, b) => b.score - a.score);
}
