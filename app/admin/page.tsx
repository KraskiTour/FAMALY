'use client';

import { useEffect, useMemo, useState } from 'react';

type NextDate = {
  start: string;
  end: string;
  price: number;
  seatsLeft: number | null;
};

type Tour = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  region: string;
  durationDays: number;
  priceFrom: number;
  isPublished?: boolean;
  nextDates: NextDate[];
  [key: string]: unknown;
};

const emptyTour: Tour = {
  id: '',
  slug: '',
  title: '',
  destination: '',
  region: '',
  durationDays: 1,
  priceFrom: 0,
  isPublished: true,
  nextDates: [],
};

function safeParseDates(raw: string): NextDate[] | null {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as NextDate[];
  } catch {
    return null;
  }
}

export default function AdminPage() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Loading...');
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [datesText, setDatesText] = useState('[]');
  const [datesError, setDatesError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/tours', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load tours');
        if (!active) return;
        setTours(data.tours || []);
        setSelectedIndex(0);
        setStatus(`Loaded ${(data.tours || []).length} tours`);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Load error');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filteredIndexes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tours.map((_, i) => i);
    return tours
      .map((tour, i) => ({ tour, i }))
      .filter(({ tour }) =>
        [tour.title, tour.slug, tour.destination, tour.id].some((value) =>
          String(value || '').toLowerCase().includes(q)
        )
      )
      .map(({ i }) => i);
  }, [tours, query]);

  const current = tours[selectedIndex] || null;

  useEffect(() => {
    if (!current) return;
    setDatesText(JSON.stringify(current.nextDates || [], null, 2));
    setDatesError('');
  }, [current?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  function patchCurrent(patch: Partial<Tour>) {
    if (!current) return;
    setTours((prev) =>
      prev.map((item, idx) => (idx === selectedIndex ? { ...item, ...patch } : item))
    );
  }

  function addTour() {
    const stamp = Date.now().toString().slice(-6);
    const newTour: Tour = {
      ...emptyTour,
      id: `new-${stamp}`,
      slug: `new-tour-${stamp}`,
      title: 'Новый тур',
      destination: 'Новое направление',
      region: 'Регион',
    };
    setTours((prev) => [...prev, newTour]);
    setSelectedIndex(tours.length);
    setStatus('New tour added locally (not saved yet)');
  }

  function removeCurrent() {
    if (!current) return;
    const ok = window.confirm(`Delete tour "${current.title}"?`);
    if (!ok) return;

    setTours((prev) => prev.filter((_, idx) => idx !== selectedIndex));
    setSelectedIndex((prev) => Math.max(0, prev - 1));
    setStatus('Tour removed locally (not saved yet)');
  }

  async function saveAll() {
    if (!current) return;

    const parsedDates = safeParseDates(datesText);
    if (!parsedDates) {
      setDatesError('`nextDates` JSON is invalid');
      return;
    }
    setDatesError('');
    patchCurrent({ nextDates: parsedDates });

    setIsSavingAll(true);
    try {
      const res = await fetch('/api/admin/tours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tours: tours.map((t, i) => (i === selectedIndex ? { ...t, nextDates: parsedDates } : t)) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save');
      setStatus(`Saved ${data.count} tours to data/tours.json`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setIsSavingAll(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Mini Admin: Tours JSON</h1>
        <div className="flex gap-2">
          <button onClick={addTour} className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold">
            Add Tour
          </button>
          <button
            onClick={saveAll}
            disabled={isSavingAll || !current}
            className="px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60 text-sm font-semibold"
          >
            {isSavingAll ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">{status}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <aside className="lg:col-span-1 border border-gray-200 rounded-2xl p-4 bg-white">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, slug, id..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
          />
          <div className="h-[580px] overflow-auto space-y-2">
            {filteredIndexes.map((idx) => {
              const t = tours[idx];
              const active = idx === selectedIndex;
              return (
                <button
                  key={`${t.slug}-${idx}`}
                  onClick={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${active ? 'border-brand-300 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="font-semibold text-gray-900">{t.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{t.slug}</div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="lg:col-span-2 border border-gray-200 rounded-2xl p-4 bg-white">
          {!current ? (
            <p className="text-sm text-gray-500">No tour selected</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-sm">
                  <span className="block text-gray-600 mb-1">ID</span>
                  <input
                    value={current.id || ''}
                    onChange={(e) => patchCurrent({ id: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-gray-600 mb-1">Slug</span>
                  <input
                    value={current.slug || ''}
                    onChange={(e) => patchCurrent({ slug: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  />
                </label>
                <label className="text-sm md:col-span-2">
                  <span className="block text-gray-600 mb-1">Title</span>
                  <input
                    value={current.title || ''}
                    onChange={(e) => patchCurrent({ title: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-gray-600 mb-1">Destination</span>
                  <input
                    value={current.destination || ''}
                    onChange={(e) => patchCurrent({ destination: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-gray-600 mb-1">Region</span>
                  <input
                    value={current.region || ''}
                    onChange={(e) => patchCurrent({ region: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-gray-600 mb-1">Duration Days</span>
                  <input
                    type="number"
                    value={current.durationDays ?? 1}
                    onChange={(e) => patchCurrent({ durationDays: Number(e.target.value) || 1 })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  />
                </label>
                <label className="text-sm">
                  <span className="block text-gray-600 mb-1">Price From</span>
                  <input
                    type="number"
                    value={current.priceFrom ?? 0}
                    onChange={(e) => patchCurrent({ priceFrom: Number(e.target.value) || 0 })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  />
                </label>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={current.isPublished !== false}
                  onChange={(e) => patchCurrent({ isPublished: e.target.checked })}
                />
                Published
              </label>

              <div>
                <p className="text-sm text-gray-700 mb-1">
                  nextDates (JSON array)
                </p>
                <textarea
                  value={datesText}
                  onChange={(e) => setDatesText(e.target.value)}
                  rows={14}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-xs"
                />
                {datesError && <p className="text-xs text-red-600 mt-1">{datesError}</p>}
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  onClick={removeCurrent}
                  className="px-3 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-sm font-semibold"
                >
                  Delete Tour
                </button>
                <button
                  onClick={saveAll}
                  disabled={isSavingAll}
                  className="px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60 text-sm font-semibold"
                >
                  {isSavingAll ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

