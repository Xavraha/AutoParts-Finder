import { NextRequest, NextResponse } from 'next/server';
import { getListingById } from '@/lib/db/queries';
import { getPriceHistory, analyzePriceTrend } from '@/lib/db/price-history';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found', code: 404 }, { status: 404 });
  }

  const history = await getPriceHistory(id);
  const priceTrend = analyzePriceTrend(history);

  return NextResponse.json({ listing, priceTrend });
}
