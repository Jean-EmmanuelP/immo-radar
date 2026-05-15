import type { Deal } from './types';

// Realistic mock data so the UI always shows something
// even when LinkUp is slow or unavailable.

let _id = 0;
function nextId() {
  return `mock-${++_id}`;
}

function computeScore(discount: number, yield_: number): number {
  // Score from 0-100: 50% weight on discount, 50% on yield
  const discountScore = Math.min(discount * 2, 50); // up to 25% discount = 50 pts
  const yieldScore = Math.min(yield_ * 5, 50); // up to 10% yield = 50 pts
  return Math.round(discountScore + yieldScore);
}

function makeDeal(
  city: string,
  neighborhood: string,
  address: string,
  askingPrice: number,
  surface: number,
  marketPricePerSqm: number,
  airbnbNightlyRate: number,
  source: string,
  description: string,
): Deal {
  const pricePerSqm = askingPrice / surface;
  const estimatedMarketValue = marketPricePerSqm * surface;
  const discount = Math.round(((estimatedMarketValue - askingPrice) / estimatedMarketValue) * 100);
  const airbnbMonthlyRevenue = Math.round(airbnbNightlyRate * 30 * 0.65);
  const airbnbAnnualYield = Math.round(((airbnbMonthlyRevenue * 12) / askingPrice) * 10000) / 100;
  const score = computeScore(Math.max(discount, 0), airbnbAnnualYield);

  return {
    id: nextId(),
    city,
    neighborhood,
    address,
    askingPrice,
    estimatedMarketValue,
    surface,
    pricePerSqm: Math.round(pricePerSqm),
    marketPricePerSqm,
    discount,
    airbnbNightlyRate,
    airbnbMonthlyRevenue,
    airbnbAnnualYield,
    score,
    source,
    sourceUrl: `https://www.leboncoin.fr/ventes_immobilieres/${Math.floor(Math.random() * 999999999)}`,
    description,
  };
}

