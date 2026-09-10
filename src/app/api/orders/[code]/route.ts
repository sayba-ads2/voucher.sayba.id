import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { syncOrderStatus } from '@/lib/fulfillment';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import type { Order, PublicOrder } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Kolom yang boleh dilihat pembeli — data modal & keuntungan tidak ikut. */
const PUBLIC_COLUMNS =
  'order_code, game_name, game_slug, product_name, target, server_id, nickname, total_amount, payment_method, payment_status, fulfillment_status, serial_number, created_at, paid_at, completed_at, expires_at';

/**
 * Status pesanan untuk halaman Cek Pesanan / Invoice.
 *
 * Kode invoice bersifat acak dan tidak bisa ditebak, jadi ia berperan sebagai
 * token akses. Untuk pesanan yang masih diproses, status diselaraskan dulu ke
 * NexShop sebagai jaring pengaman bila webhook terlambat.
 */
export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const ip = clientIp(request);

  const limit = rateLimit(`track:${ip}`, 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, error: 'Terlalu banyak permintaan. Tunggu sebentar.' },
      { status: 429 },
    );
  }

  if (!code || code.length > 40) {
    return NextResponse.json({ success: false, error: 'Kode invoice tidak valid.' }, { status: 400 });
  }

  const { data: full } = await supabaseAdmin()
    .from('orders')
    .select('*')
    .eq('order_code', code.trim().toUpperCase())
    .maybeSingle();

  if (!full) {
    return NextResponse.json(
      { success: false, error: 'Pesanan tidak ditemukan. Periksa kembali kode invoice kamu.' },
      { status: 404 },
    );
  }

  const order = full as Order;

  if (order.fulfillment_status === 'PROCESSING') {
    await syncOrderStatus(order);
  }

  const { data: fresh } = await supabaseAdmin()
    .from('orders')
    .select(PUBLIC_COLUMNS)
    .eq('id', order.id)
    .single();

  return NextResponse.json({ success: true, data: fresh as PublicOrder });
}
