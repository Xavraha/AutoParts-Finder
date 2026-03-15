import type { SourceAdapter, SearchQuery, AdapterResult, ScrapedListing } from '../types';

const MOCK_LISTINGS: ScrapedListing[] = [
  {
    externalId: 'mock-001',
    title: 'Honda Civic Alternator 2018-2021 OEM',
    description: 'Tested, working alternator pulled from 2019 Honda Civic. 90-day warranty.',
    priceCents: 8500,
    imageUrls: ['https://picsum.photos/seed/alt1/400/300'],
    originalUrl: 'https://example.com/listing/mock-001',
    lat: 33.749,
    lng: -84.388,
    city: 'Atlanta',
    state: 'GA',
    zip: '30301',
    vehicleMake: 'Honda',
    vehicleModel: 'Civic',
    vehicleYear: 2019,
    partName: 'Alternator',
    partNumber: '31100-5LA-A01',
    condition: 'used',
    sellerName: 'AutoParts ATL',
  },
  {
    externalId: 'mock-002',
    title: 'Toyota Camry Brake Pads Front 2016-2020',
    description: 'OEM front brake pads, 50% remaining. Good condition.',
    priceCents: 3500,
    imageUrls: ['https://picsum.photos/seed/brk1/400/300'],
    originalUrl: 'https://example.com/listing/mock-002',
    lat: 33.8,
    lng: -84.4,
    city: 'Marietta',
    state: 'GA',
    zip: '30060',
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    vehicleYear: 2018,
    partName: 'Brake Pads',
    condition: 'used',
    sellerName: 'Peach State Parts',
  },
  {
    externalId: 'mock-003',
    title: 'Ford F-150 Starter Motor 5.0L V8 2015-2022',
    priceCents: 12000,
    imageUrls: ['https://picsum.photos/seed/str1/400/300'],
    originalUrl: 'https://example.com/listing/mock-003',
    lat: 33.65,
    lng: -84.42,
    city: 'College Park',
    state: 'GA',
    zip: '30337',
    vehicleMake: 'Ford',
    vehicleModel: 'F-150',
    vehicleYear: 2020,
    partName: 'Starter Motor',
    condition: 'refurbished',
    sellerName: 'Southern Salvage',
  },
];

export class MockAdapter implements SourceAdapter {
  readonly key = 'mock';
  readonly name = 'Mock Source (Testing)';

  async search(query: SearchQuery): Promise<AdapterResult> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 100));

    const filtered = MOCK_LISTINGS.filter((l) =>
      l.title.toLowerCase().includes(query.query.toLowerCase()) ||
      (query.make && l.vehicleMake?.toLowerCase() === query.make.toLowerCase()) ||
      query.query === ''
    );

    return {
      listings: filtered,
      totalResults: filtered.length,
      hasMore: false,
      scrapedAt: new Date(),
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
