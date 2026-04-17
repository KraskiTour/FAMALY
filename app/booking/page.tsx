'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ATOMS_TRAVEL } from '@/lib/config';

function BookingWidget() {
  const searchParams = useSearchParams();
  const tourId = searchParams.get('tour');
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tourId) return;

    const script = document.createElement('script');
    script.src = ATOMS_TRAVEL.scriptUrl;
    script.async = true;

    script.onload = () => {
      try {
        const w = window as any;
        if (typeof w.getAtomSBookingScript === 'function') {
          w.getAtomSBookingScript(() => {
            const atomBooking = new w.atomSBooking();
            atomBooking.initialize('atoms-booking', {
              host: ATOMS_TRAVEL.host,
              locale: 'ru',
              apiVersion: 'v2',
              apiKey: ATOMS_TRAVEL.apiKey,
              tourSlug: tourId,
            }, null, null);
            atomBooking.display();
            setLoading(false);
          });
        } else {
          setError(true);
          setLoading(false);
        }
      } catch {
        setError(true);
        setLoading(false);
      }
    };

    script.onerror = () => {
      setError(true);
      setLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [tourId]);

  if (!tourId) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Тур не выбран</h1>
        <p className="text-gray-500 mb-6">Перейдите на страницу тура и нажмите «Забронировать»</p>
        <Link
          href="/tours"
          className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
        >
          Смотреть все туры
        </Link>
      </div>
    );
  }

  return (
    <div>
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Загрузка формы бронирования...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-16">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Не удалось загрузить форму</h2>
          <p className="text-gray-500 mb-6">Попробуйте обновить страницу или свяжитесь с нами</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors"
          >
            Обновить
          </button>
        </div>
      )}

      <div ref={containerRef} id="atoms-booking" />

      <style jsx global>{`
        div#atoms-booking a { color: #03b2cb; }
        div#atoms-booking a.btn { color: #000; }
        div#atoms-booking a.btn-green { color: #fff; }
        .DayPicker_weekHeader_ul { padding-left: 0px !important; }

        [atomsbookingconstructor].constructor,
        [atomsorder].order {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-size: 16px !important;
        }
        [atomsbookingconstructor].constructor .card,
        [atomsorder].order .card {
          box-shadow: 0 2px 8px 0 rgba(0, 0, 0, .1) !important;
          border-radius: 16px !important;
        }
        [atomsbookingconstructor].constructor .container,
        [atomsorder].order .container {
          padding-right: 0px !important;
          padding-left: 0px !important;
        }
        [atomsbookingconstructor].constructor .block,
        [atomsorder].order .block {
          padding: 30px 40px !important;
        }
        [atomsbookingconstructor].constructor .block .header,
        [atomsorder].order .block .header {
          font-size: 20px !important;
          margin-bottom: 16px !important;
        }
        [atomsbookingconstructor].constructor .btn-link,
        [atomsorder].order .btn-link,
        [atomsbookingconstructor].constructor a,
        [atomsorder].order a {
          font-size: 15px !important;
          text-decoration: none !important;
        }
        [atomsbookingconstructor].constructor .btn-default,
        [atomsorder].order .btn-default,
        [atomsbookingconstructor].constructor .btn-green.btn-lg {
          color: #fff !important;
          border: 1px solid transparent !important;
          padding: 0 32px !important;
          font-size: 16px !important;
          line-height: 46px !important;
          font-weight: 600 !important;
          border-radius: 12px !important;
          background-color: var(--color-brand-600, #007cf0) !important;
        }
        [atomsbookingconstructor].constructor .btn-default:hover,
        [atomsorder].order .btn-default:hover {
          background-color: var(--color-brand-700, #006ad0) !important;
        }
        .CalendarDay__selected,
        .CalendarDay__selected:active,
        .CalendarDay__selected:hover {
          color: #fff;
          background: var(--color-brand-600, #007cf0) !important;
          border-color: var(--color-brand-600, #007cf0) !important;
        }
        @media (min-width: 768px) {
          #atoms-booking .col-sm-5 {
            position: sticky;
            top: 40px;
          }
        }
        @media (max-width: 600px) {
          [atomsbookingconstructor].constructor .block,
          [atomsorder].order .block {
            padding: 20px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function BookingPage() {
  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-brand-600 transition-colors">Главная</Link>
          <span className="text-gray-300">/</span>
          <Link href="/tours" className="hover:text-brand-600 transition-colors">Все поездки</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-medium">Бронирование</span>
        </nav>

        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8">Бронирование тура</h1>

        <Suspense fallback={
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        }>
          <BookingWidget />
        </Suspense>
      </div>
    </div>
  );
}
