import Link from 'next/link';
import { getCitiesByRegion, getDirectTourCountByCity, getToursByCity } from '@/data/mock-tours';
import { pluralTours } from '@/lib/utils';

export default function DepartureCities() {
  const regions = getCitiesByRegion();

  return (
    <section id="goroda-vyezda" className="section-y bg-stone-50/60 scroll-mt-24">
      <div className="container-page">
        <div className="text-center mb-12 lg:mb-14">
          <span className="eyebrow eyebrow--center">Города выезда</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Откуда удобно отправиться
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Выберите город, из которого вам удобно отправиться в поездку
          </p>
        </div>

        <div className="space-y-10 lg:space-y-12">
          {regions.map(({ region, cities }) => (
            <div key={region}>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500 mb-4 flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {region}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                {cities.map((city) => {
                  const directCount = getDirectTourCountByCity(city.slug);
                  const totalCount = getToursByCity(city.slug).length;
                  const selfArrivalCount = totalCount - directCount;
                  return (
                    <Link
                      key={city.slug}
                      href={`/from/${city.slug}`}
                      className="group flex items-center justify-between bg-white rounded-2xl px-5 py-4 border border-gray-200/70 hover:border-brand-300 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="min-w-0">
                        <span className="text-base font-semibold text-gray-900 group-hover:text-brand-700 transition-colors block truncate">
                          {city.name}
                        </span>
                        {directCount > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {pluralTours(directCount)} с выездом
                            {selfArrivalCount > 0 && (
                              <span className="text-gray-300"> + ещё {selfArrivalCount}</span>
                            )}
                          </p>
                        )}
                      </div>
                      <svg
                        className="w-4 h-4 text-gray-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all flex-shrink-0 ml-3"
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
