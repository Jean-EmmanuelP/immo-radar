'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CITIES } from '@/lib/types';
import Link from 'next/link';

function toSlug(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

export default function CitySearch() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/ville/${toSlug(trimmed)}`);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Entrez une ville (ex: Brest, Rennes, Lyon...)"
          className="flex-1 px-4 py-3 rounded-lg bg-card-bg border border-card-border text-foreground placeholder:text-muted focus:outline-none focus:border-accent-blue/60 transition-colors"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="px-6 py-3 bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Scanner
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {CITIES.map((city) => (
          <Link
            key={city}
            href={`/ville/${toSlug(city)}`}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors bg-card-bg border border-card-border text-muted hover:text-foreground hover:border-accent-blue/40"
          >
            {city}
          </Link>
        ))}
      </div>
    </div>
  );
}
