'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession } from '@/lib/supabase-route';
import { getPricingConfig } from '@/lib/queries';
import { calculateSellPrice } from '@/lib/pricing';
import { recalculatePrices } from '@/lib/sync';

/** Semua aksi di bawah ini wajib lewat gerbang ini lebih dulu. */
async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) throw new Error('Tidak diizinkan.');
  return session;
}

export type ActionState = { ok: boolean; message: string };

/** Aktif/nonaktifkan game di etalase, atau tandai sebagai game populer. */
export async function toggleGameField(gameId: string, field: 'is_active' | 'is_featured', value: boolean) {
  await requireAdmin();
  await supabaseAdmin().from('games').update({ [field]: value }).eq('id', gameId);
  revalidatePath('/admin/games');
  revalidatePath('/');
  revalidatePath('/games');
}

export async function updateGame(gameId: string, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const slug = String(formData.get('slug') ?? '').trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    return { ok: false, message: 'Slug hanya boleh huruf kecil, angka, dan tanda hubung.' };
  }

  const { error } = await supabaseAdmin()
    .from('games')
    .update({
      name: String(formData.get('name') ?? '').trim(),
      slug,
      publisher: String(formData.get('publisher') ?? '').trim() || null,
      nexshop_game_code: String(formData.get('nexshop_game_code') ?? '').trim() || null,
      icon_url: String(formData.get('icon_url') ?? '').trim() || null,
      short_description: String(formData.get('short_description') ?? '').trim() || null,
      id_label: String(formData.get('id_label') ?? 'User ID').trim(),
      id_placeholder: String(formData.get('id_placeholder') ?? '').trim() || 'Masukkan User ID',
      server_label: String(formData.get('server_label') ?? '').trim() || null,
      needs_server_id: formData.get('needs_server_id') === 'on',
      seo_title: String(formData.get('seo_title') ?? '').trim() || null,
      seo_description: String(formData.get('seo_description') ?? '').trim() || null,
      sort_order: Number(formData.get('sort_order') ?? 100),
    })
    .eq('id', gameId);

  if (error) return { ok: false, message: error.message };

  revalidatePath('/admin/games');
  revalidatePath(`/${slug}`);
  revalidatePath('/games');
  return { ok: true, message: 'Perubahan tersimpan.' };
}

/** Ubah margin satu produk lalu hitung ulang harga jualnya. */
export async function updateProductMargin(
  productId: string,
  marginType: 'percent' | 'fixed' | '',
  marginValue: string,
): Promise<ActionState> {
  await requireAdmin();

  const { data: product } = await supabaseAdmin()
    .from('products')
    .select('id, cost_price')
    .eq('id', productId)
    .maybeSingle();

  if (!product) return { ok: false, message: 'Produk tidak ditemukan.' };

  const pricing = await getPricingConfig();
  const type = marginType === '' ? null : marginType;
  const value = marginType === '' ? null : Number(marginValue);

  if (type && (Number.isNaN(value) || value === null || value < 0)) {
    return { ok: false, message: 'Nilai margin tidak valid.' };
  }

  const sellPrice = calculateSellPrice(product.cost_price, pricing, {
    margin_type: type,
    margin_value: value,
  });

  await supabaseAdmin()
    .from('products')
    .update({ margin_type: type, margin_value: value, sell_price: sellPrice })
    .eq('id', productId);

  revalidatePath('/admin/products');
  return { ok: true, message: `Harga jual diperbarui menjadi Rp${sellPrice.toLocaleString('id-ID')}.` };
}

export async function toggleProductActive(productId: string, value: boolean) {
  await requireAdmin();
  await supabaseAdmin().from('products').update({ is_active: value }).eq('id', productId);
  revalidatePath('/admin/products');
}

/** Simpan pengaturan toko + margin global, lalu hitung ulang seluruh harga. */
export async function saveSettings(formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const db = supabaseAdmin();

  const store = {
    name: String(formData.get('store_name') ?? '').trim(),
    tagline: String(formData.get('store_tagline') ?? '').trim(),
    url: String(formData.get('store_url') ?? '').trim(),
    whatsapp: String(formData.get('store_whatsapp') ?? '').replace(/\D/g, ''),
    email: String(formData.get('store_email') ?? '').trim(),
    city: String(formData.get('store_city') ?? '').trim(),
    province: String(formData.get('store_province') ?? '').trim(),
    address: String(formData.get('store_address') ?? '').trim(),
    open_hours: String(formData.get('store_hours') ?? '').trim(),
    instagram: String(formData.get('store_instagram') ?? '').trim(),
    tiktok: String(formData.get('store_tiktok') ?? '').trim(),
  };

  const marginValue = Number(formData.get('margin_value') ?? 0);
  const minMargin = Number(formData.get('min_margin') ?? 0);
  if (Number.isNaN(marginValue) || marginValue < 0) {
    return { ok: false, message: 'Nilai margin tidak valid.' };
  }

  const pricing = {
    margin_type: (String(formData.get('margin_type') ?? 'percent') as 'percent' | 'fixed'),
    margin_value: marginValue,
    min_margin: Number.isNaN(minMargin) ? 0 : minMargin,
    rounding: Number(formData.get('rounding') ?? 100),
    unique_code: formData.get('unique_code') === 'on',
    unique_code_max: Number(formData.get('unique_code_max') ?? 199),
  };

  const order = {
    expire_minutes: Number(formData.get('expire_minutes') ?? 60),
    auto_process: formData.get('auto_process') === 'on',
    require_whatsapp: formData.get('require_whatsapp') === 'on',
    require_email: formData.get('require_email') === 'on',
  };

  const now = new Date().toISOString();
  await db.from('settings').upsert([
    { key: 'store', value: store, updated_at: now },
    { key: 'pricing', value: pricing, updated_at: now },
    { key: 'order', value: order, updated_at: now },
  ]);

  const updated = await recalculatePrices();

  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout');
  return { ok: true, message: `Pengaturan tersimpan. ${updated} harga produk dihitung ulang.` };
}

/** Simpan detail satu metode pembayaran (rekening, QRIS, biaya). */
export async function savePaymentMethod(methodId: string, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const { error } = await supabaseAdmin()
    .from('payment_methods')
    .update({
      name: String(formData.get('name') ?? '').trim(),
      account_name: String(formData.get('account_name') ?? '').trim() || null,
      account_number: String(formData.get('account_number') ?? '').trim() || null,
      qris_image_url: String(formData.get('qris_image_url') ?? '').trim() || null,
      fee_flat: Number(formData.get('fee_flat') ?? 0),
      fee_percent: Number(formData.get('fee_percent') ?? 0),
      is_active: formData.get('is_active') === 'on',
    })
    .eq('id', methodId);

  if (error) return { ok: false, message: error.message };

  revalidatePath('/admin/settings');
  return { ok: true, message: 'Metode pembayaran tersimpan.' };
}
