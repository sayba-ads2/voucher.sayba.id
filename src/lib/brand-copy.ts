import { getCategory, type CategoryKey } from './categories';
import type { Game } from '@/types';

/**
 * Kata-kata halaman brand, disesuaikan kategorinya.
 *
 * Sebelumnya setiap halaman brand memakai kalimat game: judulnya "Top Up
 * Telkomsel Murah" dan paragrafnya "Beli Diamond Telkomsel". Salah untuk
 * mayoritas katalog, dan mahal di penelusuran — orang mengetik "beli token
 * listrik", "isi pulsa Telkomsel", atau "langganan Netflix", bukan "top up"
 * untuk semuanya.
 *
 * Satu berkas ini yang menentukan kata kerja, kata benda, dan kalimat
 * pendukung per kategori, sehingga judul, H1, breadcrumb, deskripsi meta, dan
 * teks SEO di bawah halaman selalu sejalan.
 */

export type BrandCopy = {
  /** Kata kerja judul, mis. "Top Up", "Isi Pulsa", "Beli". */
  action: string;
  /** Judul H1 penuh. */
  heading: string;
  /** Judul tab / hasil penelusuran, tanpa nama toko (ditambahkan template). */
  title: (cheapest: string) => string;
  /** Kata benda barang yang dijual, mis. "diamond", "kuota", "token". */
  item: string;
  /** Judul blok teks SEO di bawah halaman. */
  seoHeading: string;
  /** Kalimat pembuka blok teks SEO. */
  intro: (count: number, cheapest: string) => string;
  /** Kalimat penutup — apa yang diterima pembeli setelah membayar. */
  delivery: string;
  /** Breadcrumb induk. */
  parent: { name: string; path: string };
  /** Kata kunci dasar untuk metadata. */
  keywords: (brand: string) => string[];
};

const lower = (value: string) => value.toLowerCase();

