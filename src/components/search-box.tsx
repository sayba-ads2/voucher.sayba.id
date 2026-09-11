'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { POPULAR_SEARCHES } from '@/lib/search';
import { cn, formatRupiah } from '@/lib/utils';

type Suggestion = {
  slug: string;
  name: string;
  kind: string;
  kindLabel: string;
  icon_url: string | null;
  cheapest: number | null;
};

/**
 * Kotak cari global.
 *
 * Prinsipnya: pembeli tidak perlu tahu produk yang ia cari masuk kategori
 * mana. Ia mengetik "netflix", "kuota xl", atau "mlbb", lalu langsung melompat
 * ke halaman pemesanannya.
 *
 * Tetap berfungsi tanpa JavaScript — elemennya form GET sungguhan menuju
 * /cari, jadi menekan Enter selalu membuahkan hasil meski saran instan gagal
 * dimuat. Saran hanyalah percepatan, bukan syarat.
 */
export function SearchBox({
  variant = 'bar',
  autoFocus = false,
  placeholder = 'Cari produk: Netflix, kuota XL, token listrik, Mobile Legends…',
  className,
}: {
  variant?: 'bar' | 'hero';
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ambil saran setelah ketikan berhenti sejenak, dan batalkan permintaan lama
  // supaya jawaban yang datang terlambat tidak menimpa yang terbaru.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        setItems(Array.isArray(json.data) ? json.data : []);
      } catch {
        /* dibatalkan atau jaringan bermasalah — biarkan saran kosong */
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  // Klik di luar kotak menutup daftar saran.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    if (highlight >= 0 && items[highlight]) {
      setOpen(false);
      router.push(`/${items[highlight].slug}`);
      return;
    }
    if (!term) return;
    setOpen(false);
    router.push(`/cari?q=${encodeURIComponent(term)}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || items.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((i) => (i + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((i) => (i <= 0 ? items.length - 1 : i - 1));
    }
  }

  const hero = variant === 'hero';
  const showPopular = open && query.trim().length < 2;
  const showResults = open && query.trim().length >= 2;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <form onSubmit={submit} action="/cari" method="get" role="search">
        <label htmlFor={`${listId}-input`} className="sr-only">
          Cari produk
        </label>
        <Search
          className={cn(
            'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-fg-faint',
            hero ? 'h-5 w-5' : 'h-4 w-4',
          )}
          aria-hidden
        />
        <input
          id={`${listId}-input`}
          ref={inputRef}
          name="q"
          type="search"
          value={query}
          autoFocus={autoFocus}
          autoComplete="off"
          role="combobox"
          aria-expanded={showResults}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-xl border bg-surface pl-11 pr-10 text-fg placeholder:text-fg-faint focus:border-brand-strong focus:outline-none',
            hero
              ? 'border-line-strong py-4 text-[15px] shadow-[0_2px_14px_-8px_rgb(26_26_28/0.35)]'
              : 'border-line py-2.5 text-sm',
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Hapus pencarian"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-faint hover:text-fg"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </form>

      {(showResults || showPopular) && (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-line bg-surface shadow-[0_18px_40px_-20px_rgb(26_26_28/0.45)]"
        >
          {showPopular && (
            <div className="p-3">
              <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-faint">
                Paling dicari
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {POPULAR_SEARCHES.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="inline-flex rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-fg-body hover:border-brand hover:text-brand-strong"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showResults && loading && items.length === 0 && (
            <p className="flex items-center gap-2 px-4 py-5 text-sm text-fg-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Mencari…
            </p>
          )}

          {showResults && !loading && items.length === 0 && (
            <div className="px-4 py-5">
              <p className="text-sm font-semibold text-fg">
                Tidak ada yang cocok dengan &ldquo;{query.trim()}&rdquo;
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                Coba kata yang lebih umum, misalnya nama operator atau nama gamenya saja.
              </p>
            </div>
          )}

          {showResults && items.length > 0 && (
            <ul className="max-h-[22rem] overflow-y-auto py-1">
              {items.map((item, index) => (
                <li key={item.slug} role="option" aria-selected={index === highlight}>
                  <Link
                    href={`/${item.slug}`}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setHighlight(index)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5',
                      index === highlight ? 'bg-brand-soft' : 'hover:bg-surface-2',
                    )}
                  >
                    <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-2 text-[11px] font-bold text-brand-strong">
                      {item.icon_url ? (
                        <Image src={item.icon_url} alt="" fill sizes="36px" className="object-cover" />
                      ) : (
                        item.name.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">
                        {item.name}
                      </span>
                      <span className="block text-[11px] text-fg-faint">{item.kindLabel}</span>
                    </span>
                    {item.cheapest ? (
                      <span className="shrink-0 text-[11px] text-fg-muted">
                        Mulai{' '}
                        <span className="font-bold text-brand-strong">
                          {formatRupiah(item.cheapest)}
                        </span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}

              <li className="border-t border-line">
                <button
                  type="button"
                  onClick={submit}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-brand-strong hover:bg-surface-2"
                >
                  Lihat semua hasil untuk &ldquo;{query.trim()}&rdquo;
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
