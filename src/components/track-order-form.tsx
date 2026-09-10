'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Search } from 'lucide-react';

export function TrackOrderForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setError('Masukkan kode invoice terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(clean)}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        router.push(`/invoice/${clean}`);
        return;
      }
      setError(json.error ?? 'Pesanan tidak ditemukan.');
    } catch {
      setError('Gagal menghubungi server. Periksa koneksi internet kamu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface p-5">
      <label htmlFor="invoice" className="mb-1.5 block text-xs font-semibold text-fg-body">
        Kode Invoice
      </label>
      <input
        id="invoice"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="TGM-260905-K7QX4M"
        autoComplete="off"
        className="w-full rounded-lg border border-line bg-surface-2 px-3.5 py-3 font-mono text-sm uppercase text-fg placeholder:font-sans placeholder:normal-case placeholder:text-fg-faint focus:border-brand-strong focus:outline-none"
      />

      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-danger-soft px-3 py-2.5 text-xs font-medium text-danger">
          <AlertCircle className="mt-px h-4 w-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-strong py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Search className="h-4 w-4" aria-hidden />
        )}
        Lacak Pesanan
      </button>
    </form>
  );
}
