import { haversineDistance } from '@/lib/geo/distance';
import type {
  SearchQuery,
  SourceAdapter,
  AdapterMetrics,
  EngineResult,
  ScrapedListing,
} from './types';

export class ScraperEngine {
  private adapters: Map<string, SourceAdapter>;

  constructor(adapters: SourceAdapter[]) {
    this.adapters = new Map(adapters.map((a) => [a.key, a]));
  }

  async search(query: SearchQuery): Promise<EngineResult> {
    const activeAdapters = Array.from(this.adapters.values());

    const results = await Promise.allSettled(
      activeAdapters.map((adapter) => this.runAdapter(adapter, query))
    );

    const allListings: EngineResult['listings'] = [];
    const metrics: AdapterMetrics[] = [];
    const seen = new Set<string>();

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { adapterKey, adapterName, listings, metric } = result.value;
        metrics.push(metric);

        for (const listing of listings) {
          const dedupeKey = `${adapterKey}:${listing.externalId}`;
          if (seen.has(dedupeKey)) continue;
          seen.add(dedupeKey);

          // Filter by radius if listing has coords
          let distanceMiles: number | undefined;
          if (listing.lat != null && listing.lng != null) {
            distanceMiles = haversineDistance(
              query.lat,
              query.lng,
              listing.lat,
              listing.lng
            );
            if (distanceMiles > query.radiusMiles) continue;
          }

          allListings.push({
            ...listing,
            sourceKey: adapterKey,
            sourceName: adapterName,
            distanceMiles,
          });
        }
      } else {
        // Adapter failed — log but don't break
        console.error('[ScraperEngine] Adapter failed:', result.reason);
      }
    }

    // Sort: listings with price first, then by distance
    allListings.sort((a, b) => {
      if (a.priceCents != null && b.priceCents != null) {
        return a.priceCents - b.priceCents;
      }
      if (a.priceCents != null) return -1;
      if (b.priceCents != null) return 1;
      return (a.distanceMiles ?? 9999) - (b.distanceMiles ?? 9999);
    });

    return {
      listings: allListings,
      totalResults: allListings.length,
      metrics,
    };
  }

  private async runAdapter(adapter: SourceAdapter, query: SearchQuery) {
    const start = Date.now();
    try {
      const result = await adapter.search(query);
      const metric: AdapterMetrics = {
        key: adapter.key,
        durationMs: Date.now() - start,
        resultCount: result.listings.length,
        success: true,
      };
      return {
        adapterKey: adapter.key,
        adapterName: adapter.name,
        listings: result.listings,
        metric,
      };
    } catch (err) {
      const metric: AdapterMetrics = {
        key: adapter.key,
        durationMs: Date.now() - start,
        resultCount: 0,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
      throw { adapterKey: adapter.key, metric, error: err };
    }
  }

  getAdapter(key: string): SourceAdapter | undefined {
    return this.adapters.get(key);
  }
}
