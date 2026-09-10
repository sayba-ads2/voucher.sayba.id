'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { savePaymentMethod } from '@/app/admin/actions';

type Method = {
  id: string;
  code: string;
  name: string;
  group_name: string;
  provider: string;
  account_name: string | null;
  account_number: string | null;
  qris_image_url: string | null;
  fee_flat: number;
  fee_percent: number;
  is_active: boolean;
};

const field =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg focus:border-brand-strong focus:outline-none';
const label = 'mb-1 block text-[11px] font-semibold uppercase tracking-wider text-fg-faint';

function MethodRow({ method }: { method: Method }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await savePaymentMethod(method.id, formData);
      setMessage(result.message);
      setTimeout(() => setMessage(null), 2500);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-line p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-surface-3 px-2.5 py-1 font-mono text-xs font-bold text-brand-strong">
          {method.code}
        </span>
        <span className="text-xs text-fg-faint">{method.group_name}</span>
        <label className="ml-auto flex items-center gap-2 text-xs text-fg-body">
          <input type="checkbox" name="is_active" defaultChecked={method.is_active} />
          Aktif
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={label} htmlFor={`n-${method.id}`}>Nama Tampilan</label>
          <input id={`n-${method.id}`} name="name" defaultValue={method.name} className={field} />
        </div>
        <div>
          <label className={label} htmlFor={`an-${method.id}`}>Atas Nama</label>
          <input
            id={`an-${method.id}`}
            name="account_name"
            defaultValue={method.account_name ?? ''}
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor={`ac-${method.id}`}>Nomor Rekening / HP</label>
          <input
            id={`ac-${method.id}`}
            name="account_number"
            defaultValue={method.account_number ?? ''}
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor={`ff-${method.id}`}>Biaya Tetap (Rp)</label>
          <input
            id={`ff-${method.id}`}
            name="fee_flat"
            inputMode="numeric"
            defaultValue={method.fee_flat}
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor={`fp-${method.id}`}>Biaya Persen (%)</label>
          <input
            id={`fp-${method.id}`}
            name="fee_percent"
            inputMode="decimal"
            defaultValue={method.fee_percent}
            className={field}
          />
        </div>
        <div>
          <label className={label} htmlFor={`q-${method.id}`}>URL Gambar QRIS</label>
          <input
            id={`q-${method.id}`}
            name="qris_image_url"
            defaultValue={method.qris_image_url ?? ''}
            placeholder="https://…/qris.png"
            className={field}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-xs font-bold text-fg hover:border-brand-strong hover:text-brand-strong disabled:opacity-60"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          Simpan
        </button>
        {message && <span className="text-xs text-fg-muted">{message}</span>}
      </div>
    </form>
  );
}

export function PaymentMethodsEditor({ methods }: { methods: Method[] }) {
  return (
    <section className="card-surface overflow-hidden">
      <div className="p-5 pb-0">
        <h2 className="text-sm font-bold text-fg">Metode Pembayaran</h2>
        <p className="mt-1 text-xs leading-relaxed text-fg-faint">
          Isi nomor rekening / e-wallet dan unggah gambar QRIS statis kamu (misalnya ke Supabase
          Storage), lalu tempel URL-nya di sini. Metode berprovider{' '}
          <code className="rounded bg-surface-2 px-1 text-brand-strong">manual</code> perlu kamu
          konfirmasi sendiri di halaman Pesanan setelah dana masuk.
        </p>
      </div>

      <div className="mt-4">
        {methods.map((method) => (
          <MethodRow key={method.id} method={method} />
        ))}
        {methods.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-fg-faint">
            Belum ada metode pembayaran. Jalankan 02_seed.sql di Supabase.
          </p>
        )}
      </div>
    </section>
  );
}
