/**
 * Registri kategori produk.
 *
 * Satu tempat yang menentukan: kategori apa saja yang dijual, bagaimana
 * kategori NexShop dipetakan ke etalase kita, alamat halamannya, label form
 * yang ditanyakan ke pembeli, kata kunci pencarian, dan urutan tampil.
 * Menambah kategori baru cukup menambah satu entri di sini plus satu berkas
 * rute tipis.
 */

export type CategoryKey =
  | 'pulsa'
  | 'data'
  | 'perdana'
  | 'pln'
  | 'ewallet'
  | 'game'
  | 'voucher'
  | 'hiburan'
  | 'tagihan'
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
  /**
   * Nilai kolom `kategori` di katalog NexShop yang masuk ke sini. Dicocokkan
   * persis (setelah dinormalkan), jadi tulis sebanyak mungkin varian nama.
   */
  providerCategories: string[];
  /**
   * Penanda cadangan: potongan kata yang, bila muncul di nilai kategori
   * penyedia, cukup untuk menentukan kategori. Dipakai hanya setelah
   * pencocokan persis gagal, sehingga kategori baru dari distributor
   * (mis. "Voucher Streaming Premium") tidak diam-diam hilang dari etalase.
   */
  providerHints: string[];
  /** Kata kunci pencarian internal + meta keywords halaman kategori. */
  keywords: string[];
  /** Label input tujuan bawaan bila brand-nya tidak punya preset sendiri */
  targetLabel: string;
  targetPlaceholder: string;
  /** Ditampilkan sebagai kotak kategori di beranda */
  showOnHome: boolean;
  /**
   * Brand baru di kategori ini langsung tampil di etalase setelah sinkronisasi.
   * Dimatikan untuk 'lainnya' — isinya campur aduk dan perlu dilihat dulu.
   */
  autoActivate: boolean;
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
    providerCategories: ['Pulsa', 'Pulsa Reguler', 'Pulsa Transfer', 'Masa Aktif', 'Pulsa Nasional'],
    providerHints: ['pulsa', 'masa aktif'],
    keywords: [
      'pulsa',
      'isi pulsa',
      'pulsa murah',
      'telkomsel',
      'simpati',
      'by u',
      'indosat',
      'im3',
      'xl',
      'axis',
      'tri',
      'smartfren',
      'pulsa transfer',
    ],
    targetLabel: 'Nomor HP',
    targetPlaceholder: 'Contoh: 081234567890',
    showOnHome: true,
    autoActivate: true,
    sort: 1,
  },
  {
    key: 'data',
    slug: 'paket-data',
    label: 'Paket Data & Kuota',
    short: 'Paket Data',
    description:
      'Paket internet harian, mingguan, dan bulanan untuk semua operator. Aktif langsung tanpa perlu kode dial.',
    providerCategories: [
      'Paket Data',
      'Data',
      'Kuota',
      'Paket Internet',
      'Internet',
      'Paket Telepon & SMS',
    ],
    providerHints: ['paket data', 'kuota', 'internet', 'paket telepon'],
    keywords: [
      'paket data',
      'kuota',
      'kuota internet',
      'paket internet',
      'kuota murah',
      'paket telkomsel',
      'kuota indosat',
      'paket xl',
      'kuota tri',
      'unlimited',
    ],
    targetLabel: 'Nomor HP',
    targetPlaceholder: 'Contoh: 081234567890',
    showOnHome: true,
    autoActivate: true,
    sort: 2,
  },
  {
    key: 'perdana',
    slug: 'kartu-perdana',
    label: 'Kartu Perdana',
    short: 'Perdana',
    description:
      'Kartu perdana internet semua operator dengan kuota bawaan besar. Nomor baru siap pakai beserta data aktivasinya.',
    providerCategories: [
      'Kartu Perdana',
      'Perdana',
      'Perdana Internet',
      'Kartu Perdana Internet',
      'Voucher Perdana',
      'Perdana Data',
    ],
    providerHints: ['perdana'],
    keywords: [
      'kartu perdana',
      'perdana',
      'perdana internet',
      'kartu perdana murah',
      'perdana telkomsel',
      'perdana xl',
      'perdana indosat',
      'nomor baru',
      'sim card',
    ],
    targetLabel: 'Nomor HP / Email Penerima',
    targetPlaceholder: 'Contoh: 081234567890',
    showOnHome: true,
    autoActivate: true,
    sort: 3,
  },
  {
    key: 'pln',
    slug: 'token-listrik',
    label: 'Token Listrik PLN',
    short: 'Token Listrik',
    description:
      'Beli token listrik PLN prabayar. Nomor token dikirim otomatis begitu pembayaran terkonfirmasi.',
    providerCategories: ['PLN', 'Token PLN', 'Token Listrik', 'Listrik', 'PLN Prabayar'],
    providerHints: ['pln', 'token listrik', 'listrik prabayar'],
    keywords: [
      'token listrik',
      'pln',
      'token pln',
      'listrik prabayar',
      'beli token',
      'token listrik murah',
      'stroom',
      'meteran listrik',
    ],
    targetLabel: 'Nomor Meter / ID Pelanggan',
    targetPlaceholder: 'Contoh: 51234567890',
    showOnHome: true,
    autoActivate: true,
    sort: 4,
  },
  {
    key: 'ewallet',
    slug: 'e-wallet',
    label: 'Saldo E-Wallet',
    short: 'E-Wallet',
    description:
      'Top up saldo DANA, GoPay, OVO, ShopeePay, LinkAja, dan e-wallet lain langsung ke nomor terdaftar.',
    providerCategories: [
      'E-Wallet',
      'EWallet',
      'E Wallet',
      'Dompet Digital',
      'Uang Elektronik',
      'Saldo',
    ],
    providerHints: ['e wallet', 'ewallet', 'dompet digital', 'uang elektronik'],
    keywords: [
      'e-wallet',
      'ewallet',
      'dana',
      'gopay',
      'ovo',
      'shopeepay',
      'linkaja',
      'saldo dana',
      'top up gopay',
      'isi saldo',
      'dompet digital',
    ],
    targetLabel: 'Nomor HP Terdaftar',
    targetPlaceholder: 'Contoh: 081234567890',
    showOnHome: true,
    autoActivate: true,
    sort: 5,
  },
  {
    key: 'game',
    slug: 'games',
    label: 'Top Up Game',
    short: 'Game',
    description:
      'Top up diamond, UC, dan koin untuk puluhan game populer. Cukup masukkan User ID, tanpa perlu login akun.',
    providerCategories: ['Gaming', 'Game', 'Games', 'Top Up Game', 'Topup Game', 'Game Online'],
    providerHints: ['gaming', 'game'],
    keywords: [
      'top up game',
      'diamond',
      'mobile legends',
      'mlbb',
      'free fire',
      'pubg',
      'uc',
      'genshin',
      'honkai',
      'valorant',
      'roblox',
      'robux',
      'call of duty',
      'honor of kings',
      'ragnarok',
      'point blank',
    ],
    targetLabel: 'User ID',
    targetPlaceholder: 'Masukkan User ID',
    showOnHome: true,
    autoActivate: true,
    sort: 6,
  },
  {
    key: 'voucher',
    slug: 'voucher',
    label: 'Voucher Digital',
    short: 'Voucher',
    description:
      'Kode voucher Steam, Razer Gold, Google Play, PlayStation, Xbox, Garena Shell, dan lainnya. Kode dikirim otomatis.',
    providerCategories: [
      'Voucher Game',
      'Voucher',
      'Voucher Digital',
      'Gift Card',
      'Giftcard',
      'Voucher Gaming',
    ],
    providerHints: ['voucher game', 'gift card', 'giftcard', 'voucher'],
    keywords: [
      'voucher',
      'steam wallet',
      'razer gold',
      'google play',
      'gift card',
      'playstation',
      'psn',
      'xbox',
      'garena shell',
      'unipin',
      'voucher game',
    ],
    targetLabel: 'Email Penerima',
    targetPlaceholder: 'nama@email.com',
    showOnHome: true,
    autoActivate: true,
    sort: 7,
  },
  {
    key: 'hiburan',
    slug: 'hiburan',
    label: 'Langganan Hiburan',
    short: 'Hiburan',
    description:
      'Langganan Netflix, Spotify, YouTube Premium, Disney+ Hotstar, Vidio, WeTV, Viu, dan layanan streaming lainnya. Aktif tanpa perlu kartu kredit.',
    providerCategories: [
      'Hiburan',
      'Streaming',
      'Voucher Hiburan',
      'Entertainment',
      'Aplikasi Premium',
      'Voucher Streaming',
      'Musik',
      'TV Streaming',
    ],
    providerHints: ['hiburan', 'streaming', 'entertainment', 'aplikasi premium'],
    keywords: [
      'netflix',
      'spotify',
      'youtube premium',
      'disney plus',
      'disney hotstar',
      'vidio',
      'wetv',
      'viu',
      'iqiyi',
      'prime video',
      'hbo',
      'catchplay',
      'langganan streaming',
      'nonton film',
      'canva pro',
      'capcut pro',
      'bstation',
    ],
    targetLabel: 'Email / Nomor Akun',
    targetPlaceholder: 'nama@email.com',
    showOnHome: true,
    autoActivate: true,
    sort: 8,
  },
  {
    key: 'tagihan',
    slug: 'tagihan',
    label: 'Bayar Tagihan',
    short: 'Tagihan',
    description:
      'Bayar tagihan listrik pascabayar, PDAM, BPJS, internet, TV kabel, dan cicilan dari satu tempat.',
    providerCategories: [
      'Tagihan',
      'PPOB',
      'Pascabayar',
      'Tagihan Bulanan',
      'BPJS',
      'PDAM',
      'Multifinance',
    ],
    providerHints: ['tagihan', 'ppob', 'pascabayar', 'bpjs', 'pdam', 'multifinance'],
    keywords: [
      'bayar tagihan',
      'pascabayar',
      'bpjs',
      'pdam',
      'indihome',
      'tv kabel',
      'cicilan',
      'ppob',
      'tagihan listrik',
      'telkom',
    ],
    targetLabel: 'Nomor Pelanggan',
    targetPlaceholder: 'Masukkan nomor pelanggan',
    showOnHome: true,
    autoActivate: true,
    sort: 9,
  },
  {
    key: 'etoll',
    slug: 'e-toll',
    label: 'Saldo E-Toll',
    short: 'E-Toll',
    description:
      'Top up saldo kartu tol elektronik e-Money, Brizzi, Flazz, dan TapCash untuk perjalanan tanpa antre.',
    providerCategories: ['E-Toll', 'ETOLL', 'E Toll', 'Kartu Tol', 'Emoney', 'E-Money'],
    providerHints: ['e toll', 'etoll', 'kartu tol', 'e money', 'emoney'],
    keywords: ['e-toll', 'etoll', 'e-money', 'brizzi', 'flazz', 'tapcash', 'saldo tol'],
    targetLabel: 'Nomor Kartu',
    targetPlaceholder: 'Masukkan nomor kartu',
    showOnHome: true,
    autoActivate: true,
    sort: 10,
  },
  {
    key: 'lainnya',
    slug: 'lainnya',
    label: 'Produk Lainnya',
    short: 'Lainnya',
    description: 'Produk digital lain yang tersedia di jaringan distributor kami.',
    providerCategories: ['Lainnya', 'Others', 'Lain-lain'],
    providerHints: [],
    keywords: ['produk digital', 'lainnya'],
    targetLabel: 'Nomor Tujuan',
    targetPlaceholder: 'Masukkan nomor tujuan',
    showOnHome: false,
    autoActivate: false,
    sort: 11,
  },
];

const BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));
const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const BY_PROVIDER = new Map<string, CategoryDef>();
for (const category of CATEGORIES) {
  for (const providerCategory of category.providerCategories) {
    BY_PROVIDER.set(normalize(providerCategory), category);
  }
}

/** Penanda cadangan, diurutkan dari yang terpanjang agar yang paling spesifik menang. */
const HINTS: { hint: string; category: CategoryDef }[] = CATEGORIES.flatMap((category) =>
  category.providerHints.map((hint) => ({ hint: normalize(hint), category })),
).sort((a, b) => b.hint.length - a.hint.length);

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

export function getCategory(key: CategoryKey): CategoryDef {
  return BY_KEY.get(key) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function getCategoryBySlug(slug: string): CategoryDef | null {
  return BY_SLUG.get(slug) ?? null;
}

/**
 * Memetakan nilai kolom `kategori` NexShop ke kategori etalase kita.
 * Mengembalikan null bila benar-benar tidak dikenali — pemanggil yang
 * menentukan apakah produk itu dibuang atau ditaruh di "Lainnya".
 */
export function mapProviderCategory(providerCategory: string): CategoryDef | null {
  const key = normalize(providerCategory);
  if (!key) return null;

  const exact = BY_PROVIDER.get(key);
  if (exact) return exact;

  for (const { hint, category } of HINTS) {
    if (key.includes(hint)) return category;
  }
  return null;
}

/**
 * Sama seperti mapProviderCategory, tapi tidak pernah menyerah: kategori yang
 * tidak dikenali jatuh ke "Lainnya". Dipakai saat sinkronisasi supaya produk
 * baru dari distributor tetap masuk database dan bisa kamu aktifkan, bukan
 * menghilang tanpa jejak.
 */
export function resolveProviderCategory(providerCategory: string): CategoryDef {
  return mapProviderCategory(providerCategory) ?? getCategory('lainnya');
}

export function homeCategories(): CategoryDef[] {
  return CATEGORIES.filter((c) => c.showOnHome).sort((a, b) => a.sort - b.sort);
}

export function sortedCategories(): CategoryDef[] {
  return [...CATEGORIES].sort((a, b) => a.sort - b.sort);
}
