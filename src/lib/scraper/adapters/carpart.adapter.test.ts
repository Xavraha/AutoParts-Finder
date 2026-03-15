import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CarPartAdapter } from './carpart.adapter';
import type { SearchQuery } from '../types';

const BASE_QUERY: SearchQuery = {
  query: 'alternator',
  make: 'Honda',
  model: 'Civic',
  lat: 33.749,
  lng: -84.388,
  radiusMiles: 100,
  zip: '30301',
};

const fixtureHtml = readFileSync(
  join(__dirname, '__fixtures__', 'carpart-sample.html'),
  'utf-8'
);

describe('CarPartAdapter', () => {
  let adapter: CarPartAdapter;

  beforeEach(() => {
    adapter = new CarPartAdapter();
    // Mock fetch to return fixture HTML
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => fixtureHtml,
    }));
  });

  it('parses listings from HTML fixture', async () => {
    const result = await adapter.search(BASE_QUERY);
    expect(result.listings.length).toBe(3);
    expect(result.listings[0]!.title).toContain('Alternator');
  });

  it('maps grades to conditions correctly', async () => {
    const result = await adapter.search(BASE_QUERY);
    const [first, second, third] = result.listings;
    expect(first!.condition).toBe('refurbished');   // grade B (row 1 in fixture)
    expect(second!.condition).toBe('like_new');     // grade A (row 2 in fixture)
    expect(third!.condition).toBe('for_parts');     // grade D (row 3 in fixture)
  });

  it('extracts prices correctly', async () => {
    const result = await adapter.search(BASE_QUERY);
    expect(result.listings[0]!.priceCents).toBe(8500); // $85.00
    expect(result.listings[1]!.priceCents).toBe(11000); // $110.00
  });

  it('sets source metadata on listings', async () => {
    const result = await adapter.search(BASE_QUERY);
    expect(result.listings[0]!.vehicleMake).toBe('Honda');
    expect(result.listings[0]!.vehicleModel).toBe('Civic');
    expect(result.scrapedAt).toBeInstanceOf(Date);
  });

  it('throws when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    await expect(adapter.search(BASE_QUERY)).rejects.toThrow('car-part.com fetch failed');
  });
});
