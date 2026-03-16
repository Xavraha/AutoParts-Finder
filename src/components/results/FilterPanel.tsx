'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const CONDITIONS = [
  { value: 'used', label: 'Used' },
  { value: 'refurbished', label: 'Refurbished' },
  { value: 'like_new', label: 'Like New' },
  { value: 'for_parts', label: 'For Parts' },
];

const SOURCES = [
  { key: 'ebay', label: 'eBay Motors' },
  { key: 'carpart', label: 'Car-Part.com' },
  { key: 'craigslist', label: 'Craigslist' },
  { key: 'lkq', label: 'LKQ Online' },
];

export function FilterPanel() {
  const router = useRouter();
  const params = useSearchParams();

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    router.push(`/search?${next}`);
  }

  const sortBy = params.get('sort') ?? 'relevance';

  return (
    <aside className="flex flex-col gap-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      {/* Sort */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Sort by</h3>
        <select
          value={sortBy}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="relevance">Relevance</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="distance">Distance</option>
          <option value="recent">Most Recent</option>
        </select>
      </div>

      {/* Price range */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Price ($)</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={params.get('priceMin') ?? ''}
            onBlur={(e) => updateParam('priceMin', e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Max"
            defaultValue={params.get('priceMax') ?? ''}
            onBlur={(e) => updateParam('priceMax', e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Condition</h3>
        <div className="flex flex-col gap-1.5">
          {CONDITIONS.map((c) => (
            <label key={c.value} className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                defaultChecked={params.get('condition') === c.value}
                onChange={(e) => e.target.checked && updateParam('condition', c.value)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
              />
              {c.label}
            </label>
          ))}
        </div>
      </div>

      {/* Sources */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Sources</h3>
        <div className="flex flex-col gap-1.5">
          {SOURCES.map((s) => (
            <label key={s.key} className="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                defaultChecked
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600"
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
