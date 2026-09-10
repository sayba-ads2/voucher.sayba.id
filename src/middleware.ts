import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Menyegarkan sesi Supabase pada tiap permintaan dan menjaga pintu /admin.
 *
 * Pemeriksaan "apakah user ini benar-benar admin" tetap dilakukan di server
 * (lihat getAdminSession) — middleware hanya menyaring pengunjung yang sama
 * sekali belum login supaya tidak membebani basis data.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/admin/login';

  if (pathname.startsWith('/admin') && !isLoginPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Jalankan pada semua rute kecuali aset statis, gambar hasil optimasi,
     * dan webhook (webhook harus bebas dari pemeriksaan sesi).
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|api/webhook|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
};
