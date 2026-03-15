'use client';

import { useEffect, useState } from 'react';
import { Loader2, Zap, CreditCard } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

interface UserPlan {
  plan: 'free' | 'premium';
  subscriptionStatus: string | null;
  subscriptionEndsAt: string | null;
}

function SettingsContent() {
  const params = useSearchParams();
  const upgraded = params.get('upgrade') === 'success';
  const [planInfo, setPlanInfo] = useState<UserPlan | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch('/api/user/plan')
      .then((r) => r.json())
      .then((d: UserPlan) => setPlanInfo(d))
      .catch(() => {});
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = (await res.json()) as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>

      {upgraded && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm font-medium text-green-800">
          🎉 Welcome to Premium! Your plan has been upgraded.
        </div>
      )}

      {/* Plan info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">Your plan</h2>
        {planInfo ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${planInfo.plan === 'premium' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {planInfo.plan === 'premium' ? 'Premium' : 'Free'}
                </p>
                {planInfo.subscriptionEndsAt && (
                  <p className="text-xs text-gray-400">
                    Renews {new Date(planInfo.subscriptionEndsAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            {planInfo.plan === 'premium' ? (
              <button
                onClick={openPortal}
                disabled={portalLoading}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Manage billing
              </button>
            ) : (
              <Link
                href="/pricing"
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Zap className="h-4 w-4" />
                Upgrade
              </Link>
            )}
          </div>
        ) : (
          <div className="h-12 animate-pulse rounded-lg bg-gray-100" />
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-gray-100" />}>
      <SettingsContent />
    </Suspense>
  );
}
