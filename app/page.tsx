import type { Metadata } from 'next';
import Hero from '@/components/sections/hero';
import PopularDestinations from '@/components/sections/popular-destinations';
import DepartureCities from '@/components/sections/departure-cities';
import Advantages from '@/components/sections/advantages';
import HowItWorks from '@/components/sections/how-it-works';
import Reviews from '@/components/sections/reviews';
import CTAMessengers from '@/components/sections/cta-messengers';
import TourGrid from '@/components/tours/tour-grid';
import { getPublishedTours } from '@/data/mock-tours';
import { Tour } from '@/lib/types';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'KRASKI.TRAVEL — туры и поездки по России из Краснодара, Ростова и юга России',
  description:
    'Готовые маршруты для семей, взрослых и небольших компаний. Крым, Грузия, Дагестан, Петербург, Золотое кольцо, Карелия и 140+ направлений. Автобус, поезд, авиа. Бронь онлайн.',
  alternates: { canonical: '/' },
};

const HERO_DESTINATIONS = new Set([
  'Крым', 'Грузия', 'Дагестан', 'Санкт-Петербург', 'Беларусь',
  'Золотое кольцо', 'Карелия', 'Москва', 'Казань', 'Калининград',
  'Стамбул', 'Армения', 'Узбекистан',
]);

function pickDiverse(source: Tour[], limit: number): Tour[] {
  const picked: Tour[] = [];
  const usedDest = new Set<string>();
  for (const t of source) {
    if (picked.length >= limit) break;
    if (usedDest.has(t.destination)) continue;
    usedDest.add(t.destination);
    picked.push(t);
  }
  for (const t of source) {
    if (picked.length >= limit) break;
    if (!picked.some((p) => p.slug === t.slug)) picked.push(t);
  }
  return picked;
}

function buildShowcase(all: Tour[]) {
  const withDates = all.filter((t) => t.nextDates.length > 0);
  const byDate = (t: Tour) => t.nextDates[0]?.start || '\uffff';

  const multiHero = withDates
    .filter((t) => t.durationDays >= 2 && HERO_DESTINATIONS.has(t.destination))
    .sort((a, b) => byDate(a).localeCompare(byDate(b)));

  const multiOther = withDates
    .filter((t) => t.durationDays >= 2 && !HERO_DESTINATIONS.has(t.destination))
    .sort((a, b) => byDate(a).localeCompare(byDate(b)));

  const oneDay = withDates
    .filter((t) => t.durationDays <= 1)
    .sort((a, b) => byDate(a).localeCompare(byDate(b)));

  const trips = pickDiverse([...multiHero, ...multiOther], 6);
  const weekends = pickDiverse(oneDay, 3);

  return { trips, weekends };
}

function ShowcaseSection({
  title, subtitle, tours, href, linkText,
}: {
  title: string; subtitle: string; tours: Tour[]; href: string; linkText: string;
}) {
  if (tours.length === 0) return null;
  return (
    <section className="py-16 lg:py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {title}
            </h2>
            <p className="mt-2 text-base text-gray-500 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          </div>
          <Link
            href={href}
            className="hidden sm:inline-flex items-center gap-1.5 text-brand-600 font-semibold hover:text-brand-700 transition-colors text-sm shrink-0"
          >
            {linkText}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
        <TourGrid tours={tours} />
        <div className="mt-6 text-center sm:hidden">
          <Link href={href} className="inline-flex items-center gap-1.5 text-brand-600 font-semibold text-sm">
            {linkText}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

const FORMAT_TILES = [
  { label: 'Многодневные', sub: 'от 2 до 9 дней', href: '/tours?type=multiday', cls: 'from-brand-50 to-brand-100/60 border-brand-100/50 hover:border-brand-200' },
  { label: 'На выходные', sub: 'однодневные рядом', href: '/tours?type=oneday', cls: 'from-violet-50 to-violet-100/60 border-violet-100/50 hover:border-violet-200' },
  { label: 'За рубеж', sub: 'Грузия, Стамбул, Узбекистан', href: '/tours?tag=abroad', cls: 'from-amber-50 to-amber-100/60 border-amber-100/50 hover:border-amber-200' },
  { label: 'С детьми', sub: 'семейные маршруты', href: '/tours?tag=family', cls: 'from-teal-50 to-teal-100/60 border-teal-100/50 hover:border-teal-200' },
  { label: 'Экскурсии', sub: 'городские прогулки', href: '/tours?tag=excursion', cls: 'from-orange-50 to-orange-100/60 border-orange-100/50 hover:border-orange-200' },
];

export default function HomePage() {
  const allTours = getPublishedTours();
  const { trips, weekends } = buildShowcase(allTours);

  return (
    <>
      <Hero />
      <PopularDestinations />

      {/* Format entry tiles */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Выберите формат</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {FORMAT_TILES.map((tile) => (
              <Link
                key={tile.label}
                href={tile.href}
                className={`bg-gradient-to-br ${tile.cls} border rounded-xl px-4 py-4 transition-all duration-200 group hover:shadow-card`}
              >
                <span className="block text-sm font-bold text-gray-900 group-hover:text-brand-700 transition-colors">
                  {tile.label}
                </span>
                <span className="block text-[11px] text-gray-500 mt-0.5">{tile.sub}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ShowcaseSection
        title="Путешествия на несколько дней"
        subtitle="Крым, Грузия, Петербург, Золотое кольцо и другие большие маршруты — от 2 до 9 дней"
        tours={trips}
        href="/tours?type=multiday"
        linkText="Все многодневные"
      />

      <ShowcaseSection
        title="Поездки на выходные"
        subtitle="Однодневные маршруты рядом — горы, море, винодельни, природа"
        tours={weekends}
        href="/tours?type=oneday"
        linkText="Все однодневные"
      />

      <DepartureCities />
      <Advantages />
      <HowItWorks />
      <Reviews />
      <CTAMessengers />
    </>
  );
}
