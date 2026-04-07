import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import TourFilters from '@/components/tours/tour-filters';
import { getPublishedTours } from '@/data/mock-tours';

interface ToursPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: ToursPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const hasQuery = Object.keys(sp).length > 0;
  return {
    title: 'Все поездки и туры по России — направления и даты',
    description:
      'Каталог поездок KRASKI.TRAVEL: семейные и взрослые туры по России. Автобус, поезд и комбинированные форматы. Фильтры по городу выезда и направлению.',
    alternates: { canonical: '/tours' },
    ...(hasQuery && { robots: { index: false, follow: true } }),
  };
}

const CATALOG_LINKS = [
  { label: 'Крым', href: '/tours/krym' },
  { label: 'Петербург', href: '/tours/saint-petersburg' },
  { label: 'Беларусь', href: '/tours/belarus' },
  { label: 'Адыгея', href: '/tours/adygeya' },
  { label: 'Семейные', href: '/tours/family' },
  { label: 'Выходные', href: '/tours/weekend' },
  { label: 'За рубеж', href: '/tours/abroad' },
];

export default function ToursPage() {
  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Все поездки
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-3xl leading-relaxed">
            Горы, море, города и природа — для семей, взрослых и небольших компаний.
            Подберите маршрут фильтрами или напишите нам — поможем выбрать.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATALOG_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm bg-white text-gray-700 border border-gray-200 px-3.5 py-1.5 rounded-lg hover:border-brand-200 hover:text-brand-600 transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <Suspense fallback={<p className="text-gray-500 text-sm py-8">Загрузка каталога…</p>}>
          <TourFilters tours={getPublishedTours()} />
        </Suspense>
      </div>
    </div>
  );
}
