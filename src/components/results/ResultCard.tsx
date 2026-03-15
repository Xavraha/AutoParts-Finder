'use client';

import Image from 'next/image';
import { ExternalLink, Heart, MapPin } from 'lucide-react';
import { SourceBadge } from './SourceBadge';
import type { SearchResponse } from '@/types/api';

type Listing = SearchResponse['results'][number];

interface ResultCardProps {
  listing: Listing;
}

const CONDITION_LABELS: Record<string, string> = {
  used: 'Used',
  refurbished: 'Refurbished',
  like_new: 'Like New',
  for_parts: 'For Parts',
};

export function ResultCard({ listing }: ResultCardProps) {
  const priceDisplay = listing.priceCents
    ? `$${(listing.priceCents / 100).toFixed(2)}`
    : 'Price not listed';

  const location = [listing.city, listing.state].filter(Boolean).join(', ');

  return (
    <div className="group flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {listing.imageUrls?.[0] ? (
          <Image
            src={listing.imageUrls[0]}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300 text-xs">
            No image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 text-sm font-medium text-gray-900">{listing.title}</p>
          <button
            type="button"
            aria-label="Save to favorites"
            className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
          >
            <Heart className="h-5 w-5" />
          </button>
        </div>

        <p className="text-lg font-bold text-green-600">{priceDisplay}</p>

        <div className="flex flex-wrap items-center gap-2 mt-auto">
          <SourceBadge sourceKey={listing.sourceKey} sourceName={listing.sourceName} />

          {listing.condition && (
            <span className="text-xs text-gray-500">
              {CONDITION_LABELS[listing.condition] ?? listing.condition}
            </span>
          )}

          {location && (
            <span className="flex items-center gap-0.5 text-xs text-gray-400">
              <MapPin className="h-3 w-3" />
              {location}
              {listing.distanceMiles != null && ` · ${listing.distanceMiles.toFixed(0)} mi`}
            </span>
          )}

          <a
            href={`/api/listings/click?url=${encodeURIComponent(listing.originalUrl)}&source=${listing.sourceKey}`}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="ml-auto flex items-center gap-1 text-xs text-blue-600 hover:underline"
          >
            View listing
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
