'use client';

// ---------------------------------------------------------------------------
// Small client component for a single tour card inside the hero cluster.
//
// Why client:
//   We render real tour images pulled from external hosts (amra-turistik.ru,
//   bogema.ru, imcdn.bolshayastrana.com, rt.plus). If any URL fails at runtime
//   (CORS, 404, network), we hide <img> so the gradient fallback under it
//   keeps the composition clean — no broken image icon.
//   That soft guard needs useState + onError, which are client-only.
//
// Scope: only hero cards use this. The parent Hero component stays a server
// component and does tour selection / data shaping on the server.
//
// Composition notes (final polish pass):
//   - main card: 3 layers of text max (eyebrow, title, price). No floating
//     date chip, no badge chip — the photo carries the mood, text is just
//     anchor. Calmer, more premium.
//   - mini cards: photo-only + tiny destination label. They are "supporting
//     photography", not mini tour-cards competing with main for attention.
//   - no float animations — stillness reads as premium in this context.
// ---------------------------------------------------------------------------

import Link from 'next/link';
import { useState } from 'react';

interface HeroCardProps {
  href: string;
  image: string;
  eyebrow: string;
  title: string;
  priceFromFormatted: string;
  /** Short label rendered over mini photos (usually destination name). */
  miniLabel?: string;
  variant: 'main' | 'mini';
  priority?: boolean;
  className?: string;
}

export default function HeroCard({
  href,
  image,
  eyebrow,
  title,
  priceFromFormatted,
  miniLabel,
  variant,
  priority = false,
  className = '',
}: HeroCardProps) {
  const [broken, setBroken] = useState(false);

  if (variant === 'main') {
    return (
      <Link
        href={href}
        className={`group block absolute rounded-[28px] overflow-hidden shadow-elevated ring-1 ring-black/5 ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500 via-brand-700 to-brand-900" aria-hidden />

        {!broken && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            onError={() => setBroken(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        )}

        {/* Readability overlay — slimmer and focused on the bottom third only,
            so the photo stays as the hero, not a background for text. */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 via-black/20 to-transparent"
          aria-hidden
        />

        <div className="absolute bottom-6 left-6 right-6 text-white">
          <p className="text-[11px] font-semibold text-white/80 uppercase tracking-[0.14em]">
            {eyebrow}
          </p>
          <h3 className="mt-1.5 text-xl sm:text-2xl font-extrabold leading-tight line-clamp-2">
            {title}
          </h3>
          <p className="mt-2.5 text-sm text-white/85">
            <span className="text-white/65">от</span>{' '}
            <span className="font-extrabold tabular-nums text-white text-base">
              {priceFromFormatted}
            </span>
          </p>
        </div>
      </Link>
    );
  }

  // mini variant — supporting photo tile with a compact destination + price
  // line at the bottom. Stronger drop shadow + white ring so the tile visibly
  // "lifts" off the main card instead of reading as a flat layer on top of it.
  return (
    <Link
      href={href}
      className={`group block absolute rounded-2xl overflow-hidden shadow-elevated ring-1 ring-white/70 ${className}`}
    >
      <div className="relative aspect-[4/5] bg-gradient-to-br from-brand-200 via-brand-500 to-brand-800">
        {!broken && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
        )}
        {/* Bottom wash for label + price readability. */}
        <div
          className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
          aria-hidden
        />
        <div className="absolute bottom-3 left-3 right-3 text-white">
          {miniLabel && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/85">
              {miniLabel}
            </p>
          )}
          <p className="mt-0.5 text-[13px] font-bold leading-tight">
            <span className="text-white/70 font-medium">от </span>
            <span className="tabular-nums">{priceFromFormatted}</span>
          </p>
        </div>
      </div>
      <span className="sr-only">{title}</span>
    </Link>
  );
}
