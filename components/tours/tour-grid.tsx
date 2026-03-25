import { Tour } from '@/lib/types';
import TourCard from './tour-card';

interface TourGridProps {
  tours: Tour[];
  emptyMessage?: string;
}

export default function TourGrid({ tours, emptyMessage = 'Туры не найдены' }: TourGridProps) {
  if (tours.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <p className="text-lg text-gray-500">{emptyMessage}</p>
        <p className="mt-2 text-sm text-gray-400">Попробуйте изменить параметры фильтра</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
      {tours.map((tour) => (
        <TourCard key={tour.id} tour={tour} />
      ))}
    </div>
  );
}
