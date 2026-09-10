const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatRupiah(value: number | null | undefined): string {
  return rupiah.format(Number(value ?? 0));
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('id-ID').format(Number(value ?? 0));
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
}

/** Menggabungkan class Tailwind secara kondisional. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

/** Kode invoice yang dilihat pembeli, mis. TGM-260905-K7QX4M. */
export function generateOrderCode(): string {
  const d = new Date();
  const stamp =
    String(d.getFullYear()).slice(2) +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  return `TGM-${stamp}-${randomCode(6)}`;
}

/**
 * ref_id yang dikirim ke NexShop. Harus unik per pesanan dan dipakai ulang
 * saat retry agar saldo tidak terpotong dua kali.
 */
export function generateRefId(orderCode: string): string {
  return `TGM${orderCode.replace(/-/g, '')}`;
}

/** Normalisasi nomor WhatsApp Indonesia ke format 62xxxxxxxxxx. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function isValidPhone(input: string): boolean {
  const n = normalizePhone(input);
  return /^62\d{8,13}$/.test(n);
}

/** Menyensor sebagian ID sebelum ditampilkan di daftar publik. */
export function maskTarget(target: string): string {
  if (target.length <= 4) return `${target[0] ?? ''}***`;
  return `${target.slice(0, 3)}${'*'.repeat(Math.max(3, target.length - 5))}${target.slice(-2)}`;
}

export function waLink(phone: string, message?: string): string {
  const base = `https://wa.me/${normalizePhone(phone)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
