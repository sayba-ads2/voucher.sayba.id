import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

/**
 * robots.txt. Halaman invoice dan dashboard admin sengaja ditutup dari
 * crawler karena berisi data pesanan pelanggan.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin', '/admin/', '/invoice/'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
