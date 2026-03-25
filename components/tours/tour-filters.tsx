'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Tour } from '@/lib/types';
import { getCitiesByRegion, destinations, tourMatchesCity } from '@/data/mock-tours';
import TourGrid from './tour-grid';

interface TourFiltersProps {
  tours: Tour[];
}

const durationOptions = [
  { label: 'Все', value: 0 },
  { label: '1–2 дня', value: 2 },
  { label: '3–5 дней', value: 5 },
  { label: '6+ дней', value: 99 },
];

const sortOptions = [
  { label: 'По цене ↑', value: 'price-asc' },
  { label: 'По цене ↓', value: 'price-desc' },
  { label: 'По длительности', value: 'duration' },
  { label: 'По дате', value: 'date' },
];

export default function TourFilters({ tours }: TourFiltersProps) {
  const searchParams = useSearchParams();
  const syncedFromUrl = useRef(false);

  const [cityFilter, setCityFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState(0);
  const [sortBy, setSortBy] = useState('price-asc');

  useEffect(() => {
    if (syncedFromUrl.current) return;
    syncedFromUrl.current = true;
    const city = searchParams.get('city')?.trim() || '';
    const dest = searchParams.get('destination')?.trim() || '';
    if (city) setCityFilter(city);
    if (dest) setDestinationFilter(dest);
  }, [searchParams]);

  const filtered = useMemo(() => {
    let result = [...tours];

    if (cityFilter) {
      result = result.filter((t) => tourMatchesCity(t, cityFilter));
    }

    if (destinationFilter) {
      result = result.filter(
        (t) => t.destination.toLowerCase() === destinations.find((d) => d.slug === destinationFilter)?.name.toLowerCase()
      );
    }

    if (durationFilter > 0) {
      if (durationFilter === 2) {
        result = result.filter((t) => t.durationDays <= 2);
      } else if (durationFilter === 5) {
        result = result.filter((t) => t.durationDays >= 3 && t.durationDays <= 5);
      } else {
        result = result.filter((t) => t.durationDays >= 6);
      }
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.priceFrom - b.priceFrom);
        break;
      case 'price-desc':
        result.sort((a, b) => b.priceFrom - a.priceFrom);
        break;
      case 'duration':
        result.sort((a, b) => a.durationDays - b.durationDays);
        break;
      case 'date':
        result.sort((a, b) => {
          const aDate = a.nextDates[0]?.start || '';
          const bDate = b.nextDates[0]?.start || '';
          return aDate.localeCompare(bDate);
        });
        break;
    }

    return result;
  }, [tours, cityFilter, destinationFilter, durationFilter, sortBy]);

  const resetFilters = () => {
    setCityFilter('');
    setDestinationFilter('');
    setDurationFilter(0);
  };

  const hasFilters = cityFilter || destinationFilter || durationFilter > 0;

  return (
    <div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-10 overflow-hidden">
        <div className="px-5 lg:px-6 py-3.5 bg-gradient-to-r from-brand-50/80 to-transparent border-b border-brand-100/50">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            <span className="text-sm font-semibold text-brand-800">Подобрать тур</span>
          </div>
        </div>
        <div className="p-5 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Город выезда</label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 bg-gray-50/30 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 focus:bg-white outline-none transition-all cursor-pointer appearance-none"
              >
                <option value="">Все города</option>
                {getCitiesByRegion().map((group) => (
                  <optgroup key={group.region} label={group.region}>
                    {group.cities.map((city) => (
                      <option key={city.slug} value={city.slug}>{city.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Направление</label>
              <select
                value={destinationFilter}
                onChange={(e) => setDestinationFilter(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 bg-gray-50/30 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 focus:bg-white outline-none transition-all cursor-pointer appearance-none"
              >
                <option value="">Все направления</option>
                {destinations.map((dest) => (
                  <option key={dest.slug} value={dest.slug}>{dest.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Длительность</label>
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 bg-gray-50/30 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 focus:bg-white outline-none transition-all cursor-pointer appearance-none"
              >
                {durationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Сортировка</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 bg-gray-50/30 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 focus:bg-white outline-none transition-all cursor-pointer appearance-none"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {hasFilters && (
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Найдено: <span className="font-bold text-gray-900">{filtered.length}</span>
              </p>
              <button
                onClick={resetFilters}
                className="text-sm text-brand-600 hover:text-brand-700 font-semibold transition-colors"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      </div>

      <TourGrid tours={filtered} />
    </div>
  );
}
