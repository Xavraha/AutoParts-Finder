export interface PopularSearch {
  slug: string;
  query: string;
  make?: string;
  model?: string;
  title: string;
  description: string;
}

export const POPULAR_SEARCHES: PopularSearch[] = [
  {
    slug: 'alternator-honda-civic',
    query: 'alternator Honda Civic',
    make: 'Honda',
    model: 'Civic',
    title: 'Used Alternator for Honda Civic',
    description: 'Find used alternators for Honda Civic from salvage yards, eBay Motors, and Craigslist across the US.',
  },
  {
    slug: 'starter-motor-toyota-camry',
    query: 'starter motor Toyota Camry',
    make: 'Toyota',
    model: 'Camry',
    title: 'Used Starter Motor for Toyota Camry',
    description: 'Search used starter motors for Toyota Camry from multiple auto parts sources.',
  },
  {
    slug: 'brake-pads-ford-f150',
    query: 'brake pads Ford F-150',
    make: 'Ford',
    model: 'F-150',
    title: 'Used Brake Pads for Ford F-150',
    description: 'Find affordable used brake pads for Ford F-150 trucks near you.',
  },
  {
    slug: 'catalytic-converter-chevrolet-silverado',
    query: 'catalytic converter Chevrolet Silverado',
    make: 'Chevrolet',
    model: 'Silverado',
    title: 'Used Catalytic Converter for Chevrolet Silverado',
    description: 'Compare prices on used catalytic converters for Chevrolet Silverado from multiple sources.',
  },
  {
    slug: 'transmission-honda-accord',
    query: 'transmission Honda Accord',
    make: 'Honda',
    model: 'Accord',
    title: 'Used Transmission for Honda Accord',
    description: 'Search used transmissions for Honda Accord. Compare prices from eBay Motors, Car-Part.com, and more.',
  },
  {
    slug: 'engine-toyota-corolla',
    query: 'engine Toyota Corolla',
    make: 'Toyota',
    model: 'Corolla',
    title: 'Used Engine for Toyota Corolla',
    description: 'Find used engines for Toyota Corolla at great prices from salvage yards nationwide.',
  },
  {
    slug: 'radiator-nissan-altima',
    query: 'radiator Nissan Altima',
    make: 'Nissan',
    model: 'Altima',
    title: 'Used Radiator for Nissan Altima',
    description: 'Compare used radiator prices for Nissan Altima across eBay Motors, Craigslist, and Car-Part.com.',
  },
  {
    slug: 'headlights-jeep-wrangler',
    query: 'headlights Jeep Wrangler',
    make: 'Jeep',
    model: 'Wrangler',
    title: 'Used Headlights for Jeep Wrangler',
    description: 'Find used OEM headlights for Jeep Wrangler from multiple auto parts sources.',
  },
  {
    slug: 'door-panel-bmw-3-series',
    query: 'door panel BMW 3 Series',
    make: 'BMW',
    model: '3 Series',
    title: 'Used Door Panel for BMW 3 Series',
    description: 'Search used door panels for BMW 3 Series from salvage yards and private sellers.',
  },
  {
    slug: 'fuel-pump-dodge-ram',
    query: 'fuel pump Dodge Ram',
    make: 'Dodge',
    model: 'Ram',
    title: 'Used Fuel Pump for Dodge Ram',
    description: 'Find used fuel pumps for Dodge Ram at the best prices from multiple sources.',
  },
];

export function getPopularSearchBySlug(slug: string): PopularSearch | undefined {
  return POPULAR_SEARCHES.find((s) => s.slug === slug);
}
