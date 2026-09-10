import { slugify } from './utils';
import { getCategory, type CategoryKey } from './categories';

/**
 * Preset metadata game.
 *
 * Katalog NexShop hanya memberi kolom `operator` (mis. "Mobile Legends").
 * File ini menerjemahkan nilai itu menjadi slug URL yang SEO-friendly, label
 * form yang benar, kode game untuk /check-nickname, dan teks deskripsi.
 *
 * Game yang belum terdaftar di sini tetap ikut tersinkron — dibuat otomatis
 * dengan pengaturan default dan status NONAKTIF, sehingga kamu yang memutuskan
 * mana yang tampil di etalase lewat dashboard /admin.
 */

export type GamePreset = {
  slug: string;
  name: string;
  publisher?: string;
  /** kode_game untuk POST /check-nickname. Kosong = validasi tidak tersedia. */
  nexshopGameCode?: string;
  aliases: string[];
  needsServerId?: boolean;
  idLabel?: string;
  idPlaceholder?: string;
  serverLabel?: string;
  serverPlaceholder?: string;
  serverOptions?: { value: string; label: string }[];
  shortDescription?: string;
  howToOrder?: string[];
  featured?: boolean;
  sortOrder?: number;
};

const DEFAULT_HOW_TO = (idLabel: string) => [
  `Masukkan ${idLabel} dengan benar dan periksa ulang sebelum lanjut.`,
  'Pilih nominal yang ingin dibeli.',
  'Pilih metode pembayaran (QRIS, e-wallet, atau transfer bank).',
  'Isi nomor WhatsApp aktif untuk menerima bukti transaksi.',
  'Selesaikan pembayaran, pesanan diproses otomatis dalam hitungan detik.',
];

