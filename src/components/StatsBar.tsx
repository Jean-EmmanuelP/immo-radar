'use client';

import { useState, useEffect } from 'react';
import type { Deal } from '@/lib/types';

function formatPrice(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export default function StatsBar() {
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    fetch('/api/deals')
      .then((r) => r.json())
      .then((d) => setDeals(d.deals || []))
      .catch(() => {});
  }, []);

  if (deals.length === 0) return null;

  const avgDiscount =
    Math.round(
      deals.filter((d) => d.discount > 0).reduce((s, d) => s + d.discount, 0) /
        Math.max(deals.filter((d) => d.discount > 0).length, 1),
    );
  const avgYield =
    Math.round(deals.reduce((s, d) => s + d.airbnbAnnualYield, 0) / deals.length * 10) / 10;
  const bestScore = Math.max(...deals.map((d) => d.score));
  const avgPrice =
    Math.round(deals.reduce((s, d) => s + d.askingPrice, 0) / deals.length);
  const cities = new Set(deals.map((d) => d.city)).size;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {[
        { label: 'Opportunités', value: String(deals.length), color: 'text-foreground' },
        { label: 'Villes', value: String(cities), color: 'text-accent-blue' },
        { label: 'Décote moy.', value: `${avgDiscount}%`, color: 'text-accent-green' },
        { label: 'Yield moy.', value: `${avgYield}%`, color: 'text-accent-amber' },
        { label: 'Meilleur score', value: String(bestScore), color: 'text-accent-green' },
      ].map((stat) => (
        <div
          key={stat.label}
          className="bg-card-bg border border-card-border rounded-lg p-4 text-center"
        >
          <p className="text-xs text-muted uppercase tracking-wide mb-1">
            {stat.label}
          </p>
          <p className={`text-2xl font-bold font-mono ${stat.color}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
