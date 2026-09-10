import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { publicEnv } from './env';
import { supabaseAdmin } from './supabase';

/** Klien Supabase yang terikat cookie sesi (server component & route handler). */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Dipanggil dari Server Component — diabaikan, middleware yang menyegarkan sesi.
        }
      },
    },
  });
}

export type AdminSession = {
  userId: string;
  email: string;
  role: string;
  fullName: string | null;
};

/**
 * Mengembalikan sesi admin bila user yang login terdaftar & aktif di admin_users,
 * atau null bila bukan admin. Dipakai sebagai gerbang seluruh halaman /admin.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabaseAdmin()
    .from('admin_users')
    .select('id, email, role, full_name, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (!data || !data.is_active) return null;

  return {
    userId: data.id,
    email: data.email,
    role: data.role,
    fullName: data.full_name,
  };
}
