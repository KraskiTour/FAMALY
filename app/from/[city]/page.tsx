import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cities, getToursByCity, getDestinationChipsForCity, getCityBySlug } from '@/data/mock-tours';
import TourGrid from '@/components/tours/tour-grid';

interface CityPageProps {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return cities.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return {};
  return {
    title: `Туры и поездки из ${city.nameGenitive} — направления и даты`,
    description: `Туры и поездки из ${city.nameGenitive} — семейные, взрослые и сборные маршруты в горы, на море и экскурсии. ${city.region}.`,
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    notFound();
  }

  const cityTours = getToursByCity(city.slug);
  const destinationChips = getDestinationChipsForCity(city.slug);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-br from-brand-800 via-brand-900 to-stone-950 text-white py-12 lg:py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="brand-blob brand-blob-teal w-[400px] h-[350px] -top-10 -right-10 opacity-70" />
          <div className="brand-blob brand-blob-warm w-[300px] h-[250px] bottom-0 left-20 opacity-50" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-brand-300 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Главная</Link>
            <span>/</span>
            <span className="text-white">Туры из {city.nameGenitive}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Туры и поездки из {city.nameGenitive}
          </h1>
          <p className="mt-3 text-sm text-brand-300/80">{city.region}</p>
          <p className="mt-3 text-lg text-brand-200/80 max-w-3xl leading-relaxed">
            {city.description}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {destinationChips.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Направления из {city.nameGenitive}
            </h2>
            <p className="text-sm text-gray-500 mb-4 max-w-3xl">
              Куда можно поехать из этого города по нашим турам. Цифра в скобках — сколько поездок в каталоге. Нажмите плашку, чтобы открыть общий список с уже выставленными фильтрами.
            </p>
            <div className="flex flex-wrap gap-2">
              {destinationChips.map(({ name, slug, count }) => {
                const href =
                  slug != null
                    ? `/tours?city=${encodeURIComponent(city.slug)}&destination=${encodeURIComponent(slug)}`
                    : null;
                const className =
                  'inline-flex items-center gap-1.5 bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium';
                const inner = (
                  <>
                    {name}
                    <span className="text-xs font-normal text-gray-400 tabular-nums">({count})</span>
                  </>
                );
                return href ? (
                  <Link key={name} href={href} className={`${className} hover:border-brand-300 hover:text-brand-700 transition-colors`}>
                    {inner}
                  </Link>
                ) : (
                  <span key={name} className={className}>
                    {inner}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {cityTours.length > 0 ? `Наши поездки (${cityTours.length})` : 'Поездки'}
          </h2>
          <Link
            href="/tours"
            className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors"
          >
            Все поездки →
          </Link>
        </div>

        <TourGrid
          tours={cityTours}
          emptyMessage={`Туры из ${city.nameGenitive} пока не добавлены. Скоро здесь появятся маршруты!`}
        />
      </div>
    </div>
  );
}
