/**
 * Analytics IDs and event helpers.
 *
 * Replace placeholder IDs with real ones before going live:
 *   YM_COUNTER_ID  → Яндекс.Метрика counter number
 *   GA_MEASUREMENT_ID → GA4 measurement ID (G-XXXXXXXXXX)
 */

export const YM_COUNTER_ID = 109118802;
export const GA_MEASUREMENT_ID = ''; // e.g. 'G-XXXXXXXXXX'

type EventName =
  | 'click_whatsapp'
  | 'click_telegram'
  | 'click_max'
  | 'click_call'
  | 'open_tour_lead_form'
  | 'submit_tour_lead_form'
  | 'click_booking_atoms';

export function trackEvent(name: EventName, params?: Record<string, string>) {
  try {
    if (typeof window === 'undefined') return;

    // Яндекс.Метрика
    if (YM_COUNTER_ID && typeof window.ym === 'function') {
      window.ym(YM_COUNTER_ID, 'reachGoal', name, params);
    }

    // GA4
    if (GA_MEASUREMENT_ID && typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  } catch {
    // analytics should never break the site
  }
}

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}
