import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Модули Allene',
  description: 'Тестовые страницы модулей Allene для проверки внешнего вида и работы.',
  alternates: { canonical: '/allene' },
};

const MODULES = [
  { href: '/allene/module-1', label: 'Модуль 1 (Прайс-лист)' },
  { href: '/allene/module-2', label: 'Модуль 2' },
  { href: '/allene/module-3', label: 'Модуль 3' },
];

export default function AlleneModulesIndexPage() {
  return (
    <div className="bg-gray-50/50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-brand-600 transition-colors">Главная</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-medium">Модули Allene</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Модули Allene</h1>
        <p className="mt-3 text-base sm:text-lg text-gray-500 max-w-3xl leading-relaxed">
          Откройте нужный модуль для проверки отображения и работы виджета.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {MODULES.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 hover:border-brand-300 hover:text-brand-700 transition-colors"
            >
              {m.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
