import 'server-only';
import { supabaseAdmin } from './supabase';
import { NexShopError, createOrder, getOrderStatus } from './nexshop';
import type { FulfillmentStatus, Order } from '@/types';

/** Mencatat jejak perubahan pesanan untuk audit & debugging. */
export async function logOrderEvent(
  orderId: string,
  type: string,
  message?: string,
  payload?: unknown,
) {
  await supabaseAdmin()
    .from('order_events')
    .insert({ order_id: orderId, type, message: message ?? null, payload: payload ?? null });
}

const PROVIDER_TO_LOCAL: Record<string, FulfillmentStatus> = {
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
};

/**
 * Meneruskan pesanan yang SUDAH DIBAYAR ke NexShop.
 *
 * Aman dipanggil berkali-kali: pesanan yang sudah pernah diteruskan langsung
 * dilewati, dan `ref_id` yang sama membuat NexShop mengembalikan order lama
 * alih-alih memotong saldo dua kali.
 */
export async function fulfillOrder(order: Order): Promise<{ status: FulfillmentStatus; message: string }> {
  if (order.payment_status !== 'PAID') {
    return { status: order.fulfillment_status, message: 'Pesanan belum dibayar.' };
  }
  if (['SUCCESS', 'FAILED', 'REFUNDED'].includes(order.fulfillment_status)) {
    return { status: order.fulfillment_status, message: 'Pesanan sudah final.' };
  }

  // Kunci optimistik: hanya satu pemanggil yang boleh berpindah ke PROCESSING.
  const { data: locked } = await supabaseAdmin()
    .from('orders')
    .update({ fulfillment_status: 'PROCESSING' })
    .eq('id', order.id)
    .in('fulfillment_status', ['WAITING_PAYMENT', 'QUEUED'])
    .select('id')
    .maybeSingle();

  if (!locked) {
    // Proses lain sudah mengambil pesanan ini — biarkan dia yang menyelesaikan.
    return { status: 'PROCESSING', message: 'Pesanan sedang diproses.' };
  }

  try {
    const result = await createOrder({
      kodeProduk: order.product_code,
      tujuan: order.target,
      serverId: order.server_id,
      refId: order.ref_id,
    });

    const status = PROVIDER_TO_LOCAL[result.status] ?? 'PROCESSING';
    await supabaseAdmin()
      .from('orders')
      .update({
        fulfillment_status: status,
        nexshop_order_id: result.order_id,
        serial_number: result.serial_number,
        cost_amount: result.price ?? order.cost_amount,
        profit_amount: order.base_amount - (result.price ?? order.cost_amount),
        completed_at: status === 'SUCCESS' ? new Date().toISOString() : null,
      })
      .eq('id', order.id);

    await logOrderEvent(order.id, 'provider_order_created', `Status provider: ${result.status}`, result);
    return { status, message: 'Pesanan diteruskan ke penyedia.' };
  } catch (err) {
    const nexErr = err instanceof NexShopError ? err : null;

    // Kegagalan sementara: kembalikan ke antrean supaya cron bisa mencoba lagi.
    if (nexErr?.isRetryable) {
      await supabaseAdmin()
        .from('orders')
        .update({ fulfillment_status: 'QUEUED', provider_message: nexErr.message })
        .eq('id', order.id);
      await logOrderEvent(order.id, 'provider_retry', nexErr.message, { code: nexErr.code });
      return { status: 'QUEUED', message: nexErr.publicMessage };
    }

    const message = nexErr?.message ?? 'Kesalahan tidak dikenal';
    await supabaseAdmin()
      .from('orders')
      .update({ fulfillment_status: 'FAILED', provider_message: message })
      .eq('id', order.id);
    await logOrderEvent(order.id, 'provider_failed', message, { code: nexErr?.code });
    return { status: 'FAILED', message: nexErr?.publicMessage ?? 'Pesanan gagal diproses.' };
  }
}

/**
 * Menyelaraskan status lokal dengan NexShop.
 * Dipakai sebagai jaring pengaman bila webhook terlambat atau tidak sampai.
 */
export async function syncOrderStatus(order: Order): Promise<FulfillmentStatus> {
  if (!order.nexshop_order_id && order.fulfillment_status !== 'PROCESSING') {
    return order.fulfillment_status;
  }
  try {
    const result = await getOrderStatus(order.nexshop_order_id ?? order.ref_id);
    const status = PROVIDER_TO_LOCAL[result.status] ?? order.fulfillment_status;
    if (status === order.fulfillment_status && result.serial_number === order.serial_number) {
      return status;
    }
    await supabaseAdmin()
      .from('orders')
      .update({
        fulfillment_status: status,
        serial_number: result.serial_number,
        nexshop_order_id: result.order_id,
        completed_at:
          status === 'SUCCESS' || status === 'FAILED' ? new Date().toISOString() : null,
      })
      .eq('id', order.id);
    await logOrderEvent(order.id, 'status_synced', `Sinkron ke ${status}`, result);
    return status;
  } catch {
    return order.fulfillment_status;
  }
}

/** Menandai pesanan lunas lalu langsung meneruskannya ke penyedia. */
export async function markPaidAndFulfill(order: Order, reference?: string) {
  if (order.payment_status === 'PAID') return fulfillOrder(order);

  const { data: updated } = await supabaseAdmin()
    .from('orders')
    .update({
      payment_status: 'PAID',
      paid_at: new Date().toISOString(),
      payment_reference: reference ?? order.payment_reference,
      fulfillment_status: 'QUEUED',
    })
    .eq('id', order.id)
    .eq('payment_status', 'PENDING')
    .select('*')
    .maybeSingle();

  const fresh = (updated as Order) ?? { ...order, payment_status: 'PAID' as const, fulfillment_status: 'QUEUED' as const };
  await logOrderEvent(order.id, 'payment_confirmed', 'Pembayaran dikonfirmasi', { reference });
  return fulfillOrder(fresh);
}
