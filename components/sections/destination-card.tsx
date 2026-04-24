// Client component — deliberately scoped to the destination card.
//
// Why client:
//   We want a soft runtime guard: if destination.image resolves to a URL
//   that fails to load (CORS, 404, network), we hide <img> so the designer
//   fallback layer beneath stays clean (no broken-image-icon).
//   That guard needs useState + an onError handler, which are client-only.
//
// Scope: only this card is client. The parent `popular-destinations.tsx`
// remains a server component and does the tour-count aggregation on the server.
'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Destination } from '@/lib/types';

type Motif = 'sea' | 'mountain' | 'city' | 'plain' | 'forest';

const TONES: Record<string, { bg: string; motif: Motif }> = {
  krym: { bg: 'from-sky-300 via-sky-600 to-indigo-900', motif: 'sea' },
  gruziya: { bg: 'from-amber-400 via-orange-600 to-rose-900', motif: 'mountain' },
  dagestan: { bg: 'from-amber-300 via-warm-500 to-warm-700', motif: 'mountain' },
  'saint-petersburg': { bg: 'from-indigo-300 via-indigo-700 to-slate-900', motif: 'city' },
  'zolotoe-kolco': { bg: 'from-yellow-300 via-amber-600 to-amber-900', motif: 'city' },
  kareliya: { bg: 'from-teal-400 via-teal-700 to-slate-900', motif: 'forest' },
  belarus: { bg: 'from-emerald-300 via-emerald-600 to-emerald-900', motif: 'forest' },
  'abrau-dyurso': { bg: 'from-brand-300 via-brand-600 to-brand-900', motif: 'sea' },
  'lago-naki': { bg: 'from-teal-300 via-brand-600 to-brand-900', motif: 'mountain' },
  arhyz: { bg: 'from-teal-300 via-brand-600 to-brand-900', motif: 'mountain' },
  kalmykiya: { bg: 'from-orange-300 via-rose-500 to-rose-800', motif: 'plain' },
  kaliningrad: { bg: 'from-slate-300 via-slate-600 to-slate-900', motif: 'city' },
};

const DEFAULT_TONE = { bg: 'from-brand-300 via-brand-600 to-brand-900', motif: 'mountain' as Motif };

/**
 * Resolves destination.image value to a renderable src or null.
 * - Empty / null / undefined / whitespace → null (fallback branch)
 * - http(s)://... → external URL (returned as-is)
 * - //host/... → protocol-relative, coerced to https:
 * - /path → local public asset
 * - data: / blob: URIs → returned as-is
 * - anything else → null (treat as missing)
 *
 * Does NOT check whether the target actually exists. Runtime failures
 * are handled softly by hiding the img (see onError in the component).
 */
function resolveImageSource(image: string | null | undefined): string | null {
  if (!image) return null;
  const trimmed = image.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return trimmed;
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  return null;
}

function MotifSvg({ motif }: { motif: Motif }) {
  switch (motif) {
    case 'sea':
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <circle cx="310" cy="120" r="52" fill="#fff" fillOpacity="0.18" />
          <path d="M0 340 Q100 310 200 330 T400 320 L400 500 L0 500 Z" fill="#fff" fillOpacity="0.1" />
          <path d="M0 380 Q120 350 240 370 T400 360 L400 500 L0 500 Z" fill="#fff" fillOpacity="0.14" />
          <path d="M0 420 Q140 400 280 420 T400 410 L400 500 L0 500 Z" fill="#000" fillOpacity="0.15" />
          <path d="M30 300 L60 280 L90 300 Z" fill="#fff" fillOpacity="0.08" />
          <path d="M320 290 L350 268 L380 290 Z" fill="#fff" fillOpacity="0.06" />
        </svg>
      );
    case 'mountain':
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <circle cx="310" cy="110" r="46" fill="#fff" fillOpacity="0.2" />
          <path d="M0 400 L70 300 L140 370 L220 220 L300 340 L360 280 L400 320 L400 500 L0 500 Z" fill="#000" fillOpacity="0.22" />
          <path d="M0 440 L60 360 L150 420 L240 300 L320 400 L400 360 L400 500 L0 500 Z" fill="#000" fillOpacity="0.32" />
          <path d="M170 250 L200 210 L230 250 L215 250 L225 280 L180 280 L190 250 Z" fill="#fff" fillOpacity="0.6" />
        </svg>
      );
    case 'city':
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <circle cx="80" cy="100" r="38" fill="#fff" fillOpacity="0.18" />
          <path d="M40 400 L40 280 L70 280 L70 260 L100 260 L100 400 Z" fill="#fff" fillOpacity="0.22" />
          <path d="M110 400 L110 240 L150 240 L150 220 L180 220 L180 240 L210 240 L210 400 Z" fill="#fff" fillOpacity="0.2" />
          <path d="M225 400 L225 300 L290 300 L290 400 Z" fill="#fff" fillOpacity="0.24" />
          <circle cx="258" cy="280" r="12" fill="#fde68a" fillOpacity="0.85" />
          <path d="M258 268 L255 240 L261 240 Z" fill="#fde68a" fillOpacity="0.85" />
          <path d="M305 400 L305 320 L345 320 L345 310 L360 310 L360 400 Z" fill="#fff" fillOpacity="0.18" />
          <path d="M0 400 L400 400 L400 500 L0 500 Z" fill="#000" fillOpacity="0.28" />
        </svg>
      );
    case 'forest':
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <path d="M60 420 L60 340 L40 340 L70 280 L50 280 L80 220 L110 280 L90 280 L120 340 L100 340 L100 420 Z" fill="#fff" fillOpacity="0.18" />
          <path d="M160 430 L160 330 L135 330 L170 260 L148 260 L180 190 L212 260 L190 260 L225 330 L200 330 L200 430 Z" fill="#fff" fillOpacity="0.22" />
          <path d="M270 420 L270 340 L250 340 L280 280 L260 280 L290 220 L320 280 L300 280 L330 340 L310 340 L310 420 Z" fill="#fff" fillOpacity="0.16" />
          <path d="M0 410 L400 410 L400 500 L0 500 Z" fill="#000" fillOpacity="0.3" />
        </svg>
      );
    case 'plain':
    default:
      return (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <circle cx="300" cy="110" r="54" fill="#fff" fillOpacity="0.22" />
          <path d="M0 380 Q100 360 200 375 T400 370 L400 500 L0 500 Z" fill="#000" fillOpacity="0.2" />
          <path d="M0 430 Q150 410 300 430 T400 425 L400 500 L0 500 Z" fill="#000" fillOpacity="0.3" />
        </svg>
      );
  }
}

