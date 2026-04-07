'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Tour } from '@/lib/types';
import { getCitiesByRegion, destinations } from '@/data/mock-tours';
import { CONTACTS } from '@/lib/config';
import { trackEvent } from '@/lib/analytics';
import { FOREIGN_REGIONS, FOREIGN_DEST_NAMES } from '@/lib/utils';
import TourGrid from './tour-grid';

interface TourFiltersProps {
  tours: Tour[];
}

const PAGE_SIZE = 24;

type TypeTab = 'all' | 'oneday' | 'multiday';
type ScenarioTag = '' | 'abroad' | 'family' | 'excursion';

const typeTabs: { label: string; value: TypeTab }[] = [
  { label: 'Все', value: 'all' },
  { label: 'Однодневные', value: 'oneday' },
  { label: 'Многодневные', value: 'multiday' },
];

const sortOptions = [
  { label: 'Рекомендуемые', value: 'recommended' },
  { label: 'По дате', value: 'date' },
  { label: 'По цене ↑', value: 'price-asc' },
  { label: 'По цене ↓', value: 'price-desc' },
  { label: 'По длительности', value: 'duration' },
];

const scenarioChips: { label: string; tag: ScenarioTag }[] = [
  { label: 'За рубеж', tag: 'abroad' },
  { label: 'С детьми', tag: 'family' },
  { label: 'Экскурсии', tag: 'excursion' },
];

const directionChips = [
  { label: 'Крым', dest: 'krym' },
  { label: 'Грузия', dest: 'gruziya' },
  { label: 'Дагестан', dest: 'dagestan' },
  { label: 'Петербург', dest: 'saint-petersburg' },
  { label: 'Золотое кольцо', dest: 'zolotoe-kolco' },
  { label: 'Москва', dest: 'moscow' },
];

function matchesTag(tour: Tour, tag: ScenarioTag): boolean {
  switch (tag) {
    case 'abroad': {
      const allDests = tour.destinations ?? [tour.destination];
      return FOREIGN_REGIONS.has(tour.region) || allDests.some((d) => FOREIGN_DEST_NAMES.has(d));
    }
    case 'family':
      return tour.badges.includes('family') || tour.badges.includes('kids');
    case 'excursion':
      return (
        tour.durationDays <= 1 &&
        tour.badges.includes('city') &&
        !tour.badges.includes('bus') &&
        !tour.badges.includes('train')
      );
    default:
      return true;
  }
}

