import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Подбор отелей онлайн',
  description:
    'Выберите город, даты и вариант размещения. Поиск отелей на KRASKI.TRAVEL.',
  alternates: { canonical: '/hotels' },
};

export default function HotelsPage() {
  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-brand-600 transition-colors">
            Главная
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-medium">Отели</span>
        </nav>

        <header className="mb-6 lg:mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Подбор отелей
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-500 max-w-3xl leading-relaxed">
            Укажите направление и даты — сравните варианты размещения.
          </p>
        </header>
      </div>

      <div className="w-full px-3 sm:px-4 lg:px-6 pb-10 lg:pb-12">
        <div className="w-full max-w-none min-h-[520px] sm:min-h-[600px] bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 lg:p-8 shadow-card">
          <div className="tv-search-form tv-moduleid-9977208 w-full" />
          <Script
            src="https://tourvisor.ru/module/init.js"
            strategy="afterInteractive"
          />
        </div>
      </div>
    </div>
  );
}
