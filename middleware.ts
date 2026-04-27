import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Перехватываем `startapp` параметр от MAX / Telegram мини-приложений.
// Документация MAX: https://dev.max.ru/docs/webapps/bridge — параметр
// приходит как `?startapp=...` в URL мини-приложения. Telegram кладёт его
// и в query (`tgWebAppStartParam`), и через `start_param` в SDK.
//
// Middleware срабатывает ДО SSR и кэша Next, поэтому корректно ловит параметр
// на любой странице (включая статически кэшированную главную) и сразу
// перенаправляет на /r — там уже резолвится id → slug тура.
//
// Используем относительный Location: за reverse-proxy (Docker → nginx)
// `request.nextUrl` иногда указывает на внутренний bind-host (0.0.0.0:3000).
// Относительный путь браузер раскроет относительно текущего origin.
// ---------------------------------------------------------------------------
export function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;

  if (pathname === '/r') return NextResponse.next();

  const startApp =
    searchParams.get('startapp') ||
    searchParams.get('startApp') ||
    searchParams.get('start_param') ||
    searchParams.get('tgWebAppStartParam');

  if (!startApp) return NextResponse.next();

  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: `/r?id=${encodeURIComponent(startApp)}`,
      'Cache-Control': 'no-store',
    },
  });
}

export const config = {
  matcher: [
    // Прогоняем middleware для всех html-страниц, кроме статических ассетов
    // и API. На /r тоже не идём (early-return выше).
    '/((?!api|_next/|.*\\..*).*)',
  ],
};
