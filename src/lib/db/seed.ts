import { db } from './index';
import { sources } from './schema';

const initialSources = [
  {
    key: 'ebay',
    name: 'eBay Motors',
    baseUrl: 'https://api.ebay.com',
    isActive: true,
    configJson: { rateLimit: 5000, dailyLimit: 5000 },
  },
  {
    key: 'carpart',
    name: 'Car-Part.com',
    baseUrl: 'https://www.car-part.com',
    isActive: true,
    configJson: { rateLimit: 1, delayMs: 3000 },
  },
  {
    key: 'craigslist',
    name: 'Craigslist',
    baseUrl: 'https://craigslist.org',
    isActive: true,
    configJson: { rateLimit: 1, delayMs: 2000 },
  },
  {
    key: 'facebook',
    name: 'Facebook Marketplace',
    baseUrl: 'https://www.facebook.com/marketplace',
    isActive: false,
    configJson: { rateLimit: 1, delayMs: 5000, requiresProxy: true },
  },
  {
    key: 'offerup',
    name: 'OfferUp',
    baseUrl: 'https://offerup.com',
    isActive: true,
    configJson: { rateLimit: 1, delayMs: 2000 },
  },
  {
    key: 'lkq',
    name: 'LKQ Online',
    baseUrl: 'https://www.lkqonline.com',
    isActive: true,
    configJson: { rateLimit: 1, delayMs: 2000 },
  },
];

async function seed() {
  console.log('Seeding sources...');
  await db
    .insert(sources)
    .values(initialSources)
    .onConflictDoUpdate({
      target: sources.key,
      set: {
        name: sources.name,
        baseUrl: sources.baseUrl,
        isActive: sources.isActive,
        configJson: sources.configJson,
      },
    });
  console.log('✓ Sources seeded:', initialSources.map((s) => s.key).join(', '));
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
