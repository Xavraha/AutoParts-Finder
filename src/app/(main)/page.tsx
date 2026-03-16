'use client';

import { SearchBar } from '@/components/search/SearchBar';
import { LocationPicker } from '@/components/search/LocationPicker';
import { VehicleSelector } from '@/components/search/VehicleSelector';
import { VinSearch } from '@/components/search/VinSearch';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { POPULAR_SEARCHES } from '@/lib/utils/popular-searches';

const SOURCES = [
  { name: 'eBay Motors', color: 'bg-yellow-400' },
  { name: 'Car-Part.com', color: 'bg-blue-500' },
  { name: 'Craigslist', color: 'bg-purple-500' },
  { name: 'LKQ Online', color: 'bg-green-500' },
  { name: 'FB Marketplace', color: 'bg-indigo-500' },
];

export default function HomePage() {
  const [showVehicle, setShowVehicle] = useState(false);
  const [searchMode, setSearchMode] = useState<'text' | 'vin'>('text');

  return (
    <div className="flex flex-col items-center gap-10 py-10">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50 sm:text-5xl">
          Find Used Auto Parts
          <span className="text-blue-600 dark:text-blue-400"> Across the US</span>
        </h1>
        <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
          Search eBay Motors, Car-Part.com, Craigslist &amp; more — all at once.
        </p>
      </div>

      {/* Search card */}
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
        {/* Mode toggle */}
        <div className="mb-4 flex rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
          <button
            type="button"
            onClick={() => setSearchMode('text')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              searchMode === 'text' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Search by part name
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('vin')}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              searchMode === 'vin' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Search by VIN
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {searchMode === 'text' ? (
            <>
              <SearchBar />
              <LocationPicker />
              <button
                type="button"
                onClick={() => setShowVehicle((v) => !v)}
                className="flex items-center gap-1 self-start text-sm text-blue-600 hover:underline"
              >
                {showVehicle ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Filter by vehicle
              </button>
              {showVehicle && <VehicleSelector />}
            </>
          ) : (
            <>
              <VinSearch />
              <LocationPicker />
            </>
          )}
        </div>
      </div>

      {/* Popular searches for SEO */}
      <div className="w-full max-w-2xl">
        <p className="mb-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400">Popular searches</p>
        <div className="flex flex-wrap justify-center gap-2">
          {POPULAR_SEARCHES.slice(0, 6).map((s) => (
            <Link
              key={s.slug}
              href={`/parts/${s.slug}`}
              className="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 shadow-sm hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {s.title.replace('Used ', '')}
            </Link>
          ))}
        </div>
      </div>

      {/* Source badges */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-gray-400 dark:text-gray-500">Searching across</p>
        <div className="flex flex-wrap justify-center gap-3">
          {SOURCES.map((s) => (
            <div key={s.name} className="flex items-center gap-2 rounded-full bg-white dark:bg-gray-800 px-4 py-2 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
              <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
