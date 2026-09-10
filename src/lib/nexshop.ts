import 'server-only';
import crypto from 'node:crypto';
import { serverEnv } from './env';

/**
 * Klien REST API Reseller NexShop.
 *
 * Semua fungsi di file ini WAJIB dipanggil dari server (route handler / server
 * action). Kredensial dikirim sebagai header dan tidak boleh sampai ke browser.
 * Referensi: Dokumentasi Reseller & Developer API NexShop, Bab 6-11.
 */

export type NexShopProduct = {
  kode_produk: string;
  nama: string;
  kategori: string;
  operator: string;
  harga_normal: number;
  harga_reseller: number;
  diskon_persen: number;
  hemat: number;
  butuh_server_id: boolean;
  status: string;
};

export type NexShopBalance = {
  balance: number;
  currency: string;
  tier: string | null;
  tier_code: string | null;
  discount_percent: number;
  reseller_status: string;
};

export type NexShopOrder = {
  order_id: string;
  ref_id: string;
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED';
  kode_produk: string;
  nama_produk: string;
  target: string;
  price: number;
  serial_number: string | null;
  balance_remaining?: number;
};

export type NexShopNickname = {
  kode_game: string;
  username: string;
  user_id: string;
  zone_id: string | null;
};

export class NexShopError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly payload?: unknown,
  ) {
    super(message);
    this.name = 'NexShopError';
  }

  /** Pesan yang aman ditampilkan ke pembeli (tanpa membocorkan detail internal). */
  get publicMessage(): string {
    switch (this.code) {
      case 'INVALID_GAME_ACCOUNT':
        return 'User ID atau Server ID tidak ditemukan. Periksa kembali data akun game kamu.';
      case 'UNSUPPORTED_GAME':
        return 'Validasi nickname untuk game ini belum tersedia. Pastikan sendiri ID-nya sudah benar.';
      case 'NICKNAME_PROVIDER_UNAVAILABLE':
        return 'Layanan validasi nickname sedang sibuk. Coba lagi sebentar lagi.';
      case 'RATE_LIMITED':
        return 'Sistem sedang ramai. Mohon tunggu beberapa detik lalu coba lagi.';
      case 'INSUFFICIENT_BALANCE':
        return 'Stok layanan sedang kosong. Hubungi admin lewat WhatsApp, dana kamu aman.';
      default:
        return 'Terjadi kendala di sistem penyedia. Tim kami sudah menerima laporannya.';
    }
  }

  /** True bila layak diulang (masalah sementara, bukan kesalahan data). */
  get isRetryable(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

const TIMEOUT_MS = 20_000;

async function request<T>(
  path: string,
  init: { method: 'GET' | 'POST'; body?: unknown } = { method: 'GET' },
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${serverEnv.nexshopBaseUrl}${path}`, {
      method: init.method,
      headers: {
        'X-NexShop-Api-Key': serverEnv.nexshopApiKey,
        'X-NexShop-Secret': serverEnv.nexshopSecretKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
      cache: 'no-store',
    });

    const text = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new NexShopError(`Respons bukan JSON (HTTP ${res.status})`, res.status, 'BAD_RESPONSE', text);
    }

    if (!res.ok || json.success === false) {
      const code = String(json.code ?? json.error ?? `HTTP_${res.status}`);
      const message = String(json.message ?? json.error ?? `Permintaan gagal (HTTP ${res.status})`);
      throw new NexShopError(message, res.status, code, json);
    }

    return json.data as T;
  } catch (err) {
    if (err instanceof NexShopError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      // Timeout BUKAN berarti order gagal — pemanggil wajib cek status pakai ref_id.
      throw new NexShopError('Koneksi ke NexShop timeout', 504, 'TIMEOUT');
    }
    throw new NexShopError(
      err instanceof Error ? err.message : 'Kesalahan jaringan',
      503,
      'NETWORK_ERROR',
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Sisa saldo deposit Partner Portal + tier aktif. */
export function getBalance() {
  return request<NexShopBalance>('/balance');
}

/** Seluruh katalog produk aktif beserta harga modal sesuai tier. */
export async function getProducts(): Promise<NexShopProduct[]> {
  const data = await request<NexShopProduct[]>('/products');
  return Array.isArray(data) ? data : [];
}

/** Validasi User ID / Zone ID sebelum order dibuat. */
export function checkNickname(kodeGame: string, userId: string, zoneId?: string | null) {
  return request<NexShopNickname>('/check-nickname', {
    method: 'POST',
    body: { kode_game: kodeGame, user_id: userId, zone_id: zoneId ?? undefined },
  });
}

/**
 * Membuat pesanan. `refId` wajib unik per pesanan DAN stabil: kalau permintaan
 * ini perlu diulang karena timeout, kirim refId yang SAMA supaya saldo tidak
 * terpotong dua kali (idempotency di sisi NexShop).
 */
export async function createOrder(params: {
  kodeProduk: string;
  tujuan: string;
  serverId?: string | null;
  refId: string;
}): Promise<NexShopOrder> {
  try {
    return await request<NexShopOrder>('/orders', {
      method: 'POST',
      body: {
        kode_produk: params.kodeProduk,
        tujuan: params.tujuan,
        server_id: params.serverId || undefined,
        ref_id: params.refId,
      },
    });
  } catch (err) {
    // Timeout / putus jaringan: pesanan mungkin sudah terbuat di sisi NexShop.
    // Jangan tandai gagal — cek statusnya dulu pakai ref_id.
    if (err instanceof NexShopError && (err.code === 'TIMEOUT' || err.code === 'NETWORK_ERROR')) {
      try {
        return await getOrderStatus(params.refId);
      } catch {
        throw err;
      }
    }
    throw err;
  }
}

/** Cek status pesanan memakai order_id NexShop atau ref_id milik toko kita. */
export function getOrderStatus(idOrRef: string) {
  return request<NexShopOrder>(`/orders/${encodeURIComponent(idOrRef)}`);
}

/**
 * Verifikasi header X-NexShop-Signature.
 * signature = HEX(HMAC_SHA256(webhook_secret, raw_body)) dihitung atas BYTE
 * MENTAH body. Jangan pakai hasil JSON.stringify — urutan kuncinya bisa
 * berbeda dan verifikasi akan selalu gagal.
 */
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const expected = crypto
    .createHmac('sha256', serverEnv.nexshopWebhookSecret)
    .update(rawBody, 'utf8')
    .digest('hex');

  const a = Buffer.from(signatureHeader.trim());
  const b = Buffer.from(expected);
  // Panjang dibandingkan lebih dulu: timingSafeEqual melempar bila beda panjang.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export type NexShopWebhookPayload = {
  event: string;
  reference_id: string;
  order_id: string;
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED';
  product_code: string;
  product_name: string;
  target: string;
  server_id: string | null;
  amount: number;
  serial_number: string | null;
  message: string;
  timestamp: string;
};
