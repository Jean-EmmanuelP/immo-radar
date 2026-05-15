// Cron endpoint — Vercel calls this every 12h.
// ONLY scans cities that have been visited in the last 48h.
// No visits = no scans = no LinkUp credits burned.

import { NextResponse } from 'next/server';
import { scanCity } from '@/lib/scanner';
import { replaceCityDeals } from '@/lib/deals-store';
import { getRecentlyVisitedCities } from '@/lib/visits';

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const citiesToRefresh = getRecentlyVisitedCities();

  if (citiesToRefresh.length === 0) {
    return NextResponse.json({
      message: 'No cities visited recently — skipping all scans',
      results: [],
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[cron] Refreshing ${citiesToRefresh.length} recently visited cities: ${citiesToRefresh.join(', ')}`);

  const results: Array<{ city: string; deals: number; error?: string }> = [];

  for (const city of citiesToRefresh) {
    try {
      console.log(`[cron] Scanning ${city}...`);
      const deals = await scanCity(city);
      if (deals.length > 0) {
        replaceCityDeals(city, deals);
      }
      results.push({ city, deals: deals.length });
    } catch (error) {
      console.error(`[cron] ${city} failed:`, error);
      results.push({ city, deals: 0, error: String(error) });
    }
  }

  const totalDeals = results.reduce((sum, r) => sum + r.deals, 0);

  return NextResponse.json({
    message: `Refreshed ${citiesToRefresh.length} cities: ${totalDeals} deals total`,
    results,
    timestamp: new Date().toISOString(),
  });
}