function pluralTrips(n: number): string {
  const mod100 = n % 100;
  const mod10 = n % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${n} поездок`;
  if (mod10 === 1) return `${n} поездка`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} поездки`;
  return `${n} поездок`;
}

interface Props {
  destination: Destination;
  tourCount: number;
  featured?: boolean;
  /**
   * If true, this card's image (when present) loads eagerly with high priority.
   * Use only for the first above-the-fold featured card. Default: false.
   */
  priority?: boolean;
}

export default function DestinationCard({ destination, tourCount, featured = false, priority = false }: Props) {
  const tone = TONES[destination.slug] ?? DEFAULT_TONE;
  const imageSrc = resolveImageSource(destination.image);

  // Soft guard: if <img> fails at runtime (broken URL / network / CORS),
  // hide it so the designer fallback (always rendered beneath) stays clean.
  // This is NOT a path-existence check — resolveImageSource is still the
  // single source of truth for "should we try to render an image at all".
  const [imgBroken, setImgBroken] = useState(false);
  const showImg = Boolean(imageSrc) && !imgBroken;

  return (
    <Link
      href={`/tours?destination=${destination.slug}`}
      className="group relative rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/60 hover:border-brand-200 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex aspect-[3/4]"
    >
      {/* --- Designer fallback layer (always rendered; overlaid by <img> if present) --- */}
      <div className={`absolute inset-0 bg-gradient-to-br ${tone.bg}`} aria-hidden />
      <MotifSvg motif={tone.motif} />
      <svg className="absolute inset-0 w-full h-full opacity-[0.08] mix-blend-overlay pointer-events-none" aria-hidden>
        <filter id={`noise-${destination.slug}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.9 0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#noise-${destination.slug})`} />
      </svg>

      {/* --- Real image, only when a source is resolvable AND not broken at runtime --- */}
      {showImg && imageSrc && (
        // Plain <img> (not next/image): image can be any external URL, and this
        // block has 12 cards above the fold — perf trade-off is acceptable.
        // onError hides img only; the fallback beneath remains as the safety net.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={destination.name}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          onError={() => setImgBroken(true)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
      )}

      {/* --- Readability overlay --- */}
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/75 via-black/30 to-transparent pointer-events-none"
        aria-hidden
      />

      {/* --- Top chips: region + trip count --- */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
        <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/25 text-white text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1 rounded-full">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          {destination.region}
        </span>
        {tourCount > 0 && (
          <span
            className={`inline-flex items-center gap-1 bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-card shrink-0 ${
              featured ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
            }`}
          >
            {pluralTrips(tourCount)}
          </span>
        )}
      </div>

      {/* --- Bottom content --- */}
      <div className="relative mt-auto p-4 lg:p-5 w-full z-10">
        <h3
          className={`font-extrabold text-white leading-[1.15] tracking-tight ${
            featured ? 'text-xl sm:text-2xl lg:text-[1.65rem]' : 'text-base sm:text-lg'
          }`}
        >
          {destination.name}
        </h3>
        <p
          className={`text-white/75 mt-1 ${
            featured ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs'
          }`}
        >
          {destination.region}
        </p>

        <p
          className={`text-white/85 leading-snug line-clamp-2 ${
            featured
              ? 'mt-3 text-sm opacity-100 max-h-24'
              : 'mt-0 text-xs opacity-0 max-h-0 group-hover:mt-2 group-hover:opacity-100 group-hover:max-h-16 transition-all duration-300 overflow-hidden'
          }`}
        >
          {destination.description}
        </p>

        <div
          className={`mt-3 inline-flex items-center gap-1.5 text-white text-xs font-semibold ${
            featured ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
          }`}
        >
          Смотреть поездки
          <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </div>

      {/* --- Brand accent line on hover --- */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-400 via-brand-500 to-warm-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none"
        aria-hidden
      />
    </Link>
  );
}
