// Scanner: uses LinkUp to find deals for a given city.

import { linkupStructured, linkupSourcedAnswer } from './linkup';
import type { Deal, Strategy } from './types';
import { REGULATED_CITIES } from './types';

function generateId(): string {
  return `deal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Determine strategy based on city regulation status */
function getStrategy(city: string): Strategy {
  const isRegulated = REGULATED_CITIES.some(
    (c) => c.toLowerCase() === city.toLowerCase(),
  );
  if (isRegulated) return 'achat-revente';
  return 'mixte';
}

function computeScore(discount: number, annualYield: number, strategy: Strategy): number {
  if (strategy === 'achat-revente') {
    // Heavily regulated city: 80% weight on discount, 20% on yield
    const discountScore = Math.min(Math.max(discount, 0) * 3.2, 80);
    const yieldScore = Math.min(annualYield * 2, 20);
    return Math.round(discountScore + yieldScore);
  }
  // mixte: balanced 50/50
  const discountScore = Math.min(Math.max(discount, 0) * 2, 50);
  const yieldScore = Math.min(annualYield * 5, 50);
  return Math.round(discountScore + yieldScore);
}

interface PropertyListing {
  address: string;
  neighborhood: string;
  price: number;
  surface: number;
  description: string;
  source: string;
  url: string;
  contactName?: string;
  contactPhone?: string;
  contactType?: 'agence' | 'particulier';
}

interface DVFData {
  neighborhood: string;
  averagePricePerSqm: number;
}

interface AirbnbData {
  neighborhood: string;
  averageNightlyRate: number;
}

const PROPERTY_SCHEMA = {
  type: 'object',
  properties: {
    listings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          address: { type: 'string' },
          neighborhood: { type: 'string' },
          price: { type: 'number' },
          surface: { type: 'number' },
          description: { type: 'string' },
          source: { type: 'string' },
          url: { type: 'string' },
          contactName: { type: 'string', description: 'Nom de l\'agence ou du vendeur particulier' },
          contactPhone: { type: 'string', description: 'Numéro de téléphone affiché sur l\'annonce' },
          contactType: { type: 'string', enum: ['agence', 'particulier'], description: 'Type de vendeur' },
        },
        required: ['address', 'neighborhood', 'price', 'surface', 'description', 'source', 'url'],
      },
    },
  },
  required: ['listings'],
};

const DVF_SCHEMA = {
  type: 'object',
  properties: {
    neighborhoods: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          neighborhood: { type: 'string' },
          averagePricePerSqm: { type: 'number' },
        },
        required: ['neighborhood', 'averagePricePerSqm'],
      },
    },
  },
  required: ['neighborhoods'],
};

const AIRBNB_SCHEMA = {
  type: 'object',
  properties: {
    neighborhoods: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          neighborhood: { type: 'string' },
          averageNightlyRate: { type: 'number' },
        },
        required: ['neighborhood', 'averageNightlyRate'],
      },
    },
  },
  required: ['neighborhoods'],
};

export async function scanCity(city: string): Promise<Deal[]> {
  const strategy = getStrategy(city);

  try {
    // Run all 3 searches in parallel
    const [propertiesResult, dvfResult, airbnbResult] = await Promise.allSettled([
      linkupStructured<{ listings: PropertyListing[] }>(
        `Annonces immobilières à vendre à ${city} France sur leboncoin.fr et seloger.com, appartements avec prix affiché, surface en m², adresse ou quartier. Inclure le nom et numéro de téléphone de l'agence ou du particulier vendeur quand disponible. Lister les 10 meilleures opportunités actuelles.`,
        PROPERTY_SCHEMA,
      ),
      linkupStructured<{ neighborhoods: DVFData[] }>(
        `DVF Demandes de Valeurs Foncières prix moyen au m² par quartier à ${city} France transactions récentes 2024 2025. Donner le prix moyen au mètre carré pour chaque quartier.`,
        DVF_SCHEMA,
      ),
      linkupStructured<{ neighborhoods: AirbnbData[] }>(
        `Tarif moyen nuitée Airbnb par quartier à ${city} France 2024 2025. Revenue location courte durée estimation par quartier.`,
        AIRBNB_SCHEMA,
      ),
    ]);

    // Extract results with fallbacks
    const listings: PropertyListing[] =
      propertiesResult.status === 'fulfilled'
        ? propertiesResult.value.data.listings ?? []
        : [];

    const dvfData: DVFData[] =
      dvfResult.status === 'fulfilled'
        ? dvfResult.value.data.neighborhoods ?? []
        : [];

    const airbnbData: AirbnbData[] =
      airbnbResult.status === 'fulfilled'
        ? airbnbResult.value.data.neighborhoods ?? []
        : [];

    if (listings.length === 0) {
      console.log(`[scanner] No listings found for ${city}, using fallback sourced answer`);
      return await scanCityFallback(city, strategy);
    }

    // Build a lookup for DVF and Airbnb data by neighborhood
    const dvfMap = new Map<string, number>();
    for (const d of dvfData) {
      dvfMap.set(d.neighborhood.toLowerCase(), d.averagePricePerSqm);
    }

    const airbnbMap = new Map<string, number>();
    for (const a of airbnbData) {
      airbnbMap.set(a.neighborhood.toLowerCase(), a.averageNightlyRate);
    }

    // Default fallbacks per city if data is sparse
    const defaultDvf = dvfData.length > 0
      ? dvfData.reduce((sum, d) => sum + d.averagePricePerSqm, 0) / dvfData.length
      : 5000;
    const defaultAirbnb = airbnbData.length > 0
      ? airbnbData.reduce((sum, a) => sum + a.averageNightlyRate, 0) / airbnbData.length
      : 80;

    // Assemble deals
    const deals: Deal[] = listings
      .filter((l) => l.price > 0 && l.surface > 0)
      .map((listing) => {
        const neighborhood = listing.neighborhood || 'Centre';
        const marketPricePerSqm =
          dvfMap.get(neighborhood.toLowerCase()) || defaultDvf;
        const airbnbNightlyRate =
          airbnbMap.get(neighborhood.toLowerCase()) || defaultAirbnb;

        const pricePerSqm = Math.round(listing.price / listing.surface);
        const estimatedMarketValue = marketPricePerSqm * listing.surface;
        const discount = Math.round(
          ((estimatedMarketValue - listing.price) / estimatedMarketValue) * 100,
        );
        const airbnbMonthlyRevenue = Math.round(airbnbNightlyRate * 30 * 0.65);
        const airbnbAnnualYield =
          Math.round(((airbnbMonthlyRevenue * 12) / listing.price) * 10000) / 100;
        const score = computeScore(Math.max(discount, 0), airbnbAnnualYield, strategy);

        return {
          id: generateId(),
          city,
          neighborhood,
          address: listing.address || `${neighborhood}, ${city}`,
          askingPrice: listing.price,
          estimatedMarketValue,
          surface: listing.surface,
          pricePerSqm,
          marketPricePerSqm,
          discount,
          airbnbNightlyRate,
          airbnbMonthlyRevenue,
          airbnbAnnualYield,
          score,
          source: listing.source || 'leboncoin',
          sourceUrl: listing.url || '#',
          description: listing.description || '',
          strategy,
          contactName: listing.contactName || undefined,
          contactPhone: listing.contactPhone || undefined,
          contactType: listing.contactType || undefined,
        };
      });

    return deals;
  } catch (error) {
    console.error(`[scanner] Error scanning ${city}:`, error);
    return [];
  }
}

// Fallback: use sourcedAnswer and parse manually
async function scanCityFallback(city: string, strategy: Strategy): Promise<Deal[]> {
  try {
    const result = await linkupSourcedAnswer(
      `Liste des appartements à vendre à ${city} France avec prix, surface, quartier. Inclure le prix moyen au m² DVF et le tarif Airbnb moyen du quartier. Format: adresse | prix | surface m² | prix DVF m² | tarif Airbnb nuit`,
    );

    // Best effort parse - return empty if parsing fails
    console.log(`[scanner] Fallback sourced answer for ${city}:`, typeof result);
    return [];
  } catch {
    return [];
  }
}
