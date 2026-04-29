import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cities, getToursByCity, getDirectTourCountByCity, getDestinationChipsForCity, getCityBySlug } from '@/data/mock-tours';
import { CONTACTS } from '@/lib/config';
import CityToursSection from '@/components/tours/city-tours-section';
import BreadcrumbJsonLd from '@/components/seo/breadcrumb-jsonld';

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
  const count = getToursByCity(city.slug).length;
  const title = `Туры из ${city.nameGenitive} — ${count} маршрутов с датами и ценами`;
  const description = `${count} туров и поездок из ${city.nameGenitive}: семейные, взрослые и сборные маршруты в горы, на море, экскурсии и за рубеж. Бронь онлайн.`;
  return {
    title,
    description,
    alternates: { canonical: `/from/${city.slug}` },
    openGraph: { title, description },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);

  if (!city) {
    notFound();
  }

  const cityTours = getToursByCity(city.slug);
  const directCount = getDirectTourCountByCity(city.slug);
  const selfArrivalCount = cityTours.length - directCount;
  const destinationChips = getDestinationChipsForCity(city.slug);

  return (
    <div className="bg-gray-50 min-h-screen">
      <BreadcrumbJsonLd items={[
        { name: 'Главная', href: '/' },
        { name: `Туры из ${city.nameGenitive}` },
      ]} />
      <div className="bg-gradient-to-br from-brand-800 via-brand-900 to-stone-950 text-white py-14 lg:py-20 relative overflow-hidden">
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
              Куда можно поехать из этого города. Нажмите на направление, чтобы посмотреть маршруты.
            </p>
            <div className="flex flex-wrap gap-2">
              {destinationChips.map(({ name, slug, count }) => {
                const href =
                  slug != null
                    ? `/tours?city=${encodeURIComponent(city.slug)}&destination=${encodeURIComponent(slug)}`
                    : null;
                const className =
                  'inline-flex items-center gap-1.5 bg-white text-gray-700 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium';
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
            Наши поездки
            {directCount > 0 && (
              <span className="text-lg font-normal text-gray-400 ml-2">
                {directCount} с выездом{selfArrivalCount > 0 && ` + ещё ${selfArrivalCount}`}
              </span>
            )}
          </h2>
          <Link
            href="/tours"
            className="text-sm text-brand-600 font-semibold hover:text-brand-700 transition-colors"
          >
            Все поездки →
          </Link>
        </div>

        <CityToursSection
          tours={cityTours}
          emptyMessage={`Туры из ${city.nameGenitive} пока не добавлены. Скоро здесь появятся маршруты!`}
        />

        {cityTours.length > 0 && (
          <div className="mt-10 mb-2">
            <p className="text-sm font-semibold text-gray-700 mb-2">Подборки по направлениям</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Море', href: '/tours/sea' },
                { label: 'Горы', href: '/tours/mountains' },
                { label: 'Адыгея', href: '/tours/adygeya' },
                { label: 'Геленджик', href: '/tours/gelendzhik' },
                { label: 'Крым', href: '/tours/krym' },
                { label: 'Выходные', href: '/tours/weekend' },
                { label: 'За рубеж', href: '/tours/abroad' },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="text-sm bg-white text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-brand-200 hover:text-brand-600 transition-colors font-medium">{l.label}</Link>
              ))}
            </div>
          </div>
        )}

        {cityTours.length > 0 && (
          <div className="mt-12 bg-gradient-to-br from-brand-50 to-brand-100/40 rounded-2xl p-6 sm:p-8 border border-brand-100/50">
            <h3 className="text-lg font-bold text-gray-900">
              Нужна помощь с выбором из {city.nameGenitive}?
            </h3>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed max-w-2xl">
              Расскажите, когда хотите поехать, на сколько дней и кто едет — подберём 2–3 подходящих маршрута с ценами и датами.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <a
                href={CONTACTS.max.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-700 text-white px-6 py-3 rounded-xl text-sm font-bold hover:from-brand-700 hover:to-brand-800 transition-all shadow-sm"
              >
                Написать в MAX
              </a>
              <Link
                href={`/tours?city=${city.slug}`}
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl text-sm font-semibold border border-gray-200 hover:border-brand-200 hover:text-brand-600 transition-all"
              >
                Все поездки с фильтром
              </Link>
            </div>
            <p className="mt-3 text-xs text-gray-400">Живая команда — отвечаем быстро, помогаем подобрать маршрут под ваш запрос.</p>
          </div>
        )}
      </div>
    </div>
  );
}
