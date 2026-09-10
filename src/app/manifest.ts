import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.tagline}`,
    short_name: site.shortName,
    description: site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#f2efe8',
    theme_color: '#1a1a1c',
    lang: 'id',
    orientation: 'portrait',
    categories: ['shopping', 'games', 'finance'],
    icons: [
      { src: '/logo-mark.png', sizes: '256x256', type: 'image/png', purpose: 'any' },
      { src: '/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
