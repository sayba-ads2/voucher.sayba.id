import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/supabase-route';
import { AdminNav } from '@/components/admin/admin-nav';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  // Login tapi belum terdaftar di admin_users: tolak dengan pesan yang jelas,
  // bukan sekadar melempar balik ke halaman login berulang-ulang.
  if (!session) {
    const { createSupabaseServerClient } = await import('@/lib/supabase-route');
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect('/admin/login');

    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="text-xl font-extrabold text-fg">Akses Ditolak</h1>
        <p className="mt-3 text-sm leading-relaxed text-fg-muted">
          Akun <span className="font-semibold text-fg">{user.email}</span> belum terdaftar
          sebagai admin. Tambahkan barisnya ke tabel{' '}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-brand-strong">admin_users</code> di
          Supabase, lalu muat ulang halaman ini.
        </p>
        <Link href="/" className="mt-6 inline-flex text-sm font-semibold text-brand-strong underline">
          Kembali ke beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <AdminNav email={session.email} role={session.role} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
