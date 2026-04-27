import type { Metadata } from 'next';
import Hero from '@/components/sections/hero';
import PopularDestinations from '@/components/sections/popular-destinations';
import DepartureCities from '@/components/sections/departure-cities';
import Advantages from '@/components/sections/advantages';
import HowItWorks from '@/components/sections/how-it-works';
import Reviews from '@/components/sections/reviews';
import CTAMessengers from '@/components/sections/cta-messengers';
import TourGrid from '@/components/tours/tour-grid';
import { getPublishedTours, getTourById } from '@/data/mock-tours';
import { Tour } from '@/lib/types';
import Link from 'next/link';
import { redirect } from 'next/navigation';

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
  eyebrow, title, subtitle, tours, href, linkText, surface = 'neutral',
}: {
  eyebrow: string; title: string; subtitle: string; tours: Tour[]; href: string; linkText: string;
  surface?: 'neutral' | 'white';
}) {
  if (tours.length === 0) return null;
  const bg = surface === 'white' ? 'bg-white' : 'bg-stone-50/60';
  return (
    <section className={`section-y ${bg}`}>
      <div className="container-page">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8 lg:mb-10">
          <div className="max-w-2xl">
            <span className="eyebrow">{eyebrow}</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              {title}
            </h2>
            <p className="mt-3 text-base sm:text-lg text-gray-500 leading-relaxed">
              {subtitle}
            </p>
          </div>
          <Link
            href={href}
            className="hidden sm:inline-flex items-center gap-1.5 text-brand-700 font-semibold hover:text-brand-800 transition-colors text-sm shrink-0 border-b border-brand-200 hover:border-brand-500 pb-0.5"
          >
            {linkText}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
        <TourGrid tours={tours} />
        <div className="mt-8 text-center sm:hidden">
          <Link href={href} className="inline-flex items-center gap-1.5 text-brand-700 font-semibold text-sm">
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
  {
    label: 'Многодневные', sub: 'от 2 до 9 дней',
    href: '/tours?type=multiday',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    ),
    tone: 'brand',
  },
  {
    label: 'На выходные', sub: 'однодневные рядом',
    href: '/tours?type=oneday',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    tone: 'neutral',
  },
  {
    label: 'За рубеж', sub: 'Грузия, Стамбул, Узбекистан',
    href: '/tours?tag=abroad',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 18v-9m-9 0h18" />
    ),
    tone: 'warm',
  },
  {
    label: 'С детьми', sub: 'семейные маршруты',
    href: '/tours?tag=family',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    ),
    tone: 'neutral',
  },
  {
    label: 'Экскурсии', sub: 'городские прогулки',
    href: '/tours?tag=excursion',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    ),
    tone: 'brand',
  },
];

const TONE_CLS: Record<string, { surface: string; iconWrap: string; icon: string }> = {
  brand: {
    surface: 'bg-gradient-to-br from-brand-50 to-white border-brand-100/70 hover:border-brand-300',
    iconWrap: 'bg-brand-100 text-brand-700',
    icon: 'text-brand-700',
  },
  warm: {
    surface: 'bg-gradient-to-br from-warm-50 to-white border-warm-100 hover:border-warm-200',
    iconWrap: 'bg-warm-100 text-warm-600',
    icon: 'text-warm-600',
  },
  neutral: {
    surface: 'bg-white border-gray-200/80 hover:border-brand-200',
    iconWrap: 'bg-brand-50 text-brand-700',
    icon: 'text-brand-700',
  },
};

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getSingleParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0]?.trim() || null;
  return value?.trim() || null;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const sp = await searchParams;
  const startAppTourId = getSingleParam(sp.startapp) ?? getSingleParam(sp.startApp);

  if (startAppTourId) {
    const targetTour = getTourById(startAppTourId);
    if (targetTour) {
      redirect(`/tours/${targetTour.slug}`);
    }
  }

  const allTours = getPublishedTours();
  const { trips, weekends } = buildShowcase(allTours);

  return (
    <>
      <Hero />
      <PopularDestinations />

      {/* Format entry tiles */}
      <section className="section-y-tight bg-white">
        <div className="container-page">
          <div className="flex items-end justify-between mb-6 lg:mb-7">
            <div>
              <span className="eyebrow">Форматы</span>
              <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Выберите формат поездки
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {FORMAT_TILES.map((tile) => {
              const t = TONE_CLS[tile.tone];
              return (
                <Link
                  key={tile.label}
                  href={tile.href}
                  className={`group ${t.surface} border rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover`}
                >
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${t.iconWrap} mb-4`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      {tile.icon}
                    </svg>
                  </span>
                  <span className="block text-sm font-bold text-gray-900 group-hover:text-brand-700 transition-colors">
                    {tile.label}
                  </span>
                  <span className="block text-[12px] text-gray-500 mt-1 leading-snug">{tile.sub}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <ShowcaseSection
        eyebrow="Многодневные"
        title="Путешествия на несколько дней"
        subtitle="Крым, Грузия, Петербург, Золотое кольцо и другие большие маршруты — от 2 до 9 дней"
        tours={trips}
        href="/tours?type=multiday"
        linkText="Все многодневные"
        surface="neutral"
      />

      <ShowcaseSection
        eyebrow="Выходные"
        title="Поездки на один-два дня"
        subtitle="Однодневные маршруты рядом — горы, море, винодельни, природа"
        tours={weekends}
        href="/tours?type=oneday"
        linkText="Все однодневные"
        surface="white"
      />

      <DepartureCities />
      <Advantages />
      <HowItWorks />
      <Reviews />
      <CTAMessengers />
    </>
  );
}
