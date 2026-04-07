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
    title: 'Отправляйтесь в путешествие',
    description: 'Остаётся только собраться и поехать за впечатлениями.',
  },
];

export default function HowItWorks() {
  return (
    <section id="kak-bronirovat" className="py-20 lg:py-28 bg-white scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Поехать проще, чем кажется
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Весь процесс — через нас. Выбирайте маршрут, бронируйте и отправляйтесь.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100/60 mb-5">
                <span className="text-xl font-extrabold text-brand-600">{step.number}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-7 left-[calc(50%+40px)] w-[calc(100%-80px)] border-t border-brand-200/50" />
              )}
              <h3 className="text-base font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 bg-gradient-to-br from-brand-50/60 to-transparent rounded-2xl border border-brand-100/40 p-6 sm:p-8 text-center">
          <p className="text-base font-bold text-gray-900">
            Вы выбираете направление — дальше помогаем с деталями, датами, билетами и бронированием
          </p>
          <p className="mt-2 text-sm text-gray-500 max-w-lg mx-auto">
            Остаёмся на связи до самого старта поездки. Обычно отвечаем в течение 15 минут.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-700 text-white px-7 py-3 rounded-2xl text-sm font-bold hover:from-brand-700 hover:to-brand-800 transition-all shadow-md shadow-brand-600/20"
            >
              Подобрать поездку
            </Link>
            <a
              href={`${CONTACTS.whatsapp.url}?text=${encodeURIComponent('Здравствуйте! Помогите подобрать поездку.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 text-white px-7 py-3 rounded-2xl text-sm font-bold hover:bg-green-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Написать в WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
