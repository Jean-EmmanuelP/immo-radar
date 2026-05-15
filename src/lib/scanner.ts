// Scanner: uses LinkUp sourcedAnswer to find real deals for any city.
// Parses the text response into Deal objects.

import { linkupSourcedAnswer, linkupStructured } from './linkup';
import type { Deal, Strategy } from './types';
import { REGULATED_CITIES } from './types';

function generateId(): string {
  return `deal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getStrategy(city: string): Strategy {
  const isRegulated = REGULATED_CITIES.some(
    (c) => c.toLowerCase() === city.toLowerCase(),
  );
  if (isRegulated) return 'achat-revente';
  return 'mixte';
}

function computeScore(discount: number, annualYield: number, strategy: Strategy): number {
  if (strategy === 'achat-revente') {
    const discountScore = Math.min(Math.max(discount, 0) * 3.2, 80);
    const yieldScore = Math.min(annualYield * 2, 20);
    return Math.round(discountScore + yieldScore);
  }
  const discountScore = Math.min(Math.max(discount, 0) * 2, 50);
  const yieldScore = Math.min(annualYield * 5, 50);
  return Math.round(discountScore + yieldScore);
}

interface DVFData {
  neighborhood: string;
  averagePricePerSqm: number;
}

interface AirbnbData {
  neighborhood: string;
  averageNightlyRate: number;
}

interface ParsedListing {
  address: string;
  neighborhood: string;
  price: number;
  surface: number;
  rooms: number;
  description: string;
  source: string;
  url: string;
  contactName: string;
  contactType: 'agence' | 'particulier';
}

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

/** Parse the sourcedAnswer text into listing objects */
function parseListingsFromText(text: string): ParsedListing[] {
  const listings: ParsedListing[] = [];

  // Split by numbered items (1., 2., 3., etc.)
  const items = text.split(/\n\d+\.\s+/).filter(Boolean);

  for (const item of items) {
    try {
      // Extract price — look for patterns like 68 670 €, 57 000€, 186,375€
      const priceMatch = item.match(/([\d\s,.]+)\s*€/);
      if (!priceMatch) continue;
      const price = parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.'));
      if (!price || price < 10000) continue;

      // Extract surface — look for patterns like 17,9 m², 38 m², 54m2
      const surfaceMatch = item.match(/([\d,.]+)\s*m[²2]/);
      const surface = surfaceMatch ? parseFloat(surfaceMatch[1].replace(',', '.')) : 0;

      // Extract rooms
      const roomsMatch = item.match(/(\d+)\s*pi[eè]ce/i) || item.match(/T(\d)/i);
      const rooms = roomsMatch ? parseInt(roomsMatch[1]) : 0;

      // Extract URL
      const urlMatch = item.match(/(https?:\/\/[^\s\]]+)/);
      const url = urlMatch ? urlMatch[1].replace(/\[.*$/, '') : '#';

      // Determine source from URL
      const source = url.includes('leboncoin') ? 'leboncoin' : url.includes('seloger') ? 'seloger' : 'autre';

      // Extract neighborhood/quartier
      const quartierMatch = item.match(/quartier\s+([^,.\n]+)/i) || item.match(/secteur\s+([^,.\n]+)/i);
      const neighborhood = quartierMatch ? quartierMatch[1].trim().replace(/^:\s*/, '') : '';

      // Extract contact/agence
      const agenceMatch = item.match(/(?:agence|vendu par|vendeur|par)\s+(?:l'agence\s+)?([^,.(\n]+)/i)
        || item.match(/(?:agence|cabinet)\s+([^,.(\n]+)/i);
      const contactName = agenceMatch ? agenceMatch[1].trim().replace(/^:\s*/, '') : '';
      const contactType = contactName.toLowerCase().includes('particulier') ? 'particulier' as const : 'agence' as const;

      // Build description from the full item text (cleaned up)
      const description = item
        .replace(/(https?:\/\/[^\s]+)/g, '')
        .replace(/\[\d+\]/g, '')
        .trim()
        .slice(0, 200);

      listings.push({
        address: neighborhood ? `${neighborhood}` : 'Adresse non précisée',
        neighborhood: neighborhood || 'Centre',
        price,
        surface: surface || 30, // default if not found
        rooms,
        description,
        source,
        url,
        contactName,
        contactType,
      });
    } catch {
      // Skip unparseable items
    }
  }

  return listings;
}

export async function scanCity(city: string): Promise<Deal[]> {
  const strategy = getStrategy(city);

  try {
    // Run 3 searches in parallel:
    // 1. sourcedAnswer for actual listings (this actually works!)
    // 2. structured for DVF data
    // 3. structured for Airbnb data
    const [listingsResult, dvfResult, airbnbResult] = await Promise.allSettled([
      linkupSourcedAnswer(
        `Liste les 10 appartements actuellement a vendre a ${city} France sur seloger.com et leboncoin.fr. Pour chaque bien, indique: le quartier, le prix exact en euros, la surface en m2, le nombre de pieces, le nom de l agence ou si c est un particulier, et le lien URL direct vers l annonce. Trie par prix croissant.`,
      ),
      linkupStructured<{ neighborhoods: DVFData[] }>(
        `DVF Demandes de Valeurs Foncieres prix moyen au m2 par quartier a ${city} France transactions recentes 2024 2025. Donner le prix moyen au metre carre pour chaque quartier.`,
        DVF_SCHEMA,
      ),
      linkupStructured<{ neighborhoods: AirbnbData[] }>(
        `Tarif moyen nuitee Airbnb par quartier a ${city} France 2024 2025. Revenue location courte duree estimation par quartier.`,
        AIRBNB_SCHEMA,
      ),
    ]);

    // Parse listings from sourcedAnswer text
    let listings: ParsedListing[] = [];
    if (listingsResult.status === 'fulfilled') {
      const answer = (listingsResult.value as { answer?: string }).answer ||
                     (typeof listingsResult.value === 'string' ? listingsResult.value : '');
      listings = parseListingsFromText(answer);
      console.log(`[scanner] Parsed ${listings.length} listings for ${city} from sourcedAnswer`);
    } else {
      console.error(`[scanner] Listings search failed for ${city}:`, listingsResult.reason);
    }

    // Extract DVF data
    const dvfData: DVFData[] =
      dvfResult.status === 'fulfilled'
        ? dvfResult.value.data.neighborhoods ?? []
        : [];

    // Extract Airbnb data
    const airbnbData: AirbnbData[] =
      airbnbResult.status === 'fulfilled'
        ? airbnbResult.value.data.neighborhoods ?? []
        : [];

    if (listings.length === 0) {
      console.log(`[scanner] No listings parsed for ${city}`);
      return [];
    }

    // Build lookup maps
    const dvfMap = new Map<string, number>();
    for (const d of dvfData) {
      dvfMap.set(d.neighborhood.toLowerCase(), d.averagePricePerSqm);
    }

    const airbnbMap = new Map<string, number>();
    for (const a of airbnbData) {
      airbnbMap.set(a.neighborhood.toLowerCase(), a.averageNightlyRate);
    }

    // Fallback averages
    const defaultDvf = dvfData.length > 0
      ? dvfData.reduce((sum, d) => sum + d.averagePricePerSqm, 0) / dvfData.length
      : 3000; // conservative default
    const defaultAirbnb = airbnbData.length > 0
      ? airbnbData.reduce((sum, a) => sum + a.averageNightlyRate, 0) / airbnbData.length
      : 60;

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
          source: listing.source || 'seloger',
          sourceUrl: listing.url || '#',
          description: listing.description || '',
          strategy,
          contactName: listing.contactName || undefined,
          contactType: listing.contactName ? listing.contactType : undefined,
        };
      });

    return deals;
  } catch (error) {
    console.error(`[scanner] Error scanning ${city}:`, error);
    return [];
  }
}
