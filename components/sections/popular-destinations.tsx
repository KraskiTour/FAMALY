import Link from 'next/link';
import { destinations } from '@/data/mock-tours';

const curatedSlugs = [
  'krym',
  'gruziya',
  'dagestan',
  'saint-petersburg',
  'zolotoe-kolco',
  'kareliya',
  'belarus',
  'abrau-dyurso',
  'lago-naki',
  'arhyz',
  'kalmykiya',
  'kaliningrad',
];

const popularDestinations = curatedSlugs
  .map((slug) => destinations.find((d) => d.slug === slug))
  .filter(Boolean) as typeof destinations;

const destColors: Record<string, string> = {
  krym: 'from-sky-400 to-sky-700',
  gruziya: 'from-amber-600 to-rose-700',
  dagestan: 'from-amber-500 to-warm-600',
  'saint-petersburg': 'from-indigo-400 to-indigo-700',
  'zolotoe-kolco': 'from-yellow-500 to-amber-700',
  kareliya: 'from-teal-600 to-slate-800',
  belarus: 'from-emerald-500 to-emerald-800',
  'abrau-dyurso': 'from-brand-500 to-brand-700',
  'lago-naki': 'from-teal-500 to-brand-700',
  arhyz: 'from-teal-500 to-brand-700',
  kalmykiya: 'from-orange-400 to-rose-600',
  kaliningrad: 'from-slate-400 to-slate-700',
};

export default function PopularDestinations() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Популярные направления
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            От однодневных поездок рядом до многодневных маршрутов по всей России и за рубежом
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {popularDestinations.map((dest) => (
            <Link
              key={dest.slug}
              href={`/tours?destination=${dest.slug}`}
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] flex items-end hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${destColors[dest.slug] || 'from-gray-400 to-gray-600'}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="relative p-4 lg:p-5 w-full">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white group-hover:text-brand-200 transition-colors">
                  {dest.name}
                </h3>
                <p className="text-xs sm:text-sm text-white/70 mt-0.5">{dest.region}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
