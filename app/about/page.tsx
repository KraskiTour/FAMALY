import type { Metadata } from 'next';
import Link from 'next/link';
import { COMPANY, CONTACTS } from '@/lib/config';
import { getPublishedTours, destinations, reviews } from '@/data/mock-tours';

export const metadata: Metadata = {
  title: 'О бренде KRASKI.TRAVEL — семейные туры и поездки по России',
  description:
    'KRASKI.TRAVEL — бренд готовых путешествий для семей, взрослых и сборных групп. Автобусные, железнодорожные и комбинированные туры по России с понятной организацией.',
  alternates: { canonical: '/about' },
};

const audiences = [
  { title: 'Семьи с детьми', text: 'Маршруты, в которых удобно ехать вместе — с продуманной программой и комфортным ритмом.' },
  { title: 'Взрослые туристы', text: 'Поездки для тех, кто хочет сменить обстановку, увидеть новые места и провести время ярко.' },
  { title: 'Пары', text: 'Короткие и многодневные путешествия вдвоём — на выходные или в отпуск.' },
  { title: 'Друзья и компании', text: 'Готовые маршруты, которые не нужно организовывать самостоятельно — удобно для небольших групп.' },
  { title: 'Сборные группы', text: 'Можно поехать без необходимости собирать свою большую компанию — присоединяйтесь к группе.' },
];

const formats = [
  { title: 'Туры выходного дня', text: 'Короткие маршруты, которые легко встроить в плотный график.' },
  { title: 'Многодневные поездки', text: 'Насыщенные путешествия на несколько дней с новым ритмом и впечатлениями.' },
  { title: 'Экскурсионные туры', text: 'Программы с посещением достопримечательностей, городов и природных мест.' },
  { title: 'Автобусные маршруты', text: 'Комфортный автобус с кондиционером и багажным отсеком.' },
  { title: 'Железнодорожные поездки', text: 'Путешествия поездом — удобный формат для длинных направлений.' },
  { title: 'Комбинированные туры', text: 'Сочетание разных видов транспорта в рамках одного маршрута.' },
];

const values = [
  { title: 'Готовые маршруты', text: 'Формат, программа и основные условия уже подготовлены — не нужно собирать поездку по частям.' },
  { title: 'Понятная организация', text: 'Даты, направления, ключевые детали и формат поездки собраны в одном месте.' },
  { title: 'Удобная бронь', text: 'Выбираете маршрут, оставляете заявку — мы подтверждаем детали и согласовываем условия.' },
  { title: 'Поддержка и координация', text: 'Остаёмся на связи на этапе бронирования и подготовки к поездке.' },
];

