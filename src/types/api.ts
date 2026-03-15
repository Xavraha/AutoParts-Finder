export interface ApiError {
  error: string;
  code: number;
}

export interface SearchResponse {
  results: Array<{
    externalId: string;
    title: string;
    description?: string;
    priceCents?: number;
    imageUrls?: string[];
    originalUrl: string;
    city?: string;
    state?: string;
    zip?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    vehicleYear?: number;
    partName?: string;
    partNumber?: string;
    condition?: string;
    sellerName?: string;
    sourceKey: string;
    sourceName: string;
    distanceMiles?: number;
  }>;
  totalResults: number;
  sources: Array<{
    key: string;
    name: string;
    resultCount: number;
    durationMs: number;
    success: boolean;
    error?: string;
  }>;
}
