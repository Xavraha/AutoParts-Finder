import { NextResponse } from 'next/server';
import { getCachedAutocomplete, setCachedAutocomplete } from '@/lib/cache/redis';

interface NhtsaMake { MakeId: number; MakeName: string }

export async function GET() {
  const cacheKey = 'vehicle-makes';
  const cached = await getCachedAutocomplete<string[]>(cacheKey);
  if (cached) return NextResponse.json({ makes: cached });

  const res = await fetch(
    'https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json',
    { next: { revalidate: 86400 } }
  );
  const data = (await res.json()) as { Results: NhtsaMake[] };
  const makes = data.Results.map((m) => m.MakeName).sort();

  setCachedAutocomplete(cacheKey, makes).catch(() => {});
  return NextResponse.json({ makes });
}
