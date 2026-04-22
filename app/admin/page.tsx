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
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Loading...');
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [datesText, setDatesText] = useState('[]');
  const [datesError, setDatesError] = useState('');
  const [tourJsonText, setTourJsonText] = useState('{}');
  const [tourJsonError, setTourJsonError] = useState('');
  const [galleryInput, setGalleryInput] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/admin/session', { cache: 'no-store' });
        const data = await res.json();
        if (!active) return;
        setConfigured(Boolean(data.configured));
        setAuthenticated(Boolean(data.authenticated));
        if (!data.configured) {
          setStatus('Set ADMIN_PASSWORD in .env.local and restart dev server');
        }
      } catch {
        if (!active) return;
        setConfigured(false);
        setStatus('Failed to check admin session');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authenticated) return;
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
  }, [authenticated]);

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
    setTourJsonText(JSON.stringify(current, null, 2));
    setDatesError('');
    setTourJsonError('');
  }, [current?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  function patchCurrent(patch: Partial<Tour>) {
    if (!current) return;
    const updated = { ...current, ...patch };
    setTours((prev) => prev.map((item, idx) => (idx === selectedIndex ? updated : item)));
    setTourJsonText(JSON.stringify(updated, null, 2));
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

  function applyTourJsonDraft(): Tour | null {
    try {
      const parsed = JSON.parse(tourJsonText) as Tour;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setTourJsonError('Tour JSON must be an object');
        return null;
      }
      if (!parsed.slug || !parsed.title) {
        setTourJsonError('Tour JSON must include at least `slug` and `title`');
        return null;
      }
      setTourJsonError('');
      return parsed;
    } catch {
      setTourJsonError('Tour JSON is invalid');
      return null;
    }
  }

  function addGalleryItem() {
    if (!current) return;
    const nextUrl = galleryInput.trim();
    if (!nextUrl) return;
    const currentGallery = Array.isArray(current.gallery) ? (current.gallery as string[]) : [];
    patchCurrent({ gallery: [...currentGallery, nextUrl] });
    setGalleryInput('');
  }

  function removeGalleryItem(index: number) {
    if (!current) return;
    const currentGallery = Array.isArray(current.gallery) ? (current.gallery as string[]) : [];
    patchCurrent({ gallery: currentGallery.filter((_, i) => i !== index) });
  }

  async function login() {
    setLoginError('');
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Login failed');
      setAuthenticated(true);
      setLoginPassword('');
      setStatus('Authenticated');
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Login failed');
    }
  }

  async function logout() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    setAuthenticated(false);
    setTours([]);
    setStatus('Signed out');
  }

  async function saveAll() {
    if (!current) return;

    const parsedDates = safeParseDates(datesText);
    if (!parsedDates) {
      setDatesError('`nextDates` JSON is invalid');
      return;
    }
    setDatesError('');

    const parsedTour = applyTourJsonDraft();
    if (!parsedTour) return;

    const mergedTour: Tour = { ...parsedTour, nextDates: parsedDates };
    const nextTours = tours.map((t, i) => (i === selectedIndex ? mergedTour : t));
    setTours(nextTours);
    setTourJsonText(JSON.stringify(mergedTour, null, 2));

    setIsSavingAll(true);
    try {
      const res = await fetch('/api/admin/tours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tours: nextTours }),
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

  if (configured === false) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Admin is not configured</h1>
        <p className="text-sm text-gray-600 mb-2">
          Create `.env.local` and add:
        </p>
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">ADMIN_PASSWORD=your_strong_password</pre>
        <p className="text-sm text-gray-600 mt-2">Then restart the dev server.</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="border border-gray-200 rounded-2xl bg-white p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Admin Login</h1>
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void login();
            }}
            placeholder="Enter admin password"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
          />
          {loginError && <p className="text-xs text-red-600 mb-3">{loginError}</p>}
          <button
            onClick={() => void login()}
            className="w-full px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 text-sm font-semibold"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Mini Admin: Tours JSON</h1>
        <div className="flex gap-2">
          <button
            onClick={() => window.open('/api/admin/tours?download=1', '_blank')}
            className="px-4 py-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-sm font-semibold"
          >
            Download tours.json
          </button>
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
          <button onClick={() => void logout()} className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-sm font-semibold text-red-700">
            Logout
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
                <p className="text-sm text-gray-700 mb-1">Tour JSON (all fields)</p>
                <textarea
                  value={tourJsonText}
                  onChange={(e) => setTourJsonText(e.target.value)}
                  rows={16}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 font-mono text-xs"
                />
                {tourJsonError && <p className="text-xs text-red-600 mt-1">{tourJsonError}</p>}
              </div>

              <div>
                <p className="text-sm text-gray-700 mb-1">Gallery</p>
                <div className="flex gap-2 mb-2">
                  <input
                    value={galleryInput}
                    onChange={(e) => setGalleryInput(e.target.value)}
                    placeholder="https://... or /images/tours/..."
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    onClick={addGalleryItem}
                    className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1 max-h-36 overflow-auto">
                  {(Array.isArray(current.gallery) ? (current.gallery as string[]) : []).map((url, i) => (
                    <div key={`${url}-${i}`} className="flex items-center justify-between gap-2 text-xs border border-gray-100 rounded px-2 py-1">
                      <span className="truncate text-gray-700">{url}</span>
                      <button
                        onClick={() => removeGalleryItem(i)}
                        className="text-red-600 hover:text-red-700 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

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

