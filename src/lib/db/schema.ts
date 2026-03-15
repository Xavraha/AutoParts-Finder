import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { AdapterAccountType } from 'next-auth/adapters';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const conditionEnum = pgEnum('condition', [
  'used',
  'refurbished',
  'like_new',
  'for_parts',
]);

// ─── sources ──────────────────────────────────────────────────────────────────

export const sources = pgTable('sources', {
  key: text('key').primaryKey(),
  name: text('name').notNull(),
  baseUrl: text('base_url').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastScrapedAt: timestamp('last_scraped_at'),
  configJson: jsonb('config_json'),
});

// ─── users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  defaultLat: doublePrecision('default_lat'),
  defaultLng: doublePrecision('default_lng'),
  defaultRadiusMi: integer('default_radius_mi').default(50),
  // Stripe subscription
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripePriceId: text('stripe_price_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  subscriptionStatus: text('subscription_status').default('inactive'),
  subscriptionEndsAt: timestamp('subscription_ends_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── NextAuth required tables ────────────────────────────────────────────────

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })]
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

// ─── listings ─────────────────────────────────────────────────────────────────

export const listings = pgTable(
  'listings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.key),
    externalId: text('external_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    priceCents: integer('price_cents'),
    currency: text('currency').notNull().default('USD'),
    imageUrls: text('image_urls').array(),
    originalUrl: text('original_url').notNull(),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    city: text('city'),
    state: text('state'),
    zip: text('zip'),
    vehicleMake: text('vehicle_make'),
    vehicleModel: text('vehicle_model'),
    vehicleYear: integer('vehicle_year'),
    partName: text('part_name'),
    partNumber: text('part_number'),
    condition: conditionEnum('condition'),
    sellerName: text('seller_name'),
    scrapedAt: timestamp('scraped_at').notNull().defaultNow(),
    isActive: boolean('is_active').notNull().default(true),
  },
  (table) => [
    uniqueIndex('listings_source_external_idx').on(table.sourceId, table.externalId),
    index('listings_geo_idx').on(table.lat, table.lng),
    index('listings_active_idx').on(table.isActive),
    index('listings_scraped_at_idx').on(table.scrapedAt),
  ]
);

// ─── searches ─────────────────────────────────────────────────────────────────

export const searches = pgTable('searches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  query: text('query').notNull(),
  filtersJson: jsonb('filters_json'),
  location: text('location'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── favorites ────────────────────────────────────────────────────────────────

export const favorites = pgTable(
  'favorites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('favorites_user_listing_idx').on(table.userId, table.listingId),
  ]
);

// ─── alerts ───────────────────────────────────────────────────────────────────

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  query: text('query').notNull(),
  filtersJson: jsonb('filters_json'),
  notifyEmail: boolean('notify_email').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  lastTriggeredAt: timestamp('last_triggered_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── user_vehicles ────────────────────────────────────────────────────────────

export const userVehicles = pgTable('user_vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  engine: text('engine'),
  nickname: text('nickname'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── price_history ────────────────────────────────────────────────────────────

export const priceHistory = pgTable(
  'price_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    listingId: uuid('listing_id')
      .notNull()
      .references(() => listings.id, { onDelete: 'cascade' }),
    priceCents: integer('price_cents').notNull(),
    recordedAt: timestamp('recorded_at').notNull().defaultNow(),
  },
  (table) => [
    index('price_history_listing_idx').on(table.listingId),
    index('price_history_recorded_idx').on(table.recordedAt),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  searches: many(searches),
  favorites: many(favorites),
  alerts: many(alerts),
  vehicles: many(userVehicles),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  source: one(sources, { fields: [listings.sourceId], references: [sources.key] }),
  favorites: many(favorites),
  priceHistory: many(priceHistory),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  listing: one(listings, { fields: [priceHistory.listingId], references: [listings.id] }),
}));

export const sourcesRelations = relations(sources, ({ many }) => ({
  listings: many(listings),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, { fields: [favorites.userId], references: [users.id] }),
  listing: one(listings, { fields: [favorites.listingId], references: [listings.id] }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, { fields: [alerts.userId], references: [users.id] }),
}));

export const userVehiclesRelations = relations(userVehicles, ({ one }) => ({
  user: one(users, { fields: [userVehicles.userId], references: [users.id] }),
}));

export const searchesRelations = relations(searches, ({ one }) => ({
  user: one(users, { fields: [searches.userId], references: [users.id] }),
}));
