import type { Metadata } from 'next';
import Link from 'next/link';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Allene — Модуль 3',
  description: 'Тестовая страница модуля Allene №3.',
  alternates: { canonical: '/allene/module-3' },
};

export default function AlleneModuleThreePage() {
  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-brand-600 transition-colors">Главная</Link>
          <span className="text-gray-300">/</span>
          <Link href="/allene" className="hover:text-brand-600 transition-colors">Модули Allene</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-medium">Модуль 3</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-6">Модуль 3</h1>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-card min-h-[520px]">
          <Script src="https://stells.info/assets/js/partner.fire.js" strategy="afterInteractive" charSet="utf-8" />
          <div className="s-partnership" style={{ display: 'none' }}>
            Ll7IUF5cHvaeyBa0q1NIAxkXyRSRN9kQM5IKauuiGzQ%3D
          </div>
        </div>
      </div>
    </div>
  );
}
