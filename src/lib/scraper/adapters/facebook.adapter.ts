import type { SourceAdapter, SearchQuery, AdapterResult, ScrapedListing } from '../types';

// Apify actor for Facebook Marketplace: apify/facebook-marketplace-scraper
// Free tier: 5 actor runs/month, up to 1000 results each
// Docs: https://apify.com/apify/facebook-marketplace-scraper

interface ApifyRun {
  id: string;
  status: string;
  defaultDatasetId: string;
}

interface ApifyDatasetItem {
  id?: string;
  title?: string;
  price?: string;
  priceAmount?: number;
  location?: string;
  city?: string;
  state?: string;
  primaryPhoto?: { uri?: string };
  photos?: Array<{ uri?: string }>;
  url?: string;
  description?: string;
  sellerName?: string;
  listingType?: string;
}

export class FacebookAdapter implements SourceAdapter {
  readonly key = 'facebook';
  readonly name = 'Facebook Marketplace';

  private readonly apiToken: string;
  private readonly actorId = 'apify~facebook-marketplace-scraper';

  constructor() {
    this.apiToken = process.env.APIFY_API_TOKEN ?? '';
  }

  async search(query: SearchQuery): Promise<AdapterResult> {
    if (!this.apiToken || this.apiToken === 'placeholder') {
      throw new Error('APIFY_API_TOKEN not configured');
    }

    const searchTerm = [query.query, query.make, query.model].filter(Boolean).join(' ');

    // Start Apify actor run
    const runRes = await fetch(
      `https://api.apify.com/v2/acts/${this.actorId}/runs?token=${this.apiToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchTerms: [searchTerm],
          maxItems: query.limit ?? 20,
          countryCode: 'US',
          categoryId: '807311116002811', // Vehicles > Auto Parts
          locationRadius: `${query.radiusMiles} miles`,
          priceMin: query.priceMin ? query.priceMin / 100 : undefined,
          priceMax: query.priceMax ? query.priceMax / 100 : undefined,
        }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!runRes.ok) {
      throw new Error(`Apify start failed: ${runRes.status}`);
    }

    const run = (await runRes.json()) as { data: ApifyRun };
    const runId = run.data.id;

    // Poll for completion (max 60s)
    const datasetId = await this.waitForRun(runId);

    // Fetch results
    const resultsRes = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${this.apiToken}&limit=${query.limit ?? 20}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!resultsRes.ok) {
      throw new Error(`Apify dataset fetch failed: ${resultsRes.status}`);
    }

    const items = (await resultsRes.json()) as ApifyDatasetItem[];
    const listings = items.map((item) => this.mapItem(item, query));

    return {
      listings,
      totalResults: listings.length,
      hasMore: listings.length >= (query.limit ?? 20),
      scrapedAt: new Date(),
    };
  }

  private async waitForRun(runId: string, maxWaitMs = 60000): Promise<string> {
    const pollInterval = 3000;
    const maxAttempts = Math.floor(maxWaitMs / pollInterval);

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, pollInterval));

      const res = await fetch(
        `https://api.apify.com/v2/actor-runs/${runId}?token=${this.apiToken}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (!res.ok) continue;

      const data = (await res.json()) as { data: ApifyRun };
      const { status, defaultDatasetId } = data.data;

      if (status === 'SUCCEEDED') return defaultDatasetId;
      if (status === 'FAILED' || status === 'ABORTED') {
        throw new Error(`Apify run ${status}`);
      }
    }

    throw new Error('Apify run timed out');
  }

  private mapItem(item: ApifyDatasetItem, query: SearchQuery): ScrapedListing {
    const priceRaw = item.priceAmount ?? this.parsePrice(item.price ?? '');
    const priceCents = priceRaw ? Math.round(priceRaw * 100) : undefined;

    const imageUrls = [
      item.primaryPhoto?.uri,
      ...(item.photos?.map((p) => p.uri) ?? []),
    ].filter((u): u is string => Boolean(u));

    // Facebook doesn't give precise coords — use city approximation
    const locationParts = (item.location ?? '').split(',').map((s) => s.trim());

    return {
      externalId: item.id ?? `fb-${Date.now()}-${Math.random()}`,
      title: item.title ?? 'Facebook Marketplace Listing',
      description: item.description,
      priceCents,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      originalUrl: item.url ?? 'https://www.facebook.com/marketplace',
      city: item.city ?? locationParts[0],
      state: item.state ?? locationParts[1],
      vehicleMake: query.make,
      vehicleModel: query.model,
      condition: 'used',
      sellerName: item.sellerName,
    };
  }

  private parsePrice(raw: string): number | undefined {
    const m = raw.replace(/,/g, '').match(/[\d.]+/);
    return m ? parseFloat(m[0]!) : undefined;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiToken || this.apiToken === 'placeholder') return false;
    try {
      const res = await fetch(`https://api.apify.com/v2/users/me?token=${this.apiToken}`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
