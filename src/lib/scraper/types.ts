export interface SearchQuery {
  query: string;
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;  // centavos
  priceMax?: number;  // centavos
  lat: number;
  lng: number;
  radiusMiles: number;
  zip?: string;
  page?: number;
  limit?: number;
  vehicleYear?: number;
}

export interface ScrapedListing {
  externalId: string;
  title: string;
  description?: string;
  priceCents?: number;
  imageUrls?: string[];
  originalUrl: string;
  lat?: number;
  lng?: number;
  city?: string;
  state?: string;
  zip?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  partName?: string;
  partNumber?: string;
  condition?: 'used' | 'refurbished' | 'like_new' | 'for_parts';
  sellerName?: string;
}

export interface AdapterResult {
  listings: ScrapedListing[];
  totalResults?: number;
  hasMore: boolean;
  scrapedAt: Date;
}

export interface SourceAdapter {
  readonly key: string;
  readonly name: string;
  search(query: SearchQuery): Promise<AdapterResult>;
  getDetails?(listingId: string): Promise<ScrapedListing>;
  healthCheck(): Promise<boolean>;
}

export interface AdapterMetrics {
  key: string;
  durationMs: number;
  resultCount: number;
  success: boolean;
  error?: string;
}

export interface EngineResult {
  listings: Array<ScrapedListing & { sourceKey: string; sourceName: string; distanceMiles?: number }>;
  totalResults: number;
  metrics: AdapterMetrics[];
  cachedAt?: Date;
}
