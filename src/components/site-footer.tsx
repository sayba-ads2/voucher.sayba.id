import Link from 'next/link';
import { Clock, Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import { Logo } from './logo';
import { CATEGORIES } from '@/lib/categories';
import { site } from '@/lib/site';
import { waLink } from '@/lib/utils';
import type { Game } from '@/types';

export function SiteFooter({ games, whatsapp }: { games: Game[]; whatsapp: string }) {
  const year = new Date().getFullYear();
  const categories = [...CATEGORIES].sort((a, b) => a.sort - b.sort);
  const popular = games.slice(0, 6);

  return (
    <footer className="on-ink mt-16 bg-ink text-cream-muted">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo tone="dark" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Satu tempat untuk pulsa, paket data, token listrik, saldo e-wallet, voucher
              digital, dan top up game. Diproses otomatis, harga transparan.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-ink-2 px-3 py-2 text-xs font-medium text-cream">
              <ShieldCheck className="h-4 w-4 text-brand" aria-hidden />
              Distributor berlisensi
            </div>
          </div>

          <div className="md:col-span-3">
            <h2 className="text-sm font-semibold text-cream">Kategori</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {categories.map((category) => (
                <li key={category.key}>
                  <Link href={`/${category.slug}`} className="transition-colors hover:text-brand">
                    {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h2 className="text-sm font-semibold text-cream">Populer</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {popular.map((game) => (
                <li key={game.id}>
                  <Link href={`/${game.slug}`} className="transition-colors hover:text-brand">
                    {game.name}
                  </Link>
                </li>
              ))}
              {popular.length === 0 && <li className="text-cream-muted">Segera hadir</li>}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h2 className="text-sm font-semibold text-cream">Bantuan</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-2.5">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                <a href={waLink(whatsapp)} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                  WhatsApp Admin
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                <a href={`mailto:${site.contact.email}`} className="hover:text-brand">
                  {site.contact.email}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                <span>{site.contact.hours}</span>
              </li>
            </ul>

            <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <li><Link href="/cek-pesanan" className="hover:text-brand">Cek Pesanan</Link></li>
              <li><Link href="/cara-order" className="hover:text-brand">Cara Order</Link></li>
              <li><Link href="/tentang-kami" className="hover:text-brand">Tentang</Link></li>
              <li><Link href="/kontak" className="hover:text-brand">Kontak</Link></li>
              <li><Link href="/syarat-ketentuan" className="hover:text-brand">S&amp;K</Link></li>
              <li><Link href="/kebijakan-privasi" className="hover:text-brand">Privasi</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-ink-line pt-6 text-xs sm:flex-row">
          <p>© {year} {site.name}. Bagian dari Sayba Arc.</p>
          <p className="text-center sm:text-right">
            Semua merek dagang adalah milik pemegang hak masing-masing dan tidak berafiliasi
            dengan situs ini.
          </p>
        </div>
      </div>
    </footer>
  );
}
