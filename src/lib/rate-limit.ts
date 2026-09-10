import 'server-only';

/**
 * Rate limiter sederhana berbasis memori proses.
 *
 * Cukup untuk meredam spam dari satu IP pada satu instance serverless. Untuk
 * perlindungan lintas-instance yang lebih ketat, ganti implementasinya dengan
 * Upstash Redis / Vercel KV tanpa mengubah pemanggilnya.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

/** Membersihkan bucket kedaluwarsa agar memori tidak menumpuk. */
export function pruneRateLimits() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function clientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '0.0.0.0'
  );
}
