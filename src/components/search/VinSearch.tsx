'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scan, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { VinDecodeResult } from '@/lib/utils/vin';

export function VinSearch() {
  const router = useRouter();
  const [vin, setVin] = useState('');
  const [partName, setPartName] = useState('');
  const [decoded, setDecoded] = useState<VinDecodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function decodeVin() {
    if (vin.length !== 17) return;
    setLoading(true);
    setError('');
    setDecoded(null);

    try {
      const res = await fetch(`/api/vehicles/vin?vin=${encodeURIComponent(vin)}`);
      const data = (await res.json()) as { vehicle?: VinDecodeResult; error?: string };
      if (data.vehicle?.valid) {
        setDecoded(data.vehicle);
      } else {
        setError(data.error ?? data.vehicle?.errors[0] ?? 'Invalid VIN');
      }
    } catch {
      setError('Could not decode VIN. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function searchWithVin() {
    if (!decoded || !partName.trim()) return;
    const q = [partName, decoded.make, decoded.model, decoded.year].filter(Boolean).join(' ');
    router.push(`/search?q=${encodeURIComponent(q)}&make=${decoded.make}&model=${decoded.model}&yearMin=${decoded.year}&yearMax=${decoded.year}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Scan className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            maxLength={17}
            placeholder="Enter 17-character VIN"
            value={vin}
            onChange={(e) => {
              setVin(e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, ''));
              setDecoded(null);
              setError('');
            }}
            className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 font-mono text-sm uppercase tracking-wider focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={decodeVin}
          disabled={vin.length !== 17 || loading}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Decode'}
        </button>
      </div>

      <div className="text-right text-xs text-gray-400">{vin.length}/17</div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {decoded && (
        <div className="flex flex-col gap-3 rounded-lg bg-green-50 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
            <CheckCircle className="h-4 w-4" />
            {decoded.year} {decoded.make} {decoded.model}
            {decoded.trim && <span className="font-normal text-green-600">— {decoded.trim}</span>}
          </div>
          {decoded.engine && (
            <p className="text-xs text-green-700">Engine: {decoded.engine}</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="What part do you need? (e.g. alternator)"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              className="flex-1 rounded-lg border border-green-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              onKeyDown={(e) => e.key === 'Enter' && searchWithVin()}
            />
            <button
              type="button"
              onClick={searchWithVin}
              disabled={!partName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
