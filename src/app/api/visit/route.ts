// Records a city visit — called by the frontend when a user visits a city page.
import { NextResponse } from 'next/server';
import { recordVisit } from '@/lib/visits';

export async function POST(request: Request) {
  try {
    const { city } = await request.json();
    if (!city || typeof city !== 'string') {
      return NextResponse.json({ error: 'city required' }, { status: 400 });
    }
    recordVisit(city);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
