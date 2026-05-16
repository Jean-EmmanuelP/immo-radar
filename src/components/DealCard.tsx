'use client';

import { useState } from 'react';
import type { Deal, Verdict } from '@/lib/types';

function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function fmtN(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

function isDirectListing(url: string): boolean {
  if (/seloger\.com\/annonces\/.*\/\d+\.htm/.test(url)) return true;
  if (/selogerneuf\.com\/annonces\/.*\/\d+/.test(url)) return true;
  if (/leboncoin\.fr\/ad\//.test(url)) return true;
  if (/annonce[-_]\d+/.test(url)) return true;
  return false;
}

function getSourceLabel(url: string): string {
  if (url.includes('leboncoin')) return 'Leboncoin';
  if (url.includes('seloger')) return 'SeLoger';
  try { return new URL(url).hostname.replace('www.', ''); } catch { return 'le site'; }
}

function VerdictBadge({ verdict, reason }: { verdict: Verdict; reason: string }) {
  const config: Record<Verdict, { bg: string; label: string }> = {
    'GO': { bg: 'bg-accent-green/20 text-accent-green border-accent-green/40', label: 'GO' },
    'PRUDENT': { bg: 'bg-accent-amber/20 text-accent-amber border-accent-amber/40', label: 'PRUDENT' },
    'ÉVITER': { bg: 'bg-accent-red/20 text-accent-red border-accent-red/40', label: 'ÉVITER' },
  };
  const { bg, label } = config[verdict];

  return (
    <div className={`rounded-lg border p-3 mb-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg font-black font-mono">{label}</span>
      </div>
      <p className="text-xs opacity-80">{reason}</p>
    </div>
  );
}

function MetricRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-card-border/30 last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <div className="text-right">
        <span className="text-sm font-mono text-foreground">{value}</span>
        {sub && <span className="text-xs text-muted ml-1">{sub}</span>}
      </div>
    </div>
  );
}

export default function DealCard({ deal }: { deal: Deal }) {
  const [expanded, setExpanded] = useState(false);
  const f = deal.financial;
  const isRegulated = deal.strategy === 'achat-revente';

  return (
    <div className="bg-card-bg border border-card-border rounded-lg overflow-hidden hover:border-accent-blue/40 transition-colors">
      {/* Verdict banner */}
      <div className="px-5 pt-5">
        <VerdictBadge verdict={deal.verdict} reason={deal.verdictReason} />
      </div>

      {/* Header */}
      <div className="px-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-foreground font-semibold truncate">{deal.neighborhood}</h3>
              <span className="text-xs text-muted px-1.5 py-0.5 bg-card-border/50 rounded">{deal.source}</span>
            </div>
            <p className="text-sm text-muted truncate">{deal.address}, {deal.city}</p>
          </div>
          <span className="text-2xl font-black font-mono text-foreground">{deal.score}</span>
        </div>

        {/* Key numbers */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Prix demandé</p>
            <p className="text-xl font-bold font-mono text-foreground">{fmt(deal.askingPrice)}</p>
            <p className="text-xs text-muted">{fmtN(deal.pricePerSqm)} /m² &middot; {deal.surface} m²</p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Coût total</p>
            <p className="text-xl font-bold font-mono text-foreground/70">{fmt(f.totalAcquisitionCost)}</p>
            <p className="text-xs text-muted">dont {fmt(f.notaryFees)} de notaire</p>
          </div>
        </div>

        {/* 4 key metrics */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-background/50 rounded-md p-2 text-center">
            <p className="text-[10px] text-muted mb-0.5">Décote</p>
            <p className={`text-sm font-bold font-mono ${deal.discount > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              {deal.discount > 0 ? '-' : '+'}{Math.abs(deal.discount)}%
            </p>
          </div>
          <div className="bg-background/50 rounded-md p-2 text-center">
            <p className="text-[10px] text-muted mb-0.5">Yield net</p>
            <p className={`text-sm font-bold font-mono ${f.netYield >= 5 ? 'text-accent-green' : f.netYield >= 3 ? 'text-accent-amber' : 'text-accent-red'}`}>
              {f.netYield}%
            </p>
          </div>
          <div className="bg-background/50 rounded-md p-2 text-center">
            <p className="text-[10px] text-muted mb-0.5">Cashflow</p>
            <p className={`text-sm font-bold font-mono ${f.monthlyCashflow >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
              {f.monthlyCashflow >= 0 ? '+' : ''}{f.monthlyCashflow}€
            </p>
          </div>
          <div className="bg-background/50 rounded-md p-2 text-center">
            <p className="text-[10px] text-muted mb-0.5">Mensualité</p>
            <p className="text-sm font-bold font-mono text-foreground">{fmt(f.monthlyPayment)}</p>
          </div>
        </div>

        {/* Expand/collapse for full analysis */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs text-accent-blue hover:text-accent-blue/80 py-2 transition-colors"
        >
          {expanded ? 'Masquer l\u2019analyse compl\u00e8te \u25B2' : 'Voir l\u2019analyse compl\u00e8te \u25BC'}
        </button>

        {expanded && (
          <div className="pb-2 space-y-4">
            {/* Prêt */}
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Simulation de pr\u00eat (25 ans \u00e0 {f.interestRate}%)</p>
              <MetricRow label="Apport (10%)" value={fmt(f.downPayment)} />
              <MetricRow label="Montant emprunt\u00e9" value={fmt(f.loanAmount)} />
              <MetricRow label="Mensualit\u00e9" value={fmt(f.monthlyPayment)} sub="/mois" />
              <MetricRow label="Int\u00e9r\u00eats totaux" value={fmt(f.totalInterest)} sub="sur 25 ans" />
            </div>

            {/* Charges */}
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Charges annuelles</p>
              <MetricRow label="Taxe fonci\u00e8re" value={fmt(f.taxeFonciere)} sub="/an" />
              <MetricRow label="Charges copro" value={fmt(f.chargesCopro)} sub="/an" />
              <MetricRow label="Assurance PNO" value={fmt(f.assurancePNO)} sub="/an" />
              <MetricRow label="Gestion locative (8%)" value={fmt(f.gestionLocative)} sub="/an" />
              <MetricRow label="Provision travaux (1%)" value={fmt(f.entretienAnnuel)} sub="/an" />
            </div>

            {/* Rentabilité */}
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Rentabilit\u00e9</p>
              <MetricRow label="Revenu Airbnb brut" value={fmt(deal.airbnbMonthlyRevenue)} sub="/mois" />
              <MetricRow label="Rendement brut" value={`${deal.airbnbAnnualYield}%`} />
              <MetricRow label="Rendement net" value={`${f.netYield}%`} />
              <MetricRow label="Cashflow mensuel" value={`${f.monthlyCashflow >= 0 ? '+' : ''}${f.monthlyCashflow}\u20AC`} sub="/mois" />
              <MetricRow label="Cashflow annuel" value={fmt(f.annualCashflow)} sub="/an" />
            </div>

            {/* Plus-value */}
            <div>
              <p className="text-xs text-muted uppercase tracking-wide mb-2">Plus-value potentielle</p>
              <MetricRow label="Valeur march\u00e9 (DVF)" value={fmt(f.estimatedResaleValue)} />
              <MetricRow label="Gain potentiel" value={fmt(f.potentialGain)} sub={`(${f.potentialGainPct}%)`} />
            </div>
          </div>
        )}
      </div>

      {/* Regulation warning */}
      {isRegulated && (
        <div className="mx-5 mb-3 flex items-center gap-1.5 text-xs text-accent-amber bg-accent-amber/10 border border-accent-amber/20 rounded-md px-2.5 py-1.5">
          <span>&#9888;</span>
          <span>R\u00e9glementation stricte \u2014 location courte dur\u00e9e encadr\u00e9e</span>
        </div>
      )}

      {/* Contact + Link */}
      <div className="px-5 pb-5 space-y-2">
        {deal.contactName && (
          <div className="flex items-center gap-2 text-sm bg-accent-blue/10 border border-accent-blue/20 rounded-md px-3 py-2">
            <span className="text-accent-blue font-medium">
              {deal.contactType === 'agence' ? 'Agence' : 'Particulier'}
            </span>
            <span className="text-foreground">{deal.contactName}</span>
            {deal.contactPhone && (
              <a href={`tel:${deal.contactPhone.replace(/\s/g, '')}`}
                 className="text-accent-green font-mono font-semibold hover:underline ml-auto">
                {deal.contactPhone}
              </a>
            )}
          </div>
        )}

        {deal.sourceUrl && deal.sourceUrl !== '#' && (
          <a href={deal.sourceUrl} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center text-sm text-accent-blue hover:text-accent-blue/80 transition-colors">
            {isDirectListing(deal.sourceUrl)
              ? 'Voir l\u2019annonce \u2192'
              : `Rechercher sur ${getSourceLabel(deal.sourceUrl)} \u2192`}
          </a>
        )}
      </div>
    </div>
  );
}
