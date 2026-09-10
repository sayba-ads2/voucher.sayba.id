'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, MessageCircle, Receipt, X } from 'lucide-react';
import { Logo } from './logo';
import { CATEGORIES } from '@/lib/categories';
import { cn, waLink } from '@/lib/utils';

/** Kategori yang muat di bilah navigasi; sisanya ada di menu dan footer. */
const PRIMARY = ['pulsa', 'data', 'pln', 'game', 'voucher'];

const NAV = CATEGORIES.filter((c) => PRIMARY.includes(c.key))
  .sort((a, b) => a.sort - b.sort)
  .map((c) => ({ href: `/${c.slug}`, label: c.short }));

const MOBILE_NAV = [
  { href: '/', label: 'Beranda' },
  ...CATEGORIES.sort((a, b) => a.sort - b.sort).map((c) => ({
    href: `/${c.slug}`,
    label: c.label,
  })),
  { href: '/cek-pesanan', label: 'Cek Pesanan' },
  { href: '/cara-order', label: 'Cara Order' },
];

export function SiteHeader({ whatsapp }: { whatsapp: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    /* Bilah melayang: tidak menempel ke tepi layar, jadi latar putih tulang
       tetap terlihat di kiri-kanan dan header terbaca sebagai satu objek. */
    <header className="on-ink sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="mx-auto max-w-6xl rounded-2xl bg-ink shadow-[0_6px_24px_-12px_rgb(26_26_28/0.45)] ring-1 ring-ink-line">
        <div className="flex h-15 items-center justify-between gap-4 px-3 sm:px-5">
          <Link href="/" aria-label={`Beranda`} className="shrink-0">
            <Logo tone="dark" />
          </Link>

          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Navigasi utama">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-ink-2 text-brand'
                      : 'text-cream-muted hover:bg-ink-2 hover:text-cream',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/cek-pesanan"
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-cream-muted transition-colors hover:bg-ink-2 hover:text-cream sm:flex"
            >
              <Receipt className="h-4 w-4" aria-hidden />
              Lacak
            </Link>
            <a
              href={waLink(whatsapp, 'Halo admin Sayba, saya mau tanya.')}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-brand-strong hover:text-white sm:flex"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Admin
            </a>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-lg text-cream transition-colors hover:bg-ink-2 lg:hidden"
              aria-label={open ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-ink-line px-3 pb-3 lg:hidden" aria-label="Navigasi seluler">
            <ul className="grid grid-cols-2 gap-1 pt-2">
              {MOBILE_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-cream-muted hover:bg-ink-2 hover:text-cream"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href={waLink(whatsapp, 'Halo admin Sayba, saya mau tanya.')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-semibold text-ink"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Chat Admin
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
