'use client';

// ---------------------------------------------------------------------------
// Mobile-only sticky CTA bar for a tour page.
//
// Why client:
//   - uses window.scrollY / IntersectionObserver to show itself only after the
//     user has scrolled past the first screen (we don't want it covering the
//     hero-gallery)
//   - emits trackEvent() on tap
//
// Why separate from TourSidebar:
//   Desktop already has a sticky right-column sidebar with price + CTA. On
//   mobile the sidebar lives at the bottom of the page — classic conversion
//   killer on long tour pages. This bar fills that gap without duplicating
//   the sidebar's form state.
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';
import type { Tour } from '@/lib/types';
import { CONTACTS } from '@/lib/config';
import { formatPrice } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { getMaxMiniAppUrl } from '@/lib/miniapp-links';

interface TourStickyCtaProps {
  tour: Tour;
}

export default function TourStickyCta({ tour }: TourStickyCtaProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show the bar only after the user scrolls past ~1 viewport height.
    // That keeps the hero clean on first impression and brings the CTA
    // exactly when the user starts exploring the page.
    const onScroll = () => {
      const threshold = Math.max(window.innerHeight * 0.6, 420);
      setVisible(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const maxHref = getMaxMiniAppUrl(tour.id);

  const hasNearestDates = tour.nextDates.length > 0;
  const canBookOnline = Boolean(tour.atomsTourId) && hasNearestDates && !tour.onRequestOnly;
  const primaryHref = canBookOnline
    ? `/booking?tour=${tour.atomsTourId}`
    : maxHref;
  const primaryLabel = canBookOnline ? 'Забронировать' : (hasNearestDates ? 'Написать' : 'Уточнить');
  const primaryExternal = !canBookOnline;

  const handlePrimary = () => {
    if (canBookOnline) {
      trackEvent('click_booking_atoms', { tour: tour.slug, atomsTourId: tour.atomsTourId!, source: 'mobile_sticky' });
    } else {
      trackEvent('click_max', { tour: tour.slug, source: 'mobile_sticky' });
    }
  };

  return (
    <div
      className={`lg:hidden fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-hidden={!visible}
    >
      <div className="mx-auto max-w-3xl px-3 pb-3 pt-2">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-elevated p-2.5 flex items-center gap-2.5">
          <div className="flex-1 min-w-0 pl-1.5">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">От</p>
            <p className="text-lg font-extrabold text-gray-900 tracking-tight truncate">
              {formatPrice(tour.priceFrom)}
              <span className="text-xs font-medium text-gray-400 ml-1">/чел</span>
            </p>
          </div>

          <a
            href={CONTACTS.max.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('click_max', { tour: tour.slug, source: 'mobile_sticky_max' })}
            aria-label="Написать в MAX"
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors shrink-0"
          >
            MAX
          </a>

          <a
            href={primaryHref}
            {...(primaryExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            onClick={handlePrimary}
            className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-button shrink-0"
          >
            {primaryLabel}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.4} stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
