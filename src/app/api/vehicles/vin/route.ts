import { NextRequest, NextResponse } from 'next/server';
import { decodeVin } from '@/lib/utils/vin';

export async function GET(req: NextRequest) {
  const vin = req.nextUrl.searchParams.get('vin');

  if (!vin) {
    return NextResponse.json({ error: 'vin parameter is required', code: 400 }, { status: 400 });
  }

  if (vin.length !== 17) {
    return NextResponse.json({ error: 'VIN must be 17 characters', code: 400 }, { status: 400 });
  }

  try {
    const result = await decodeVin(vin);
    return NextResponse.json({ vehicle: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'VIN decode failed', code: 500 },
      { status: 500 }
    );
  }
}