export default function TourFilters({ tours }: TourFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const syncedFromUrl = useRef(false);

  const [cityFilter, setCityFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [typeTab, setTypeTab] = useState<TypeTab>('all');
  const [scenarioTag, setScenarioTag] = useState<ScenarioTag>('');
  const [sortBy, setSortBy] = useState('recommended');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (syncedFromUrl.current) return;
    syncedFromUrl.current = true;
    const city = searchParams.get('city')?.trim() || '';
    const dest = searchParams.get('destination')?.trim() || '';
    const type = searchParams.get('type')?.trim() || '';
    const tag = searchParams.get('tag')?.trim() || '';
    if (city) setCityFilter(city);
    if (dest) setDestinationFilter(dest);
    if (type === 'oneday' || type === 'multiday') setTypeTab(type);
    if (tag === 'abroad' || tag === 'family' || tag === 'excursion') setScenarioTag(tag);
  }, [searchParams]);

  const buildUrl = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v) sp.set(k, v);
      }
      const qs = sp.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router, pathname],
  );

  const urlParams = useCallback(
    (overrides: Partial<{ city: string; destination: string; type: string; tag: string }> = {}) => {
      const city = overrides.city ?? cityFilter;
      const destination = overrides.destination ?? destinationFilter;
      const type = overrides.type ?? (typeTab === 'all' ? '' : typeTab);
      const tag = overrides.tag ?? scenarioTag;
      return { city, destination, type, tag };
    },
    [cityFilter, destinationFilter, typeTab, scenarioTag],
  );

  const handleCityChange = (v: string) => {
    setCityFilter(v);
    setVisibleCount(PAGE_SIZE);
    buildUrl(urlParams({ city: v }));
  };

  const handleDestChange = (v: string) => {
    setDestinationFilter(v);
    setScenarioTag('');
    setVisibleCount(PAGE_SIZE);
    buildUrl(urlParams({ destination: v, tag: '' }));
  };

  const handleTypeTab = (v: TypeTab) => {
    setTypeTab(v);
    setVisibleCount(PAGE_SIZE);
    buildUrl(urlParams({ type: v === 'all' ? '' : v }));
  };

  const handleScenarioChip = (tag: ScenarioTag) => {
    const next = scenarioTag === tag ? '' : tag;
    setScenarioTag(next);
    setDestinationFilter('');
    setVisibleCount(PAGE_SIZE);
    buildUrl(urlParams({ tag: next, destination: '' }));
  };

  const handleDirectionChip = (dest: string) => {
    const next = destinationFilter === dest ? '' : dest;
    setDestinationFilter(next);
    setScenarioTag('');
    setVisibleCount(PAGE_SIZE);
    buildUrl(urlParams({ destination: next, tag: '' }));
  };

  const filtered = useMemo(() => {
    let result = [...tours];

    if (cityFilter) {
      result = result.filter(
        (t) => t.departureCities.length === 0 || t.departureCities.some((c) => c.slug === cityFilter),
      );
    }

    if (destinationFilter) {
      const destName = destinations.find((d) => d.slug === destinationFilter)?.name.toLowerCase();
      if (destName) {
        result = result.filter((t) => {
          const tourDests = t.destinations ?? [t.destination];
          return tourDests.some((d) => d.toLowerCase() === destName);
        });
      }
    }

    if (scenarioTag) {
      result = result.filter((t) => matchesTag(t, scenarioTag));
    }

    if (typeTab === 'oneday') {
      result = result.filter((t) => t.durationDays <= 1);
    } else if (typeTab === 'multiday') {
      result = result.filter((t) => t.durationDays >= 2);
    }

    const byDate = (t: Tour) => t.nextDates[0]?.start || '\uffff';

    switch (sortBy) {
      case 'recommended':
        result.sort((a, b) => {
          const aTier = a.durationDays >= 2 ? 0 : 1;
          const bTier = b.durationDays >= 2 ? 0 : 1;
          if (aTier !== bTier) return aTier - bTier;
          return byDate(a).localeCompare(byDate(b));
        });
        break;
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
        result.sort((a, b) => byDate(a).localeCompare(byDate(b)));
        break;
    }

    return result;
  }, [tours, cityFilter, destinationFilter, scenarioTag, typeTab, sortBy]);

  const visibleTours = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const resetFilters = () => {
    setCityFilter('');
    setDestinationFilter('');
    setTypeTab('all');
    setScenarioTag('');
    setVisibleCount(PAGE_SIZE);
    router.replace(pathname, { scroll: false });
  };

  const hasFilters = cityFilter || destinationFilter || typeTab !== 'all' || scenarioTag;

  const onedayCount = useMemo(() => tours.filter((t) => t.durationDays <= 1).length, [tours]);
  const multidayCount = useMemo(() => tours.filter((t) => t.durationDays >= 2).length, [tours]);

  return (
    <div>
      {/* Quick picks: scenario + direction chips */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-0.5">Формат</span>
        {scenarioChips.map((chip) => {
          const isActive = scenarioTag === chip.tag;
          return (
            <button
              key={chip.tag}
              onClick={() => handleScenarioChip(chip.tag)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
                isActive
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm shadow-brand-600/20'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              {chip.label}
            </button>
          );
        })}

        <span className="text-gray-200 mx-1 select-none">|</span>

        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mr-0.5">Направление</span>
        {directionChips.map((chip) => {
          const isActive = destinationFilter === chip.dest;
          return (
            <button
              key={chip.dest}
              onClick={() => handleDirectionChip(chip.dest)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-200 hover:text-brand-600'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Type tabs */}
      <div className="flex items-center gap-2 mb-6">
        {typeTabs.map((tab) => {
          const isActive = typeTab === tab.value;
          const count = tab.value === 'all' ? tours.length : tab.value === 'oneday' ? onedayCount : multidayCount;
          return (
            <button
              key={tab.value}
              onClick={() => handleTypeTab(tab.value)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-200 hover:text-brand-600'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${isActive ? 'text-white/70' : 'text-gray-400'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters panel */}
      <div className="bg-white rounded-2xl shadow-panel border border-gray-100 mb-10 overflow-hidden">
        <div className="px-5 lg:px-6 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            <span className="text-sm font-semibold text-gray-800">Подобрать поездку</span>
          </div>
        </div>
        <div className="p-5 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
            <div>
              <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Город выезда</label>
              <select
                value={cityFilter}
                onChange={(e) => handleCityChange(e.target.value)}
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
                onChange={(e) => handleDestChange(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 bg-gray-50/30 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 focus:bg-white outline-none transition-all cursor-pointer appearance-none"
              >
                <option value="">Все направления</option>
                {destinations.map((dest) => (
                  <option key={dest.slug} value={dest.slug}>{dest.name}</option>
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

      <TourGrid tours={visibleTours} />

      {hasMore && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-10 py-4 rounded-2xl text-sm font-bold hover:border-brand-300 hover:text-brand-600 hover:shadow-card transition-all duration-200"
          >
            Показать ещё
            <span className="text-gray-400 text-xs">
              {visibleCount} из {filtered.length}
            </span>
          </button>
        </div>
      )}

      <CatalogHelpCta count={filtered.length} />
    </div>
  );
}

function CatalogHelpCta({ count }: { count: number }) {
  return (
    <div className="mt-16 bg-gradient-to-br from-brand-50/60 via-white to-white rounded-2xl border border-brand-100/40 shadow-panel p-7 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold text-gray-900">
          Не хотите сравнивать {count} {count === 1 ? 'вариант' : count < 5 ? 'варианта' : 'вариантов'} самостоятельно?
        </p>
        <p className="mt-1 text-sm text-gray-500 leading-relaxed">
          Напишите — подберём маршрут под ваши даты, бюджет и формат отдыха. Обычно отвечаем в течение 15 минут.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
        <a
          href={`${CONTACTS.whatsapp.url}?text=${encodeURIComponent('Здравствуйте! Помогите подобрать поездку.')}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('click_whatsapp', { source: 'catalog_help' })}
          className="inline-flex items-center justify-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
        <a
          href={CONTACTS.telegram.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('click_telegram', { source: 'catalog_help' })}
          className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 transition-colors"
        >
          Telegram
        </a>
        <a
          href={`tel:${CONTACTS.phoneRaw}`}
          onClick={() => trackEvent('click_call', { source: 'catalog_help' })}
          className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-brand-200 hover:text-brand-600 transition-colors"
        >
          {CONTACTS.phone}
        </a>
      </div>
    </div>
  );
}
