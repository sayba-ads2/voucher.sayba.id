import { NextResponse } from 'next/server';
import { NexShopError, checkNickname } from '@/lib/nexshop';
import { getGameBySlug } from '@/lib/queries';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Validasi User ID / Zone ID akun game.
 *
 * Endpoint ini sengaja berada di server: kredensial NexShop tidak boleh
 * menyentuh browser. Dibatasi 20 permintaan per menit per IP agar tidak
 * dipakai orang untuk memindai ID pemain secara massal.
 */
export async function POST(request: Request) {
  const ip = clientIp(request);
  const limit = rateLimit(`nickname:${ip}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { success: false, error: 'Terlalu banyak percobaan. Coba lagi sebentar lagi.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  let body: { slug?: string; user_id?: string; zone_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Format permintaan tidak valid.' }, { status: 400 });
  }

  const { slug, user_id: userId, zone_id: zoneId } = body;
  if (!slug || !userId?.trim()) {
    return NextResponse.json({ success: false, error: 'Data belum lengkap.' }, { status: 400 });
  }

  const game = await getGameBySlug(slug);
  if (!game) {
    return NextResponse.json({ success: false, error: 'Game tidak ditemukan.' }, { status: 404 });
  }
  if (!game.nexshop_game_code) {
    return NextResponse.json(
      { success: false, error: 'Validasi nickname belum tersedia untuk game ini.' },
      { status: 400 },
    );
  }
  if (game.needs_server_id && !zoneId?.trim()) {
    return NextResponse.json(
      { success: false, error: `${game.server_label ?? 'Server ID'} wajib diisi.` },
      { status: 400 },
    );
  }

  try {
    const data = await checkNickname(game.nexshop_game_code, userId.trim(), zoneId?.trim() || null);
    return NextResponse.json({ success: true, data: { username: data.username } });
  } catch (err) {
    if (err instanceof NexShopError) {
      return NextResponse.json(
        { success: false, error: err.publicMessage, code: err.code },
        { status: err.status === 422 ? 422 : 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Gagal memvalidasi akun. Coba lagi sebentar lagi.' },
      { status: 500 },
    );
  }
}