export const GAME_PRESETS: GamePreset[] = [
  {
    slug: 'mobile-legends',
    name: 'Mobile Legends: Bang Bang',
    publisher: 'Moonton',
    nexshopGameCode: 'mobile-legends',
    aliases: ['mobile legends', 'mobile legend', 'mlbb', 'ml', 'mobile legends bang bang'],
    needsServerId: true,
    idLabel: 'User ID',
    idPlaceholder: 'Contoh: 123456789',
    serverLabel: 'Zone ID (Server)',
    serverPlaceholder: 'Contoh: 2123',
    shortDescription:
      'Top up diamond Mobile Legends termurah, proses otomatis kurang dari 10 detik.',
    howToOrder: [
      'Buka Mobile Legends, ketuk foto profil di pojok kiri atas.',
      'Salin User ID dan Zone ID (angka dalam kurung).',
      'Masukkan kedua ID tersebut di form, lalu pilih nominal diamond.',
      'Pilih metode pembayaran dan selesaikan pembayaran.',
      'Diamond masuk otomatis, cek notifikasi di dalam game.',
    ],
    featured: true,
    sortOrder: 1,
  },
  {
    slug: 'free-fire',
    name: 'Free Fire',
    publisher: 'Garena',
    nexshopGameCode: 'free-fire',
    aliases: ['free fire', 'freefire', 'ff', 'garena free fire'],
    idLabel: 'User ID',
    idPlaceholder: 'Contoh: 123456789',
    shortDescription: 'Top up diamond Free Fire murah, cukup masukkan User ID tanpa login akun.',
    howToOrder: [
      'Buka Free Fire, ketuk foto profil di pojok kiri atas.',
      'Salin angka User ID / Player ID kamu.',
      'Masukkan User ID di form, lalu pilih nominal diamond.',
      'Pilih metode pembayaran dan selesaikan pembayaran.',
      'Diamond langsung masuk ke akun kamu.',
    ],
    featured: true,
    sortOrder: 2,
  },
  {
    slug: 'pubg-mobile',
    name: 'PUBG Mobile',
    publisher: 'Level Infinite',
    nexshopGameCode: 'pubg-mobile',
    aliases: ['pubg mobile', 'pubgm', 'pubg'],
    idLabel: 'Character ID',
    idPlaceholder: 'Contoh: 5123456789',
    shortDescription: 'Top up UC PUBG Mobile resmi dan murah, langsung masuk ke akun.',
    featured: true,
    sortOrder: 3,
  },
  {
    slug: 'genshin-impact',
    name: 'Genshin Impact',
    publisher: 'HoYoverse',
    nexshopGameCode: 'genshin-impact',
    aliases: ['genshin impact', 'genshin'],
    needsServerId: true,
    idLabel: 'UID',
    idPlaceholder: 'Contoh: 812345678',
    serverLabel: 'Server',
    serverPlaceholder: 'Pilih server',
    serverOptions: [
      { value: 'os_asia', label: 'Asia' },
      { value: 'os_usa', label: 'America' },
      { value: 'os_euro', label: 'Europe' },
      { value: 'os_cht', label: 'TW/HK/MO' },
    ],
    shortDescription: 'Top up Genesis Crystal & Blessing of the Welkin Moon harga hemat.',
    featured: true,
    sortOrder: 4,
  },
  {
    slug: 'honor-of-kings',
    name: 'Honor of Kings',
    publisher: 'Level Infinite',
    nexshopGameCode: 'honor-of-kings',
    aliases: ['honor of kings', 'hok'],
    idLabel: 'Player ID',
    idPlaceholder: 'Contoh: 123456789',
    shortDescription: 'Top up Token Honor of Kings cepat dan murah.',
    featured: true,
    sortOrder: 5,
  },
  {
    slug: 'valorant',
    name: 'VALORANT',
    publisher: 'Riot Games',
    nexshopGameCode: 'valorant',
    aliases: ['valorant'],
    idLabel: 'Riot ID',
    idPlaceholder: 'Contoh: NamaKamu#NA1',
    shortDescription: 'Top up VALORANT Point (VP) tanpa ribet, aman tanpa login.',
    featured: true,
    sortOrder: 6,
  },
  {
    slug: 'call-of-duty-mobile',
    name: 'Call of Duty: Mobile',
    publisher: 'Garena',
    nexshopGameCode: 'call-of-duty-mobile',
    aliases: ['call of duty mobile', 'codm', 'cod mobile', 'cod m'],
    idLabel: 'Open ID',
    idPlaceholder: 'Masukkan Open ID',
    shortDescription: 'Top up CP Call of Duty Mobile murah dan otomatis.',
    sortOrder: 7,
  },
  {
    slug: 'honkai-star-rail',
    name: 'Honkai: Star Rail',
    publisher: 'HoYoverse',
    nexshopGameCode: 'honkai-star-rail',
    aliases: ['honkai star rail', 'honkai: star rail', 'hsr', 'star rail'],
    needsServerId: true,
    idLabel: 'UID',
    idPlaceholder: 'Contoh: 812345678',
    serverLabel: 'Server',
    serverOptions: [
      { value: 'prod_official_asia', label: 'Asia' },
      { value: 'prod_official_usa', label: 'America' },
      { value: 'prod_official_eur', label: 'Europe' },
      { value: 'prod_official_cht', label: 'TW/HK/MO' },
    ],
    shortDescription: 'Top up Oneiric Shard Honkai: Star Rail dengan harga bersahabat.',
    sortOrder: 8,
  },
  {
    slug: 'roblox',
    name: 'Roblox',
    publisher: 'Roblox Corporation',
    nexshopGameCode: 'roblox',
    aliases: ['roblox', 'robux'],
    idLabel: 'Username Roblox',
    idPlaceholder: 'Contoh: playerkeren123',
    shortDescription: 'Beli Robux murah, cukup dengan username Roblox kamu.',
    sortOrder: 9,
  },
  {
    slug: 'point-blank',
    name: 'Point Blank',
    publisher: 'Zepetto',
    nexshopGameCode: 'point-blank',
    aliases: ['point blank', 'pb zepetto', 'pb'],
    idLabel: 'ID Player',
    shortDescription: 'Top up PB Cash Point Blank cepat dan aman.',
    sortOrder: 10,
  },
  {
    slug: 'arena-of-valor',
    name: 'Arena of Valor',
    publisher: 'Garena',
    nexshopGameCode: 'arena-of-valor',
    aliases: ['arena of valor', 'aov'],
    idLabel: 'Player ID',
    shortDescription: 'Top up Voucher Arena of Valor harga reseller.',
    sortOrder: 11,
  },
  {
    slug: 'clash-of-clans',
    name: 'Clash of Clans',
    publisher: 'Supercell',
    nexshopGameCode: 'clash-of-clans',
    aliases: ['clash of clans', 'coc'],
    idLabel: 'Player Tag',
    idPlaceholder: 'Contoh: #ABCD1234',
    shortDescription: 'Top up Gems Clash of Clans lewat Supercell ID.',
    sortOrder: 12,
  },
  {
    slug: 'ragnarok-m',
    name: 'Ragnarok M: Eternal Love',
    publisher: 'Gravity',
    aliases: ['ragnarok m', 'ragnarok m eternal love', 'ragnarok mobile'],
    needsServerId: true,
    idLabel: 'Character ID',
    serverLabel: 'Server',
    shortDescription: 'Top up Big Cat Coin Ragnarok M dengan harga hemat.',
    sortOrder: 13,
  },
  {
    slug: 'stumble-guys',
    name: 'Stumble Guys',
    publisher: 'Scopely',
    aliases: ['stumble guys'],
    idLabel: 'Player ID',
    shortDescription: 'Top up Gems Stumble Guys murah dan instan.',
    sortOrder: 14,
  },
  {
    slug: 'sausage-man',
    name: 'Sausage Man',
    publisher: 'XD Entertainment',
    aliases: ['sausage man'],
    idLabel: 'Player ID',
    shortDescription: 'Top up Candy Sausage Man langsung masuk.',
    sortOrder: 15,
  },
  {
    slug: 'super-sus',
    name: 'Super Sus',
    publisher: 'GoGames',
    aliases: ['super sus'],
    idLabel: 'Player ID',
    shortDescription: 'Top up Golden Star Super Sus harga bersaing.',
    sortOrder: 16,
  },

  {
    slug: 'magic-chess-go-go',
    name: 'Magic Chess: Go Go',
    publisher: 'Moonton',
    aliases: ['magic chess go go', 'magic chess', 'magic chess: go go'],
    idLabel: 'User ID',
    shortDescription: 'Top up Magic Chess: Go Go murah, proses otomatis.',
    sortOrder: 17,
  },
  {
    slug: 'delta-force',
    name: 'Delta Force',
    publisher: 'Team Jade',
    aliases: ['delta force'],
    idLabel: 'Player ID',
    shortDescription: 'Top up Delta Force dengan harga distributor.',
    sortOrder: 18,
  },
  {
    slug: 'ea-sports-fc-mobile',
    name: 'EA Sports FC Mobile',
    publisher: 'Electronic Arts',
    aliases: ['ea sports fc mobile', 'fc mobile', 'ea sports fc'],
    idLabel: 'User ID',
    shortDescription: 'Top up FC Points EA Sports FC Mobile murah.',
    sortOrder: 19,
  },
  {
    slug: 'league-of-legends',
    name: 'League of Legends',
    publisher: 'Riot Games',
    aliases: ['league of legends'],
    idLabel: 'Riot ID',
    idPlaceholder: 'Contoh: NamaKamu#TAG',
    shortDescription: 'Top up Riot Points League of Legends aman dan cepat.',
    sortOrder: 20,
  },
  {
    slug: 'arena-breakout',
    name: 'Arena Breakout',
    publisher: 'Level Infinite',
    aliases: ['arena breakout', 'voucher arena breakout'],
    idLabel: 'Player ID',
    shortDescription: 'Top up Bond Arena Breakout harga hemat.',
    sortOrder: 21,
  },
  {
    slug: 'honkai-impact-3',
    name: 'Honkai Impact 3rd',
    publisher: 'HoYoverse',
    aliases: ['honkai impact 3', 'honkai impact'],
    idLabel: 'UID',
    shortDescription: 'Top up Crystal Honkai Impact 3rd murah.',
    sortOrder: 22,
  },
  {
    slug: 'steam-wallet',
    name: 'Steam Wallet Code',
    publisher: 'Valve',
    aliases: ['voucher steam wallet', 'steam wallet', 'steam'],
    idLabel: 'Email Penerima',
    idPlaceholder: 'nama@email.com',
    shortDescription: 'Beli kode Steam Wallet region Indonesia, kode dikirim otomatis.',
    sortOrder: 30,
  },
  {
    slug: 'razer-gold',
    name: 'Razer Gold',
    publisher: 'Razer',
    aliases: ['voucher razer gold', 'razer gold', 'razer'],
    idLabel: 'Email Penerima',
    idPlaceholder: 'nama@email.com',
    shortDescription: 'Voucher Razer Gold untuk ratusan game sekaligus.',
    sortOrder: 31,
  },
  {
    slug: 'google-play',
    name: 'Google Play Gift Card',
    publisher: 'Google',
    aliases: ['voucher google play', 'google play'],
    idLabel: 'Email Penerima',
    idPlaceholder: 'nama@email.com',
    shortDescription: 'Gift card Google Play untuk pembelian dalam aplikasi dan game.',
    sortOrder: 32,
  },
  {
    slug: 'garena-shell',
    name: 'Garena Shell',
    publisher: 'Garena',
    aliases: ['voucher garena shell', 'garena shell'],
    idLabel: 'Garena ID',
    shortDescription: 'Top up Garena Shell untuk seluruh game Garena.',
    sortOrder: 33,
  },
  {
    slug: 'playstation',
    name: 'PlayStation Network',
    publisher: 'Sony',
    aliases: ['voucher play station', 'playstation', 'play station', 'psn'],
    idLabel: 'Email Penerima',
    idPlaceholder: 'nama@email.com',
    shortDescription: 'Voucher PSN region Indonesia, kode dikirim otomatis.',
    sortOrder: 34,
  },
  {
    slug: 'xbox',
    name: 'Xbox Game Pass & Gift Card',
    publisher: 'Microsoft',
    aliases: ['voucher xbox', 'xbox'],
    idLabel: 'Email Penerima',
    idPlaceholder: 'nama@email.com',
    shortDescription: 'Voucher Xbox dan Game Pass harga bersaing.',
    sortOrder: 35,
  },
  {
    slug: 'efootball',
    name: 'eFootball',
    publisher: 'Konami',
    aliases: ['voucher efootball', 'efootball', 'e football'],
    idLabel: 'User ID',
    shortDescription: 'Top up eFootball Coin murah dan legal.',
    sortOrder: 36,
  },
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const ALIAS_INDEX = new Map<string, GamePreset>();
for (const preset of GAME_PRESETS) {
  ALIAS_INDEX.set(normalize(preset.name), preset);
  ALIAS_INDEX.set(normalize(preset.slug), preset);
  for (const alias of preset.aliases) ALIAS_INDEX.set(normalize(alias), preset);
}

/** Mencari preset berdasarkan nilai `operator` dari katalog NexShop. */
export function findPreset(operator: string): GamePreset | null {
  const key = normalize(operator);
  const exact = ALIAS_INDEX.get(key);
  if (exact) return exact;

  // Cocokkan sebagian: "Topup Mobile Legends" -> mobile-legends.
  for (const [alias, preset] of ALIAS_INDEX) {
    if (alias.length >= 5 && (key.includes(alias) || alias.includes(key))) return preset;
  }
  return null;
}


/**
 * Merapikan nama operator katalog untuk kategori non-game.
 *
 * Katalog menuliskan brand yang sama dengan banyak awalan: "Pulsa Telkomsel",
 * "DATA TELKOMSEL", "VOUCHER TELKOMSEL", "Injek V.Telkomsel". Awalan itu
 * dibuang agar kartu etalase cukup menampilkan "Telkomsel", sementara slug
 * tetap diberi awalan kategori supaya Telkomsel di halaman Pulsa dan di
 * halaman Paket Data tidak saling menimpa.
 */
const BRAND_PREFIXES = [
  'injek v.', 'injek v', 'voucher', 'pulsa', 'paket data', 'data', 'token',
  'saldo', 'tagihan', 'act', 'transfer',
];

function cleanBrandName(operator: string): string {
  let name = operator.trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of BRAND_PREFIXES) {
      const lower = name.toLowerCase();
      if (lower.startsWith(prefix + ' ') || lower.startsWith(prefix + '.')) {
        name = name.slice(prefix.length + 1).trim();
        changed = true;
      }
    }
  }
  if (!name) name = operator.trim();

  // "TELKOMSEL" -> "Telkomsel", tapi akronim pendek seperti PLN dibiarkan.
  return name
    .split(/\s+/)
    .map((word) =>
      word.length > 3 && word === word.toUpperCase()
        ? word[0] + word.slice(1).toLowerCase()
        : word,
    )
    .join(' ');
}

