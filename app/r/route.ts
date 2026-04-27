import { NextRequest, NextResponse } from 'next/server';
import { getTourById } from '@/data/mock-tours';

// Резолвер диплинков: /r?id=43 → /tours/[slug]
// Используется и middleware (для query-параметра startapp от MAX/Telegram),
// и клиентским fallback'ом (когда параметр приходит через SDK мини-приложения,
// см. components/miniapp/start-app-redirect.tsx).
//
// Используем относительный Location — за reverse-proxy `request.nextUrl`
// может указывать на внутренний docker-host (0.0.0.0:3000); относительный
// путь браузер раскроет от текущего origin (kraski.travel).
export const dynamic = 'force-dynamic';

function relativeRedirect(path: string) {
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: path,
      'Cache-Control': 'no-store',
    },
  });
}

export function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')?.trim();

  if (!id) {
    return relativeRedirect('/tours');
  }

  const tour = getTourById(id);
  if (!tour) {
    return relativeRedirect(`/tours?notFoundId=${encodeURIComponent(id)}`);
  }

  return relativeRedirect(`/tours/${tour.slug}`);
}
