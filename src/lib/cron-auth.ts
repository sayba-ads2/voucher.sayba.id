import 'server-only';

/**
 * Gerbang untuk endpoint terjadwal.
 *
 * Vercel Cron memanggil dengan header `Authorization: Bearer <CRON_SECRET>`.
 * Tanpa ini, siapa pun yang tahu URL-nya bisa memicu sinkronisasi berulang.
 */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  return header === `Bearer ${secret}`;
}
