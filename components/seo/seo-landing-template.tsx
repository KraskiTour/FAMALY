import Link from 'next/link';
import TourGrid from '@/components/tours/tour-grid';
import BreadcrumbJsonLd from '@/components/seo/breadcrumb-jsonld';
import FaqJsonLd from '@/components/seo/faq-jsonld';
import { Tour } from '@/lib/types';
import { CONTACTS } from '@/lib/config';
import { pluralTours } from '@/lib/utils';

interface SeoLandingFaq {
  question: string;
  answer: string;
}

interface SeoLandingProps {
  h1: string;
  intro: string;
  tours: Tour[];
  faqs: SeoLandingFaq[];
  relatedLinks: { label: string; href: string }[];
  breadcrumbName: string;
  canonicalPath: string;
  ctaTitle?: string;
  ctaText?: string;
  ctaWhatsApp?: string;
}

export default function SeoLandingTemplate({
  h1,
  intro,
  tours,
  faqs,
  relatedLinks,
  breadcrumbName,
  canonicalPath,
  ctaTitle,
  ctaText,
  ctaWhatsApp,
}: SeoLandingProps) {
  const faqsWithId = faqs.map((f, i) => ({
    ...f,
    id: `faq-${i}`,
    tourSlug: null,
  }));

  return (
    <div className="bg-gray-50/50 min-h-screen">
      <BreadcrumbJsonLd
        items={[
          { name: 'Главная', href: '/' },
          { name: 'Все поездки', href: '/tours' },
          { name: breadcrumbName },
        ]}
      />
      {faqsWithId.length > 0 && <FaqJsonLd faqs={faqsWithId} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-brand-600 transition-colors">Главная</Link>
          <span className="text-gray-300">/</span>
          <Link href="/tours" className="hover:text-brand-600 transition-colors">Все поездки</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-medium">{breadcrumbName}</span>
        </nav>

        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            {h1}
          </h1>
          <p className="mt-2 text-sm text-gray-500">{pluralTours(tours.length)} с датами и ценами</p>
          <div className="mt-5 max-w-3xl text-[15px] text-gray-600 leading-relaxed">
            {intro.split(/\n\n+/).filter(Boolean).map((p, i) => (
              <p key={i} className={i > 0 ? 'mt-3' : ''}>{p.trim()}</p>
            ))}
          </div>
        </div>

        <TourGrid tours={tours} />

        {/* CTA */}
        <div className="mt-14 bg-gradient-to-br from-brand-50/50 via-white to-white rounded-2xl border border-brand-100/40 shadow-panel p-7 sm:p-10 max-w-2xl">
          <p className="text-lg font-bold text-gray-900">
            {ctaTitle || 'Нужна помощь с выбором?'}
          </p>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            {ctaText || 'Подберём маршрут под ваши даты, бюджет и формат отдыха. Напишите — ответим в течение часа.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`${CONTACTS.whatsapp.url}?text=${encodeURIComponent(ctaWhatsApp || 'Здравствуйте! Хочу подобрать тур.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-green-700 transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={CONTACTS.telegram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-sky-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-sky-600 transition-colors"
            >
              Telegram
            </a>
            <a
              href={`tel:${CONTACTS.phoneRaw}`}
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-200 transition-colors"
            >
              {CONTACTS.phone}
            </a>
          </div>
          <p className="mt-3 text-xs text-gray-400">Живая команда — отвечаем быстро, помогаем подобрать маршрут под ваш запрос.</p>
        </div>

        {/* FAQ */}
        {faqs.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Частые вопросы</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 border-l-2 border-l-brand-200">
                  <h3 className="text-base font-semibold text-gray-900">{faq.question}</h3>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related */}
        {relatedLinks.length > 0 && (
          <section className="mt-14">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Смотрите также</h2>
            <div className="flex flex-wrap gap-2.5">
              {relatedLinks
                .filter((l) => l.href !== canonicalPath)
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm bg-brand-50 text-brand-700 px-4 py-2.5 rounded-lg hover:bg-brand-100 hover:shadow-sm transition-all duration-200 font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
