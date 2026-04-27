import { NextRequest, NextResponse } from 'next/server';
import { getTourById } from '@/data/mock-tours';

// Резолвер диплинков: /r?id=43 → /tours/[slug]
// Используется и middleware (для query-параметра startapp от MAX/Telegram),
// и клиентским fallback'ом (когда параметр приходит через SDK мини-приложения,
// см. components/miniapp/start-app-redirect.tsx).
export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')?.trim();
  const base = request.nextUrl;

  if (!id) {
    return NextResponse.redirect(new URL('/tours', base));
  }

  const tour = getTourById(id);
  if (!tour) {
    const fallback = new URL('/tours', base);
    fallback.searchParams.set('notFoundId', id);
    return NextResponse.redirect(fallback);
  }

  return NextResponse.redirect(new URL(`/tours/${tour.slug}`, base));
}
