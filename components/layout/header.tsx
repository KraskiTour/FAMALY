'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CONTACTS } from '@/lib/config';

const navigation = [
  { name: 'Главная', href: '/' },
  { name: 'Все поездки', href: '/tours' },
  { name: 'Из Краснодара', href: '/from/krasnodar' },
  { name: 'Из Ростова', href: '/from/rostov-na-donu' },
];

const messengerLinks = [
  { label: CONTACTS.whatsapp.label, url: CONTACTS.whatsapp.url },
  { label: CONTACTS.telegram.label, url: CONTACTS.telegram.url },
  { label: CONTACTS.max.label, url: CONTACTS.max.url },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-100/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 002.288-4.042 1.087 1.087 0 00-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 01-.98-.314l-.295-.295a1.125 1.125 0 010-1.591l.13-.132a1.125 1.125 0 011.3-.21l.603.302a.809.809 0 001.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 001.528-1.732l.146-.292M6.115 5.19A9 9 0 1017.18 4.64M6.115 5.19A8.965 8.965 0 0112 3c1.929 0 3.716.607 5.18 1.64" />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-brand-600">KRASKI</span><span className="text-gray-400 font-bold">.</span><span className="text-gray-900">TRAVEL</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[14px] font-medium text-gray-600 hover:text-brand-600 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-5">
            {messengerLinks.map((m) => (
              <a
                key={m.label}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-medium text-gray-400 hover:text-brand-600 transition-colors"
              >
                {m.label}
              </a>
            ))}
            <Link
              href="/tours"
              className="bg-gradient-to-r from-brand-600 to-brand-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-brand-700 hover:to-brand-800 transition-all shadow-sm shadow-brand-600/20"
            >
              Подобрать поездку
            </Link>
          </div>

          <button
            type="button"
            className="lg:hidden p-2 -mr-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Меню"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-5 pb-6">
            <nav className="flex flex-col gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[15px] font-medium text-gray-700 hover:text-brand-600 hover:bg-brand-50 transition-colors py-2.5 px-3 rounded-xl"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
              {messengerLinks.map((m) => (
                <a key={m.label} href={m.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-500 hover:text-brand-600">{m.label}</a>
              ))}
            </div>
            <Link
              href="/tours"
              className="mt-4 block text-center bg-gradient-to-r from-brand-600 to-brand-700 text-white px-5 py-3 rounded-xl text-sm font-semibold hover:from-brand-700 hover:to-brand-800 transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Подобрать поездку
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
