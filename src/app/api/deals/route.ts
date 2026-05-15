import { NextResponse } from 'next/server';
import { getAllDeals, getDealsByCity, isCacheFresh, getCacheAge } from '@/lib/deals-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city');
  const sortBy = searchParams.get('sort') || 'score';

  let deals = city ? getDealsByCity(city) : getAllDeals();

  switch (sortBy) {
    case 'discount':
      deals.sort((a, b) => b.discount - a.discount);
      break;
    case 'yield':
      deals.sort((a, b) => b.airbnbAnnualYield - a.airbnbAnnualYield);
      break;
    case 'price':
      deals.sort((a, b) => a.askingPrice - b.askingPrice);
      break;
    case 'score':
    default:
      deals.sort((a, b) => b.score - a.score);
      break;
  }

  return NextResponse.json({
    deals,
    count: deals.length,
    cacheFresh: city ? isCacheFresh(city) : undefined,
    cacheAge: city ? getCacheAge(city) : undefined,
  });
}
