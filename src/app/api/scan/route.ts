import { NextResponse } from 'next/server';
import { scanCity } from '@/lib/scanner';
import { replaceCityDeals, getDealsByCity } from '@/lib/deals-store';

export const maxDuration = 120;

function capitalizeCity(slug: string): string {
  return slug
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawCity = (body.city as string)?.trim();

    if (!rawCity || rawCity.length === 0) {
      return NextResponse.json(
        { error: 'City name is required (non-empty string).' },
        { status: 400 },
      );
    }

    const city = capitalizeCity(rawCity);
    const deals = await scanCity(city);

    if (deals.length > 0) {
      replaceCityDeals(city, deals);
    }

    const currentDeals = getDealsByCity(city);

    return NextResponse.json({
      city,
      scannedDeals: deals.length,
      totalDeals: currentDeals.length,
      message: deals.length > 0
        ? `Found ${deals.length} new deals for ${city}`
        : `No new deals found via LinkUp, showing ${currentDeals.length} cached deals`,
    });
  } catch (error) {
    console.error('[scan] Error:', error);
    return NextResponse.json(
      { error: 'Scan failed', details: String(error) },
      { status: 500 },
    );
  }
}
