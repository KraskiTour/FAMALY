import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { reviews, getPublishedTours, getTourBySlug, getFaqsForTour } from '@/data/mock-tours';
import { BADGE_LABELS, BADGE_COLORS } from '@/lib/types';
import type { Tour } from '@/lib/types';
import { formatPrice, pluralDays } from '@/lib/utils';
import { CONTACTS } from '@/lib/config';
import TourGallery from '@/components/tours/tour-gallery';
import TourItinerary from '@/components/tours/tour-itinerary';
import TourIncludes from '@/components/tours/tour-includes';
import TourSidebar from '@/components/tours/tour-sidebar';
import TourAudience from '@/components/tours/tour-audience';
import TourStickyCta from '@/components/tours/tour-sticky-cta';
import TourDescription from '@/components/tours/tour-description';
import TourJsonLd from '@/components/tours/tour-jsonld';
import FaqJsonLd from '@/components/seo/faq-jsonld';
import BreadcrumbJsonLd from '@/components/seo/breadcrumb-jsonld';

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
    alternates: { canonical: `/tours/${tour.slug}` },
    openGraph: {
      title: tour.seoTitle,
      description: tour.seoDescription,
      ...(tour.gallery[0] && { images: [tour.gallery[0]] }),
    },
  };
}

const DIFFICULTY_LABEL: Record<Tour['difficulty'], string> = {
  easy: 'Простой',
  medium: 'Средний',
  hard: 'Сложный',
};

