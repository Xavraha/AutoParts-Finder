'use client';

import { useState } from 'react';
import { Check, Zap, Loader2 } from 'lucide-react';
import { PLANS } from '@/lib/stripe/client';
import Link from 'next/link';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error === 'Unauthorized') {
        window.location.href = '/login?callbackUrl=/pricing';
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl py-10">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900">Simple, transparent pricing</h1>
        <p className="mt-2 text-gray-500">Start free. Upgrade when you need more power.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Free plan */}
        <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{PLANS.free.name}</p>
            <p className="mt-1 text-4xl font-extrabold text-gray-900">$0</p>
            <p className="text-sm text-gray-400">Forever free</p>
          </div>
          <ul className="flex flex-1 flex-col gap-2 mb-6">
            {PLANS.free.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/search"
            className="block rounded-xl border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Get started free
          </Link>
        </div>

        {/* Premium plan */}
        <div className="flex flex-col rounded-2xl border-2 border-blue-600 bg-blue-50 p-6 shadow-md relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
              <Zap className="h-3 w-3" /> Most popular
            </span>
          </div>
          <div className="mb-4">
            <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">{PLANS.premium.name}</p>
            <div className="mt-1 flex items-baseline gap-1">
              <p className="text-4xl font-extrabold text-gray-900">${PLANS.premium.price}</p>
              <p className="text-gray-400">/month</p>
            </div>
            <p className="text-sm text-gray-500">Cancel anytime</p>
          </div>
          <ul className="flex flex-1 flex-col gap-2 mb-6">
            {PLANS.premium.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-700 font-medium">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {loading ? 'Redirecting...' : 'Upgrade to Premium'}
          </button>
          <p className="mt-2 text-center text-xs text-gray-400">Secure checkout via Stripe</p>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-12">
        <h2 className="mb-6 text-center text-xl font-bold text-gray-900">Frequently asked questions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              q: 'Can I cancel anytime?',
              a: 'Yes. Cancel from your account settings. You keep Premium until the end of the billing period.',
            },
            {
              q: 'What payment methods are accepted?',
              a: 'All major credit/debit cards via Stripe. No PayPal at this time.',
            },
            {
              q: 'Is the free plan really free?',
              a: 'Yes, no credit card required. You get full search access with some limits on alerts and favorites.',
            },
            {
              q: 'What are unlimited alerts?',
              a: 'Free users can set up to 3 active alerts. Premium users can set as many as they want.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="font-semibold text-gray-900">{q}</p>
              <p className="mt-1 text-sm text-gray-500">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
