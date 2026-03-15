import type { SourceAdapter, SearchQuery, AdapterResult, ScrapedListing } from '../types';

interface EbayTokenCache {
  token: string;
  expiresAt: number;
}

interface EbayItem {
  itemId: string;
  title: string;
  shortDescription?: string;
  price?: { value: string; currency: string };
  image?: { imageUrl: string };
  additionalImages?: Array<{ imageUrl: string }>;
  itemWebUrl: string;
  itemLocation?: {
    city?: string;
    stateOrProvince?: string;
    postalCode?: string;
    country?: string;
  };
  condition?: string;
  seller?: { username: string };
}

interface EbaySearchResponse {
  itemSummaries?: EbayItem[];
  total?: number;
  next?: string;
}

export class EbayAdapter implements SourceAdapter {
  readonly key = 'ebay';
  readonly name = 'eBay Motors';

  private tokenCache: EbayTokenCache | null = null;
  private readonly appId: string;
  private readonly certId: string;

  constructor() {
    this.appId = process.env.EBAY_APP_ID ?? '';
    this.certId = process.env.EBAY_CERT_ID ?? '';
  }

  private async getToken(): Promise<string> {
    if (this.tokenCache && Date.now() < this.tokenCache.expiresAt) {
      return this.tokenCache.token;
    }

    const credentials = Buffer.from(`${this.appId}:${this.certId}`).toString('base64');
    const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope',
    });

    if (!res.ok) {
      throw new Error(`eBay OAuth failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.tokenCache = {
      token: data.access_token,
      // Subtract 60s buffer before expiry
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };

    return this.tokenCache.token;
  }

  async search(query: SearchQuery): Promise<AdapterResult> {
    const token = await this.getToken();

    const params = new URLSearchParams({
      q: [query.query, query.make, query.model].filter(Boolean).join(' '),
      category_ids: '6030', // eBay Motors > Parts & Accessories
      limit: String(query.limit ?? 20),
      offset: String(((query.page ?? 1) - 1) * (query.limit ?? 20)),
      filter: 'buyingOptions:{FIXED_PRICE|AUCTION},itemLocationCountry:US',
    });

    if (query.priceMin) {
      params.append('filter', `price:[${query.priceMin / 100}..${(query.priceMax ?? 99999) / 100}]`);
    }

    const res = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      throw new Error(`eBay search failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as EbaySearchResponse;
    const items = data.itemSummaries ?? [];

    const listings: ScrapedListing[] = items.map((item) => {
      const priceCents = item.price?.value
        ? Math.round(parseFloat(item.price.value) * 100)
        : undefined;

      const imageUrls = [
        item.image?.imageUrl,
        ...(item.additionalImages?.map((i) => i.imageUrl) ?? []),
      ].filter(Boolean) as string[];

      const condition = this.normalizeCondition(item.condition ?? '');

      return {
        externalId: item.itemId,
        title: item.title,
        description: item.shortDescription,
        priceCents,
        imageUrls,
        originalUrl: item.itemWebUrl,
        city: item.itemLocation?.city,
        state: item.itemLocation?.stateOrProvince,
        zip: item.itemLocation?.postalCode,
        vehicleMake: query.make,
        vehicleModel: query.model,
        condition,
        sellerName: item.seller?.username,
      };
    });

    return {
      listings,
      totalResults: data.total,
      hasMore: !!data.next,
      scrapedAt: new Date(),
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.getToken();
      return true;
    } catch {
      return false;
    }
  }

  private normalizeCondition(
    condition: string
  ): ScrapedListing['condition'] {
    const c = condition.toLowerCase();
    if (c.includes('new')) return 'like_new';
    if (c.includes('refurb') || c.includes('remanufactur')) return 'refurbished';
    if (c.includes('parts') || c.includes('repair')) return 'for_parts';
    return 'used';
  }
}
