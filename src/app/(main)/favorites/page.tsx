'use client';

import { useEffect, useState } from 'react';
import { Heart, ExternalLink, MapPin } from 'lucide-react';
import { SourceBadge } from '@/components/results/SourceBadge';
import Image from 'next/image';

interface FavoriteListing {
  id: string;
  listing: {
    id: string;
    title: string;
    priceCents: number | null;
    imageUrls: string[] | null;
    originalUrl: string;
    city: string | null;
    state: string | null;
    condition: string | null;
    sourceId: string;
    source: { key: string; name: string };
  };
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/favorites')
      .then((r) => r.json())
      .then((data: { favorites?: FavoriteListing[] }) => setFavorites(data.favorites ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function removeFavorite(listingId: string) {
    await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId }),
    });
    setFavorites((prev) => prev.filter((f) => f.listing.id !== listingId));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Favorites</h1>
        <p className="text-sm text-gray-500">Parts you&apos;ve saved for later</p>
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      )}

      {!loading && favorites.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Heart className="h-12 w-12 text-gray-200" />
          <p className="font-semibold text-gray-600">No favorites yet</p>
          <p className="text-sm text-gray-400">Click the heart icon on any listing to save it here.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {favorites.map(({ listing }) => (
          <div key={listing.id} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {listing.imageUrls?.[0] && (
                <Image src={listing.imageUrls[0]} alt={listing.title} fill className="object-cover" sizes="80px" />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-1 min-w-0">
              <p className="line-clamp-2 text-sm font-medium text-gray-900">{listing.title}</p>
              {listing.priceCents && (
                <p className="text-base font-bold text-green-600">
                  ${(listing.priceCents / 100).toFixed(2)}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-auto">
                <SourceBadge sourceKey={listing.source.key} sourceName={listing.source.name} />
                {listing.city && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="h-3 w-3" />
                    {listing.city}, {listing.state}
                  </span>
                )}
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={() => removeFavorite(listing.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Remove from favorites"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                  </button>
                  <a
                    href={listing.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