export const MOCK_DEALS: Deal[] = [
  // Paris
  makeDeal('Paris', 'Marais', '23 Rue des Francs-Bourgeois, 75004', 385000, 35, 13500, 145, 'leboncoin', 'Studio rénové dans le Marais, idéal investissement locatif. Parquet ancien, poutres apparentes.'),
  makeDeal('Paris', 'Belleville', '15 Rue de Belleville, 75020', 295000, 42, 8500, 110, 'seloger', 'T2 lumineux avec vue dégagée, quartier en pleine gentrification. Proche métro.'),
  makeDeal('Paris', 'Batignolles', '8 Rue Legendre, 75017', 450000, 55, 10200, 130, 'leboncoin', 'T3 familial, cuisine équipée, balcon. Quartier calme et recherché.'),
  makeDeal('Paris', 'Oberkampf', '42 Rue Oberkampf, 75011', 320000, 38, 10800, 125, 'seloger', 'T2 à rafraîchir, fort potentiel. Rue très demandée pour location courte durée.'),

  // Lyon
  makeDeal('Lyon', 'Croix-Rousse', '12 Montée de la Grande Côte, 69001', 195000, 45, 5200, 85, 'leboncoin', 'T2 typique Croix-Rousse, plafonds hauts, traboule. Vue sur les toits.'),
  makeDeal('Lyon', 'Presqu\'île', '5 Rue de la République, 69002', 280000, 50, 6800, 100, 'seloger', 'T3 en plein centre, idéal Airbnb. Proximité place Bellecour.'),
  makeDeal('Lyon', 'Part-Dieu', '30 Rue Garibaldi, 69003', 165000, 35, 5500, 75, 'leboncoin', 'Studio proche gare Part-Dieu, rentabilité immédiate. Locataire en place.'),

  // Marseille
  makeDeal('Marseille', 'Vieux-Port', '18 Quai de Rive Neuve, 13007', 210000, 55, 4500, 90, 'leboncoin', 'T3 vue mer, terrasse, parking. Quartier touristique premium.'),
  makeDeal('Marseille', 'Cours Julien', '7 Rue des Trois Mages, 13006', 145000, 40, 4200, 70, 'seloger', 'T2 dans quartier branché, idéal location saisonnière. Travaux faits.'),
  makeDeal('Marseille', 'Endoume', '25 Corniche Kennedy, 13007', 320000, 65, 5800, 110, 'leboncoin', 'T4 avec vue mer panoramique, terrasse 15m². Rare à ce prix.'),

  // Bordeaux
  makeDeal('Bordeaux', 'Chartrons', '14 Rue Notre-Dame, 33000', 235000, 55, 5000, 85, 'seloger', 'T3 dans les Chartrons, pierre bordelaise. Proximité quais et tram.'),
  makeDeal('Bordeaux', 'Saint-Michel', '3 Place Meynard, 33000', 175000, 45, 4600, 75, 'leboncoin', 'T2 rénové, quartier vivant. Fort potentiel locatif.'),

  // Toulouse
  makeDeal('Toulouse', 'Capitole', '8 Rue Alsace-Lorraine, 31000', 198000, 42, 5300, 80, 'seloger', 'T2 hypercentre, briques roses. Très demandé en location courte durée.'),
  makeDeal('Toulouse', 'Saint-Cyprien', '22 Rue de la République, 31300', 165000, 50, 3800, 65, 'leboncoin', 'T3 rive gauche, calme, proche métro. Prix négociable.'),

  // Nantes
  makeDeal('Nantes', 'Centre-ville', '10 Rue Crébillon, 44000', 195000, 48, 4700, 75, 'seloger', 'T2 plein centre, immeuble haussmannien. Très bon état.'),
  makeDeal('Nantes', 'Île de Nantes', '15 Boulevard de la Prairie, 44200', 220000, 55, 4400, 80, 'leboncoin', 'T3 neuf, quartier en plein boom. Balcon, parking inclus.'),

  // Lille
  makeDeal('Lille', 'Vieux-Lille', '5 Rue de la Monnaie, 59800', 225000, 50, 5200, 80, 'leboncoin', 'T2 de charme dans le Vieux-Lille, briques et parquet. Idéal investissement.'),
  makeDeal('Lille', 'Wazemmes', '18 Rue Gambetta, 59000', 135000, 45, 3500, 60, 'seloger', 'T2 quartier populaire et branché. Prix très attractif.'),

  // Strasbourg
  makeDeal('Strasbourg', 'Petite France', '3 Rue du Bain-aux-Plantes, 67000', 260000, 50, 5800, 95, 'seloger', 'T2 colombages, quartier UNESCO. Rendement Airbnb exceptionnel.'),
  makeDeal('Strasbourg', 'Krutenau', '12 Rue de Zurich, 67000', 175000, 45, 4500, 70, 'leboncoin', 'T2 quartier étudiant animé, proche université. Travaux légers.'),

  // Montpellier
  makeDeal('Montpellier', 'Écusson', '8 Rue Foch, 34000', 185000, 40, 5200, 80, 'leboncoin', 'T2 centre historique, pierres de taille. Vue sur place de la Comédie.'),
  makeDeal('Montpellier', 'Antigone', '20 Esplanade de l\'Europe, 34000', 155000, 45, 4000, 65, 'seloger', 'T2 architecture néo-classique, terrasse. Proche tramway.'),

  // Nice
  makeDeal('Nice', 'Vieux-Nice', '6 Rue du Pont-Vieux, 06300', 275000, 42, 7500, 110, 'seloger', 'T2 Vieux-Nice, rénové, climatisé. Rendement Airbnb très élevé.'),
  makeDeal('Nice', 'Promenade', '45 Promenade des Anglais, 06000', 380000, 55, 8200, 130, 'leboncoin', 'T3 face mer, 2ème étage, balcon. Emplacement premium absolu.'),
  makeDeal('Nice', 'Libération', '12 Avenue Malausséna, 06000', 195000, 40, 5800, 85, 'leboncoin', 'T2 quartier Libération, marché, ambiance village. Bon état.'),
];
