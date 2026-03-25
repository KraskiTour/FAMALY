import Link from 'next/link';
import { getCitiesByRegion, getToursByCity } from '@/data/mock-tours';
import { pluralTours } from '@/lib/utils';

export default function DepartureCities() {
  const regions = getCitiesByRegion();

  return (
    <section id="goroda-vyezda" className="py-20 lg:py-28 bg-stone-50/60 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Города выезда
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Выберите город, из которого вам удобно отправиться в поездку
          </p>
        </div>

        <div className="space-y-10">
          {regions.map(({ region, cities }) => (
            <div key={region}>
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {region}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                {cities.map((city) => {
                  const tourCount = getToursByCity(city.slug).length;
                  return (
                    <Link
                      key={city.slug}
                      href={`/from/${city.slug}`}
                      className="group flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-100/60 hover:border-brand-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div>
                        <span className="text-base font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                          {city.name}
                        </span>
                        {tourCount > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">{pluralTours(tourCount)}</p>
                        )}
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
