import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { WhatsAppFloat } from '@/components/whatsapp-float';
import { JsonLd, onlineStoreJsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/jsonld';
import { getActiveGames, getStoreSettings } from '@/lib/queries';
import { site } from '@/lib/site';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [...site.keywords],
  applicationName: site.name,
  authors: [{ name: 'Sayba Arc', url: site.url }],
  creator: 'Sayba Arc',
  publisher: 'Sayba Arc',
  category: 'Game & Voucher Digital',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: site.locale,
    url: site.url,
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [{ url: site.ogImage, width: 1200, height: 630, alt: site.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    images: [site.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#1a1a1c',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [games, store] = await Promise.all([getActiveGames(), getStoreSettings()]);
  const whatsapp = store.whatsapp || site.contact.whatsapp;

  return (
    <html lang="id" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <JsonLd data={[organizationJsonLd(), websiteJsonLd(), onlineStoreJsonLd()]} />
      </head>
      <body className="min-h-screen antialiased">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-strong focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Lompat ke konten utama
        </a>

        <SiteHeader whatsapp={whatsapp} />
        <main id="konten">{children}</main>
        <SiteFooter games={games} whatsapp={whatsapp} />
        <WhatsAppFloat phone={whatsapp} />
      </body>
    </html>
  );
}
