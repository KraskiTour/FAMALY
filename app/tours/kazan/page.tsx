import type { Metadata } from 'next';
import { getSeoLanding, getSeoLandingTours } from '@/lib/seo-landings';
import SeoLandingTemplate from '@/components/seo/seo-landing-template';

const config = getSeoLanding('kazan')!;

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
  alternates: { canonical: `/tours/${config.slug}` },
  openGraph: { title: config.title, description: config.description },
};

export default function KazanToursPage() {
  const tours = getSeoLandingTours(config);
  return (
    <SeoLandingTemplate
      h1={config.h1}
      intro={config.intro}
      tours={tours}
      faqs={config.faqs}
      relatedLinks={config.relatedLinks}
      breadcrumbName="Казань"
      canonicalPath={`/tours/${config.slug}`}
    />
  );
}
