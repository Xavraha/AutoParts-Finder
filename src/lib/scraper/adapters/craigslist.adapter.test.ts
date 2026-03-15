import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CraigslistAdapter } from './craigslist.adapter';
import type { SearchQuery } from '../types';

const BASE_QUERY: SearchQuery = {
  query: 'alternator',
  lat: 33.749,  // Atlanta
  lng: -84.388,
  radiusMiles: 100,
};

const MOCK_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>atlanta craigslist | auto parts - by owner</title>
    <item>
      <title>Alternator Honda Civic $85 (Atlanta)</title>
      <link>https://atlanta.craigslist.org/atl/pta/1234567890.html</link>
      <description>OEM alternator, tested and working</description>
    </item>
    <item>
      <title>Toyota Camry Starter Motor $65 (Marietta)</title>
      <link>https://atlanta.craigslist.org/atl/pta/9876543210.html</link>
      <description>Pulled from 2017 Camry</description>
    </item>
  </channel>
</rss>`;

describe('CraigslistAdapter', () => {
  let adapter: CraigslistAdapter;

  beforeEach(() => {
    adapter = new CraigslistAdapter();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => MOCK_RSS,
    }));
  });

  it('parses RSS listings', async () => {
    const result = await adapter.search(BASE_QUERY);
    expect(result.listings.length).toBeGreaterThan(0);
    expect(result.listings[0]!.title).toContain('Alternator');
  });

  it('extracts price from title', async () => {
    const result = await adapter.search(BASE_QUERY);
    expect(result.listings[0]!.priceCents).toBe(8500); // $85
    expect(result.listings[1]!.priceCents).toBe(6500); // $65
  });

  it('extracts external ID from URL', async () => {
    const result = await adapter.search(BASE_QUERY);
    expect(result.listings[0]!.externalId).toBe('1234567890');
    expect(result.listings[1]!.externalId).toBe('9876543210');
  });

  it('selects only metros within radius', async () => {
    // Very small radius — only Atlanta should be selected (query centered on Atlanta)
    const narrowQuery = { ...BASE_QUERY, radiusMiles: 10 };
    await adapter.search(narrowQuery);
    // fetch should only be called once (only Atlanta metro is within 10 miles)
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

  it('handles fetch failure gracefully — returns empty array', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')));
    const result = await adapter.search(BASE_QUERY);
    expect(result.listings).toHaveLength(0);
  });
});