/** Awalan slug per kategori agar brand yang sama di dua kategori tidak bentrok. */
const SLUG_PREFIX: Partial<Record<CategoryKey, string>> = {
  pulsa: 'pulsa',
  data: 'paket-data',
  pln: 'token-listrik',
  ewallet: 'e-wallet',
  tagihan: 'tagihan',
  etoll: 'e-toll',
};

/** Kalimat pembuka per kategori, dipakai bila brand tidak punya preset. */
const CATEGORY_BLURB: Record<CategoryKey, (brand: string) => string> = {
  pulsa: (b) => `Isi pulsa ${b} otomatis, masuk dalam hitungan detik.`,
  data: (b) => `Beli paket data ${b} tanpa kode dial, langsung aktif.`,
  pln: (b) => `Beli token listrik ${b} prabayar, nomor token dikirim otomatis.`,
  ewallet: (b) => `Top up saldo ${b} langsung ke nomor terdaftar.`,
  game: (b) => `Top up ${b} dengan harga distributor, tanpa perlu login akun.`,
  voucher: (b) => `Beli voucher ${b}, kode dikirim otomatis setelah pembayaran.`,
  tagihan: (b) => `Bayar tagihan ${b} kapan saja tanpa antre.`,
  hiburan: (b) => `Beli langganan ${b} dengan harga bersaing.`,
  etoll: (b) => `Top up saldo ${b} untuk perjalanan tanpa antre.`,
  lainnya: (b) => `Beli produk ${b} dengan proses otomatis.`,
};

