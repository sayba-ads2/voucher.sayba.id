import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { publicEnv, serverEnv } from './env';

/**
 * Klien service-role. HANYA untuk kode server (route handler / server component).
 * Melewati RLS, jadi jangan pernah diekspor ke komponen client.
 */
let adminClient: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    adminClient = createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'X-Client-Info': 'saybavoucher-server' } },
    });
  }
  return adminClient;
}

/** Klien anon untuk pembacaan etalase publik (tunduk pada RLS). */
export function supabasePublic(): SupabaseClient {
  return createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
