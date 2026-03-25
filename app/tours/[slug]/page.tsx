import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { reviews, getPublishedTours, getTourBySlug, getFaqsForTour } from '@/data/mock-tours';
import { BADGE_LABELS, BADGE_COLORS } from '@/lib/types';
import { formatPrice, pluralDays } from '@/lib/utils';
import TourGallery from '@/components/tours/tour-gallery';
import TourItinerary from '@/components/tours/tour-itinerary';
import TourIncludes from '@/components/tours/tour-includes';
import TourSidebar from '@/components/tours/tour-sidebar';

interface TourPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getPublishedTours().map((tour) => ({ slug: tour.slug }));
}

export async function generateMetadata({ params }: TourPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tour = getTourBySlug(slug);
  if (!tour) return {};
  return {
    title: tour.seoTitle,
    description: tour.seoDescription,
  };
}

export default async function TourPage({ params }: TourPageProps) {
  const { slug } = await params;
  const tour = getTourBySlug(slug);

  if (!tour) {
    notFound();
  }

  const tourReviews = reviews.filter((r) => r.tourSlug === tour.slug);
  const tourFaqs = getFaqsForTour(tour);

  const difficultyLabel = { easy: 'Простой', medium: 'Средний', hard: 'Сложный' };

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-brand-600 transition-colors">Главная</Link>
          <span className="text-gray-300">/</span>
          <Link href="/tours" className="hover:text-brand-600 transition-colors">Все поездки</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-medium truncate max-w-[200px] sm:max-w-none inline-block align-bottom">{tour.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="lg:col-span-2 space-y-10">
            <TourGallery images={tour.gallery} title={tour.title} />

            <div>
              {tour.badges.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {tour.badges.map((badge) => (
                    <span
                      key={badge}
                      className={`${BADGE_COLORS[badge]} text-white text-xs font-semibold px-3 py-1 rounded-lg`}
                    >
                      {BADGE_LABELS[badge]}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{tour.title}</h1>

              <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                <span className="text-brand-600 font-medium">{tour.destination}</span>
                <span className="text-gray-300">·</span>
                <span>{pluralDays(tour.durationDays)}</span>
                <span className="text-gray-300">·</span>
                <span>{tour.region}</span>
              </div>

              <div className="mt-5 space-y-3">
                {tour.fullDescription.split(/\n\n+/).filter(Boolean).map((paragraph, i) => (
                  <p key={i} className="text-[15px] text-gray-600 leading-relaxed">{paragraph.trim()}</p>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Транспорт', value: tour.transport },
                { label: 'Проживание', value: tour.hotel },
                { label: 'Питание', value: tour.meals },
                { label: 'Сложность', value: difficultyLabel[tour.difficulty] },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl p-4 border border-gray-100/80 shadow-sm">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">{item.label}</p>
                  <p className="text-sm font-bold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <p className="text-sm font-medium text-gray-500 mb-2">Города выезда</p>
              {tour.departureCities.length === 0 ? (
                <p className="text-sm text-gray-700 leading-relaxed">
                  Фиксированного города отправления нет: тур доступен при выборе любого города в каталоге — вы
                  добираетесь к месту начала программы самостоятельно. Детали по встрече на маршруте — в блоке «Транспорт»
                  и при бронировании.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tour.departureCities.map((dc) => (
                    <Link
                      key={dc.slug}
                      href={`/from/${dc.slug}`}
                      className="text-sm bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors font-medium"
                    >
                      {dc.city}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {tour.organizationalInfo && (
              <div className="bg-white rounded-xl p-5 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-4.5 h-4.5 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  Организационная информация
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tour.organizationalInfo.meetingPoint && (
                    <div className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Место встречи</p>
                        <p className="text-sm text-gray-700 mt-0.5">{tour.organizationalInfo.meetingPoint}</p>
                      </div>
                    </div>
                  )}
                  {tour.organizationalInfo.checkIn && (
                    <div className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Заселение</p>
                        <p className="text-sm text-gray-700 mt-0.5">{tour.organizationalInfo.checkIn}</p>
                      </div>
                    </div>
                  )}
                  {tour.organizationalInfo.checkOut && (
                    <div className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                      </svg>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Выезд</p>
                        <p className="text-sm text-gray-700 mt-0.5">{tour.organizationalInfo.checkOut}</p>
                      </div>
                    </div>
                  )}
                  {tour.organizationalInfo.programStart && (
                    <div className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                      </svg>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Начало программы</p>
                        <p className="text-sm text-gray-700 mt-0.5">{tour.organizationalInfo.programStart}</p>
                      </div>
                    </div>
                  )}
                  {tour.organizationalInfo.programEnd && (
                    <div className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
                      </svg>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Окончание</p>
                        <p className="text-sm text-gray-700 mt-0.5">{tour.organizationalInfo.programEnd}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <TourItinerary itinerary={tour.itinerary} />
            <TourIncludes included={tour.included} excluded={tour.excluded} />

            {tourFaqs.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Частые вопросы</h2>
                <div className="space-y-4">
                  {tourFaqs.map((faq) => (
                    <div key={faq.id} className="bg-white rounded-xl p-5 border border-gray-100">
                      <h3 className="text-base font-semibold text-gray-900">{faq.question}</h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {tourReviews.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Отзывы</h2>
                <div className="space-y-4">
                  {tourReviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl p-5 border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900 text-sm">{review.author}</span>
                        <span className="text-xs text-gray-400">· {review.city}</span>
                      </div>
                      <div className="flex gap-0.5 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400' : 'text-gray-200'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{review.text}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-1">
            <TourSidebar tour={tour} />
          </div>
        </div>
      </div>
    </div>
  );
}
