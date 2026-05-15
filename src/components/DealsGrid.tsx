'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Deal } from '@/lib/types';
import DealCard from './DealCard';
import SortBar from './SortBar';

export default function DealsGrid({ city }: { city?: string }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [sort, setSort] = useState('score');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const fetchDeals = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sort });
      if (city) params.set('city', city);
      const res = await fetch(`/api/deals?${params}`);
      const data = await res.json();
      setDeals(data.deals || []);
    } catch (err) {
      console.error('Failed to fetch deals:', err);
    } finally {
      setLoading(false);
    }
  }, [city, sort]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const handleScan = async () => {
    if (!city || scanning) return;
    setScanning(true);
    try {
      await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: city.charAt(0).toUpperCase() + city.slice(1) }),
      });
      await fetchDeals();
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted animate-pulse">Chargement des deals...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted">
            <span className="text-foreground font-mono font-bold">{deals.length}</span>{' '}
            opportunites
          </p>
          <SortBar sort={sort} onSort={setSort} />
        </div>
        {city && (
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-4 py-2 bg-accent-blue/20 text-accent-blue rounded-lg text-sm font-medium hover:bg-accent-blue/30 transition-colors disabled:opacity-50"
          >
            {scanning ? 'Scan en cours...' : 'Scanner LinkUp'}
          </button>
        )}
      </div>

      {deals.length === 0 ? (
        <div className="text-center py-20 text-muted">
          Aucune opportunite trouvee.{' '}
          {city && (
            <button onClick={handleScan} className="text-accent-blue hover:underline">
              Lancer un scan
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  );
}