export default async function TourPage({ params }: TourPageProps) {
  const { slug } = await params;
  const tour = getTourBySlug(slug);

  if (!tour) {
    notFound();
  }

  const tourReviews = reviews.filter((r) => r.tourSlug === tour.slug);
  const tourFaqs = getFaqsForTour(tour);

  const destinationsLine = (tour.destinations ?? [tour.destination]).join(' · ');
  const hasHighlights = Array.isArray(tour.highlights) && tour.highlights.length > 0;
  const descriptionParagraphs = tour.fullDescription
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const managerMessage = `Здравствуйте! Интересует тур «${tour.title}». Подскажите, пожалуйста, актуальные даты, стоимость и доступность мест.`;
  const managerHref = `${CONTACTS.whatsapp.url}?text=${encodeURIComponent(managerMessage)}`;

  const keyFacts: { label: string; value: string; icon: React.ReactNode }[] = [
    {
      label: 'Длительность',
      value: pluralDays(tour.durationDays),
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      ),
    },
    {
      label: 'Транспорт',
      value: tour.transport,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      ),
    },
    {
      label: 'Проживание',
      value: tour.hotel,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      ),
    },
    {
      label: 'Питание',
      value: tour.meals,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.126-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z" />
      ),
    },
    {
      label: 'Сложность',
      value: DIFFICULTY_LABEL[tour.difficulty],
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" />
      ),
    },
    ...(tour.maxGroupSize
      ? [{
          label: 'Группа',
          value: `до ${tour.maxGroupSize} чел.`,
          icon: (
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          ),
        }]
      : []),
  ];

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <TourJsonLd tour={tour} />
      <FaqJsonLd faqs={tourFaqs} />
      <BreadcrumbJsonLd items={[
        { name: 'Главная', href: '/' },
        { name: 'Все поездки', href: '/tours' },
        { name: tour.title },
      ]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6 lg:mb-8">
          <Link href="/" className="hover:text-brand-600 transition-colors">Главная</Link>
          <span className="text-gray-300">/</span>
          <Link href="/tours" className="hover:text-brand-600 transition-colors">Все поездки</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-medium truncate max-w-[200px] sm:max-w-none inline-block align-bottom">{tour.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="lg:col-span-2 space-y-10 lg:space-y-12">
            {/* ─── First screen / tour hero ─────────────────────────────── */}
            <section>
              <div className="mb-5 lg:mb-6">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-brand-700 mb-3">
                  <span className="inline-block w-6 h-px bg-brand-400" />
                  <span>{pluralDays(tour.durationDays)} · {tour.transport} · {tour.region}</span>
                </div>

                {tour.badges.length > 0 && (
                  <div className="flex gap-2 mb-4 flex-wrap">
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

                <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-gray-900 tracking-tight leading-[1.1]">
                  {tour.title}
                </h1>

                <p className="mt-3 text-base text-gray-600 leading-relaxed">
                  <span className="text-brand-700 font-semibold">{destinationsLine}</span>
                  {tour.shortDescription ? (
                    <>
                      <span className="text-gray-300 mx-2">·</span>
                      {tour.shortDescription}
                    </>
                  ) : null}
                </p>
              </div>

              <TourGallery images={tour.gallery} title={tour.title} />

              {tour.onRequestOnly && (
                <div className="mt-5 lg:mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zM12 16.5h.008v.008H12v-.008z" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-bold text-amber-900">
                        Тур временно доступен по индивидуальному запросу
                      </p>
                      <p className="mt-1 text-sm text-amber-900/90 leading-relaxed">
                        {tour.onRequestReason || 'Поставщик обновляет условия программы и наличие мест. Наш менеджер уточнит актуальные даты, стоимость и подберет удобный вариант поездки.'}
                      </p>
                      <a
                        href={managerHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors"
                      >
                        Связаться с менеджером
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {hasHighlights && (
                <div className="mt-5 lg:mt-6 bg-white rounded-2xl border border-brand-100 shadow-card p-4 sm:p-5">
                  <p className="text-[11px] uppercase tracking-wider text-brand-700 font-semibold mb-3">
                    Главное в туре
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {tour.highlights!.map((h) => (
                      <li
                        key={h}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-800 bg-brand-50/80 border border-brand-100 rounded-full px-3 py-1.5"
                      >
                        <svg className="w-3.5 h-3.5 text-brand-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* ─── Short description / summary ─────────────────────────── */}
            {descriptionParagraphs.length > 0 && (
              <section>
                <div className="mb-4 lg:mb-5">
                  <span className="eyebrow">О путешествии</span>
                  <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Коротко о туре
                  </h2>
                </div>
                <TourDescription paragraphs={descriptionParagraphs} />
              </section>
            )}

            {/* ─── Key facts — premium tiles ──────────────────────────── */}
            <section>
              <div className="mb-5 lg:mb-6">
                <span className="eyebrow">Формат</span>
                <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Коротко о формате
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {keyFacts.map((fact) => (
                  <div
                    key={fact.label}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/70 shadow-card hover:shadow-card-hover transition-shadow"
                  >
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-brand-50 text-brand-700 mb-3">
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                        {fact.icon}
                      </svg>
                    </span>
                    <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
                      {fact.label}
                    </p>
                    <p className="text-sm sm:text-[15px] font-bold text-gray-900 mt-0.5 leading-snug">
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── Кому подходит ─────────────────────────────────────── */}
            <TourAudience tour={tour} />

            {/* ─── Departure cities + organizational info ───────────── */}
            {(tour.departureCities.length > 0 || tour.organizationalInfo) && (
              <section>
                <div className="mb-4 lg:mb-5">
                  <span className="eyebrow">Логистика</span>
                  <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Выезд и организация
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/70 shadow-card">
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-50 text-brand-700">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                      </span>
                      <h3 className="text-base font-bold text-gray-900">
                        {tour.departureCities.length > 0 ? 'Города выезда' : 'Старт программы'}
                      </h3>
                    </div>
                    {tour.departureCities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {tour.departureCities.map((dc) => (
                          <Link
                            key={dc.slug}
                            href={`/from/${dc.slug}`}
                            className="inline-flex items-center gap-1.5 text-sm bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors font-semibold"
                          >
                            {dc.city}
                            {dc.departureTime && (
                              <span className="text-xs text-brand-600/80 font-medium">· {dc.departureTime}</span>
                            )}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Программа стартует по месту проведения. Поможем подобрать билеты, удобный поезд или авиаперелёт до начала тура.
                      </p>
                    )}
                  </div>

                  {tour.organizationalInfo && (
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/70 shadow-card">
                      <div className="flex items-center gap-2.5 mb-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-50 text-brand-700">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                          </svg>
                        </span>
                        <h3 className="text-base font-bold text-gray-900">Организационные детали</h3>
                      </div>
                      <ul className="space-y-2">
                        {tour.organizationalInfo.meetingPoint && (
                          <OrgItem label="Место встречи" value={tour.organizationalInfo.meetingPoint} />
                        )}
                        {tour.organizationalInfo.programStart && (
                          <OrgItem label="Начало программы" value={tour.organizationalInfo.programStart} />
                        )}
                        {tour.organizationalInfo.programEnd && (
                          <OrgItem label="Окончание" value={tour.organizationalInfo.programEnd} />
                        )}
                        {tour.organizationalInfo.checkIn && (
                          <OrgItem label="Заселение" value={tour.organizationalInfo.checkIn} />
                        )}
                        {tour.organizationalInfo.checkOut && (
                          <OrgItem label="Выезд" value={tour.organizationalInfo.checkOut} />
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            <TourItinerary itinerary={tour.itinerary} />

            <TourIncludes included={tour.included} excluded={tour.excluded} />

            {tourFaqs.length > 0 && (
              <section>
                <div className="mb-5 lg:mb-6">
                  <span className="eyebrow">Вопросы–ответы</span>
                  <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Частые вопросы
                  </h2>
                </div>
                <div className="space-y-3">
                  {tourFaqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/70 shadow-card hover:border-brand-200 transition-colors"
                    >
                      <h3 className="text-base font-bold text-gray-900">{faq.question}</h3>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {tourReviews.length > 0 && (
              <section>
                <div className="mb-5 lg:mb-6">
                  <span className="eyebrow">Мнения путешественников</span>
                  <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    Отзывы
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tourReviews.map((review) => {
                    const initials = review.author
                      .split(/\s+/)
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    return (
                      <div
                        key={review.id}
                        className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/70 shadow-card"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-sm font-bold">
                            {initials}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{review.author}</p>
                            <p className="text-xs text-gray-400">{review.city}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 mb-3">
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
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <div className="lg:col-span-1">
            <TourSidebar tour={tour} />
          </div>
        </div>
      </div>

      <TourStickyCta tour={tour} />
    </div>
  );
}

function OrgItem({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-400 mt-[8px] shrink-0" aria-hidden />
      <div className="min-w-0 leading-snug">
        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">{label}</span>
        <p className="text-sm text-gray-800">{value}</p>
      </div>
    </li>
  );
}
