import { haversineDistance } from '@/lib/geo/distance';
import type { SourceAdapter, SearchQuery, AdapterResult, ScrapedListing } from '../types';

// OfferUp internal search API — no auth required
// Category 48 = Auto Parts, 53 = Auto Wheels & Tires
const OFFERUP_SEARCH_URL = 'https://offerup.com/api/search/v3/listings/';
const AUTO_PARTS_CATEGORY_ID = 48;
const DELAY_MS = 2000;

interface OfferUpListing {
  id?: string | number;
  name?: string;
  description?: string;
  price?: string | number;
  state?: string; // 'for_sale', etc.
  condition?: string; // 'Used', 'New', etc.
  location?: {
    city?: string;
    state?: string;
    zip_code?: string;
    lat?: number;
    lng?: number;
  };
  images?: Array<{ url?: string; cdn_url?: string }>;
  seller?: { name?: string };
  slug?: string;
  share_url?: string;
}

interface OfferUpResponse {
  data?: {
    listings?: OfferUpListing[];
    meta?: { total_count?: number; next_page?: string };
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export class OfferUpAdapter implements SourceAdapter {
  readonly key = 'offerup';
  readonly name = 'OfferUp';

  private lastRequestAt = 0;

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < DELAY_MS) await sleep(DELAY_MS - elapsed);
    this.lastRequestAt = Date.now();
  }

  async search(query: SearchQuery): Promise<AdapterResult> {
    await this.throttle();

    const searchTerm = [query.query, query.make, query.model].filter(Boolean).join(' ');
    const limit = query.limit ?? 20;
    const offset = ((query.page ?? 1) - 1) * limit;

    const params = new URLSearchParams({
      q: searchTerm,
      category_id: String(AUTO_PARTS_CATEGORY_ID),
      limit: String(limit),
      offset: String(offset),
      include_seller_info: 'true',
    });

    // Use zip if available, otherwise lat/lng
    if (query.zip) {
      params.set('zip', query.zip);
      params.set('radius', String(query.radiusMiles));
    } else {
      params.set('lat', String(query.lat));
      params.set('lng', String(query.lng));
      params.set('radius', String(query.radiusMiles));
    }

    if (query.priceMin) params.set('price_min', String(Math.floor(query.priceMin / 100)));
    if (query.priceMax) params.set('price_max', String(Math.floor(query.priceMax / 100)));

    const res = await fetch(`${OFFERUP_SEARCH_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        Accept: 'application/json',
        Referer: 'https://offerup.com/',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) throw new Error(`OfferUp API returned ${res.status}`);

    const json = (await res.json()) as OfferUpResponse;
    const rawListings = json?.data?.listings ?? [];
    const totalCount = json?.data?.meta?.total_count ?? rawListings.length;

    const listings = rawListings
      .filter((item) => this.isWithinRadius(item, query))
      .map((item) => this.mapItem(item, query));

    return {
      listings,
      totalResults: totalCount,
      hasMore: offset + listings.length < totalCount,
      scrapedAt: new Date(),
    };
  }

  private isWithinRadius(item: OfferUpListing, query: SearchQuery): boolean {
    const lat = item.location?.lat;
    const lng = item.location?.lng;
    if (!lat || !lng) return true; // keep if we can't verify
    const dist = haversineDistance(query.lat, query.lng, lat, lng);
    return dist <= query.radiusMiles;
  }

  private mapItem(item: OfferUpListing, query: SearchQuery): ScrapedListing {
    const id = item.id ? String(item.id) : `ou-${Date.now()}-${Math.random()}`;

    const priceRaw = typeof item.price === 'string'
      ? parseFloat(item.price.replace(/[^0-9.]/g, ''))
      : item.price;
    const priceCents = priceRaw && !isNaN(priceRaw) ? Math.round(priceRaw * 100) : undefined;

    const imageUrls = (item.images ?? [])
      .map((img) => img.cdn_url ?? img.url)
      .filter((u): u is string => Boolean(u));

    const url = item.share_url ?? `https://offerup.com/item/detail/${id}`;

    const condition = this.mapCondition(item.condition);

    return {
      externalId: id,
      title: item.name ?? 'OfferUp Listing',
      description: item.description,
      priceCents,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      originalUrl: url,
      lat: item.location?.lat,
      lng: item.location?.lng,
      city: item.location?.city,
      state: item.location?.state,
      zip: item.location?.zip_code,
      vehicleMake: query.make,
      vehicleModel: query.model,
      condition,
      sellerName: item.seller?.name,
    };
  }

  private mapCondition(raw?: string): ScrapedListing['condition'] {
    if (!raw) return 'used';
    const lower = raw.toLowerCase();
    if (lower.includes('new')) return 'like_new';
    if (lower.includes('parts')) return 'for_parts';
    if (lower.includes('refurb') || lower.includes('remanufact')) return 'refurbished';
    return 'used';
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch('https://offerup.com', {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
