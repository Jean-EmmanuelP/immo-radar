export type Strategy = 'achat-revente' | 'airbnb' | 'mixte';

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
