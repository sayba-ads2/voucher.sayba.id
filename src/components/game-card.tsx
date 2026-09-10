import Image from 'next/image';
import Link from 'next/link';
import { Gamepad2, Lightbulb, Receipt, Signal, Ticket, Tv, Wallet, Wifi } from 'lucide-react';
import type { GameKind } from '@/types';
import { cn, formatRupiah } from '@/lib/utils';
import type { Game } from '@/types';

const PLACEHOLDER_ICON: Partial<Record<GameKind, typeof Ticket>> = {
  pulsa: Signal,
  data: Wifi,
  pln: Lightbulb,
  ewallet: Wallet,
  game: Gamepad2,
  voucher: Ticket,
  tagihan: Receipt,
  hiburan: Tv,
};

const ACTION_LABEL: Partial<Record<GameKind, string>> = {
  pulsa: 'Isi pulsa',
  data: 'Beli paket data',
  pln: 'Beli token',
  ewallet: 'Top up saldo',
  game: 'Top up',
  voucher: 'Beli voucher',
  tagihan: 'Bayar tagihan',
};

const KIND_LABEL: Partial<Record<GameKind, string>> = {
  pulsa: 'Pulsa',
  data: 'Paket data',
  pln: 'Token listrik',
  ewallet: 'Saldo e-wallet',
  game: 'Top up game',
  voucher: 'Voucher digital',
  tagihan: 'Tagihan',
  hiburan: 'Hiburan',
};

/**
 * Kartu etalase.
 *
 * `variant="rail"` memberi lebar tetap agar bisa dipakai di dalam carousel;
 * `variant="grid"` melebar mengikuti kolom grid.
 */
export function GameCard({
  game,
  cheapest,
  variant = 'grid',
}: {
  game: Game;
  cheapest?: number;
  variant?: 'grid' | 'rail';
}) {
  const Placeholder = PLACEHOLDER_ICON[game.kind] ?? Ticket;
  const label = ACTION_LABEL[game.kind] ?? 'Beli';

  return (
    <Link
      href={`/${game.slug}`}
      className={cn(
        'card-surface card-surface-hover group block overflow-hidden',
        variant === 'rail' && 'w-36 sm:w-40',
      )}
      title={`${label} ${game.name}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
        {game.icon_url ? (
          <Image
            src={game.icon_url}
            alt={`Ikon ${game.name}`}
            fill
            sizes="(max-width: 640px) 45vw, 200px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-linear-to-br from-surface-2 to-surface-3">
            <Placeholder className="h-8 w-8 text-fg-faint" aria-hidden />
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-fg">
          {game.name}
        </h3>
        <p className="mt-0.5 truncate text-[11px] text-fg-faint">
          {game.publisher ?? KIND_LABEL[game.kind] ?? 'Produk digital'}
        </p>
        {cheapest ? (
          <p className="mt-2 text-[11px] text-fg-muted">
            Mulai <span className="font-bold text-brand-strong">{formatRupiah(cheapest)}</span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}
