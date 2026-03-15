import * as cheerio from 'cheerio';
import type { SourceAdapter, SearchQuery, AdapterResult, ScrapedListing } from '../types';

const DELAY_MS = 3000;
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]!;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Convert miles to km for car-part.com distance param
function milesToKm(miles: number): number {
  return Math.round(miles * 1.60934);
}

export class CarPartAdapter implements SourceAdapter {
  readonly key = 'carpart';
  readonly name = 'Car-Part.com';

  private lastRequestAt = 0;

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < DELAY_MS) {
      await sleep(DELAY_MS - elapsed);
    }
    this.lastRequestAt = Date.now();
  }

  async search(query: SearchQuery): Promise<AdapterResult> {
    await this.throttle();

    // car-part.com accepts ZIP + distance + part name
    const zip = query.zip ?? '90001'; // default to LA if no zip
    const distanceKm = milesToKm(query.radiusMiles);

    // Build the search URL — car-part.com uses a form POST style URL
    const partQuery = [query.query, query.make, query.model]
      .filter(Boolean)
      .join(' ');

    const params = new URLSearchParams({
      'action': 'search',
      'searchType': 'fuzzy',
      'entry1': partQuery,
      'zc': zip,
      'dist': String(Math.min(distanceKm, 500)),
      'vehicle_description': [query.make, query.model, query.vehicleYear ?? '']
        .filter(Boolean).join(' '),
    });

    const url = `https://www.car-part.com/cgi-bin/search.cgi?${params}`;

    let html: string;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': randomUA(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': 'https://www.car-part.com/',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        throw new Error(`car-part.com responded with ${res.status}`);
      }
      html = await res.text();
    } catch (err) {
      throw new Error(`car-part.com fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    return this.parse(html, query);
  }

  private parse(html: string, query: SearchQuery): AdapterResult {
    const $ = cheerio.load(html);
    const listings: ScrapedListing[] = [];

    // car-part.com results are in table rows with class "resultRow" or similar
    // The site uses a data table — rows contain: part, grade, price, location, distance
    $('table.result-table tr, tr.result-row, tbody tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length < 4) return;

      const titleCell = $(cells[0]).text().trim();
      const gradeCell = $(cells[1]).text().trim();
      const priceCell = $(cells[2]).text().trim();
      const locationCell = $(cells[3]).text().trim();
      const distanceCell = $(cells[4])?.text().trim() ?? '';

      if (!titleCell || titleCell.toLowerCase().includes('part name')) return;

      // Extract price
      const priceMatch = priceCell.match(/\$?([\d,]+\.?\d*)/);
      const priceCents = priceMatch
        ? Math.round(parseFloat(priceMatch[1]!.replace(',', '')) * 100)
        : undefined;

      if (priceCents === undefined && !priceCell) return;

      // Extract location (city, state)
      const locationParts = locationCell.split(',').map((s) => s.trim());
      const city = locationParts[0];
      const state = locationParts[1];

      // Generate a stable external ID
      const externalId = `carpart-${i}-${titleCell.slice(0, 20).replace(/\s+/g, '-')}`;

      const condition = this.normalizeGrade(gradeCell);

      const listing: ScrapedListing = {
        externalId,
        title: titleCell,
        priceCents,
        originalUrl: 'https://www.car-part.com',
        city,
        state,
        vehicleMake: query.make,
        vehicleModel: query.model,
        vehicleYear: query.yearMin,
        partName: query.query,
        condition,
        sellerName: locationCell,
      };

      // Try to parse distance
      const distMatch = distanceCell.match(/([\d.]+)/);
      if (distMatch) {
        const distMiles = parseFloat(distMatch[1]!) / 1.60934;
        // Approximate lat/lng offset (not accurate but enables filtering)
        listing.lat = query.lat + (distMiles / 69) * (Math.random() > 0.5 ? 1 : -1);
        listing.lng = query.lng + (distMiles / 69) * (Math.random() > 0.5 ? 1 : -1);
      }

      listings.push(listing);
    });

    return {
      listings: listings.slice(0, query.limit ?? 20),
      totalResults: listings.length,
      hasMore: listings.length >= (query.limit ?? 20),
      scrapedAt: new Date(),
    };
  }

  private normalizeGrade(grade: string): ScrapedListing['condition'] {
    const g = grade.toUpperCase();
    if (g === 'A' || g === 'A+') return 'like_new';
    if (g === 'B') return 'refurbished';
    if (g === 'D' || g === 'F') return 'for_parts';
    return 'used';
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch('https://www.car-part.com', {
        headers: { 'User-Agent': randomUA() },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
