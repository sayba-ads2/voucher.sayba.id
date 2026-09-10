import { NextResponse } from 'next/server';
import { syncCatalog } from '@/lib/sync';
import { isAuthorizedCron } from '@/lib/cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Sinkronisasi katalog + harga modal dari NexShop.
 * Dijadwalkan lewat vercel.json (default: setiap 6 jam).
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ success: false, error: 'Tidak diizinkan.' }, { status: 401 });
  }

  try {
    const result = await syncCatalog();
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Sinkronisasi gagal.' },
      { status: 500 },
    );
  }
}
