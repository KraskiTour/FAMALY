'use client';

import { useEffect } from 'react';

// ---------------------------------------------------------------------------
// Клиентский fallback для случая, когда параметр старта мини-приложения
// приходит НЕ через query-строку URL (которую ловит middleware), а через:
//   • URL hash: #startapp=43, #tgWebAppStartParam=43
//   • SDK MAX: window.WebApp.initDataUnsafe.start_param
//   • SDK Telegram: window.Telegram.WebApp.initDataUnsafe.start_param
//
// Запускается на каждой странице (через layout) и при обнаружении id
// делает мгновенный редирект через /r?id=..., где route handler знает
// карту id → slug.
// ---------------------------------------------------------------------------
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

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
    window.WebApp?.initDataUnsafe?.start_param ||
    window.Telegram?.WebApp?.initDataUnsafe?.start_param ||
    null
  );
}

function tryRedirect(): boolean {
  const candidate = (readFromHash() || readFromSdk() || '').trim();
  if (!candidate || !ID_PATTERN.test(candidate)) return false;

  // Если уже на /r, ничего не делаем — там работает route handler.
  if (window.location.pathname === '/r') return false;

  window.location.replace(`/r?id=${encodeURIComponent(candidate)}`);
  return true;
}

export default function StartAppRedirect() {
  useEffect(() => {
    if (tryRedirect()) return;

    // SDK мини-приложения может загрузиться чуть позже, чем React.
    // Делаем несколько попыток в течение ~3 секунд.
    let cancelled = false;
    const delays = [50, 200, 500, 1000, 2000];
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
