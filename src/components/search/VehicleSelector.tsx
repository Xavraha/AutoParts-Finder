'use client';

import { useEffect, useState } from 'react';
import { useSearchStore } from '@/stores/searchStore';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - i);

export function VehicleSelector() {
  const { make, model, yearMin, yearMax, setMake, setModel, setYearMin, setYearMax } =
    useSearchStore();
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    fetch('https://vpic.nhtsa.dot.gov/api/vehicles/GetMakesForVehicleType/car?format=json')
      .then((r) => r.json())
      .then((data: { Results: Array<{ MakeName: string }> }) => {
        const sorted = data.Results.map((m) => m.MakeName).sort();
        setMakes(sorted);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!make) {
      setModels([]);
      return;
    }
    fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(make)}?format=json`
    )
      .then((r) => r.json())
      .then((data: { Results: Array<{ Model_Name: string }> }) => {
        const sorted = data.Results.map((m) => m.Model_Name).sort();
        setModels(sorted);
      })
      .catch(() => {});
  }, [make]);

  const selectClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <select value={make} onChange={(e) => { setMake(e.target.value); setModel(''); }} className={selectClass}>
        <option value="">Make</option>
        {makes.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      <select value={model} onChange={(e) => setModel(e.target.value)} disabled={!make} className={selectClass}>
        <option value="">Model</option>
        {models.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      <select value={yearMin} onChange={(e) => setYearMin(e.target.value)} className={selectClass}>
        <option value="">Year from</option>
        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>

      <select value={yearMax} onChange={(e) => setYearMax(e.target.value)} className={selectClass}>
        <option value="">Year to</option>
        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}
