'use client';

import type { Deal } from '@/lib/types';

function formatPrice(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

function ScoreBadge({ score }: { score: number }) {
  const bg =
    score >= 70
      ? 'bg-accent-green/20 text-accent-green border-accent-green/30'
      : score >= 50
        ? 'bg-accent-amber/20 text-accent-amber border-accent-amber/30'
        : 'bg-accent-blue/20 text-accent-blue border-accent-blue/30';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-mono font-bold border ${bg}`}
    >
      {score}
    </span>
  );
}

function StrategyBadge({ strategy }: { strategy: Deal['strategy'] }) {
  const config = {
    'achat-revente': {
      label: 'Achat-revente',
      className: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
    airbnb: {
      label: 'Airbnb',
      className: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    },
    mixte: {
      label: 'Mixte',
      className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    },
  };
  const { label, className } = config[strategy];

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${className}`}>
      {label}
    </span>
  );
}

export default function DealCard({ deal }: { deal: Deal }) {
  const isRegulated = deal.strategy === 'achat-revente';

  return (
    <div className="bg-card-bg border border-card-border rounded-lg p-5 hover:border-accent-blue/40 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-foreground font-semibold truncate">
              {deal.neighborhood}
            </h3>
            <span className="text-xs text-muted px-1.5 py-0.5 bg-card-border/50 rounded">
              {deal.source}
            </span>
            <StrategyBadge strategy={deal.strategy} />
          </div>
          <p className="text-sm text-muted truncate">{deal.address}</p>
        </div>
        <ScoreBadge score={deal.score} />
      </div>

      {/* Price row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted uppercase tracking-wide mb-0.5">
            Prix demandé
          </p>
          <p className="text-lg font-bold font-mono text-foreground">
            {formatPrice(deal.askingPrice)}
          </p>
          <p className="text-xs text-muted">
            {formatNumber(deal.pricePerSqm)} /m2
          </p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wide mb-0.5">
            Valeur marché
          </p>
          <p className="text-lg font-bold font-mono text-foreground/70">
            {formatPrice(deal.estimatedMarketValue)}
          </p>
          <p className="text-xs text-muted">
            {formatNumber(deal.marketPricePerSqm)} /m2 (DVF)
          </p>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Discount */}
        <div className="bg-background/50 rounded-md p-2.5 text-center">
          <p className="text-xs text-muted mb-0.5">Décote</p>
          <p
            className={`text-base font-bold font-mono ${
              deal.discount > 0 ? 'text-accent-green' : 'text-accent-red'
            }`}
          >
            {deal.discount > 0 ? '-' : '+'}
            {Math.abs(deal.discount)}%
          </p>
        </div>

        {/* Yield */}
        <div className="bg-background/50 rounded-md p-2.5 text-center">
          <p className="text-xs text-muted mb-0.5">Yield Airbnb</p>
          <p className="text-base font-bold font-mono text-accent-amber">
            {deal.airbnbAnnualYield}%
          </p>
        </div>

        {/* Surface */}
        <div className="bg-background/50 rounded-md p-2.5 text-center">
          <p className="text-xs text-muted mb-0.5">Surface</p>
          <p className="text-base font-bold font-mono text-foreground">
            {deal.surface} m2
          </p>
        </div>
      </div>

      {/* Airbnb estimate */}
      <div className="flex items-center justify-between text-sm mb-3 px-1">
        <span className="text-muted">
          Airbnb: {formatPrice(deal.airbnbNightlyRate)}/nuit
        </span>
        <span className="text-accent-green font-mono font-semibold">
          {formatPrice(deal.airbnbMonthlyRevenue)}/mois
        </span>
      </div>

      {/* Regulation warning */}
      {isRegulated && (
        <div className="flex items-center gap-1.5 text-xs text-accent-amber bg-accent-amber/10 border border-accent-amber/20 rounded-md px-2.5 py-1.5 mb-3">
          <span>&#9888;</span>
          <span>Réglementation stricte &mdash; location courte durée encadrée</span>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-muted/80 line-clamp-2 mb-3">
        {deal.description}
      </p>

      {/* Contact info */}
      {(deal.contactName || deal.contactPhone) && (
        <div className="flex items-center gap-2 text-sm bg-accent-blue/10 border border-accent-blue/20 rounded-md px-3 py-2 mb-3">
          <span className="text-accent-blue font-medium">
            {deal.contactType === 'agence' ? 'Agence' : 'Particulier'}
          </span>
          {deal.contactName && (
            <span className="text-foreground">{deal.contactName}</span>
          )}
          {deal.contactPhone && (
            <a
              href={`tel:${deal.contactPhone.replace(/\s/g, '')}`}
              className="text-accent-green font-mono font-semibold hover:underline ml-auto"
            >
              {deal.contactPhone}
            </a>
          )}
        </div>
      )}

      {/* Footer */}
      <a
        href={deal.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center text-sm text-accent-blue hover:text-accent-blue/80 transition-colors"
      >
        Voir l&apos;annonce &rarr;
      </a>
    </div>
  );
}
