import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fulfillOrder, syncOrderStatus } from '@/lib/fulfillment';
import { isAuthorizedCron } from '@/lib/cron-auth';
import { pruneRateLimits } from '@/lib/rate-limit';
import type { Order } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Jaring pengaman berkala (default tiap 5 menit lewat vercel.json):
 *
 * 1. Menutup pesanan yang tidak dibayar sampai batas waktu.
 * 2. Mengulang pesanan lunas yang sempat gagal diteruskan karena gangguan.
 * 3. Menyelaraskan pesanan PROCESSING bila webhook tidak kunjung datang.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ success: false, error: 'Tidak diizinkan.' }, { status: 401 });
  }

  const db = supabaseAdmin();
  const now = new Date().toISOString();

  // 1. Kedaluwarsa -----------------------------------------------------------
  const { data: expired } = await db
    .from('orders')
    .update({ payment_status: 'EXPIRED' })
    .eq('payment_status', 'PENDING')
    .lt('expires_at', now)
    .select('id');

  // 2. Antrean yang perlu diulang -------------------------------------------
  const { data: queued } = await db
    .from('orders')
    .select('*')
    .eq('payment_status', 'PAID')
    .in('fulfillment_status', ['QUEUED', 'WAITING_PAYMENT'])
    .order('created_at', { ascending: true })
    .limit(20);

  let retried = 0;
  for (const order of (queued as Order[]) ?? []) {
    await fulfillOrder(order);
    retried++;
  }

  // 3. Pesanan yang masih menggantung di provider ---------------------------
  const staleThreshold = new Date(Date.now() - 2 * 60_000).toISOString();
  const { data: processing } = await db
    .from('orders')
    .select('*')
    .eq('fulfillment_status', 'PROCESSING')
    .lt('updated_at', staleThreshold)
    .order('updated_at', { ascending: true })
    .limit(30);

  let synced = 0;
  for (const order of (processing as Order[]) ?? []) {
    await syncOrderStatus(order);
    synced++;
  }

  pruneRateLimits();

  return NextResponse.json({
    success: true,
    data: { expired: expired?.length ?? 0, retried, synced },
  });
}
