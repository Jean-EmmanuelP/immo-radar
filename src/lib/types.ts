export type Strategy = 'achat-revente' | 'airbnb' | 'mixte';
export type Verdict = 'GO' | 'PRUDENT' | 'ÉVITER';

export interface FinancialAnalysis {
  // Coût total d'acquisition
  notaryFees: number;          // ~8% pour ancien, ~3% pour neuf
  totalAcquisitionCost: number; // prix + notaire

  // Simulation prêt (25 ans, taux actuel)
  loanAmount: number;          // totalAcquisitionCost - apport
  downPayment: number;         // 10% apport
  monthlyPayment: number;      // mensualité
  interestRate: number;        // taux utilisé
  totalInterest: number;       // intérêts totaux sur 25 ans

  // Charges annuelles estimées
  taxeFonciere: number;        // estimée selon ville/surface
  chargesCopro: number;        // charges copropriété estimées
  assurancePNO: number;        // assurance propriétaire non occupant
  gestionLocative: number;     // 8% du revenu si géré par agence
  entretienAnnuel: number;     // provision travaux 1%

  // Rentabilité
  grossYield: number;          // rendement brut
  netYield: number;            // rendement net après charges
  monthlyCashflow: number;     // revenu - mensualité - charges mensuelles
  annualCashflow: number;      // cashflow annuel

  // Plus-value potentielle (achat-revente)
  estimatedResaleValue: number;
  potentialGain: number;       // revente - acquisition totale
  potentialGainPct: number;
}

export interface Deal {
  id: string;
  city: string;
  neighborhood: string;
  address: string;
  askingPrice: number;
  estimatedMarketValue: number;
  surface: number;
  pricePerSqm: number;
  marketPricePerSqm: number;
  discount: number;
  airbnbNightlyRate: number;
  airbnbMonthlyRevenue: number;
  airbnbAnnualYield: number;
  score: number;
  source: string;
  sourceUrl: string;
  description: string;
  imageUrl?: string;
  strategy: Strategy;
  contactName?: string;
  contactPhone?: string;
  contactType?: 'agence' | 'particulier';

  // Decision-making fields
  financial: FinancialAnalysis;
  verdict: Verdict;
  verdictReason: string;
}

/** Popular cities for quick-access pills */
export const CITIES = [
  'Paris',
  'Lyon',
  'Marseille',
  'Bordeaux',
  'Toulouse',
  'Nantes',
  'Lille',
  'Strasbourg',
  'Montpellier',
  'Nice',
  'Brest',
  'Rennes',
  'Angers',
  'Tours',
  'Grenoble',
  'Toulon',
  'Dijon',
  'Rouen',
  'Reims',
  'Le Havre',
] as const;

/** Cities where Airbnb short-term rental is heavily regulated */
export const REGULATED_CITIES = [
  'Paris',
  'Lyon',
  'Marseille',
  'Bordeaux',
  'Nice',
  'Strasbourg',
];

/** Any city string is accepted */
export type City = string;
