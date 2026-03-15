import { XMLParser } from 'fast-xml-parser';
import { haversineDistance, zipToCoords } from '@/lib/geo/distance';
import type { SourceAdapter, SearchQuery, AdapterResult, ScrapedListing } from '../types';

const DELAY_MS = 2000;

// Major US metro Craigslist subdomains with approximate coordinates
const CRAIGSLIST_METROS: Array<{ subdomain: string; lat: number; lng: number; city: string; state: string }> = [
  { subdomain: 'newyork',    lat: 40.7128, lng: -74.006,  city: 'New York',    state: 'NY' },
  { subdomain: 'losangeles', lat: 34.0522, lng: -118.2437,city: 'Los Angeles', state: 'CA' },
  { subdomain: 'chicago',    lat: 41.8781, lng: -87.6298, city: 'Chicago',     state: 'IL' },
  { subdomain: 'houston',    lat: 29.7604, lng: -95.3698, city: 'Houston',     state: 'TX' },
  { subdomain: 'phoenix',    lat: 33.4484, lng: -112.074, city: 'Phoenix',     state: 'AZ' },
  { subdomain: 'philadelphia',lat:39.9526, lng: -75.1652, city: 'Philadelphia',state: 'PA' },
  { subdomain: 'sanantonio', lat: 29.4241, lng: -98.4936, city: 'San Antonio', state: 'TX' },
  { subdomain: 'sandiego',   lat: 32.7157, lng: -117.1611,city: 'San Diego',   state: 'CA' },
  { subdomain: 'dallas',     lat: 32.7767, lng: -96.797,  city: 'Dallas',      state: 'TX' },
  { subdomain: 'sfbay',      lat: 37.7749, lng: -122.4194,city: 'San Francisco',state:'CA' },
  { subdomain: 'seattle',    lat: 47.6062, lng: -122.3321,city: 'Seattle',     state: 'WA' },
  { subdomain: 'denver',     lat: 39.7392, lng: -104.9903,city: 'Denver',      state: 'CO' },
  { subdomain: 'boston',     lat: 42.3601, lng: -71.0589, city: 'Boston',      state: 'MA' },
  { subdomain: 'atlanta',    lat: 33.749,  lng: -84.388,  city: 'Atlanta',     state: 'GA' },
  { subdomain: 'miami',      lat: 25.7617, lng: -80.1918, city: 'Miami',       state: 'FL' },
  { subdomain: 'minneapolis',lat: 44.9778, lng: -93.265,  city: 'Minneapolis', state: 'MN' },
  { subdomain: 'portland',   lat: 45.5051, lng: -122.675, city: 'Portland',    state: 'OR' },
  { subdomain: 'lasvegas',   lat: 36.1699, lng: -115.1398,city: 'Las Vegas',   state: 'NV' },
  { subdomain: 'detroit',    lat: 42.3314, lng: -83.0458, city: 'Detroit',     state: 'MI' },
  { subdomain: 'charlotte',  lat: 35.2271, lng: -80.8431, city: 'Charlotte',   state: 'NC' },
];

interface RssItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  'dc:date'?: string;
  enclosure?: { '@_url'?: string };
}

interface RssChannel {
  item?: RssItem | RssItem[];
}

interface RssFeed {
  rss?: { channel?: RssChannel };
  feed?: { entry?: RssItem | RssItem[] };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export class CraigslistAdapter implements SourceAdapter {
  readonly key = 'craigslist';
  readonly name = 'Craigslist';

  private lastRequestAt = 0;
  private readonly parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < DELAY_MS) await sleep(DELAY_MS - elapsed);
    this.lastRequestAt = Date.now();
  }

  async search(query: SearchQuery): Promise<AdapterResult> {
    // Select metros within the search radius
    const nearbyMetros = CRAIGSLIST_METROS.filter((metro) => {
      const dist = haversineDistance(query.lat, query.lng, metro.lat, metro.lng);
      return dist <= query.radiusMiles;
    });

    // Always include at least the closest metro
    if (nearbyMetros.length === 0) {
      const closest = CRAIGSLIST_METROS.reduce((best, metro) => {
        const d = haversineDistance(query.lat, query.lng, metro.lat, metro.lng);
        const bd = haversineDistance(query.lat, query.lng, best.lat, best.lng);
        return d < bd ? metro : best;
      });
      nearbyMetros.push(closest);
    }

    // Limit to 3 metros to avoid rate limiting
    const targetMetros = nearbyMetros.slice(0, 3);

    const allListings: ScrapedListing[] = [];

    for (const metro of targetMetros) {
      try {
        await this.throttle();
        const listings = await this.fetchMetro(metro, query);
        allListings.push(...listings);
      } catch (err) {
        console.warn(`[CraigslistAdapter] Failed for ${metro.subdomain}:`, err);
      }
    }

    return {
      listings: allListings.slice(0, query.limit ?? 20),
      totalResults: allListings.length,
      hasMore: allListings.length >= (query.limit ?? 20),
      scrapedAt: new Date(),
    };
  }

  private async fetchMetro(
    metro: (typeof CRAIGSLIST_METROS)[number],
    query: SearchQuery
  ): Promise<ScrapedListing[]> {
    const searchTerm = [query.query, query.make, query.model].filter(Boolean).join(' ');
    const url = `https://${metro.subdomain}.craigslist.org/search/pta?query=${encodeURIComponent(searchTerm)}&format=rss`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AutoPartsFinder/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`${res.status} from ${metro.subdomain}.craigslist.org`);

    const xml = await res.text();
    const feed = this.parser.parse(xml) as RssFeed;

    const rawItems: RssItem[] = [];
    const channel = feed?.rss?.channel;
    if (channel?.item) {
      rawItems.push(...(Array.isArray(channel.item) ? channel.item : [channel.item]));
    }

    return rawItems.map((item, i) => this.mapItem(item, i, metro, query));
  }

  private mapItem(
    item: RssItem,
    index: number,
    metro: (typeof CRAIGSLIST_METROS)[number],
    query: SearchQuery
  ): ScrapedListing {
    const title = item.title ?? 'Craigslist Listing';
    const url = item.link ?? `https://${metro.subdomain}.craigslist.org`;

    // Extract external ID from URL (craigslist URLs end in /1234567890.html)
    const idMatch = url.match(/\/(\d{10,})\.html/);
    const externalId = idMatch ? idMatch[1]! : `cl-${metro.subdomain}-${index}`;

    // Extract price from title — Craigslist often puts price in title: "Alternator $85"
    const priceMatch = title.match(/\$\s*([\d,]+)/);
    const priceCents = priceMatch
      ? Math.round(parseFloat(priceMatch[1]!.replace(',', '')) * 100)
      : undefined;

    // Extract image from description or enclosure
    const imageUrl = item.enclosure?.['@_url'] ?? undefined;

    return {
      externalId,
      title,
      description: item.description,
      priceCents,
      imageUrls: imageUrl ? [imageUrl] : undefined,
      originalUrl: url,
      lat: metro.lat,
      lng: metro.lng,
      city: metro.city,
      state: metro.state,
      vehicleMake: query.make,
      vehicleModel: query.model,
      condition: 'used',
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch('https://atlanta.craigslist.org', {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
