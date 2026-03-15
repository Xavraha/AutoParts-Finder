'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useSearchStore } from '@/stores/searchStore';

const POPULAR_SEARCHES = [
  'alternator Honda Civic',
  'starter motor Toyota Camry',
  'brake pads Ford F-150',
  'catalytic converter Chevrolet Silverado',
  'transmission Honda Accord',
];

interface SearchBarProps {
  compact?: boolean;
}

export function SearchBar({ compact = false }: SearchBarProps) {
  const router = useRouter();
  const { query, lat, lng, radiusMiles, make, model, yearMin, yearMax, setQuery } =
    useSearchStore();

  function buildSearchUrl(q = query) {
    const params = new URLSearchParams({ q });
    if (lat != null) params.set('lat', String(lat));
    if (lng != null) params.set('lng', String(lng));
    params.set('radius', String(radiusMiles));
    if (make) params.set('make', make);
    if (model) params.set('model', model);
    if (yearMin) params.set('yearMin', yearMin);
    if (yearMax) params.set('yearMax', yearMax);
    return `/search?${params}`;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(buildSearchUrl());
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search auto parts (e.g. alternator Honda Civic 2018)"
            className={`w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
              compact ? 'py-2 text-sm' : 'py-4 text-base'
            }`}
          />
        </div>
        <button
          type="submit"
          className={`rounded-xl bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors ${
            compact ? 'px-4 py-2 text-sm' : 'px-6 py-4 text-base'
          }`}
        >
          Search
        </button>
      </form>

      {!compact && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-xs text-gray-400">Popular:</span>
          {POPULAR_SEARCHES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuery(s);
                router.push(buildSearchUrl(s));
              }}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
