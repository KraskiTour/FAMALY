import Link from 'next/link';
import { destinations } from '@/data/mock-tours';

const popularDestinations = destinations.slice(0, 8);

const destColors: Record<string, string> = {
  arhyz: 'from-teal-500 to-brand-700',
  dombay: 'from-sky-500 to-blue-700',
  prielbrusie: 'from-slate-400 to-slate-700',
  dagestan: 'from-amber-500 to-warm-600',
  chechnya: 'from-brand-600 to-brand-800',
  krym: 'from-sky-400 to-sky-700',
  abhazia: 'from-teal-500 to-teal-800',
  'lago-naki': 'from-brand-500 to-brand-700',
  belarus: 'from-emerald-500 to-teal-800',
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
            Выбирайте поездки на выходные, семейные путешествия и многодневные маршруты по самым востребованным направлениям
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
