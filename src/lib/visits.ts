// Track which cities have been visited recently.
// Uses /tmp files — lightweight, no external DB needed.
// The cron only refreshes cities that appear in this list.

import fs from 'fs';
import path from 'path';

const VISITS_FILE = path.join('/tmp', 'immo-radar-visits.json');
const VISIT_TTL_MS = 48 * 60 * 60 * 1000; // 48h

interface VisitRecord {
  city: string;
  lastVisited: number;
}

function readVisits(): VisitRecord[] {
  try {
    if (!fs.existsSync(VISITS_FILE)) return [];
    const raw = fs.readFileSync(VISITS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeVisits(visits: VisitRecord[]) {
  try {
    fs.writeFileSync(VISITS_FILE, JSON.stringify(visits));
  } catch {
    // ignore
  }
}

/** Record that a city was visited */
export function recordVisit(city: string) {
  const visits = readVisits();
  const existing = visits.find((v) => v.city.toLowerCase() === city.toLowerCase());
  if (existing) {
    existing.lastVisited = Date.now();
  } else {
    visits.push({ city, lastVisited: Date.now() });
  }
  writeVisits(visits);
}

/** Get cities visited in the last 48h */
export function getRecentlyVisitedCities(): string[] {
  const visits = readVisits();
  const cutoff = Date.now() - VISIT_TTL_MS;
  return visits
    .filter((v) => v.lastVisited > cutoff)
    .map((v) => v.city);
}
