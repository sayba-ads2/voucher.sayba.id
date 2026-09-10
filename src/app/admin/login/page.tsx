import type { Metadata } from 'next';
import { LoginForm } from '@/components/admin/login-form';
import { LogoMark } from '@/components/logo';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Masuk Dashboard',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-12">
      <div className="text-center">
        <span className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 ring-1 ring-line">
          <LogoMark className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-fg">Dashboard Admin</h1>
        <p className="mt-1.5 text-sm text-fg-faint">
          Masuk memakai akun Supabase yang terdaftar di tabel admin_users.
        </p>
      </div>
      <div className="mt-7">
        <LoginForm />
      </div>
    </div>
  );
}
