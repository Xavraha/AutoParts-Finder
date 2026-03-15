import * as cheerio from 'cheerio';
import type { SourceAdapter, SearchQuery, AdapterResult, ScrapedListing } from '../types';

const DELAY_MS = 2000;
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36',
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export class LkqAdapter implements SourceAdapter {
  readonly key = 'lkq';
  readonly name = 'LKQ Online';

  private lastRequestAt = 0;

  private async throttle(): Promise<void> {
    const elapsed = Date.now() - this.lastRequestAt;
    if (elapsed < DELAY_MS) await sleep(DELAY_MS - elapsed);
    this.lastRequestAt = Date.now();
  }

  async search(query: SearchQuery): Promise<AdapterResult> {
    await this.throttle();

    const searchTerm = [query.query, query.make, query.model].filter(Boolean).join(' ');
    const zip = query.zip ?? '90001';

    // LKQ uses a search URL with part name + zip
    const params = new URLSearchParams({
      q: searchTerm,
      zip,
      radius: String(Math.min(query.radiusMiles, 500)),
    });

    const url = `https://www.lkqonline.com/search?${params}`;

    let html: string;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]!,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          Referer: 'https://www.lkqonline.com/',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) throw new Error(`LKQ responded ${res.status}`);
      html = await res.text();
    } catch (err) {
      throw new Error(`LKQ fetch failed: ${err instanceof Error ? err.message : String(err)}`);
    }

    return this.parse(html, query);
  }

  private parse(html: string, query: SearchQuery): AdapterResult {
    const $ = cheerio.load(html);
    const listings: ScrapedListing[] = [];

    // LKQ product cards — selectors based on observed HTML structure
    $('[class*="product-card"], [class*="part-item"], .search-result-item').each((i, el) => {
      const $el = $(el);

      const title =
        $el.find('[class*="product-title"], [class*="part-name"], h3, h2').first().text().trim();
      if (!title) return;

      const priceText = $el.find('[class*="price"], [class*="cost"]').first().text().trim();
      const priceMatch = priceText.match(/[\d,]+\.?\d*/);
      const priceCents = priceMatch
        ? Math.round(parseFloat(priceMatch[0].replace(',', '')) * 100)
        : undefined;

      const location = $el.find('[class*="location"], [class*="store"]').first().text().trim();
      const locationParts = location.split(',').map((s) => s.trim());

      const imgSrc = $el.find('img').first().attr('src');
      const href = $el.find('a').first().attr('href');
      const partUrl = href
        ? href.startsWith('http')
          ? href
          : `https://www.lkqonline.com${href}`
        : 'https://www.lkqonline.com';

      const externalId = href
        ? href.replace(/[^a-zA-Z0-9]/g, '-').slice(-30)
        : `lkq-${i}`;

      listings.push({
        externalId,
        title,
        priceCents,
        imageUrls: imgSrc ? [imgSrc] : undefined,
        originalUrl: partUrl,
        city: locationParts[0],
        state: locationParts[1],
        vehicleMake: query.make,
        vehicleModel: query.model,
        vehicleYear: query.yearMin,
        partName: query.query,
        condition: 'used',
        sellerName: 'LKQ',
      });
    });

    return {
      listings: listings.slice(0, query.limit ?? 20),
      totalResults: listings.length,
      hasMore: listings.length >= (query.limit ?? 20),
      scrapedAt: new Date(),
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch('https://www.lkqonline.com', {
        headers: { 'User-Agent': USER_AGENTS[0]! },
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
