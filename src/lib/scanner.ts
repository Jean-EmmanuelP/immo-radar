// Scanner: uses LinkUp sourcedAnswer to find real deals for any city.
// Parses the text response into Deal objects.

import { linkupSourcedAnswer, linkupStructured } from './linkup';
import type { Deal, Strategy } from './types';
import { REGULATED_CITIES } from './types';
import { computeFinancials, computeVerdict } from './financial';

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

/** Check if a URL points to an individual listing (not a search/category page) */
function isValidListingUrl(url: string): boolean {
  if (!url || url === '#') return false;
  // SeLoger individual listing: ends with /XXXXXXXX.htm
  if (/seloger\.com\/annonces\/.*\/\d+\.htm/.test(url)) return true;
  // SeLogerNeuf program page
  if (/selogerneuf\.com\/annonces\/.*\/\d+/.test(url)) return true;
  // Leboncoin individual ad: /ad/ path
  if (/leboncoin\.fr\/ad\//.test(url)) return true;
  // Agency website with specific listing ID
  if (/annonce[-_]\d+/.test(url)) return true;
  // Any URL with a long numeric ID at the end (likely an individual listing)
  if (/\/\d{6,}/.test(url)) return true;
  // Reject known search/category patterns
  if (/leboncoin\.fr\/ck\//.test(url)) return false;
  if (/leboncoin\.fr\/cl\//.test(url)) return false;
  if (/leboncoin\.fr\/boutique\//.test(url)) return false;
  if (/leboncoin\.fr\/recherche\//.test(url)) return false;
  if (/seloger\.com\/immobilier\//.test(url)) return false;
  if (/seloger\.com\/recherche\//.test(url)) return false;
  // Default: accept but flag as uncertain
  return true;
}

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

      // Extract ALL URLs from the item, prefer valid listing URLs
      const allUrls = [...item.matchAll(/(https?:\/\/[^\s\])]+)/g)]
        .map((m) => m[1].replace(/\[.*$/, '').replace(/[.,;:]+$/, ''));

      // Pick the best URL: prefer validated listing URLs
      const validUrl = allUrls.find((u) => isValidListingUrl(u));
      const url = validUrl || allUrls[0] || '#';
      const hasDirectLink = validUrl ? isValidListingUrl(validUrl) : false;

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
        `Liste les 10 appartements actuellement a vendre a ${city} France. Cherche sur seloger.com et leboncoin.fr les annonces individuelles (pas les pages de recherche).

Pour chaque bien donne:
- quartier ou adresse
- prix exact en euros
- surface en m2
- nombre de pieces
- nom de l agence immobiliere ou particulier
- URL DIRECTE vers la page de l annonce individuelle (format seloger: /annonces/achat/.../XXXXXXXX.htm ou format leboncoin: /ad/ventes_immobilieres/XXXXXXXX)

IMPORTANT: ne donne PAS d URL de pages de recherche ou de categories. Chaque URL doit pointer vers UNE SEULE annonce specifique.

Trie par prix croissant.`,
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
    let sourceUrls: string[] = [];
    if (listingsResult.status === 'fulfilled') {
      const result = listingsResult.value as { answer?: string; sources?: Array<{ url: string }> };
      const answer = result.answer || (typeof listingsResult.value === 'string' ? listingsResult.value : '');
      listings = parseListingsFromText(answer);

      // Collect valid listing URLs from LinkUp sources
      sourceUrls = (result.sources || [])
        .map((s) => s.url)
        .filter((u) => isValidListingUrl(u));

      // Enrich listings: replace bad URLs with better ones from sources
      for (const listing of listings) {
        if (!isValidListingUrl(listing.url)) {
          // Try to find a matching source URL (same site)
          const sameSource = sourceUrls.find((su) => {
            if (listing.source === 'seloger') return su.includes('seloger.com');
            if (listing.source === 'leboncoin') return su.includes('leboncoin.fr');
            return false;
          });
          if (sameSource) {
            listing.url = sameSource;
            // Remove used URL so we don't assign it twice
            sourceUrls = sourceUrls.filter((u) => u !== sameSource);
          }
        }
      }

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

        // Financial analysis
        const isNeuf = listing.description.toLowerCase().includes('neuf') ||
                       listing.url.includes('selogerneuf');
        const financial = computeFinancials(
          listing.price, listing.surface, city,
          airbnbMonthlyRevenue, estimatedMarketValue, isNeuf,
        );
        const { verdict, reason: verdictReason } = computeVerdict(financial, Math.max(discount, 0), strategy);

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
          financial,
          verdict,
          verdictReason,
        };
      });

    return deals;
  } catch (error) {
    console.error(`[scanner] Error scanning ${city}:`, error);
    return [];
  }
}
