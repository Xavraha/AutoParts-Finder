'use client';

import { useEffect, useState } from 'react';
import { Car, Plus, Trash2, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSearchStore } from '@/stores/searchStore';

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  engine: string | null;
  nickname: string | null;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - i);

export default function GaragePage() {
  const router = useRouter();
  const { setMake, setModel, setYearMin, setYearMax } = useSearchStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ make: '', model: '', year: CURRENT_YEAR, engine: '', nickname: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/vehicles')
      .then((r) => r.json())
      .then((data: { vehicles?: Vehicle[] }) => setVehicles(data.vehicles ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, year: Number(form.year) }),
    });
    const data = (await res.json()) as { vehicle?: Vehicle };
    if (data.vehicle) {
      setVehicles((prev) => [data.vehicle!, ...prev]);
      setShowForm(false);
      setForm({ make: '', model: '', year: CURRENT_YEAR, engine: '', nickname: '' });
    }
    setSaving(false);
  }

  async function deleteVehicle(id: string) {
    await fetch(`/api/vehicles?id=${id}`, { method: 'DELETE' });
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  }

  function searchForVehicle(v: Vehicle) {
    setMake(v.make);
    setModel(v.model);
    setYearMin(String(v.year));
    setYearMax(String(v.year));
    router.push(`/search?q=parts&make=${v.make}&model=${v.model}&yearMin=${v.year}&yearMax=${v.year}`);
  }

  const inputClass = 'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Garage</h1>
          <p className="text-sm text-gray-500">Search parts for your vehicles quickly</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add vehicle
        </button>
      </div>

      {/* Add vehicle form */}
      {showForm && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Add a vehicle</h2>
            <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-gray-500" /></button>
          </div>
          <form onSubmit={addVehicle} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <input required placeholder="Make (e.g. Honda)" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} className={inputClass} />
            <input required placeholder="Model (e.g. Civic)" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className={inputClass} />
            <select value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className={inputClass}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <input placeholder="Engine (optional)" value={form.engine} onChange={(e) => setForm({ ...form, engine: e.target.value })} className={inputClass} />
            <input placeholder="Nickname (optional)" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} className={inputClass} />
            <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save vehicle'}
            </button>
          </form>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-gray-200" />)}
        </div>
      )}

      {!loading && vehicles.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Car className="h-12 w-12 text-gray-200" />
          <p className="font-semibold text-gray-600">Your garage is empty</p>
          <p className="text-sm text-gray-400">Add your vehicles to search parts for them quickly.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((v) => (
          <div key={v.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{v.nickname ?? `${v.year} ${v.make} ${v.model}`}</p>
                <p className="text-sm text-gray-500">{v.year} · {v.make} {v.model}</p>
                {v.engine && <p className="text-xs text-gray-400">{v.engine}</p>}
              </div>
              <button onClick={() => deleteVehicle(v.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => searchForVehicle(v)}
              className="flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Search className="h-4 w-4" />
              Find parts for this vehicle
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
