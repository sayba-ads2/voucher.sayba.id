import { publicEnv } from './env';

/**
 * Identitas toko + kata kunci SEO. Nilai di sini dipakai untuk metadata,
 * structured data (JSON-LD), sitemap, dan teks marketing di seluruh halaman.
 */
export const site = {
  name: 'Sayba Voucher',
  shortName: 'SaybaVoucher',
  legalName: 'Sayba Voucher — Sayba Arc',
  shortTagline: 'Pulsa · Listrik · Voucher · Game',
  url: publicEnv.siteUrl,
  logo: `${publicEnv.siteUrl}/logo-512.png`,
  ogImage: `${publicEnv.siteUrl}/og-image.jpg`,
  locale: 'id_ID',
  language: 'id',
  currency: 'IDR',

  tagline: 'Semua Kebutuhan Digital dalam Satu Tempat',
  description:
    'Beli pulsa, paket data, token listrik PLN, saldo e-wallet, voucher digital, dan top up game dalam satu tempat. Proses otomatis 24 jam, harga transparan, bayar pakai QRIS, e-wallet, atau transfer bank. Melayani seluruh Indonesia.',

  contact: {
    whatsapp: publicEnv.whatsapp || '6287803445749',
    email: 'sayba.help@gmail.com',
    hours: 'Setiap hari 08.00 - 23.00 WIB (sistem otomatis 24 jam)',
  },

  /** Alamat badan usaha — dipakai untuk keterangan legal, bukan penargetan pasar. */
  address: {
    city: 'Pontianak',
    region: 'Kalimantan Barat',
    country: 'ID',
  },

  social: {
    instagram: 'https://instagram.com/saybaarc',
    tiktok: 'https://tiktok.com/@saybaarc',
    facebook: '',
  },

  /** Kata kunci utama, mencakup seluruh kategori dan berskala nasional. */
  keywords: [
    'sayba voucher',
    'beli pulsa online',
    'pulsa murah semua operator',
    'beli paket data murah',
    'token listrik pln online',
    'beli token listrik murah',
    'top up e-wallet',
    'top up dana ovo gopay shopeepay',
    'voucher game murah',
    'voucher steam wallet',
    'voucher google play',
    'top up game murah',
    'top up mobile legends',
    'top up free fire',
    'bayar tagihan online',
    'ppob online 24 jam',
    'sayba arc',
  ],

  /**
   * Slug game yang ditonjolkan di beranda. Kategori lain tetap punya halaman
   * sendiri dan tetap terindeks.
   */
  homeGameSlugs: ['mobile-legends', 'free-fire', 'pubg-mobile'],
} as const;

export type Site = typeof site;

/** Judul halaman standar: "<judul> | Sayba Voucher" */
export function pageTitle(title: string): string {
  return `${title} | ${site.name}`;
}

export function canonical(path = '/'): string {
  return new URL(path, site.url).toString();
}
