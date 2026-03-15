'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Plus, Trash2, X } from 'lucide-react';

interface Alert {
  id: string;
  query: string;
  notifyEmail: boolean;
  isActive: boolean;
  lastTriggeredAt: string | null;
  createdAt: string;
}

export default function AlertsPage() {
  const [alertList, setAlertList] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newQuery, setNewQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/alerts')
      .then((r) => r.json())
      .then((data: { alerts?: Alert[] }) => setAlertList(data.alerts ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function createAlert(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuery.trim()) return;
    setSaving(true);
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: newQuery, notifyEmail: true }),
    });
    const data = (await res.json()) as { alert?: Alert };
    if (data.alert) {
      setAlertList((prev) => [data.alert!, ...prev]);
      setNewQuery('');
      setShowForm(false);
    }
    setSaving(false);
  }

  async function deleteAlert(id: string) {
    await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
    setAlertList((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Alerts</h1>
          <p className="text-sm text-gray-500">Get notified when new parts matching your search appear</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New alert
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Create an alert</h2>
            <button onClick={() => setShowForm(false)}><X className="h-4 w-4 text-gray-500" /></button>
          </div>
          <form onSubmit={createAlert} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. alternator Honda Civic 2018"
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              required
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={saving || !newQuery.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Create'}
            </button>
          </form>
          <p className="mt-2 text-xs text-gray-500">
            You&apos;ll receive an email every 6 hours when new listings match this search.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200" />)}
        </div>
      )}

      {!loading && alertList.length === 0 && !showForm && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Bell className="h-12 w-12 text-gray-200" />
          <p className="font-semibold text-gray-600">No alerts yet</p>
          <p className="text-sm text-gray-400">Create an alert to get notified when new parts appear.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {alertList.map((alert) => (
          <div key={alert.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className={`rounded-full p-2 ${alert.isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
              {alert.isActive ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">&ldquo;{alert.query}&rdquo;</p>
              <p className="text-xs text-gray-400">
                {alert.lastTriggeredAt
                  ? `Last triggered: ${new Date(alert.lastTriggeredAt).toLocaleDateString()}`
                  : 'Never triggered yet'}
                {alert.notifyEmail && ' · Email notifications on'}
              </p>
            </div>
            <button
              onClick={() => deleteAlert(alert.id)}
              className="text-gray-300 hover:text-red-500 transition-colors"
              title="Delete alert"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
