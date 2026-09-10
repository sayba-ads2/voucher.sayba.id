import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/supabase-route';
import { recalculatePrices, syncCatalog } from '@/lib/sync';
import { getBalance } from '@/lib/nexshop';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Aksi katalog dari dashboard admin.
 *  - action "sync"        : tarik ulang katalog & harga modal dari NexShop
 *  - action "recalculate" : hitung ulang harga jual setelah margin diubah
 *  - action "balance"     : cek sisa saldo deposit Partner Portal
 */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Tidak diizinkan.' }, { status: 401 });
  }

  const { action } = (await request.json().catch(() => ({}))) as { action?: string };

  try {
    switch (action) {
      case 'sync':
        return NextResponse.json({ success: true, data: await syncCatalog() });
      case 'recalculate':
        return NextResponse.json({ success: true, data: { updated: await recalculatePrices() } });
      case 'balance':
        return NextResponse.json({ success: true, data: await getBalance() });
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
