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
}

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
] as const;

export type City = (typeof CITIES)[number];
