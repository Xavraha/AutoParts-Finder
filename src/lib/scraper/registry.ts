import type { SourceAdapter } from './types';
import { MockAdapter } from './adapters/mock.adapter';
import { EbayAdapter } from './adapters/ebay.adapter';
import { CarPartAdapter } from './adapters/carpart.adapter';
import { CraigslistAdapter } from './adapters/craigslist.adapter';
import { FacebookAdapter } from './adapters/facebook.adapter';
import { LkqAdapter } from './adapters/lkq.adapter';

function buildAdapters(): SourceAdapter[] {
  const adapters: SourceAdapter[] = [];

  if (process.env.EBAY_APP_ID && process.env.EBAY_APP_ID !== 'placeholder') {
    adapters.push(new EbayAdapter());
  } else {
    adapters.push(new MockAdapter());
  }

  adapters.push(new CarPartAdapter());
  adapters.push(new CraigslistAdapter());
  adapters.push(new LkqAdapter());

  // Facebook: optional, only active when Apify token is configured
  if (process.env.APIFY_API_TOKEN && process.env.APIFY_API_TOKEN !== 'placeholder') {
    adapters.push(new FacebookAdapter());
  }

  return adapters;
}

const adapters = buildAdapters();

export const adapterRegistry = new Map<string, SourceAdapter>(
  adapters.map((a) => [a.key, a])
);

export function getActiveAdapters(): SourceAdapter[] {
  return adapters;
}
