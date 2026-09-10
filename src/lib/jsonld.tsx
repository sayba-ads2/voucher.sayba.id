import { site, canonical } from './site';
import type { Faq, Game, PublicProduct } from '@/types';

/**
 * Structured data (schema.org JSON-LD).
 *
 * Google memakai ini untuk rich result: rating bintang, breadcrumb, dan FAQ
 * accordion di halaman hasil pencarian. Toko diperlakukan sebagai toko daring
 * berskala nasional — bukan bisnis lokal — karena seluruh layanannya online.
 */

const ORG_ID = `${site.url}/#organization`;
const WEBSITE_ID = `${site.url}/#website`;
const STORE_ID = `${site.url}/#store`;

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    logo: { '@type': 'ImageObject', url: site.logo },
    image: site.ogImage,
    description: site.description,
    email: site.contact.email,
    telephone: `+${site.contact.whatsapp}`,
    sameAs: Object.values(site.social).filter(Boolean),
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      addressCountry: site.address.country,
    },
  };
}

export function onlineStoreJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    '@id': STORE_ID,
    name: site.name,
    image: site.ogImage,
    url: site.url,
    telephone: `+${site.contact.whatsapp}`,
    email: site.contact.email,
    priceRange: 'Rp1.000 - Rp5.000.000',
    currenciesAccepted: 'IDR',
    paymentAccepted: 'QRIS, DANA, GoPay, OVO, ShopeePay, Transfer Bank',
    areaServed: { '@type': 'Country', name: 'Indonesia' },
    parentOrganization: { '@id': ORG_ID },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '00:00',
        closes: '23:59',
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: site.url,
    name: site.name,
    inLanguage: 'id-ID',
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: canonical(item.path),
    })),
  };
}

export function faqJsonLd(faqs: Faq[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

/** Halaman brand diperlakukan sebagai Product dengan rentang harga (offers). */
export function brandProductJsonLd(game: Game, products: PublicProduct[]) {
  const prices = products.map((p) => p.sell_price).filter((p) => p > 0);
  const low = prices.length ? Math.min(...prices) : 0;
  const high = prices.length ? Math.max(...prices) : 0;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: game.name,
    description:
      game.seo_description ?? game.short_description ?? `${game.name} — proses otomatis 24 jam.`,
    image: game.icon_url ?? site.ogImage,
    brand: { '@type': 'Brand', name: game.publisher ?? game.name },
    category: 'Produk Digital',
    url: canonical(`/${game.slug}`),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'IDR',
      lowPrice: low,
      highPrice: high,
      offerCount: products.length,
      availability: 'https://schema.org/InStock',
      seller: { '@id': ORG_ID },
    },
  };
}

/** Menyisipkan JSON-LD ke dalam halaman. */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
