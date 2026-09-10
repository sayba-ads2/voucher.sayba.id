'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calculator, Loader2, RefreshCw, Wallet } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

type Balance = { balance: number; tier: string | null; discount_percent: number; reseller_status: string };

/**
 * Panel operasional: tarik katalog terbaru, hitung ulang harga jual, dan cek
 * sisa saldo deposit Partner Portal. Semua pemanggilan lewat /api/admin/sync
 * supaya kredensial NexShop tetap di server.
 */
export function SyncPanel() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);

  async function run(action: 'sync' | 'recalculate' | 'balance') {
    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();

      if (!json.success) {
        setMessage(`Gagal: ${json.error}`);
        return;
      }

      if (action === 'sync') {
        const d = json.data;
        setMessage(
          `Sinkron selesai: ${d.sellableProducts} produk dari ${d.fetched} di katalog, ${d.gamesCreated} brand baru dibuat (nonaktif).`,
        );
        router.refresh();
      } else if (action === 'recalculate') {
        setMessage(`${json.data.updated} harga jual dihitung ulang.`);
        router.refresh();
      } else {
        setBalance(json.data as Balance);
        setMessage(null);
      }
    } catch {
      setMessage('Gagal menghubungi server.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card-surface p-4">
      <h2 className="text-sm font-bold text-fg">Operasional Katalog</h2>
      <p className="mt-1 text-xs text-fg-faint">
        Sinkronisasi juga berjalan otomatis lewat cron. Tombol di sini untuk memaksa pembaruan
        segera.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => run('sync')}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-strong px-3.5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          {busy === 'sync' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden />
          )}
          Sinkron Katalog NexShop
        </button>

        <button
          type="button"
          onClick={() => run('recalculate')}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2.5 text-xs font-bold text-fg transition-colors hover:border-brand-strong disabled:opacity-60"
        >
          {busy === 'recalculate' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Calculator className="h-4 w-4" aria-hidden />
          )}
          Hitung Ulang Harga
        </button>

        <button
          type="button"
          onClick={() => run('balance')}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-3.5 py-2.5 text-xs font-bold text-fg transition-colors hover:border-brand-strong disabled:opacity-60"
        >
          {busy === 'balance' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Wallet className="h-4 w-4" aria-hidden />
          )}
          Cek Saldo Deposit
        </button>
      </div>

      {balance && (
        <div className="mt-4 grid gap-3 rounded-lg border border-line bg-surface-2 p-4 sm:grid-cols-3">
          <div>
            <span className="text-xs text-fg-faint">Sisa Saldo</span>
            <p className="mt-1 text-lg font-extrabold text-success">
              {formatRupiah(balance.balance)}
            </p>
          </div>
          <div>
            <span className="text-xs text-fg-faint">Tier</span>
            <p className="mt-1 text-lg font-extrabold text-fg">
              {balance.tier ?? 'Belum ada'} ({balance.discount_percent}%)
            </p>
          </div>
          <div>
            <span className="text-xs text-fg-faint">Status Reseller</span>
            <p className="mt-1 text-lg font-extrabold text-fg">{balance.reseller_status}</p>
          </div>
        </div>
      )}

      {message && (
        <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2.5 text-xs text-fg-body">{message}</p>
      )}
    </section>
  );
}