export function brandCopy(game: Game): BrandCopy {
  const kind: CategoryKey = game.kind;
  const category = getCategory(kind);
  const brand = game.name;
  const parent = { name: category.label, path: `/${category.slug}` };

  const base: Omit<BrandCopy, 'action' | 'heading' | 'title' | 'item' | 'seoHeading' | 'intro' | 'delivery'> = {
    parent,
    keywords: (b) => [
      `${lower(category.label)} ${lower(b)}`,
      `${lower(b)} murah`,
      `beli ${lower(b)} online`,
      ...category.keywords.slice(0, 6),
    ],
  };

  switch (kind) {
    case 'pulsa':
      return {
        ...base,
        action: 'Isi Pulsa',
        heading: `Isi Pulsa ${brand} Online`,
        title: (c) => `Isi Pulsa ${brand} Murah — Mulai ${c}, Masuk Otomatis`,
        item: 'pulsa',
        seoHeading: `Beli Pulsa ${brand} Murah Online`,
        intro: (n, c) =>
          `Tersedia ${n} pilihan nominal pulsa ${brand}${c ? `, mulai dari ${c}` : ''}. Cukup masukkan nomor HP, pulsa masuk otomatis tanpa perlu ke konter.`,
        delivery: 'Pulsa masuk langsung ke nomor tujuan dan bisa dipakai saat itu juga.',
      };

    case 'data':
      return {
        ...base,
        action: 'Beli Paket Data',
        heading: `Beli Paket Data & Kuota ${brand}`,
        title: (c) => `Paket Data ${brand} Murah — Mulai ${c}, Aktif Otomatis`,
        item: 'kuota',
        seoHeading: `Beli Kuota Internet ${brand} Murah`,
        intro: (n, c) =>
          `Ada ${n} pilihan paket data ${brand}${c ? `, mulai dari ${c}` : ''} — harian, mingguan, sampai bulanan. Tidak perlu kode dial, paket langsung aktif.`,
        delivery: 'Kuota aktif otomatis di nomor tujuan, biasanya kurang dari satu menit.',
      };

    case 'perdana':
      return {
        ...base,
        action: 'Beli Kartu Perdana',
        heading: `Beli Kartu Perdana ${brand}`,
        title: (c) => `Kartu Perdana ${brand} Murah — Mulai ${c}, Kuota Besar`,
        item: 'kartu perdana',
        seoHeading: `Kartu Perdana ${brand} dengan Kuota Bawaan`,
        intro: (n, c) =>
          `Tersedia ${n} pilihan kartu perdana ${brand}${c ? `, mulai dari ${c}` : ''}, lengkap dengan kuota bawaannya. Cocok untuk nomor kedua atau pengganti paket bulanan.`,
        delivery: 'Data kartu dan cara aktivasinya dikirim ke kontak yang kamu isi di form.',
      };

    case 'pln':
      return {
        ...base,
        action: 'Beli Token Listrik',
        heading: `Beli Token Listrik ${brand}`,
        title: (c) => `Token Listrik ${brand} — Mulai ${c}, Token Keluar Otomatis`,
        item: 'token listrik',
        seoHeading: `Beli Token Listrik PLN Prabayar Online`,
        intro: (n, c) =>
          `Ada ${n} pilihan nominal token${c ? `, mulai dari ${c}` : ''}. Masukkan nomor meter atau ID pelanggan, nomor token langsung keluar setelah pembayaran.`,
        delivery: 'Nomor token 20 digit ditampilkan di halaman invoice dan dikirim ke WhatsApp kamu.',
      };

    case 'ewallet':
      return {
        ...base,
        action: 'Top Up Saldo',
        heading: `Top Up Saldo ${brand}`,
        title: (c) => `Top Up ${brand} Murah — Mulai ${c}, Saldo Masuk Otomatis`,
        item: 'saldo',
        seoHeading: `Isi Saldo ${brand} Tanpa Ribet`,
        intro: (n, c) =>
          `Tersedia ${n} pilihan nominal saldo ${brand}${c ? `, mulai dari ${c}` : ''}. Cukup nomor HP yang terdaftar — tidak perlu login, tidak perlu OTP.`,
        delivery: 'Saldo masuk langsung ke akun tujuan dan bisa dicek di aplikasinya.',
      };

    case 'voucher':
      return {
        ...base,
        action: 'Beli Voucher',
        heading: `Beli Voucher ${brand}`,
        title: (c) => `Voucher ${brand} Murah — Mulai ${c}, Kode Dikirim Otomatis`,
        item: 'voucher',
        seoHeading: `Beli Kode Voucher ${brand} Resmi`,
        intro: (n, c) =>
          `Ada ${n} pilihan nominal voucher ${brand}${c ? `, mulai dari ${c}` : ''}. Kode yang kamu terima resmi dan bisa langsung ditukarkan.`,
        delivery: 'Kode voucher dikirim otomatis ke email dan tampil di halaman invoice.',
      };

    case 'hiburan':
      return {
        ...base,
        action: 'Berlangganan',
        heading: `Langganan ${brand} Murah`,
        title: (c) => `Langganan ${brand} Murah — Mulai ${c}, Tanpa Kartu Kredit`,
        item: 'langganan',
        seoHeading: `Beli Langganan ${brand} Tanpa Kartu Kredit`,
        intro: (n, c) =>
          `Tersedia ${n} pilihan paket langganan ${brand}${c ? `, mulai dari ${c}` : ''}. Bayar sekali pakai QRIS atau e-wallet — tidak perlu kartu kredit dan tidak ada tagihan otomatis.`,
        delivery: 'Kode atau detail aktivasi dikirim otomatis begitu pembayaran terkonfirmasi.',
      };

    case 'tagihan':
      return {
        ...base,
        action: 'Bayar Tagihan',
        heading: `Bayar Tagihan ${brand}`,
        title: (c) => `Bayar Tagihan ${brand} Online — Cepat & Tanpa Antre`,
        item: 'tagihan',
        seoHeading: `Bayar Tagihan ${brand} Online`,
        intro: (n) =>
          `Tersedia ${n} jenis pembayaran untuk ${brand}. Masukkan nomor pelanggan, tagihan langsung tampil sebelum kamu membayar.`,
        delivery: 'Bukti pelunasan dikirim ke WhatsApp dan tersimpan di halaman invoice.',
      };

    case 'etoll':
      return {
        ...base,
        action: 'Top Up Saldo',
        heading: `Top Up Saldo ${brand}`,
        title: (c) => `Top Up ${brand} — Mulai ${c}, Saldo Langsung Bertambah`,
        item: 'saldo',
        seoHeading: `Isi Saldo Kartu Tol ${brand}`,
        intro: (n, c) =>
          `Ada ${n} pilihan nominal${c ? `, mulai dari ${c}` : ''}. Isi saldo sebelum berangkat supaya tidak tertahan di gerbang tol.`,
        delivery: 'Saldo siap di-update ke kartu lewat aplikasi atau mesin yang tersedia.',
      };

    case 'game':
    default:
      return {
        ...base,
        action: 'Top Up',
        heading: `Top Up ${brand}`,
        title: (c) => `Top Up ${brand} Murah — Mulai ${c}, Proses Otomatis`,
        item: 'diamond',
        seoHeading: `Top Up ${brand} Murah dan Aman`,
        intro: (n, c) =>
          `Tersedia ${n} pilihan nominal${c ? `, mulai dari ${c}` : ''}, tanpa perlu mendaftar akun lebih dulu.`,
        delivery: 'Item masuk otomatis ke akun kamu, biasanya dalam hitungan detik.',
      };
  }
}
