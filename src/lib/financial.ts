// Financial analysis engine — computes all numbers needed for a buy decision.

import type { FinancialAnalysis, Verdict, Strategy } from './types';

const CURRENT_RATE = 3.45; // taux moyen mai 2026
const LOAN_YEARS = 25;
const DOWN_PAYMENT_PCT = 0.10; // 10% apport
const NOTARY_PCT_ANCIEN = 0.08;
const NOTARY_PCT_NEUF = 0.03;
const COPRO_PER_SQM_MONTH = 3; // ~3€/m²/mois en moyenne
const ASSURANCE_PNO = 150; // €/an
const ENTRETIEN_PCT = 0.01; // 1% du prix/an
const GESTION_PCT = 0.08; // 8% du revenu brut

// Taxe foncière estimée selon la taille de la ville
const TAXE_FONCIERE_RATES: Record<string, number> = {
  paris: 15,      // €/m²/an
  lyon: 12,
  marseille: 18,
  bordeaux: 20,
  nice: 14,
  strasbourg: 16,
  toulouse: 14,
  nantes: 15,
  lille: 22,
  montpellier: 18,
};
const DEFAULT_TAXE_FONCIERE_RATE = 12; // €/m²/an pour villes moyennes

function monthlyPayment(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function computeFinancials(
  askingPrice: number,
  surface: number,
  city: string,
  airbnbMonthlyRevenue: number,
  estimatedMarketValue: number,
  isNeuf: boolean = false,
): FinancialAnalysis {
  // Acquisition
  const notaryPct = isNeuf ? NOTARY_PCT_NEUF : NOTARY_PCT_ANCIEN;
  const notaryFees = Math.round(askingPrice * notaryPct);
  const totalAcquisitionCost = askingPrice + notaryFees;

  // Prêt
  const downPayment = Math.round(totalAcquisitionCost * DOWN_PAYMENT_PCT);
  const loanAmount = totalAcquisitionCost - downPayment;
  const monthly = Math.round(monthlyPayment(loanAmount, CURRENT_RATE, LOAN_YEARS));
  const totalInterest = Math.round(monthly * LOAN_YEARS * 12 - loanAmount);

  // Charges annuelles
  const cityKey = city.toLowerCase().replace(/\s+/g, '');
  const taxeRate = TAXE_FONCIERE_RATES[cityKey] || DEFAULT_TAXE_FONCIERE_RATE;
  const taxeFonciere = Math.round(taxeRate * surface);
  const chargesCopro = Math.round(COPRO_PER_SQM_MONTH * surface * 12);
  const assurancePNO = ASSURANCE_PNO;
  const entretienAnnuel = Math.round(askingPrice * ENTRETIEN_PCT);
  const annualRevenue = airbnbMonthlyRevenue * 12;
  const gestionLocative = Math.round(annualRevenue * GESTION_PCT);

  const totalChargesAnnuelles = taxeFonciere + chargesCopro + assurancePNO + gestionLocative + entretienAnnuel;

  // Rentabilité
  const grossYield = Math.round((annualRevenue / totalAcquisitionCost) * 10000) / 100;
  const netRevenue = annualRevenue - totalChargesAnnuelles;
  const netYield = Math.round((netRevenue / totalAcquisitionCost) * 10000) / 100;

  const monthlyCharges = Math.round(totalChargesAnnuelles / 12);
  const monthlyCashflow = airbnbMonthlyRevenue - monthly - monthlyCharges;
  const annualCashflow = monthlyCashflow * 12;

  // Plus-value
  const potentialGain = estimatedMarketValue - totalAcquisitionCost;
  const potentialGainPct = Math.round((potentialGain / totalAcquisitionCost) * 10000) / 100;

  return {
    notaryFees,
    totalAcquisitionCost,
    loanAmount,
    downPayment,
    monthlyPayment: monthly,
    interestRate: CURRENT_RATE,
    totalInterest,
    taxeFonciere,
    chargesCopro,
    assurancePNO,
    gestionLocative,
    entretienAnnuel,
    grossYield,
    netYield,
    monthlyCashflow,
    annualCashflow,
    estimatedResaleValue: estimatedMarketValue,
    potentialGain,
    potentialGainPct,
  };
}

export function computeVerdict(
  financial: FinancialAnalysis,
  discount: number,
  strategy: Strategy,
): { verdict: Verdict; reason: string } {
  // GO conditions
  if (strategy === 'achat-revente') {
    if (discount >= 15 && financial.potentialGainPct >= 10) {
      return { verdict: 'GO', reason: `Décote de ${discount}% — plus-value potentielle de ${financial.potentialGainPct}% après frais` };
    }
    if (discount >= 10) {
      return { verdict: 'PRUDENT', reason: `Décote correcte de ${discount}% mais marge nette limitée après frais de notaire` };
    }
    return { verdict: 'ÉVITER', reason: `Décote insuffisante (${discount}%) — risque de perte après frais d'acquisition` };
  }

  // Mixte / Airbnb
  if (financial.netYield >= 6 && financial.monthlyCashflow > 0) {
    return { verdict: 'GO', reason: `Rendement net ${financial.netYield}% + cashflow positif de ${financial.monthlyCashflow}€/mois` };
  }
  if (financial.netYield >= 4 || financial.monthlyCashflow > -100) {
    return { verdict: 'PRUDENT', reason: `Rendement net ${financial.netYield}% — cashflow ${financial.monthlyCashflow >= 0 ? 'neutre' : 'légèrement négatif'} (${financial.monthlyCashflow}€/mois)` };
  }
  return { verdict: 'ÉVITER', reason: `Rendement net faible (${financial.netYield}%) et cashflow négatif de ${financial.monthlyCashflow}€/mois` };
}
