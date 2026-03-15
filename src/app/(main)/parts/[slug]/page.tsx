import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { POPULAR_SEARCHES, getPopularSearchBySlug } from '@/lib/utils/popular-searches';
import { Search, ExternalLink } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return POPULAR_SEARCHES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const search = getPopularSearchBySlug(slug);
  if (!search) return {};

  return {
    title: `${search.title} | AutoParts Finder`,
    description: search.description,
    openGraph: {
      title: search.title,
      description: search.description,
      type: 'website',
    },
    alternates: {
      canonical: `/parts/${slug}`,
    },
  };
}

export default async function PopularSearchPage({ params }: Props) {
  const { slug } = await params;
  const search = getPopularSearchBySlug(slug);
  if (!search) notFound();

  const searchUrl = `/search?q=${encodeURIComponent(search.query)}${search.make ? `&make=${encodeURIComponent(search.make)}` : ''}${search.model ? `&model=${encodeURIComponent(search.model)}` : ''}`;

  // Related searches (same make or similar parts)
  const related = POPULAR_SEARCHES.filter(
    (s) => s.slug !== slug && (s.make === search.make || s.query.split(' ')[0] === search.query.split(' ')[0])
  ).slice(0, 4);

  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{search.title}</span>
      </nav>

      {/* Hero */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white">
        <h1 className="mb-2 text-3xl font-extrabold">{search.title}</h1>
        <p className="mb-6 text-blue-100">{search.description}</p>
        <Link
          href={searchUrl}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-blue-700 shadow hover:bg-blue-50 transition-colors"
        >
          <Search className="h-5 w-5" />
          Search Now — Live Results
        </Link>
      </div>

      {/* Info section */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Sources searched', value: '5+', desc: 'eBay, Craigslist, Car-Part & more' },
          { label: 'Average price', value: 'Compare live', desc: 'Prices updated every 30 min' },
          { label: 'Search radius', value: 'Nationwide', desc: 'Filter by ZIP + distance' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
            <p className="text-xl font-bold text-blue-600">{stat.value}</p>
            <p className="text-sm font-medium text-gray-700">{stat.label}</p>
            <p className="text-xs text-gray-400">{stat.desc}</p>
          </div>
        ))}
      </div>

      {/* Tips section */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Tips for buying a used {search.query.split(' ').slice(0, 2).join(' ')}
        </h2>
        <ul className="flex flex-col gap-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-500">•</span>
            Always verify the part number matches your vehicle&apos;s OEM spec before purchasing.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-500">•</span>
            Ask the seller for mileage and condition details, especially for mechanical parts.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-500">•</span>
            Prefer sellers who offer a 30-day warranty or return policy.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-500">•</span>
            Compare at least 3 listings before buying — prices vary significantly across sources.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-blue-500">•</span>
            Filter by distance to save on shipping — local pickup is often cheaper.
          </li>
        </ul>
      </div>

      {/* Related searches */}
      {related.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Related searches</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/parts/${r.slug}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow transition-all"
              >
                <div>
                  <p className="font-medium text-gray-900">{r.title}</p>
                  <p className="text-xs text-gray-400 truncate">{r.description.slice(0, 60)}…</p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-gray-300" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-8 text-center">
        <Link
          href={searchUrl}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow hover:bg-blue-700 transition-colors"
        >
          <Search className="h-5 w-5" />
          Search {search.title} now
        </Link>
      </div>

      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SearchResultsPage',
            name: search.title,
            description: search.description,
            url: `https://autopartsfinder.app/parts/${slug}`,
          }),
        }}
      />
    </div>
  );
}
