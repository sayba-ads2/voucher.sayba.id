'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { ExternalLink, Loader2, Pencil, Search } from 'lucide-react';
import { toggleGameField, updateGame } from '@/app/admin/actions';
import { cn } from '@/lib/utils';
import type { Game } from '@/types';

function Toggle({
  checked,
  label,
  onChange,
  disabled,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-success' : 'bg-surface-3',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
          checked ? 'translate-x-5.5' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

function EditForm({ game, onDone }: { game: Game; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateGame(game.id, formData);
      setMessage(result.message);
      if (result.ok) setTimeout(onDone, 900);
    });
  }

  const field =
    'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-fg focus:border-brand-strong focus:outline-none';
  const label = 'mb-1 block text-[11px] font-semibold uppercase tracking-wider text-fg-faint';

  return (
    <form onSubmit={handleSubmit} className="border-t border-line bg-surface-2 p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={label} htmlFor={`name-${game.id}`}>Nama Game</label>
          <input id={`name-${game.id}`} name="name" defaultValue={game.name} className={field} />
        </div>
        <div>
          <label className={label} htmlFor={`slug-${game.id}`}>Slug URL</label>
          <input id={`slug-${game.id}`} name="slug" defaultValue={game.slug} className={field} />
        </div>
        <div>
          <label className={label} htmlFor={`pub-${game.id}`}>Publisher</label>
          <input id={`pub-${game.id}`} name="publisher" defaultValue={game.publisher ?? ''} className={field} />
        </div>
        <div>
          <label className={label} htmlFor={`code-${game.id}`}>Kode Game (cek nickname)</label>
          <input
            id={`code-${game.id}`}
            name="nexshop_game_code"
            defaultValue={game.nexshop_game_code ?? ''}
            placeholder="mis. mobile-legends"
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor={`icon-${game.id}`}>URL Ikon</label>
          <input id={`icon-${game.id}`} name="icon_url" defaultValue={game.icon_url ?? ''} className={field} />
        </div>
        <div>
          <label className={label} htmlFor={`sort-${game.id}`}>Urutan</label>
          <input
            id={`sort-${game.id}`}
            name="sort_order"
            type="number"
            defaultValue={game.sort_order}
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor={`idl-${game.id}`}>Label Input ID</label>
          <input id={`idl-${game.id}`} name="id_label" defaultValue={game.id_label} className={field} />
        </div>
        <div>
          <label className={label} htmlFor={`idp-${game.id}`}>Placeholder ID</label>
          <input
            id={`idp-${game.id}`}
            name="id_placeholder"
            defaultValue={game.id_placeholder}
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor={`sl-${game.id}`}>Label Server</label>
          <input
            id={`sl-${game.id}`}
            name="server_label"
            defaultValue={game.server_label ?? ''}
            className={field}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className={label} htmlFor={`desc-${game.id}`}>Deskripsi Singkat</label>
          <input
            id={`desc-${game.id}`}
            name="short_description"
            defaultValue={game.short_description ?? ''}
            className={field}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className={label} htmlFor={`st-${game.id}`}>SEO Title (kosong = otomatis)</label>
          <input id={`st-${game.id}`} name="seo_title" defaultValue={game.seo_title ?? ''} className={field} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className={label} htmlFor={`sd-${game.id}`}>SEO Description (kosong = otomatis)</label>
          <textarea
            id={`sd-${game.id}`}
            name="seo_description"
            rows={2}
            defaultValue={game.seo_description ?? ''}
            className={field}
          />
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-fg-body">
        <input type="checkbox" name="needs_server_id" defaultChecked={game.needs_server_id} />
        Butuh Server / Zone ID
      </label>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-strong px-4 py-2 text-xs font-bold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          Simpan
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-line px-4 py-2 text-xs font-bold text-fg-body"
        >
          Tutup
        </button>
        {message && <span className="text-xs text-fg-muted">{message}</span>}
      </div>
    </form>
  );
}

export function GamesTable({ games }: { games: Game[] }) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) => g.name.toLowerCase().includes(q) || g.slug.includes(q));
  }, [games, query]);

  function handleToggle(gameId: string, field: 'is_active' | 'is_featured', value: boolean) {
    startTransition(() => toggleGameField(gameId, field, value));
  }

  return (
    <div className="card-surface overflow-hidden">
      <div className="relative border-b border-line p-3">
        <Search className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari game…"
          aria-label="Cari game"
          className="w-full rounded-lg border border-line bg-surface py-2.5 pl-10 pr-3 text-sm text-fg focus:border-brand-strong focus:outline-none"
        />
      </div>

      <ul className="divide-y divide-line">
        {filtered.map((game) => (
          <li key={game.id}>
            <div className="flex flex-wrap items-center gap-4 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-fg">{game.name}</span>
                  {game.is_active && (
                    <Link
                      href={`/${game.slug}`}
                      target="_blank"
                      className="text-fg-faint hover:text-brand-strong"
                      aria-label={`Buka halaman ${game.name}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  )}
                </div>
                <span className="block truncate font-mono text-[11px] text-fg-faint">
                  /{game.slug} · {game.provider_operator ?? '—'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-fg-muted">
                <span className="w-12 text-right">Aktif</span>
                <Toggle
                  checked={game.is_active}
                  label={`Aktifkan ${game.name}`}
                  disabled={pending}
                  onChange={(v) => handleToggle(game.id, 'is_active', v)}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-fg-muted">
                <span className="w-14 text-right">Populer</span>
                <Toggle
                  checked={game.is_featured}
                  label={`Jadikan ${game.name} populer`}
                  disabled={pending}
                  onChange={(v) => handleToggle(game.id, 'is_featured', v)}
                />
              </div>

              <button
                type="button"
                onClick={() => setEditing(editing === game.id ? null : game.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-semibold text-fg-body hover:border-brand-strong hover:text-brand-strong"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Ubah
              </button>
            </div>

            {editing === game.id && <EditForm game={game} onDone={() => setEditing(null)} />}
          </li>
        ))}

        {filtered.length === 0 && (
          <li className="px-4 py-12 text-center text-sm text-fg-faint">
            Tidak ada game yang cocok. Jalankan sinkronisasi katalog lebih dulu.
          </li>
        )}
      </ul>
    </div>
  );
}
