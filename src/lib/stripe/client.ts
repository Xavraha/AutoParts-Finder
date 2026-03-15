import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'placeholder') {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  _stripe = new Stripe(key, { apiVersion: '2026-02-25.clover' });
  return _stripe;
}

export const PLANS = {
  free: {
    name: 'Free',
    priceId: null,
    price: 0,
    features: [
      'Up to 3 search alerts',
      '5 searches per minute',
      'Search across all sources',
      'Save up to 20 favorites',
    ],
    limits: {
      alerts: 3,
      favoritesMax: 20,
      searchesPerMinute: 5,
    },
  },
  premium: {
    name: 'Premium',
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID ?? '',
    price: 7,  // $7/month
    features: [
      'Unlimited search alerts',
      '30 searches per minute',
      'Instant alert notifications',
      'Unlimited favorites',
      'Price history charts',
      'Priority support',
    ],
    limits: {
      alerts: Infinity,
      favoritesMax: Infinity,
      searchesPerMinute: 30,
    },
  },
} as const;

export type PlanKey = keyof typeof PLANS;
