import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ScraperEngine } from '@/lib/scraper/engine';
import { getActiveAdapters } from '@/lib/scraper/registry';
import { getCachedSearch, setCachedSearch } from '@/lib/cache/redis';
import { checkRateLimit } from '@/lib/cache/ratelimit';
import type { SearchResponse, ApiError } from '@/types/api';

const SearchSchema = z.object({
  query: z.string().min(1, 'query is required'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusMiles: z.number().min(1).max(1000).default(50),
  make: z.string().optional(),
  model: z.string().optional(),
  yearMin: z.number().int().min(1900).max(2100).optional(),
  yearMax: z.number().int().min(1900).max(2100).optional(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  zip: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export async function POST(req: NextRequest): Promise<NextResponse<SearchResponse | ApiError>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body', code: 400 }, { status: 400 });
  }

  const parsed = SearchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(', '), code: 400 },
      { status: 400 }
    );
  }

  const queryParams = parsed.data;

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'anonymous';
  const { allowed, remaining } = await checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.', code: 429 },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    );
  }

  // Check cache
  const cacheParams = { ...queryParams } as Record<string, unknown>;
  const cached = await getCachedSearch<SearchResponse>(cacheParams);
  if (cached) {
    return NextResponse.json({ ...cached, cachedAt: new Date().toISOString() } as unknown as SearchResponse);
  }

  try {
    const engine = new ScraperEngine(getActiveAdapters());
    const engineResult = await engine.search(queryParams);

    const response: SearchResponse = {
      results: engineResult.listings,
      totalResults: engineResult.totalResults,
      sources: engineResult.metrics.map((m) => ({
        key: m.key,
        name: m.key,
        resultCount: m.resultCount,
        durationMs: m.durationMs,
        success: m.success,
        error: m.error,
      })),
    };

    // Cache the result (fire-and-forget)
    setCachedSearch(cacheParams, response).catch(() => {});

    return NextResponse.json(response);
  } catch (err) {
    console.error('[POST /api/search] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error', code: 500 }, { status: 500 });
  }
}
