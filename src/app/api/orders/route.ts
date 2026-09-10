import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOrderSettings, getPaymentMethodByCode, getProductByCode, getGameBySlug } from '@/lib/queries';
import { getPricingConfig } from '@/lib/queries';
import { calculatePaymentFee, generateUniqueCode } from '@/lib/pricing';
import { generateOrderCode, generateRefId, isValidPhone, normalizePhone } from '@/lib/utils';
import { logOrderEvent } from '@/lib/fulfillment';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Membuat pesanan baru berstatus MENUNGGU PEMBAYARAN.
 *
 * Catatan keamanan: harga TIDAK PERNAH diambil dari body permintaan. Semua
 * nominal dihitung ulang di server dari tabel `products`, sehingga pembeli
 * tidak bisa memanipulasi harga lewat DevTools.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`order:${ip}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, error: 'Terlalu banyak pesanan dalam waktu singkat. Tunggu sebentar.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  let body: Record<string, string | null>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Format permintaan tidak valid.' }, { status: 400 });
  }

  const slug = String(body.slug ?? '');
  const kodeProduk = String(body.kode_produk ?? '');
  const target = String(body.target ?? '').trim();
  const serverId = body.server_id ? String(body.server_id).trim() : null;
  const nickname = body.nickname ? String(body.nickname).slice(0, 80) : null;
  const methodCode = String(body.payment_method ?? '');
  const whatsappRaw = String(body.whatsapp ?? '').trim();
  const email = body.email ? String(body.email).trim().slice(0, 160) : null;

  if (!slug || !kodeProduk || !target || !methodCode) {
    return NextResponse.json({ success: false, error: 'Data pesanan belum lengkap.' }, { status: 400 });
  }
  if (target.length > 64 || (serverId && serverId.length > 32)) {
    return NextResponse.json({ success: false, error: 'Data akun tidak valid.' }, { status: 400 });
  }

  const [game, product, method, orderSettings, pricing] = await Promise.all([
    getGameBySlug(slug),
    getProductByCode(kodeProduk),
    getPaymentMethodByCode(methodCode),
    getOrderSettings(),
    getPricingConfig(),
  ]);

  if (!game) {
    return NextResponse.json({ success: false, error: 'Game tidak ditemukan.' }, { status: 404 });
  }
  if (!product || !product.is_active || product.provider_status !== 'ACTIVE' || product.game_id !== game.id) {
    return NextResponse.json(
      { success: false, error: 'Nominal ini sedang tidak tersedia. Pilih nominal lain.' },
      { status: 400 },
    );
  }
  if (!method) {
    return NextResponse.json({ success: false, error: 'Metode pembayaran tidak tersedia.' }, { status: 400 });
  }
  if (game.needs_server_id && !serverId) {
    return NextResponse.json(
      { success: false, error: `${game.server_label ?? 'Server ID'} wajib diisi.` },
      { status: 400 },
    );
  }
  if (orderSettings.require_whatsapp && !isValidPhone(whatsappRaw)) {
    return NextResponse.json(
      { success: false, error: 'Nomor WhatsApp tidak valid. Contoh: 081234567890' },
      { status: 400 },
    );
  }

  // --- Perhitungan nominal, seluruhnya di sisi server -----------------------
  const baseAmount = product.sell_price;
  const fee = calculatePaymentFee(baseAmount, method);
  const uniqueCode = method.provider === 'manual' ? generateUniqueCode(pricing) : 0;
  const totalAmount = baseAmount + fee + uniqueCode;

  if (totalAmount < method.min_amount || totalAmount > method.max_amount) {
    return NextResponse.json(
      { success: false, error: 'Nominal di luar batas metode pembayaran ini.' },
      { status: 400 },
    );
  }

  const orderCode = generateOrderCode();
  const expiresAt = new Date(Date.now() + orderSettings.expire_minutes * 60_000).toISOString();

  const { data, error } = await supabaseAdmin()
    .from('orders')
    .insert({
      order_code: orderCode,
      ref_id: generateRefId(orderCode),
      game_id: game.id,
      product_id: product.id,
      game_name: game.name,
      game_slug: game.slug,
      product_code: product.kode_produk,
      product_name: product.name,
      target,
      server_id: serverId,
      nickname,
      contact_whatsapp: whatsappRaw ? normalizePhone(whatsappRaw) : null,
      contact_email: email,
      cost_amount: product.cost_price,
      base_amount: baseAmount,
      fee_amount: fee,
      unique_code: uniqueCode,
      total_amount: totalAmount,
      profit_amount: baseAmount - product.cost_price,
      payment_method: method.code,
      payment_provider: method.provider,
      payment_status: 'PENDING',
      fulfillment_status: 'WAITING_PAYMENT',
      expires_at: expiresAt,
      ip_address: ip,
      user_agent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
    })
    .select('id, order_code')
    .single();

  if (error || !data) {
    return NextResponse.json(
      { success: false, error: 'Gagal membuat pesanan. Coba lagi sebentar lagi.' },
      { status: 500 },
    );
  }

  await logOrderEvent(data.id, 'order_created', `Pesanan dibuat lewat ${method.name}`, {
    total: totalAmount,
  });

  return NextResponse.json({ success: true, data: { order_code: data.order_code } }, { status: 201 });
}
