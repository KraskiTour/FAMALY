'use client';

import { useEffect } from 'react';

// ---------------------------------------------------------------------------
// Клиентский fallback для случая, когда параметр старта мини-приложения
// приходит НЕ через query-строку URL (которую ловит middleware), а через:
//   • URL hash: #startapp=43, #tgWebAppStartParam=43
//   • SDK MAX:  window.WebApp.initDataUnsafe.start_param
//   • SDK Telegram: window.Telegram.WebApp.initDataUnsafe.start_param
//
// Логика:
//   1. На каждой странице слушаем источники (query, hash, SDK) ~10 секунд:
//      SDK мини-приложения часто инициализируется позже React.
//   2. Один и тот же id обрабатываем только один раз за сессию —
//      сохраняем в sessionStorage, иначе при возврате на тур-страницу
//      будет бесконечный цикл редиректов (SDK продолжает держать start_param).
//
// Включить отладочные логи можно из консоли:
//   localStorage.setItem('startAppRedirect:debug', '1')
// ---------------------------------------------------------------------------
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const SESSION_KEY = 'startAppRedirect:resolved';

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

function isDebug(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem('startAppRedirect:debug') === '1';
  } catch {
    return false;
  }
}

function log(...args: unknown[]) {
  if (isDebug()) console.log('[StartAppRedirect]', ...args);
}

function safeGet(fn: () => string | undefined | null): string | null {
  try {
    return fn() ?? null;
  } catch {
    return null;
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
  return (
    safeGet(() => window.WebApp?.initDataUnsafe?.start_param) ||
    safeGet(() => window.Telegram?.WebApp?.initDataUnsafe?.start_param)
  );
}

function alreadyResolved(id: string): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === id;
  } catch {
    return false;
  }
}

function markResolved(id: string) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, id);
  } catch {
    /* ignore */
  }
}

function tryRedirect(): boolean {
  const candidate = (readFromQuery() || readFromHash() || readFromSdk() || '').trim();

  if (!candidate || !ID_PATTERN.test(candidate)) return false;
  if (window.location.pathname === '/r') return false;
  if (alreadyResolved(candidate)) {
    log('skip (already resolved)', candidate);
    return false;
  }

  log('redirect to', `/r?id=${candidate}`);
  markResolved(candidate);
  window.location.replace(`/r?id=${encodeURIComponent(candidate)}`);
  return true;
}

export default function StartAppRedirect() {
  useEffect(() => {
    if (tryRedirect()) return;

    let cancelled = false;
    // SDK мини-приложения иногда инициализируется заметно позже React.
    const delays = [50, 200, 500, 1000, 2000, 4000, 7000];
    const timers: number[] = [];

    for (const delay of delays) {
      const id = window.setTimeout(() => {
        if (!cancelled) tryRedirect();
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
