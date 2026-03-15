import { db } from './index';
import { priceHistory, listings } from './schema';
import { eq, desc, asc } from 'drizzle-orm';

export async function recordPriceIfChanged(listingId: string, newPriceCents: number): Promise<void> {
  // Get the last recorded price
  const last = await db.query.priceHistory.findFirst({
    where: eq(priceHistory.listingId, listingId),
    orderBy: [desc(priceHistory.recordedAt)],
  });

  // Only record if price changed or no history yet
  if (!last || last.priceCents !== newPriceCents) {
    await db.insert(priceHistory).values({ listingId, priceCents: newPriceCents });
  }
}

export async function getPriceHistory(listingId: string) {
  return db.query.priceHistory.findMany({
    where: eq(priceHistory.listingId, listingId),
    orderBy: [asc(priceHistory.recordedAt)],
  });
}

export interface PriceTrend {
  current: number;
  previous: number | null;
  lowest: number;
  highest: number;
  changePercent: number | null;
  direction: 'up' | 'down' | 'stable' | 'new';
  dataPoints: Array<{ date: string; priceCents: number }>;
}

export function analyzePriceTrend(history: typeof priceHistory.$inferSelect[]): PriceTrend {
  if (history.length === 0) {
    return { current: 0, previous: null, lowest: 0, highest: 0, changePercent: null, direction: 'new', dataPoints: [] };
  }

  const sorted = [...history].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  const current = sorted.at(-1)!.priceCents;
  const previous = sorted.length > 1 ? sorted.at(-2)!.priceCents : null;
  const prices = sorted.map((h) => h.priceCents);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);

  let changePercent: number | null = null;
  let direction: PriceTrend['direction'] = 'stable';

  if (previous !== null) {
    changePercent = ((current - previous) / previous) * 100;
    if (changePercent > 1) direction = 'up';
    else if (changePercent < -1) direction = 'down';
    else direction = 'stable';
  } else {
    direction = 'new';
  }

  const dataPoints = sorted.map((h) => ({
    date: h.recordedAt.toISOString().split('T')[0]!,
    priceCents: h.priceCents,
  }));

  return { current, previous, lowest, highest, changePercent, direction, dataPoints };
}
