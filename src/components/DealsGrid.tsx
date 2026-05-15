'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Deal } from '@/lib/types';
import DealCard from './DealCard';
import SortBar from './SortBar';

function capitalizeCity(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface FetchResult {
  deals: Deal[];
  cacheFresh?: boolean;
  cacheAge?: string | null;
}

export default function DealsGrid({ city }: { city?: string }) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [sort, setSort] = useState('score');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [cacheAge, setCacheAge] = useState<string | null>(null);
  const autoScanned = useRef(false);

  const fetchDeals = useCallback(async (): Promise<FetchResult> => {
    try {
      const params = new URLSearchParams({ sort });
      if (city) params.set('city', city);
      const res = await fetch(`/api/deals?${params}`);
      const data = await res.json();
      setDeals(data.deals || []);
      setCacheAge(data.cacheAge || null);
      return data;
    } catch (err) {
      console.error('Failed to fetch deals:', err);
      return { deals: [] };
    } finally {
      setLoading(false);
    }
  }, [city, sort]);

  const handleScan = useCallback(async () => {
    if (!city || scanning) return;
    setScanning(true);
    try {
      await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: capitalizeCity(city) }),
      });
      await fetchDeals();
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setScanning(false);
    }
  }, [city, scanning, fetchDeals]);

  useEffect(() => {
    fetchDeals().then((result) => {
      // Only auto-scan if: on a city page, no cached deals, cache is NOT fresh, and haven't already tried
      if (city && result.deals.length === 0 && !result.cacheFresh && !autoScanned.current) {
        autoScanned.current = true;
        setScanning(true);
        fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city: capitalizeCity(city) }),
        })
          .then(() => fetchDeals())
          .catch((err) => console.error('Auto-scan failed:', err))
          .finally(() => setScanning(false));
      }
    });
  }, [fetchDeals, city]);

  if (loading || scanning) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin mb-4" />
        <div className="text-muted">
          {scanning
            ? `Analyse en cours pour ${capitalizeCity(city || '')}...`
            : 'Chargement des données...'}
        </div>
        {scanning && (
          <p className="text-xs text-muted/60 mt-2">
            3 recherches LinkUp en parallèle — environ 30 à 60 secondes
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted">
            <span className="text-foreground font-mono font-bold">{deals.length}</span>{' '}
            opportunités
          </p>
          <SortBar sort={sort} onSort={setSort} />
        </div>
        <div className="flex items-center gap-3">
          {cacheAge && (
            <span className="text-xs text-muted/60">
              Données : {cacheAge}
            </span>
          )}
          {city && (
            <button
              onClick={handleScan}
              disabled={scanning}
              className="px-4 py-2 bg-accent-blue/20 text-accent-blue rounded-lg text-sm font-medium hover:bg-accent-blue/30 transition-colors disabled:opacity-50"
            >
              {scanning ? 'Scan en cours...' : 'Re-scanner'}
            </button>
          )}
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted mb-2">Aucune opportunité trouvée.</p>
          {city && (
            <button onClick={handleScan} className="text-accent-blue hover:underline">
              Lancer un scan
            </button>
          )}
          {!city && (
            <p className="text-sm text-muted/60">
              Sélectionnez une ville ou lancez une recherche pour commencer.
            </p>
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
