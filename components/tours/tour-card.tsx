import Link from 'next/link';
import Image from 'next/image';
import { Tour, BADGE_LABELS, BADGE_COLORS } from '@/lib/types';
import { formatPrice, pluralDays, formatDate } from '@/lib/utils';

interface TourCardProps {
  tour: Tour;
}

export default function TourCard({ tour }: TourCardProps) {
  const nextDate = tour.nextDates[0];

  return (
    <Link
      href={`/tours/${tour.slug}`}
      className="group bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col border border-gray-100/60"
    >
      <div className="relative aspect-[16/10] bg-gradient-to-br from-brand-50 via-teal-50 to-sky-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent z-10" />
        {tour.gallery[0] && (tour.gallery[0].startsWith('/images/') || tour.gallery[0].startsWith('http')) ? (
          <Image src={tour.gallery[0]} alt={tour.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-brand-200/80" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
            </svg>
          </div>
        )}

        {tour.badges.length > 0 && (
          <div className="absolute top-3 left-3 z-20 flex gap-1.5 flex-wrap">
            {tour.badges.slice(0, 3).map((badge) => (
              <span
                key={badge}
                className={`${BADGE_COLORS[badge]} text-white text-[11px] font-semibold px-2.5 py-1 rounded-full`}
              >
                {BADGE_LABELS[badge]}
              </span>
            ))}
          </div>
        )}

        {nextDate && nextDate.seatsLeft <= 5 && (
          <div className="absolute bottom-3 right-3 z-20 bg-rose-500/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
            Осталось {nextDate.seatsLeft} мест
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
          <span className="text-brand-600 font-semibold">{tour.destination}</span>
          <span className="text-gray-200">·</span>
          <span>{pluralDays(tour.durationDays)}</span>
        </div>

        <h3 className="text-[17px] font-bold text-gray-900 group-hover:text-brand-700 transition-colors leading-snug line-clamp-2">
          {tour.title}
        </h3>

        <p className="mt-2 text-[13px] text-gray-500 line-clamp-2 leading-relaxed">
          {tour.shortDescription}
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className="truncate">
            {tour.departureCities.length === 0
              ? 'Самостоятельный приезд · любой город'
              : tour.departureCities.map((c) => c.city).join(', ')}
          </span>
        </div>

        <div className="mt-auto pt-4 mt-4 border-t border-gray-100/80 flex items-end justify-between">
          <div>
            {tour.oldPrice && (
              <span className="text-[11px] text-gray-400 line-through block mb-0.5">
                {formatPrice(tour.oldPrice)}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-[11px] font-medium text-gray-400">от</span>
              <span className="text-xl font-extrabold text-gray-900">
                {formatPrice(tour.priceFrom)}
              </span>
            </div>
          </div>
          {nextDate && (
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                {formatDate(nextDate.start)}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
