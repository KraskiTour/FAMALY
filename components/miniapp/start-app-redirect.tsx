'use client';

import { useEffect } from 'react';

// ---------------------------------------------------------------------------
// Клиентский fallback на случай, когда параметр старта мини-приложения
// приходит НЕ через query-строку URL (которую ловит middleware), а через:
//   • URL hash: #startapp=43, #tgWebAppStartParam=43
//   • SDK MAX:  window.WebApp.initDataUnsafe.start_param
//   • SDK Telegram: window.Telegram.WebApp.initDataUnsafe.start_param
//
// Проверяет источники периодически в течение ~10 секунд (SDK мини-приложения
// иногда подгружается заметно позже React). При нахождении id делает
// мгновенный редирект через /r?id=... — там уже route handler знает
// карту id → slug.
// ---------------------------------------------------------------------------
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const DEBUG = true;

declare global {
  interface Window {
    WebApp?: {
      initDataUnsafe?: { start_param?: string };
    };
    Telegram?: {
      WebApp?: {
        initDataUnsafe?: { start_param?: string };
      };
    };
  }
}

function log(...args: unknown[]) {
  if (DEBUG && typeof console !== 'undefined') {
    console.log('[StartAppRedirect]', ...args);
  }
}

function readFromQuery(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return (
    params.get('startapp') ||
    params.get('startApp') ||
    params.get('start_param') ||
    params.get('tgWebAppStartParam')
  );
}

function readFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  return (
    params.get('startapp') ||
    params.get('startApp') ||
    params.get('start_param') ||
    params.get('tgWebAppStartParam')
  );
}

function readFromSdk(): string | null {
  if (typeof window === 'undefined') return null;
  const fromMax = window.WebApp?.initDataUnsafe?.start_param;
  const fromTg = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  return fromMax || fromTg || null;
}

function tryRedirect(reason: string): boolean {
  const fromQuery = readFromQuery();
  const fromHash = readFromHash();
  const fromSdk = readFromSdk();
  const candidate = (fromQuery || fromHash || fromSdk || '').trim();

  log('check', reason, {
    pathname: window.location.pathname,
    fromQuery,
    fromHash,
    fromSdk,
    hasMaxSdk: typeof window.WebApp !== 'undefined',
    hasTelegramSdk: typeof window.Telegram?.WebApp !== 'undefined',
  });

  if (!candidate) return false;
  if (!ID_PATTERN.test(candidate)) {
    log('rejected (bad pattern):', candidate);
    return false;
  }
  if (window.location.pathname === '/r') return false;

  log('redirecting to /r?id=' + candidate);
  window.location.replace(`/r?id=${encodeURIComponent(candidate)}`);
  return true;
}

export default function StartAppRedirect() {
  useEffect(() => {
    if (tryRedirect('mount')) return;

    let cancelled = false;
    const delays = [50, 200, 500, 1000, 2000, 4000, 7000, 10000];
    const timers: number[] = [];

    for (const delay of delays) {
      const id = window.setTimeout(() => {
        if (!cancelled) tryRedirect(`retry@${delay}ms`);
      }, delay);
      timers.push(id);
    }

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  return null;
}
