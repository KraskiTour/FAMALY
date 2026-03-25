import type { Metadata } from 'next';
import { Suspense } from 'react';
import TourFilters from '@/components/tours/tour-filters';
import { getPublishedTours } from '@/data/mock-tours';

export const metadata: Metadata = {
  title: 'Все поездки и туры по России — направления и даты',
  description:
    'Каталог поездок KRASKI.TRAVEL: семейные и взрослые туры по России. Автобус, поезд и комбинированные форматы. Фильтры по городу выезда и направлению.',
};

export default function ToursPage() {
  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Все поездки
          </h1>
          <p className="mt-3 text-lg text-gray-500 max-w-3xl leading-relaxed">
            Здесь собраны поездки и туры для семей, взрослых и небольших компаний — горы, море, города и природа.
            Подберите маршрут фильтрами и напишите нам для брони.
          </p>
        </div>

        <Suspense fallback={<p className="text-gray-500 text-sm py-8">Загрузка каталога…</p>}>
          <TourFilters tours={getPublishedTours()} />
        </Suspense>
      </div>
    </div>
  );
}
