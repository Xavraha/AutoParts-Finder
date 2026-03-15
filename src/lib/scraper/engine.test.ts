import { describe, it, expect, vi } from 'vitest';
import { ScraperEngine } from './engine';
import { MockAdapter } from './adapters/mock.adapter';
import type { SourceAdapter, SearchQuery, AdapterResult } from './types';

const BASE_QUERY: SearchQuery = {
  query: 'alternator',
  lat: 33.749,
  lng: -84.388,
  radiusMiles: 100,
};

describe('ScraperEngine', () => {
  it('returns results from mock adapter', async () => {
    const engine = new ScraperEngine([new MockAdapter()]);
    const result = await engine.search(BASE_QUERY);
    expect(result.listings.length).toBeGreaterThan(0);
    expect(result.listings[0].sourceKey).toBe('mock');
    expect(result.metrics[0].success).toBe(true);
  });

  it('runs all adapters in parallel', async () => {
    const mock1 = new MockAdapter();
    const mock2: SourceAdapter = {
      key: 'mock2',
      name: 'Mock 2',
      search: vi.fn().mockResolvedValue({
        listings: [
          {
            externalId: 'mock2-001',
            title: 'Honda Civic Alternator from Mock2',
            originalUrl: 'https://example.com/mock2-001',
            priceCents: 9000,
            lat: 33.75,
            lng: -84.39,
          },
        ],
        hasMore: false,
        scrapedAt: new Date(),
      } satisfies AdapterResult),
      healthCheck: async () => true,
    };

    const engine = new ScraperEngine([mock1, mock2]);
    const result = await engine.search(BASE_QUERY);

    expect(result.metrics).toHaveLength(2);
    expect(result.listings.some((l) => l.sourceKey === 'mock2')).toBe(true);
  });

  it('continues when one adapter fails', async () => {
    const failingAdapter: SourceAdapter = {
      key: 'failing',
      name: 'Failing Adapter',
      search: vi.fn().mockRejectedValue(new Error('Network timeout')),
      healthCheck: async () => false,
    };

    const engine = new ScraperEngine([new MockAdapter(), failingAdapter]);
    const result = await engine.search(BASE_QUERY);

    // Mock adapter results still returned
    expect(result.listings.length).toBeGreaterThan(0);
    expect(result.listings.every((l) => l.sourceKey === 'mock')).toBe(true);
  });

  it('filters listings outside the radius', async () => {
    const farAdapter: SourceAdapter = {
      key: 'far',
      name: 'Far Adapter',
      search: vi.fn().mockResolvedValue({
        listings: [
          {
            externalId: 'far-001',
            title: 'Alternator far away',
            originalUrl: 'https://example.com/far-001',
            lat: 40.7128,  // New York
            lng: -74.006,
            priceCents: 5000,
          },
        ],
        hasMore: false,
        scrapedAt: new Date(),
      } satisfies AdapterResult),
      healthCheck: async () => true,
    };

    const engine = new ScraperEngine([farAdapter]);
    const result = await engine.search({ ...BASE_QUERY, radiusMiles: 50 });

    // NY is ~870 miles from Atlanta, should be filtered out
    expect(result.listings).toHaveLength(0);
  });

  it('deduplicates listings with same source + externalId', async () => {
    const dupAdapter: SourceAdapter = {
      key: 'dup',
      name: 'Dup Adapter',
      search: vi.fn().mockResolvedValue({
        listings: [
          { externalId: 'dup-001', title: 'Alt', originalUrl: 'https://x.com/1' },
          { externalId: 'dup-001', title: 'Alt', originalUrl: 'https://x.com/1' },
        ],
        hasMore: false,
        scrapedAt: new Date(),
      } satisfies AdapterResult),
      healthCheck: async () => true,
    };

    const engine = new ScraperEngine([dupAdapter]);
    const result = await engine.search(BASE_QUERY);
    expect(result.listings).toHaveLength(1);
  });
});
