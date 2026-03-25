import Link from 'next/link';
import { COMPANY, CONTACTS } from '@/lib/config';

const footerNav = [
  {
    title: 'Направления',
    links: [
      { name: 'Семейные поездки', href: '/tours' },
      { name: 'Туры выходного дня', href: '/tours' },
      { name: 'Многодневные путешествия', href: '/tours' },
      { name: 'Экскурсионные маршруты', href: '/tours' },
      { name: 'Горные направления', href: '/tours' },
    ],
  },
  {
    title: 'Города выезда',
    links: [
      { name: 'Из Краснодара', href: '/from/krasnodar' },
      { name: 'Из Ростова-на-Дону', href: '/from/rostov-na-donu' },
      { name: 'Из Ставрополя', href: '/from/stavropol' },
      { name: 'Из Новороссийска', href: '/from/novorossiysk' },
      { name: 'Из Сочи', href: '/from/sochi' },
    ],
  },
  {
    title: 'Информация',
    links: [
      { name: 'О бренде', href: '/about' },
      { name: 'Как забронировать', href: '/#kak-bronirovat' },
      { name: 'Контакты', href: '/about#kontakty' },
    ],
  },
];

const messengerButtons = [
  { label: CONTACTS.whatsapp.label, url: CONTACTS.whatsapp.url, className: 'bg-green-600 hover:bg-green-700' },
  { label: CONTACTS.telegram.label, url: CONTACTS.telegram.url, className: 'bg-blue-500 hover:bg-blue-600' },
  { label: CONTACTS.max.label, url: CONTACTS.max.url, className: 'bg-violet-600 hover:bg-violet-700' },
];

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 002.288-4.042 1.087 1.087 0 00-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 01-.98-.314l-.295-.295a1.125 1.125 0 010-1.591l.13-.132a1.125 1.125 0 011.3-.21l.603.302a.809.809 0 001.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 001.528-1.732l.146-.292M6.115 5.19A9 9 0 1017.18 4.64M6.115 5.19A8.965 8.965 0 0112 3c1.929 0 3.716.607 5.18 1.64" />
                </svg>
              </div>
              <span className="text-xl font-extrabold tracking-tight">
                <span className="text-brand-400">KRASKI</span><span className="text-gray-500 font-bold">.</span><span className="text-white">TRAVEL</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-400 max-w-sm leading-relaxed">
              Семейные, взрослые и сборные путешествия по России и ярким направлениям. Готовые маршруты, удобная бронь и поездки без лишней суеты.
            </p>
            <p className="mt-3 text-xs text-gray-500 leading-relaxed">
              Остались вопросы по поездке? Напишите нам — поможем подобрать подходящий маршрут.
            </p>
            <div className="flex items-center gap-3 mt-6 flex-wrap">
              {messengerButtons.map((m) => (
                <a
                  key={m.label}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 ${m.className} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                >
                  {m.label}
                </a>
              ))}
            </div>
            <div className="mt-5 space-y-1.5 text-sm text-gray-400">
              <p>{CONTACTS.phone}</p>
              <p>{CONTACTS.email}</p>
              <p>{COMPANY.address}</p>
              <p className="text-gray-500">{COMPANY.workingHours}</p>
            </div>
          </div>

          {footerNav.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} {COMPANY.name}. Все права защищены. {COMPANY.fullName} ИНН {COMPANY.inn} КПП {COMPANY.kpp} ОГРН {COMPANY.ogrn}
          </p>
          <p className="text-xs text-gray-500">
            Информация на сайте не является публичной офертой
          </p>
        </div>
      </div>
    </footer>
  );
}
