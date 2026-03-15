'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/results/FilterPanel';
import { ResultCard } from '@/components/results/ResultCard';
import { ResultCardSkeleton } from '@/components/results/ResultCardSkeleton';
import type { SearchResponse } from '@/types/api';

function SearchResults() {
  const params = useSearchParams();
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const q = params.get('q') ?? '';
  const lat = parseFloat(params.get('lat') ?? '');
  const lng = parseFloat(params.get('lng') ?? '');
  const radius = parseInt(params.get('radius') ?? '50', 10);
  const make = params.get('make') ?? undefined;
  const model = params.get('model') ?? undefined;

  useEffect(() => {
    if (!q) return;

    // Use default US center if no location provided
    const searchLat = isNaN(lat) ? 39.5 : lat;
    const searchLng = isNaN(lng) ? -98.35 : lng;
    const searchRadius = isNaN(radius) ? 500 : radius;

    setLoading(true);
    setError('');

    fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: q,
        lat: searchLat,
        lng: searchLng,
        radiusMiles: searchRadius,
        make,
        model,
      }),
    })
      .then((r) => r.json())
      .then((json: SearchResponse) => setData(json))
      .catch(() => setError('Search failed. Please try again.'))
      .finally(() => setLoading(false));
  }, [q, lat, lng, radius, make, model]);

  const results = data?.results ?? [];
  const sources = data?.sources ?? [];

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Filters sidebar */}
      <div className="w-full lg:w-64 shrink-0">
        <FilterPanel />
      </div>

      {/* Results */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            {q && (
              <h1 className="text-lg font-semibold text-gray-900">
                Results for &ldquo;{q}&rdquo;
              </h1>
            )}
            {!loading && data && (
              <p className="text-sm text-gray-500">{data.totalResults} listings found</p>
            )}
          </div>

          {/* Source counters */}
          {sources.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sources.map((s) => (
                <span key={s.key} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                  {s.key}: {s.resultCount}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ResultCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Results list */}
        {!loading && results.length > 0 && (
          <div className="flex flex-col gap-3">
            {results.map((listing, i) => (
              <ResultCard key={`${listing.sourceKey}-${listing.externalId}-${i}`} listing={listing} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && results.length === 0 && q && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-4xl">🔧</p>
            <p className="text-lg font-semibold text-gray-700">No parts found</p>
            <p className="text-sm text-gray-400">
              Try a broader search term or increase the radius.
            </p>
          </div>
        )}

        {/* No query */}
        {!q && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-4xl">🔍</p>
            <p className="text-lg font-semibold text-gray-700">Enter a search term to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="flex flex-col gap-4">
      <SearchBar compact />
      <Suspense fallback={<div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <ResultCardSkeleton key={i} />)}</div>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
