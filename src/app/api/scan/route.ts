import { NextResponse } from 'next/server';
import { CITIES, type City } from '@/lib/types';
import { scanCity } from '@/lib/scanner';
import { replaceCityDeals, getDealsByCity } from '@/lib/deals-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const city = body.city as string;

    if (!city || !CITIES.includes(city as City)) {
      return NextResponse.json(
        { error: `Invalid city. Must be one of: ${CITIES.join(', ')}` },
        { status: 400 },
      );
    }

    const deals = await scanCity(city as City);

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
