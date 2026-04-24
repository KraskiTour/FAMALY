import Link from 'next/link';
import { getPublishedTours } from '@/data/mock-tours';
import { formatPrice, pluralDays } from '@/lib/utils';
import type { Tour } from '@/lib/types';
import HeroCard from './hero-card';

const TRUST_STATS = [
  { value: '140+', label: 'направлений' },
  { value: '12', label: 'городов выезда' },
  { value: '4.9', label: 'средний рейтинг' },
];

const HERO_BULLETS = [
  'Для семей, взрослых и небольших компаний',
  'Автобус, поезд и комбинированные маршруты',
  'Выходные, каникулы и многодневные поездки',
];

/**
 * Preferred anchor destinations for the hero cluster.
 * We try to cover different "vibes" (mountains / sea / city / nature) so the
 * 3 hero cards feel like a curated travel-brand window, not 3 random cards.
 */
const HERO_DESTINATION_PRIORITY = [
  'Домбай',
  'Лаго-Наки',
  'Архыз',
  'Дагестан',
  'Крым',
  'Санкт-Петербург',
  'Карелия',
  'Грузия',
  'Золотое кольцо',
  'Абхазия',
  'Калининград',
];

function hasValidGallery(tour: Tour): boolean {
  const first = tour.gallery?.[0];
  return Boolean(first && /^https?:\/\//i.test(first.trim()));
}

function badgeScore(tour: Tour): number {
  let s = 0;
  if (tour.badges.includes('hit')) s += 3;
  if (tour.badges.includes('new')) s += 2;
  if (tour.badges.includes('hot')) s += 2;
  return s;
}

/**
 * Pick 3 tours for the hero cluster: one main + two mini cards.
 * Rules:
 *   - Only tours with a real external image in gallery[0]
 *   - Different destinations to keep the cluster visually varied
 *   - Main slot strongly prefers multi-day tours — their lead photos are
 *     usually scenic landscapes (mountains, sea, old towns) and read as
 *     travel-brand kadrs. One-day city excursions make weaker hero kadrs.
 *   - Prefer tours from HERO_DESTINATION_PRIORITY; fall back to anything valid
 *   - Within a destination, prefer badged tours (hit / new / hot)
 */
function pickHeroTours(allTours: Tour[]): Tour[] {
  const valid = allTours.filter(hasValidGallery);

  // Group candidates by their primary destination name.
  const byDest = new Map<string, Tour[]>();
  for (const tour of valid) {
    const names = tour.destinations ?? [tour.destination];
    for (const name of names) {
      if (!byDest.has(name)) byDest.set(name, []);
      byDest.get(name)!.push(tour);
    }
  }

  // Sort within each destination: multi-day first, then by badge score.
  const scenicScore = (t: Tour) =>
    (t.durationDays >= 2 ? 10 : 0) + badgeScore(t);
  for (const pool of byDest.values()) {
    pool.sort((a, b) => scenicScore(b) - scenicScore(a));
  }

  const picked: Tour[] = [];
  const usedIds = new Set<string>();
  const usedDestinations = new Set<string>();

  // First pass: honor the priority list, one tour per destination.
  for (const destName of HERO_DESTINATION_PRIORITY) {
    if (picked.length >= 3) break;
    const pool = byDest.get(destName);
    if (!pool || pool.length === 0) continue;
    const pick = pool.find((t) => !usedIds.has(t.id));
    if (pick) {
      picked.push(pick);
      usedIds.add(pick.id);
      usedDestinations.add(destName);
    }
  }

  // Second pass: fill remaining slots with any valid tour from a fresh destination.
  if (picked.length < 3) {
    const fallback = [...valid].sort((a, b) => scenicScore(b) - scenicScore(a));
    for (const tour of fallback) {
      if (picked.length >= 3) break;
      if (usedIds.has(tour.id)) continue;
      const destName = tour.destination;
      if (usedDestinations.has(destName)) continue;
      picked.push(tour);
      usedIds.add(tour.id);
      usedDestinations.add(destName);
    }
  }

  return picked;
}

function heroEyebrow(tour: Tour): string {
  const dest = (tour.destinations ?? [tour.destination])[0];
  return `${dest} · ${pluralDays(tour.durationDays)}`;
}

function heroMiniLabel(tour: Tour): string {
  return (tour.destinations ?? [tour.destination])[0];
}

export default function Hero() {
  const allTours = getPublishedTours();
  const [mainTour, miniA, miniB] = pickHeroTours(allTours);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-warm-50/30">
      <div className="absolute inset-0 hero-grid opacity-70" aria-hidden />
      <div className="brand-blob brand-blob-teal w-[560px] h-[460px] -top-40 -left-32 opacity-60" aria-hidden />
      <div className="brand-blob brand-blob-warm w-[420px] h-[360px] top-1/3 -right-32 opacity-50" aria-hidden />

      <div className="relative container-page pt-16 pb-14 sm:pt-20 sm:pb-20 lg:pt-24 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left: Content */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 bg-white border border-brand-100 rounded-full pl-1.5 pr-4 py-1 shadow-card">
              <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-[11px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full" />
                2026
              </span>
              <span className="text-xs sm:text-[13px] font-medium text-gray-600">
                Бронирование открыто — выбирайте даты
              </span>
            </div>

            <h1 className="mt-6 text-[2.5rem] leading-[1.05] sm:text-5xl lg:text-[4rem] lg:leading-[1.03] font-extrabold text-gray-900 tracking-tight">
              Путешествия, которые
              <br className="hidden sm:block" />{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-brand-700 via-brand-600 to-teal-500 bg-clip-text text-transparent">
                  легко выбрать
                </span>
                <span
                  className="absolute -bottom-1 left-0 right-0 h-2.5 bg-warm-200/70 -z-0 rounded-sm"
                  aria-hidden
                />
              </span>{' '}
              <br className="hidden sm:block" />
              и приятно вспоминать
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-xl">
              Готовые маршруты по России и близкому зарубежью — для семей, взрослых
              и небольших компаний. Выбирайте формат и бронируйте без лишней суеты.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/tours"
                className="group/cta inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-700 text-white px-8 py-4 rounded-xl text-base font-bold hover:from-brand-700 hover:to-brand-800 transition-all shadow-button"
              >
                Подобрать поездку
                <svg className="w-4 h-4 transition-transform group-hover/cta:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                href="/#goroda-vyezda"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-xl text-base font-semibold hover:border-brand-300 hover:text-brand-700 transition-all shadow-card"
              >
                Смотреть направления
              </Link>
            </div>

            <ul className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl">
              {HERO_BULLETS.map((text) => (
                <li key={text} className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 shrink-0">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                  <span className="text-sm text-gray-600 leading-snug">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Visual cluster — one tall main photo + two calm supporting
              tiles stacked on the left. Cards no longer cross each other's
              axes, so the composition reads as "feature + 2 context shots"
              instead of a noisy collage. */}
          <div className="lg:col-span-5 relative h-[420px] sm:h-[500px] lg:h-[560px] mt-4 lg:mt-0">
            {/* Main photo — tall 3:4 portrait, occupies the right ~64% */}
            {mainTour && (
              <HeroCard
                variant="main"
                priority
                href={`/tours/${mainTour.slug}`}
                image={mainTour.gallery[0]}
                eyebrow={heroEyebrow(mainTour)}
                title={mainTour.title}
                priceFromFormatted={formatPrice(mainTour.priceFrom)}
                className="inset-y-0 right-0 w-[68%] sm:w-[64%]"
              />
            )}

            {/* Supporting tile — top-left, slightly overlapping the main card
                by ~6% for a gentle layered feel, not a crowded collage. */}
            {miniA && (
              <HeroCard
                variant="mini"
                href={`/tours/${miniA.slug}`}
                image={miniA.gallery[0]}
                eyebrow={heroEyebrow(miniA)}
                title={miniA.title}
                priceFromFormatted={formatPrice(miniA.priceFrom)}
                miniLabel={heroMiniLabel(miniA)}
                className="top-2 left-0 w-[38%] sm:w-[36%]"
              />
            )}

            {/* Supporting tile — bottom-left, mirrors miniA for balance. */}
            {miniB && (
              <HeroCard
                variant="mini"
                href={`/tours/${miniB.slug}`}
                image={miniB.gallery[0]}
                eyebrow={heroEyebrow(miniB)}
                title={miniB.title}
                priceFromFormatted={formatPrice(miniB.priceFrom)}
                miniLabel={heroMiniLabel(miniB)}
                className="bottom-2 left-[6%] w-[34%] sm:w-[32%]"
              />
            )}
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-12 lg:mt-14 pt-7 border-t border-gray-200/70 grid grid-cols-3 gap-6 max-w-2xl">
          {TRUST_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {stat.value}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 mt-0.5 leading-tight">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
