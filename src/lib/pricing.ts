export type PricingConfig = {
  margin_type: 'percent' | 'fixed';
  margin_value: number;
  /** Keuntungan minimum per transaksi dalam rupiah. */
  min_margin: number;
  /** Pembulatan harga jual ke atas, mis. 100 -> Rp12.300. */
  rounding: number;
  unique_code: boolean;
  unique_code_max: number;
};

export const DEFAULT_PRICING: PricingConfig = {
  margin_type: 'percent',
  margin_value: 6,
  min_margin: 500,
  rounding: 100,
  unique_code: true,
  unique_code_max: 199,
};

/**
 * Menghitung harga jual dari harga modal (harga_reseller NexShop).
 *
 * Margin per-produk menang atas margin global. Hasil selalu dibulatkan KE ATAS
 * ke kelipatan `rounding` sehingga margin tidak pernah tergerus pembulatan.
 */
export function calculateSellPrice(
  costPrice: number,
  config: PricingConfig = DEFAULT_PRICING,
  override?: { margin_type?: 'percent' | 'fixed' | null; margin_value?: number | null },
): number {
  const type = override?.margin_type ?? config.margin_type;
  const value = override?.margin_value ?? config.margin_value;

  const rawMargin = type === 'percent' ? (costPrice * Number(value)) / 100 : Number(value);
  const margin = Math.max(rawMargin, config.min_margin);
  const price = costPrice + margin;

  const step = config.rounding > 0 ? config.rounding : 1;
  return Math.ceil(price / step) * step;
}

/** Kode unik 3 digit untuk mencocokkan transfer manual/QRIS secara otomatis. */
export function generateUniqueCode(config: PricingConfig = DEFAULT_PRICING): number {
  if (!config.unique_code) return 0;
  const max = Math.max(1, Math.min(config.unique_code_max, 999));
  return Math.floor(Math.random() * max) + 1;
}

/** Biaya metode pembayaran (flat + persentase), dibulatkan ke atas. */
export function calculatePaymentFee(
  amount: number,
  method: { fee_flat?: number | null; fee_percent?: number | null },
): number {
  const flat = Number(method.fee_flat ?? 0);
  const percent = (amount * Number(method.fee_percent ?? 0)) / 100;
  return Math.ceil(flat + percent);
}
