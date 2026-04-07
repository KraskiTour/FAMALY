import { Tour } from '@/lib/types';
import { COMPANY, CONTACTS, SITE } from '@/lib/config';

interface TourJsonLdProps {
  tour: Tour;
}

export default function TourJsonLd({ tour }: TourJsonLdProps) {
  const url = `${SITE.url}/tours/${tour.slug}`;
  const firstDate = tour.nextDates[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: tour.title,
    description: tour.seoDescription || tour.shortDescription,
    url,
    touristType: 'Families, Adults, Couples, Groups',
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: tour.itinerary.length,
      itemListElement: tour.itinerary.map((day) => ({
        '@type': 'ListItem',
        position: day.day,
        name: day.title,
      })),
    },
    offers: firstDate
      ? {
          '@type': 'Offer',
          price: tour.priceFrom,
          priceCurrency: 'RUB',
          availability: 'https://schema.org/InStock',
          validFrom: firstDate.start,
          url,
        }
      : {
          '@type': 'Offer',
          price: tour.priceFrom,
          priceCurrency: 'RUB',
          url,
        },
    provider: {
      '@type': 'TravelAgency',
      name: COMPANY.name,
      url: SITE.url,
      telephone: CONTACTS.phone,
      email: CONTACTS.email,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Краснодар',
        addressRegion: 'Краснодарский край',
        addressCountry: 'RU',
        streetAddress: COMPANY.address,
      },
    },
    ...(tour.gallery[0] && { image: tour.gallery[0] }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
