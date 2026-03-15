import { NextRequest, NextResponse } from 'next/server';
import { getCachedAutocomplete, setCachedAutocomplete } from '@/lib/cache/redis';

interface NhtsaModel { Model_ID: number; Model_Name: string }

export async function GET(req: NextRequest) {
  const make = req.nextUrl.searchParams.get('make');
  if (!make) return NextResponse.json({ error: 'make is required' }, { status: 400 });

  const cacheKey = `vehicle-models-${make.toLowerCase()}`;
  const cached = await getCachedAutocomplete<string[]>(cacheKey);
  if (cached) return NextResponse.json({ models: cached });

  const res = await fetch(
    `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`,
    { next: { revalidate: 86400 } }
  );
  const data = (await res.json()) as { Results: NhtsaModel[] };
  const models = data.Results.map((m) => m.Model_Name).sort();

  setCachedAutocomplete(cacheKey, models).catch(() => {});
  return NextResponse.json({ models });
}