/**
 * Membentuk baris tabel `games` (etalase brand) dari nilai operator katalog.
 *
 * Preset dipakai lebih dulu; brand tanpa preset — dan itu mayoritas, karena
 * katalog punya ratusan operator — memakai label bawaan kategorinya. Semua
 * baris baru dibuat nonaktif supaya kamu yang memilih untuk menjualnya.
 */
export function buildGameRow(
  operator: string,
  needsServerId: boolean,
  categoryKey: CategoryKey = 'game',
) {
  const category = getCategory(categoryKey);
  const preset = categoryKey === 'game' || categoryKey === 'voucher' ? findPreset(operator) : null;
  const idLabel = preset?.idLabel ?? category.targetLabel;

  const brandName = preset?.name ?? (categoryKey === 'game' ? operator : cleanBrandName(operator));
  const prefix = SLUG_PREFIX[categoryKey];
  const slug =
    preset?.slug ?? (prefix ? `${prefix}-${slugify(brandName)}` : slugify(brandName));

  return {
    slug,
    name: brandName,
    publisher: preset?.publisher ?? null,
    nexshop_game_code: preset?.nexshopGameCode ?? null,
    provider_operator: operator,
    short_description:
      preset?.shortDescription ?? CATEGORY_BLURB[categoryKey](brandName),
    id_label: idLabel,
    id_placeholder: preset?.idPlaceholder ?? category.targetPlaceholder,
    server_label: preset?.serverLabel ?? 'Server / Zone ID',
    server_placeholder: preset?.serverPlaceholder ?? 'Masukkan Zone ID',
    needs_server_id: preset?.needsServerId ?? needsServerId,
    server_options: preset?.serverOptions ?? null,
    how_to_order: preset?.howToOrder ?? DEFAULT_HOW_TO(idLabel),
    is_featured: preset?.featured ?? false,
    sort_order: preset?.sortOrder ?? 100,
  };
}
