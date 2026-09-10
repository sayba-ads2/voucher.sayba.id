import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession } from '@/lib/supabase-route';
import { fulfillOrder, logOrderEvent, markPaidAndFulfill, syncOrderStatus } from '@/lib/fulfillment';
import type { Order } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Tindakan admin terhadap satu pesanan.
 *  - confirm : tandai lunas (untuk pembayaran manual) lalu proses otomatis
 *  - retry   : ulangi pengiriman ke NexShop
 *  - sync    : tarik status terbaru dari NexShop
 *  - cancel  : batalkan pesanan yang belum dibayar
 *  - refund  : tandai dana sudah dikembalikan ke pembeli
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Tidak diizinkan.' }, { status: 401 });
  }

  const { id } = await context.params;
  const { action, reference } = (await request.json().catch(() => ({}))) as {
    action?: string;
    reference?: string;
  };

  const { data } = await supabaseAdmin().from('orders').select('*').eq('id', id).maybeSingle();
  if (!data) {
    return NextResponse.json({ success: false, error: 'Pesanan tidak ditemukan.' }, { status: 404 });
  }
  const order = data as Order;

  try {
    switch (action) {
      case 'confirm': {
        const result = await markPaidAndFulfill(order, reference);
        return NextResponse.json({ success: true, data: result });
      }
      case 'retry': {
        if (order.payment_status !== 'PAID') {
          return NextResponse.json(
            { success: false, error: 'Pesanan belum lunas.' },
            { status: 400 },
          );
        }
        // Kembalikan ke antrean supaya fulfillOrder mau memprosesnya lagi.
        await supabaseAdmin()
          .from('orders')
          .update({ fulfillment_status: 'QUEUED' })
          .eq('id', order.id);
        const result = await fulfillOrder({ ...order, fulfillment_status: 'QUEUED' });
        await logOrderEvent(order.id, 'admin_retry', `Diulang oleh ${session.email}`);
        return NextResponse.json({ success: true, data: result });
      }
      case 'sync': {
        const status = await syncOrderStatus(order);
        return NextResponse.json({ success: true, data: { status } });
      }
      case 'cancel': {
        await supabaseAdmin()
          .from('orders')
          .update({ payment_status: 'CANCELLED', fulfillment_status: 'FAILED' })
          .eq('id', order.id)
          .eq('payment_status', 'PENDING');
        await logOrderEvent(order.id, 'admin_cancel', `Dibatalkan oleh ${session.email}`);
        return NextResponse.json({ success: true });
      }
      case 'refund': {
        await supabaseAdmin()
          .from('orders')
          .update({ payment_status: 'REFUNDED', fulfillment_status: 'REFUNDED' })
          .eq('id', order.id);
        await logOrderEvent(order.id, 'admin_refund', `Dana dikembalikan oleh ${session.email}`);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ success: false, error: 'Aksi tidak dikenal.' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Terjadi kesalahan.' },
      { status: 500 },
    );
  }
}
