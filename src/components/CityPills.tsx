'use client';

import Link from 'next/link';
import { CITIES } from '@/lib/types';

function toSlug(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

export default function CityPills({ activeCity }: { activeCity?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/"
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          !activeCity
            ? 'bg-accent-blue text-white'
            : 'bg-card-bg border border-card-border text-muted hover:text-foreground hover:border-accent-blue/40'
        }`}
      >
        Toutes
      </Link>
      {CITIES.map((city) => (
        <Link
          key={city}
          href={`/ville/${toSlug(city)}`}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeCity?.toLowerCase() === toSlug(city)
              ? 'bg-accent-blue text-white'
              : 'bg-card-bg border border-card-border text-muted hover:text-foreground hover:border-accent-blue/40'
          }`}
        >
          {city}
        </Link>
      ))}
    </div>
  );
}
