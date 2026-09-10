/**
 * Registri kategori produk.
 *
 * Satu tempat yang menentukan: kategori apa saja yang dijual, bagaimana
 * kategori NexShop dipetakan ke etalase kita, alamat halamannya, label form
 * yang ditanyakan ke pembeli, dan urutan tampil. Menambah kategori baru cukup
 * menambah satu entri di sini plus satu berkas rute tipis.
 */

export type CategoryKey =
  | 'pulsa'
  | 'data'
  | 'pln'
  | 'ewallet'
  | 'game'
  | 'voucher'
  | 'tagihan'
  | 'hiburan'
  | 'etoll'
  | 'lainnya';

export type CategoryDef = {
  key: CategoryKey;
  /** Alamat halaman kategori, mis. /token-listrik */
  slug: string;
  label: string;
  /** Nama pendek untuk navigasi & chip */
  short: string;
  description: string;
  /** Nilai kolom `kategori` di katalog NexShop yang masuk ke sini */
  providerCategories: string[];
  /** Label input tujuan bawaan bila brand-nya tidak punya preset sendiri */
  targetLabel: string;
  targetPlaceholder: string;
  /** Ditampilkan sebagai kotak kategori di beranda */
  showOnHome: boolean;
  sort: number;
};

export const CATEGORIES: CategoryDef[] = [
  {
    key: 'pulsa',
    slug: 'pulsa',
    label: 'Pulsa',
    short: 'Pulsa',
    description:
      'Isi pulsa semua operator: Telkomsel, Indosat, XL, Tri, Smartfren, dan Axis. Masuk otomatis dalam hitungan detik.',
    providerCategories: ['Pulsa', 'Masa Aktif'],
    targetLabel: 'Nomor HP',
    targetPlaceholder: 'Contoh: 081234567890',
    showOnHome: true,
    sort: 1,
  },
  {
    key: 'data',
    slug: 'paket-data',
    label: 'Paket Data',
    short: 'Paket Data',
    description:
      'Paket internet harian, mingguan, dan bulanan untuk semua operator. Aktif langsung tanpa perlu kode dial.',
    providerCategories: ['Paket Data'],
    targetLabel: 'Nomor HP',
    targetPlaceholder: 'Contoh: 081234567890',
    showOnHome: true,
    sort: 2,
  },
  {
    key: 'pln',
    slug: 'token-listrik',
    label: 'Token Listrik PLN',
    short: 'Token Listrik',
    description:
      'Beli token listrik PLN prabayar. Nomor token dikirim otomatis begitu pembayaran terkonfirmasi.',
    providerCategories: ['PLN'],
    targetLabel: 'Nomor Meter / ID Pelanggan',
    targetPlaceholder: 'Contoh: 51234567890',
    showOnHome: true,
    sort: 3,
  },
  {
    key: 'ewallet',
    slug: 'e-wallet',
    label: 'Saldo E-Wallet',
    short: 'E-Wallet',
    description:
      'Top up saldo DANA, GoPay, OVO, ShopeePay, LinkAja, dan e-wallet lain langsung ke nomor terdaftar.',
    providerCategories: ['E-Wallet'],
    targetLabel: 'Nomor HP Terdaftar',
    targetPlaceholder: 'Contoh: 081234567890',
    showOnHome: true,
    sort: 4,
  },
  {
    key: 'game',
    slug: 'games',
    label: 'Top Up Game',
    short: 'Game',
    description:
      'Top up diamond, UC, dan koin untuk puluhan game populer. Cukup masukkan User ID, tanpa perlu login akun.',
    providerCategories: ['Gaming'],
    targetLabel: 'User ID',
    targetPlaceholder: 'Masukkan User ID',
    showOnHome: true,
    sort: 5,
  },
  {
    key: 'voucher',
    slug: 'voucher',
    label: 'Voucher Digital',
    short: 'Voucher',
    description:
      'Kode voucher Steam, Razer Gold, Google Play, PlayStation, Xbox, Garena Shell, dan lainnya. Kode dikirim otomatis.',
    providerCategories: ['Voucher Game'],
    targetLabel: 'Email Penerima',
    targetPlaceholder: 'nama@email.com',
    showOnHome: true,
    sort: 6,
  },
  {
    key: 'tagihan',
    slug: 'tagihan',
    label: 'Bayar Tagihan',
    short: 'Tagihan',
    description:
      'Bayar tagihan listrik pascabayar, PDAM, BPJS, internet, TV kabel, dan cicilan dari satu tempat.',
    providerCategories: ['Tagihan'],
    targetLabel: 'Nomor Pelanggan',
    targetPlaceholder: 'Masukkan nomor pelanggan',
    showOnHome: true,
    sort: 7,
  },
  {
    key: 'hiburan',
    slug: 'hiburan',
    label: 'Langganan Hiburan',
    short: 'Hiburan',
    description:
      'Voucher dan langganan layanan streaming film, musik, serta hiburan digital lainnya.',
    providerCategories: ['Hiburan'],
    targetLabel: 'Email / Nomor Akun',
    targetPlaceholder: 'nama@email.com',
    showOnHome: true,
    sort: 8,
  },
  {
    key: 'etoll',
    slug: 'e-toll',
    label: 'Saldo E-Toll',
    short: 'E-Toll',
    description: 'Top up saldo kartu tol elektronik untuk perjalanan tanpa antre.',
    providerCategories: ['E-Toll'],
    targetLabel: 'Nomor Kartu',
    targetPlaceholder: 'Masukkan nomor kartu',
    showOnHome: false,
    sort: 9,
  },
  {
    key: 'lainnya',
    slug: 'lainnya',
    label: 'Produk Lainnya',
    short: 'Lainnya',
    description: 'Produk digital lain yang tersedia di jaringan distributor kami.',
    providerCategories: ['Lainnya'],
    targetLabel: 'Nomor Tujuan',
    targetPlaceholder: 'Masukkan nomor tujuan',
    showOnHome: false,
    sort: 10,
  },
];

const BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));
const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));
const BY_PROVIDER = new Map<string, CategoryDef>();
for (const category of CATEGORIES) {
  for (const providerCategory of category.providerCategories) {
    BY_PROVIDER.set(providerCategory.toLowerCase(), category);
  }
}

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

export function getCategory(key: CategoryKey): CategoryDef {
  return BY_KEY.get(key) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function getCategoryBySlug(slug: string): CategoryDef | null {
  return BY_SLUG.get(slug) ?? null;
}

/** Memetakan nilai kolom `kategori` NexShop ke kategori etalase kita. */
export function mapProviderCategory(providerCategory: string): CategoryDef | null {
  return BY_PROVIDER.get(providerCategory.trim().toLowerCase()) ?? null;
}

export function homeCategories(): CategoryDef[] {
  return CATEGORIES.filter((c) => c.showOnHome).sort((a, b) => a.sort - b.sort);
}
