import Link from 'next/link';
import { destinations, getPublishedTours } from '@/data/mock-tours';
import type { Tour } from '@/lib/types';
import DestinationCard from './destination-card';

const curatedSlugs = [
  'krym',
  'gruziya',
  'dagestan',
  'saint-petersburg',
  'zolotoe-kolco',
  'kareliya',
  'belarus',
  'abrau-dyurso',
  'lago-naki',
  'arhyz',
  'kalmykiya',
  'kaliningrad',
];

function matchesDestination(tour: Tour, destName: string): boolean {
  return tour.destination === destName || (tour.destinations?.includes(destName) ?? false);
}

function badgeScore(tour: Tour): number {
  let s = 0;
  if (tour.badges.includes('hit')) s += 3;
  if (tour.badges.includes('new')) s += 2;
  if (tour.badges.includes('hot')) s += 2;
  return s;
}

/**
 * Resolve a real hero image for a destination by borrowing the first gallery
 * photo from its strongest matching tour. Prefers hit/new/hot tours so the
 * card reflects the operator's flagship visual for that destination.
 *
 * Returns null when no matching tour has a valid external image — in that
 * case DestinationCard falls back to its designer motif layer.
 */
function resolveDestinationImage(destName: string, tours: Tour[]): string | null {
  const matches = tours.filter(
    (t) =>
      matchesDestination(t, destName) &&
      Boolean(t.gallery?.[0]) &&
      /^https?:\/\//i.test(t.gallery[0].trim()),
  );
  if (matches.length === 0) return null;
  const sorted = [...matches].sort((a, b) => badgeScore(b) - badgeScore(a));
  return sorted[0].gallery[0];
}

function countToursForDestination(destName: string, tours: Tour[]): number {
  return tours.filter((t) => matchesDestination(t, destName)).length;
}

export default function PopularDestinations() {
  const tours = getPublishedTours();

  const cards = curatedSlugs
    .map((slug) => {
      const dest = destinations.find((d) => d.slug === slug);
      if (!dest) return null;
      const realImage = resolveDestinationImage(dest.name, tours);
      // Override the (possibly empty) static destination image with a live
      // one pulled from real tour galleries — keeps the card looking like a
      // travel service, not a design concept.
      const enriched = realImage ? { ...dest, image: realImage } : dest;
      return { dest: enriched, count: countToursForDestination(dest.name, tours) };
    })
    .filter(Boolean) as { dest: typeof destinations[number]; count: number }[];

  return (
    <section className="section-y bg-white">
      <div className="container-page">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10 lg:mb-12">
          <div className="max-w-2xl">
            <span className="eyebrow">Направления</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Популярные направления
            </h2>
            <p className="mt-3 text-base sm:text-lg text-gray-500 leading-relaxed">
              От однодневных поездок рядом до многодневных маршрутов по всей России и за рубежом
            </p>
          </div>
          <Link
            href="/tours"
            className="hidden sm:inline-flex items-center gap-1.5 text-brand-700 font-semibold hover:text-brand-800 transition-colors text-sm shrink-0 border-b border-brand-200 hover:border-brand-500 pb-0.5"
          >
            Все направления
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {cards.map(({ dest, count }, i) => (
            <DestinationCard
              key={dest.slug}
              destination={dest}
              tourCount={count}
              featured={i < 2}
              priority={i === 0}
            />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/tours" className="inline-flex items-center gap-1.5 text-brand-700 font-semibold text-sm">
            Все направления
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
