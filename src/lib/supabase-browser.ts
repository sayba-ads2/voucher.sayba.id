'use client';

import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from './env';

/** Klien Supabase untuk dashboard admin di browser (login/logout). */
export function createSupabaseBrowserClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
