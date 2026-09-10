import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyWebhookSignature, type NexShopWebhookPayload } from '@/lib/nexshop';
import { logOrderEvent } from '@/lib/fulfillment';
import type { FulfillmentStatus } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Penerima Webhook Relay NexShop.
 *
 * URL yang didaftarkan di Partner Portal:
 *   https://topup.sayba.id/api/webhook/nexshop
 *
 * Tiga aturan yang ditegakkan di sini:
 * 1. Signature diverifikasi dari BYTE MENTAH body sebelum JSON di-parse.
 * 2. Perbandingan signature timing-safe (di dalam verifyWebhookSignature).
 * 3. Pemrosesan idempoten — kiriman ulang untuk reference_id yang sama tidak
 *    boleh mengubah pesanan yang sudah final.
 */

const STATUS_MAP: Record<string, FulfillmentStatus> = {
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
};

export async function POST(request: Request) {
  // Ambil raw body dulu — JSON.stringify hasil parse bisa berbeda susunannya
  // dan membuat verifikasi selalu gagal.
  const rawBody = await request.text();
  const signature = request.headers.get('x-nexshop-signature');
  const event = request.headers.get('x-nexshop-event');

  const valid = verifyWebhookSignature(rawBody, signature);

  let payload: NexShopWebhookPayload | null = null;
  try {
    payload = JSON.parse(rawBody) as NexShopWebhookPayload;
  } catch {
    payload = null;
  }

  await supabaseAdmin().from('webhook_logs').insert({
    source: 'nexshop',
    event: event ?? payload?.event ?? null,
    reference_id: payload?.reference_id ?? null,
    signature_valid: valid,
    status_code: valid ? 200 : 401,
    payload: {
      body: payload ?? { raw: rawBody.slice(0, 2000) },
      // Disimpan untuk menelusuri kegagalan verifikasi: kalau signature_valid
      // false, bandingkan nilai ini dengan HMAC yang dihitung dari kandidat
      // secret lain. Signature bukan rahasia — ia justru dikirim terbuka di
      // header oleh NexShop.
      received_signature: signature,
      raw_body_length: rawBody.length,
    },
  });

  if (!valid) {
    return new NextResponse('signature tidak valid', { status: 401 });
  }
  if (!payload?.reference_id) {
    return new NextResponse('payload tidak lengkap', { status: 400 });
  }

  const { data: order } = await supabaseAdmin()
    .from('orders')
    .select('id, fulfillment_status, base_amount, cost_amount, serial_number')
    .eq('ref_id', payload.reference_id)
    .maybeSingle();

  if (!order) {
    // Balas 200 supaya NexShop tidak mengulang kiriman untuk pesanan yang
    // memang bukan milik kita. Jejaknya sudah tercatat di webhook_logs.
    return NextResponse.json({ received: true, matched: false });
  }

  // Pesanan yang sudah final tidak boleh diubah lagi oleh kiriman ulang.
  if (['SUCCESS', 'FAILED', 'REFUNDED'].includes(order.fulfillment_status)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const status = STATUS_MAP[payload.status] ?? 'PROCESSING';
  const isFinal = status === 'SUCCESS' || status === 'FAILED';

  await supabaseAdmin()
    .from('orders')
    .update({
      fulfillment_status: status,
      nexshop_order_id: payload.order_id ?? null,
      serial_number: payload.serial_number ?? order.serial_number,
      provider_message: payload.message ?? null,
      cost_amount: payload.amount ?? order.cost_amount,
      profit_amount: order.base_amount - (payload.amount ?? order.cost_amount),
      completed_at: isFinal ? new Date().toISOString() : null,
    })
    .eq('id', order.id)
    .not('fulfillment_status', 'in', '("SUCCESS","FAILED","REFUNDED")');

  await logOrderEvent(order.id, 'webhook_received', `Status provider: ${payload.status}`, payload);

  return NextResponse.json({ received: true });
}

/** NexShop memakai GET untuk uji jangkauan endpoint dari Partner Portal. */
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'nexshop-webhook' });
}
