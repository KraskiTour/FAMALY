import Link from 'next/link';
import { CONTACTS } from '@/lib/config';

const steps = [
  {
    number: '01',
    title: 'Выберите направление',
    description: 'Смотрите маршруты, длительность, даты и формат поездки.',
  },
  {
    number: '02',
    title: 'Напишите нам',
    description: 'Уточним даты, условия, стоимость — подберём лучший вариант для вас.',
  },
  {
    number: '03',
    title: 'Подтвердите детали',
    description: 'Формат, даты и организацию согласовываем заранее, без сюрпризов.',
  },
  {
    number: '04',
    title: 'Отправляйтесь',
    description: 'Остаётся только собраться и поехать за впечатлениями.',
  },
];

export default function HowItWorks() {
  return (
    <section id="kak-bronirovat" className="section-y bg-white scroll-mt-24">
      <div className="container-page">
        <div className="text-center mb-14 lg:mb-16">
          <span className="eyebrow eyebrow--center">Как это работает</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Поехать проще, чем кажется
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Весь процесс — через нас. Выбирайте маршрут, бронируйте и отправляйтесь.
          </p>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Connecting dashed line on desktop */}
          <div
            className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px border-t border-dashed border-brand-200"
            aria-hidden
          />
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative bg-white border border-gray-200/70 rounded-2xl p-6 lg:p-7 hover:border-brand-200 hover:shadow-card-hover transition-all duration-300"
            >
              <span
                className="absolute -top-4 left-6 inline-flex items-center justify-center min-w-[3rem] h-8 px-3 rounded-full bg-gradient-to-r from-brand-600 to-brand-700 text-white text-xs font-extrabold tracking-wider shadow-button"
              >
                Шаг {step.number}
              </span>
              <h3 className="mt-3 text-base font-bold text-gray-900 mb-2 leading-snug">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 lg:mt-16 relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-warm-50/50 p-8 lg:p-10">
          <div className="brand-blob brand-blob-teal w-[320px] h-[260px] -top-16 -right-20 opacity-60" aria-hidden />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-snug">
                Вы выбираете направление — дальше помогаем с деталями и бронированием
              </p>
              <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
                Остаёмся на связи до самого старта поездки. Обычно отвечаем в течение 15 минут.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/tours"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-700 text-white px-6 py-3.5 rounded-xl text-sm font-bold hover:from-brand-700 hover:to-brand-800 transition-all shadow-button"
              >
                Подобрать поездку
              </Link>
              <a
                href={CONTACTS.max.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 border border-gray-200 px-6 py-3.5 rounded-xl text-sm font-bold hover:border-brand-300 hover:text-brand-700 transition-all shadow-card"
              >
                Написать в MAX
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
