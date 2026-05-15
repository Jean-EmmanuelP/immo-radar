// In-memory deal store for v1.
// Persists only for the lifetime of the server process.

import type { Deal } from './types';

// Start empty — deals are populated by scanning
let deals: Deal[] = [];

export function getAllDeals(): Deal[] {
  return [...deals].sort((a, b) => b.score - a.score);
}

export function getDealsByCity(city: string): Deal[] {
  return deals
    .filter((d) => d.city.toLowerCase() === city.toLowerCase())
    .sort((a, b) => b.score - a.score);
}

export function addDeals(newDeals: Deal[]): void {
  // Deduplicate by address
  const existing = new Set(deals.map((d) => d.address.toLowerCase()));
  const unique = newDeals.filter((d) => !existing.has(d.address.toLowerCase()));
  deals = [...deals, ...unique];
}

export function replaceCityDeals(city: string, newDeals: Deal[]): void {
  deals = [
    ...deals.filter((d) => d.city.toLowerCase() !== city.toLowerCase()),
    ...newDeals,
  ];
}
