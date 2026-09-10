/**
 * Pembacaan environment variable terpusat.
 *
 * Aturan penting: NEXSHOP_API_KEY / NEXSHOP_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY
 * TIDAK boleh diberi prefix NEXT_PUBLIC_. Prefix itu membuat nilainya ikut
 * ter-bundle ke JavaScript browser dan siapa pun bisa membacanya lewat DevTools.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Environment variable ${name} belum diisi. Cek Vercel > Settings > Environment Variables.`,
    );
  }
  return value;
}

/** Variabel yang aman dibaca di browser. */
export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://topup.sayba.id',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? '',
};

/** Variabel rahasia — hanya boleh dipanggil dari kode server. */
export const serverEnv = {
  get supabaseUrl() {
    return required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseServiceKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get nexshopBaseUrl() {
    return process.env.NEXSHOP_API_BASE ?? 'https://nexshop.cloud/api/v1/reseller';
  },
  get nexshopApiKey() {
    return required('NEXSHOP_API_KEY', process.env.NEXSHOP_API_KEY);
  },
  get nexshopSecretKey() {
    return required('NEXSHOP_SECRET_KEY', process.env.NEXSHOP_SECRET_KEY);
  },
  get nexshopWebhookSecret() {
    return required('NEXSHOP_WEBHOOK_SECRET', process.env.NEXSHOP_WEBHOOK_SECRET);
  },
  /** Token bearer untuk endpoint cron/sinkronisasi internal. */
  get cronSecret() {
    return required('CRON_SECRET', process.env.CRON_SECRET);
  },
};

export const isProduction = process.env.NODE_ENV === 'production';
