'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Wrench, Chrome, Mail, Loader2 } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') ?? '/';
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState<'google' | 'email' | null>(null);

  async function handleGoogle() {
    setLoading('google');
    await signIn('google', { callbackUrl });
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading('email');
    await signIn('resend', { email, callbackUrl, redirect: false });
    setEmailSent(true);
    setLoading(null);
  }

  if (emailSent) {
    return (
      <div className="rounded-lg bg-green-50 p-4 text-center text-sm text-green-700">
        <p className="font-medium">Check your email!</p>
        <p className="mt-1">We sent a magic link to <strong>{email}</strong></p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleGoogle}
        disabled={loading !== null}
        className="flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {loading === 'google' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Chrome className="h-4 w-4 text-blue-500" />
        )}
        Continue with Google
      </button>

      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      <form onSubmit={handleEmail} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          type="submit"
          disabled={loading !== null || !email}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading === 'email' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Send magic link
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-blue-600">
            <Wrench className="h-6 w-6" />
            <span className="text-xl">AutoParts Finder</span>
          </Link>
          <p className="text-sm text-gray-500">Sign in to save favorites &amp; set alerts</p>
        </div>
        <Suspense fallback={<div className="h-40 animate-pulse rounded-xl bg-gray-100" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
