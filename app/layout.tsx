import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import AnalyticsScripts from '@/components/analytics/analytics-scripts';
import { COMPANY, SITE } from '@/lib/config';

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.defaultTitle,
    template: `%s${SITE.titleSuffix}`,
  },
  description: SITE.defaultDescription,
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: COMPANY.name,
    title: SITE.defaultTitle,
    description: SITE.defaultDescription,
  },
  twitter: {
    card: 'summary',
    title: SITE.defaultTitle,
    description: SITE.defaultDescription,
  },
  icons: {
    icon: '/favicon.svg',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-white text-gray-900">
        <AnalyticsScripts />
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
