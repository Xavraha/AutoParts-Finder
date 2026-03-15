'use client';

import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { useSearchStore } from '@/stores/searchStore';
import { zipToCoords } from '@/lib/geo/distance';

const RADIUS_OPTIONS = [25, 50, 100, 250, 500];

export function LocationPicker() {
  const { zip, radiusMiles, setZip, setLocation, setRadius } = useSearchStore();
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  async function handleZipBlur() {
    if (zip.length === 5) {
      const coords = await zipToCoords(zip);
      if (coords) setLocation(coords.lat, coords.lng, zip);
    }
  }

  function handleGeolocate() {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported');
      return;
    }
    setGeoLoading(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(pos.coords.latitude, pos.coords.longitude);
        setGeoLoading(false);
      },
      () => {
        setGeoError('Could not get location');
        setGeoLoading(false);
      }
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* ZIP + GPS row */}
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder="ZIP code"
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
          onBlur={handleZipBlur}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={geoLoading}
          title="Use my location"
          className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {geoLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">My location</span>
        </button>
      </div>

      {geoError && <p className="text-xs text-red-500">{geoError}</p>}

      {/* Radius selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 whitespace-nowrap">Radius:</span>
        <div className="flex gap-1 flex-wrap">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRadius(r)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                radiusMiles === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r} mi
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