function TrustStats() {
  const tourCount = getPublishedTours().length;
  const destCount = destinations.length;
  const stats = [
    { value: `${tourCount}+`, label: 'маршрутов в каталоге' },
    { value: `${destCount}`, label: 'направлений' },
    { value: '15+', label: 'городов выезда' },
    { value: `с ${COMPANY.foundedYear}`, label: 'года работаем' },
  ];
  return (
    <section className="-mt-10 relative z-10 mb-6">
      <div className="bg-white rounded-2xl shadow-elevated border border-gray-100 p-6 sm:p-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-2xl sm:text-3xl font-extrabold text-brand-600 tracking-tight">{s.value}</p>
              <p className="mt-1 text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-800 via-brand-900 to-stone-950 text-white py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="brand-blob brand-blob-teal w-[500px] h-[450px] -top-10 -right-20 opacity-90" />
          <div className="brand-blob brand-blob-warm w-[400px] h-[350px] bottom-0 -left-10 opacity-60" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-brand-300 mb-6">
            <Link href="/" className="hover:text-white transition-colors">Главная</Link>
            <span>/</span>
            <span className="text-white">О бренде</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-3xl">
            KRASKI.TRAVEL — готовые туры и поездки для тех, кто хочет путешествовать удобно
          </h1>
          <p className="mt-6 text-lg text-brand-200/80 max-w-2xl leading-relaxed">
            Семейные, взрослые и сборные путешествия по России — автобусом, поездом и в комбинированных форматах. Понятная организация, удобная бронь и маршруты, которые легко выбрать.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Trust stats */}
        <TrustStats />

        {/* Что такое KRASKI.TRAVEL */}
        <section className="py-16 lg:py-20 border-b border-gray-100">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Что такое KRASKI.TRAVEL
            </h2>
            <div className="mt-6 space-y-4 text-[15px] text-gray-600 leading-relaxed">
              <p>
                KRASKI.TRAVEL — это сайт готовых путешествий, где удобно выбирать маршруты,
                смотреть направления, сравнивать форматы поездок и бронировать туры без сложной
                самостоятельной организации.
              </p>
              <p>
                На сайте собраны поездки на выходные, многодневные маршруты, экскурсионные программы
                и яркие направления по России — для семей, взрослых, пар, друзей и сборных групп.
              </p>
              <p>
                Мы не агрегатор и не маркетплейс. KRASKI.TRAVEL — это единый бренд, под которым
                собраны проверенные маршруты с понятными условиями и удобной бронью.
              </p>
            </div>
          </div>
        </section>

        {/* Для кого */}
        <section className="py-16 lg:py-20 border-b border-gray-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-10">
            Кому подойдут наши туры и поездки
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {audiences.map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Форматы */}
        <section className="py-16 lg:py-20 border-b border-gray-100 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-gray-50/40">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-4">
            Форматы путешествий
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl leading-relaxed mb-10">
            На KRASKI.TRAVEL собраны разные форматы организованных поездок — от коротких туров выходного дня до насыщенных многодневных маршрутов.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {formats.map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card">
                <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Как мы помогаем */}
        <section className="py-16 lg:py-20 border-b border-gray-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-4">
            Как мы помогаем
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl leading-relaxed mb-10">
            KRASKI.TRAVEL — это не просто каталог. За сайтом стоит живая команда, которая помогает на каждом шаге.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: '🎯', text: 'Подберём маршрут под ваши даты, бюджет и формат отдыха' },
              { icon: '🔄', text: 'Поможем сравнить варианты, если не можете выбрать' },
              { icon: '📅', text: 'Подскажем по датам и наличию мест' },
              { icon: '🚂', text: 'Поможем с билетами и логистикой до старта тура' },
              { icon: '💬', text: 'Остаёмся на связи до самой поездки' },
              { icon: '⚡', text: 'Обычно отвечаем в течение 15 минут' },
            ].map((item) => (
              <div key={item.text} className="flex gap-3.5 p-5 bg-brand-50/40 rounded-xl border border-brand-100/30">
                <span className="text-xl shrink-0">{item.icon}</span>
                <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Отличие от KRASKI.DETI */}
        <section className="py-16 lg:py-20 border-b border-gray-100 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-gray-50/40">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-10">
            Чем KRASKI.TRAVEL отличается от KRASKI.DETI
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
            <div className="bg-brand-50/50 rounded-2xl p-8 border border-brand-100/50">
              <h3 className="text-lg font-bold text-brand-800 mb-4">KRASKI.TRAVEL</h3>
              <ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
                <li className="flex gap-2"><span className="text-brand-500 mt-0.5">•</span> Семейный отдых и поездки с детьми</li>
                <li className="flex gap-2"><span className="text-brand-500 mt-0.5">•</span> Взрослые туры и сборные путешествия</li>
                <li className="flex gap-2"><span className="text-brand-500 mt-0.5">•</span> Маршруты для пар, друзей и небольших компаний</li>
                <li className="flex gap-2"><span className="text-brand-500 mt-0.5">•</span> Travel-подача и современный бренд</li>
              </ul>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">KRASKI.DETI</h3>
              <ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span> Школьные экскурсии и поездки для классов</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span> Детские организованные группы</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span> Выпускные и профориентация</li>
                <li className="flex gap-2"><span className="text-gray-400 mt-0.5">•</span> Школьная подача и работа с учреждениями</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Наш подход */}
        <section className="py-16 lg:py-20 border-b border-gray-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-4">
            Как мы подходим к организации
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl leading-relaxed mb-10">
            KRASKI.TRAVEL — это не витрина случайных предложений. Каждый маршрут на сайте подготовлен
            с понятным форматом, датами и условиями.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((item) => (
              <div key={item.title} className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-card">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/60 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Почему нам доверяют */}
        <section className="py-16 lg:py-20 border-b border-gray-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-10">
            Почему нам доверяют
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { title: 'Понятная коммуникация', text: 'Отвечаем в мессенджерах и по телефону — без роботов, IVR и длинных ожиданий. Вы всегда знаете, с кем разговариваете.' },
              { title: 'Помощь с выбором', text: 'Не просто показываем каталог — помогаем сравнить, подобрать даты и формат поездки под ваши условия.' },
              { title: 'Единая точка контакта', text: 'Один менеджер ведёт вашу поездку от заявки до старта. Не нужно повторять детали разным людям.' },
              { title: 'Поддержка до старта', text: 'Напоминаем о поездке, помогаем с билетами и логистикой, отвечаем на вопросы до самого выезда.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-card">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/60 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Отзывы */}
        <section className="py-16 lg:py-20 border-b border-gray-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-4">
            Что говорят о поездках
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl leading-relaxed mb-10">
            Отзывы участников наших туров.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.slice(0, 3).map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{r.text}</p>
                <p className="text-xs text-gray-400">
                  <span className="font-semibold text-gray-700">{r.author}</span> · {r.city}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="kontakty" className="py-16 lg:py-20 border-b border-gray-100 scroll-mt-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-6">
            Контакты и реквизиты
          </h2>
          <div className="max-w-2xl space-y-4 text-[15px] text-gray-600 leading-relaxed">
            <p>
              <span className="font-semibold text-gray-900">Телефон: </span>
              <a href={`tel:${CONTACTS.phoneRaw}`} className="text-brand-600 hover:text-brand-700">
                {CONTACTS.phone}
              </a>
            </p>
            <p>
              <span className="font-semibold text-gray-900">Электронная почта: </span>
              <a href={`mailto:${CONTACTS.email}`} className="text-brand-600 hover:text-brand-700">
                {CONTACTS.email}
              </a>
            </p>
            <p>
              <span className="font-semibold text-gray-900">Юридический адрес: </span>
              {COMPANY.address}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Режим работы: </span>
              {COMPANY.workingHours}
            </p>
            <p className="text-sm text-gray-500 pt-2 border-t border-gray-100">
              {COMPANY.fullName} · ИНН {COMPANY.inn} · КПП {COMPANY.kpp} · ОГРН {COMPANY.ogrn}
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20">
          <div className="bg-gradient-to-br from-brand-50 to-brand-100/40 rounded-3xl p-8 sm:p-12 text-center border border-brand-100/50">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Найдите свою следующую поездку
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
              Смотрите направления, выбирайте маршрут и бронируйте — для выходных, отпуска, семьи или небольшой компании.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/tours"
                className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-brand-600 to-brand-700 text-white px-8 py-4 rounded-2xl text-base font-bold hover:from-brand-700 hover:to-brand-800 transition-all shadow-md shadow-brand-600/25"
              >
                Подобрать поездку
              </Link>
              <a
                href={CONTACTS.max.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 bg-white text-gray-700 px-8 py-4 rounded-2xl text-base font-semibold border border-gray-200 hover:border-brand-200 hover:text-brand-700 transition-all"
              >
                Написать в MAX
              </a>
            </div>
            <p className="mt-5 text-xs text-gray-400">
              {CONTACTS.phone} · {CONTACTS.email} · {COMPANY.workingHours}
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
