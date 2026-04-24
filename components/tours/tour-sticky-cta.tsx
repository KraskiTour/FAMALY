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

  const whatsappHref = `${CONTACTS.whatsapp.url}?text=${encodeURIComponent(
    `Здравствуйте! Интересует тур «${tour.title}».`,
  )}`;

  const primaryHref = tour.atomsTourId
    ? `/booking?tour=${tour.atomsTourId}`
    : whatsappHref;
  const primaryLabel = tour.atomsTourId ? 'Забронировать' : 'Написать';
  const primaryExternal = !tour.atomsTourId;

  const handlePrimary = () => {
    if (tour.atomsTourId) {
      trackEvent('click_booking_atoms', { tour: tour.slug, atomsTourId: tour.atomsTourId!, source: 'mobile_sticky' });
    } else {
      trackEvent('click_whatsapp', { tour: tour.slug, source: 'mobile_sticky' });
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
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('click_whatsapp', { tour: tour.slug, source: 'mobile_sticky_wa' })}
            aria-label="Написать в WhatsApp"
            className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
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
