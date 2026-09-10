'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Gamepad2, LayoutDashboard, LogOut, Receipt, Settings, Tag } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard },
  { href: '/admin/games', label: 'Game', icon: Gamepad2 },
  { href: '/admin/products', label: 'Produk & Margin', icon: Tag },
  { href: '/admin/orders', label: 'Pesanan', icon: Receipt },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
];

export function AdminNav({ email, role }: { email: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="card-surface flex flex-wrap items-center justify-between gap-4 p-3">
      <nav className="flex flex-wrap gap-1" aria-label="Navigasi dashboard">
        {LINKS.map((link) => {
          const active = link.href === '/admin' ? pathname === '/admin' : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                active ? 'bg-brand-strong text-white' : 'text-fg-body hover:bg-surface-2',
              )}
            >
              <link.icon className="h-4 w-4" aria-hidden />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <span className="block text-xs font-semibold text-fg">{email}</span>
          <span className="block text-[10px] uppercase tracking-wider text-fg-faint">{role}</span>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-fg-body transition-colors hover:border-red-500/50 hover:text-danger"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          Keluar
        </button>
      </div>
    </div>
  );
}
