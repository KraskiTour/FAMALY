import type { Metadata } from 'next';
import Script from 'next/script';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Каталог стран и отелей — Tourvisor',
  description:
    'Каталог стран и отелей через Tourvisor на KRASKI.TRAVEL.',
  alternates: { canonical: '/hotels-turvizor-catalog' },
};

export default function HotelsTurvizorCatalogPage() {
  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-brand-600 transition-colors">
            Главная
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-medium">
            Каталог стран и отелей
          </span>
        </nav>

        <header className="mb-6 lg:mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Каталог стран и отелей
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-500 max-w-3xl leading-relaxed">
            Выберите страну и направление размещения через Tourvisor.
          </p>
        </header>

        <div className="max-w-[980px] mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-card min-h-[520px]">
            <div className="tv-country tv-moduleid-9991212" />
            <Script
              src="https://tourvisor.ru/module/init.js"
              strategy="afterInteractive"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
