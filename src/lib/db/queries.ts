import { db } from './index';
import { listings, favorites, alerts, searches, sources } from './schema';
import { eq, and, desc } from 'drizzle-orm';
import { recordPriceIfChanged } from './price-history';

export async function getListingById(id: string) {
  return db.query.listings.findFirst({
    where: eq(listings.id, id),
    with: { source: true },
  });
}

export async function getRecentListings(limit = 20) {
  return db.query.listings.findMany({
    where: eq(listings.isActive, true),
    orderBy: [desc(listings.scrapedAt)],
    limit,
    with: { source: true },
  });
}

export async function upsertListing(data: typeof listings.$inferInsert) {
  const [row] = await db
    .insert(listings)
    .values(data)
    .onConflictDoUpdate({
      target: [listings.sourceId, listings.externalId],
      set: {
        title: data.title,
        description: data.description,
        priceCents: data.priceCents,
        imageUrls: data.imageUrls,
        originalUrl: data.originalUrl,
        isActive: true,
        scrapedAt: new Date(),
      },
    })
    .returning();

  // Record price history whenever a listing is upserted with a price
  if (row && data.priceCents != null) {
    await recordPriceIfChanged(row.id, data.priceCents).catch(() => {});
  }

  return [row];
}

export async function getUserFavorites(userId: string) {
  return db.query.favorites.findMany({
    where: eq(favorites.userId, userId),
    with: { listing: { with: { source: true } } },
    orderBy: [desc(favorites.createdAt)],
  });
}

export async function toggleFavorite(userId: string, listingId: string) {
  const existing = await db.query.favorites.findFirst({
    where: and(eq(favorites.userId, userId), eq(favorites.listingId, listingId)),
  });

  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));
    return { action: 'removed' };
  }

  await db.insert(favorites).values({ userId, listingId });
  return { action: 'added' };
}

export async function getUserAlerts(userId: string) {
  return db.query.alerts.findMany({
    where: and(eq(alerts.userId, userId), eq(alerts.isActive, true)),
    orderBy: [desc(alerts.createdAt)],
  });
}

export async function getActiveSources() {
  return db.query.sources.findMany({
    where: eq(sources.isActive, true),
  });
}

export async function updateSourceLastScraped(key: string) {
  return db
    .update(sources)
    .set({ lastScrapedAt: new Date() })
    .where(eq(sources.key, key));
}

export async function saveSearch(data: typeof searches.$inferInsert) {
  return db.insert(searches).values(data).returning();
}
