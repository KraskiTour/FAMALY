import Hero from '@/components/sections/hero';
import PopularDestinations from '@/components/sections/popular-destinations';
import DepartureCities from '@/components/sections/departure-cities';
import Advantages from '@/components/sections/advantages';
import HowItWorks from '@/components/sections/how-it-works';
import Reviews from '@/components/sections/reviews';
import CTAMessengers from '@/components/sections/cta-messengers';
import TourGrid from '@/components/tours/tour-grid';
import { getPublishedTours } from '@/data/mock-tours';
import Link from 'next/link';

function pickShowcaseTours(all: ReturnType<typeof getPublishedTours>, limit: number) {
  const sorted = [...all].sort((a, b) => {
    const aDate = a.nextDates[0]?.start || '';
    const bDate = b.nextDates[0]?.start || '';
    return aDate.localeCompare(bDate);
  });
  const picked: typeof sorted = [];
  const usedDest = new Set<string>();
  for (const t of sorted) {
    if (picked.length >= limit) break;
    if (usedDest.has(t.destination)) continue;
    usedDest.add(t.destination);
    picked.push(t);
  }
  for (const t of sorted) {
    if (picked.length >= limit) break;
    if (!picked.some((p) => p.slug === t.slug)) picked.push(t);
  }
  return picked;
}

export default function HomePage() {
  const allTours = getPublishedTours();
  const upcomingTours = pickShowcaseTours(allTours, 6);

  return (
    <>
      <Hero />
      <PopularDestinations />

      <section className="py-20 lg:py-28 bg-gray-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Ближайшие поездки
              </h2>
              <p className="mt-3 text-lg text-gray-500 leading-relaxed">
                Актуальные даты и цены по разным направлениям — бронь через сайт или мессенджер
              </p>
            </div>
            <Link
              href="/tours"
              className="hidden sm:inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700 transition-colors"
            >
              Все поездки
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
          <TourGrid tours={upcomingTours} />
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 text-brand-600 font-semibold"
            >
              Смотреть все поездки
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <DepartureCities />
      <Advantages />
      <HowItWorks />
      <Reviews />
      <CTAMessengers />
    </>
  );
}
