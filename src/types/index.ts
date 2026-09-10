export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';

export type FulfillmentStatus =
  | 'WAITING_PAYMENT'
  | 'QUEUED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'REFUNDED';

export type ServerOption = { value: string; label: string };

/**
 * Kategori etalase tempat sebuah brand tampil.
 * Definisi lengkapnya (label, slug, label input) ada di src/lib/categories.ts.
 */
export type { CategoryKey as GameKind } from '@/lib/categories';

export type Game = {
  id: string;
  slug: string;
  name: string;
  publisher: string | null;
  nexshop_game_code: string | null;
  provider_operator: string | null;
  kind: import('@/lib/categories').CategoryKey;
  icon_url: string | null;
  banner_url: string | null;
  short_description: string | null;
  description: string | null;
  id_label: string;
  id_placeholder: string;
  server_label: string | null;
  server_placeholder: string | null;
  needs_server_id: boolean;
  server_options: ServerOption[] | null;
  how_to_order: string[];
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
};

export type Product = {
  id: string;
  game_id: string | null;
  kode_produk: string;
  name: string;
  category: string | null;
  operator: string | null;
  base_price: number;
  cost_price: number;
  margin_type: 'percent' | 'fixed' | null;
  margin_value: number | null;
  sell_price: number;
  needs_server_id: boolean;
  provider_status: string;
  is_active: boolean;
  is_promo: boolean;
  label: string | null;
  sort_order: number;
};

/** Produk seperti yang dikirim ke browser — TANPA harga modal. */
export type PublicProduct = Pick<
  Product,
  'id' | 'kode_produk' | 'name' | 'sell_price' | 'base_price' | 'is_promo' | 'label' | 'needs_server_id'
>;

export type PaymentMethod = {
  id: string;
  code: string;
  name: string;
  group_name: string;
  provider: string;
  icon_url: string | null;
  fee_flat: number;
  fee_percent: number;
  min_amount: number;
  max_amount: number;
  instructions: string[];
  account_name: string | null;
  account_number: string | null;
  qris_image_url: string | null;
  sort_order: number;
};

export type Order = {
  id: string;
  order_code: string;
  ref_id: string;
  game_name: string | null;
  game_slug: string | null;
  product_code: string;
  product_name: string;
  target: string;
  server_id: string | null;
  nickname: string | null;
  contact_whatsapp: string | null;
  contact_email: string | null;
  cost_amount: number;
  base_amount: number;
  fee_amount: number;
  unique_code: number;
  total_amount: number;
  profit_amount: number;
  payment_method: string | null;
  payment_provider: string;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  paid_at: string | null;
  expires_at: string | null;
  fulfillment_status: FulfillmentStatus;
  nexshop_order_id: string | null;
  serial_number: string | null;
  provider_message: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Bentuk order yang aman dikirim ke pembeli di halaman Cek Pesanan. */
export type PublicOrder = Pick<
  Order,
  | 'order_code'
  | 'game_name'
  | 'game_slug'
  | 'product_name'
  | 'target'
  | 'server_id'
  | 'nickname'
  | 'total_amount'
  | 'payment_method'
  | 'payment_status'
  | 'fulfillment_status'
  | 'serial_number'
  | 'created_at'
  | 'paid_at'
  | 'completed_at'
  | 'expires_at'
>;

export type Testimonial = {
  id: string;
  name: string;
  city: string | null;
  game: string | null;
  rating: number;
  message: string;
};

export type Faq = { id: string; question: string; answer: string; category: string | null };

export type StoreSettings = {
  name: string;
  tagline: string;
  url: string;
  whatsapp: string;
  email: string;
  city: string;
  province: string;
  address: string;
  open_hours: string;
  instagram?: string;
  tiktok?: string;
};

export type OrderSettings = {
  expire_minutes: number;
  auto_process: boolean;
  require_whatsapp: boolean;
  require_email: boolean;
};

export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string; code?: string };
