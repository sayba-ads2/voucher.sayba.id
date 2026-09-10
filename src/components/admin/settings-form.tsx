'use client';

import { useState, useTransition } from 'react';
import { Loader2, Save } from 'lucide-react';
import { saveSettings } from '@/app/admin/actions';
import type { PricingConfig } from '@/lib/pricing';
import type { OrderSettings, StoreSettings } from '@/types';

const field =
  'w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-fg focus:border-brand-strong focus:outline-none';
const label = 'mb-1 block text-[11px] font-semibold uppercase tracking-wider text-fg-faint';

export function SettingsForm({
  store,
  pricing,
  order,
}: {
  store: StoreSettings;
  pricing: PricingConfig;
  order: OrderSettings;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveSettings(formData);
      setMessage(result.message);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ------------------------------------------------------------ toko */}
      <section className="card-surface p-5">
        <h2 className="text-sm font-bold text-fg">Identitas Toko</h2>
        <p className="mt-1 text-xs text-fg-faint">
          Dipakai di footer, halaman kontak, structured data, dan tautan WhatsApp.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={label} htmlFor="store_name">Nama Toko</label>
            <input id="store_name" name="store_name" defaultValue={store.name} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="store_tagline">Tagline</label>
            <input id="store_tagline" name="store_tagline" defaultValue={store.tagline} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="store_url">URL Situs</label>
            <input id="store_url" name="store_url" defaultValue={store.url} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="store_whatsapp">WhatsApp (format 62…)</label>
            <input
              id="store_whatsapp"
              name="store_whatsapp"
              defaultValue={store.whatsapp}
              placeholder="6281234567890"
              className={field}
            />
          </div>
          <div>
            <label className={label} htmlFor="store_email">Email</label>
            <input id="store_email" name="store_email" defaultValue={store.email} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="store_hours">Jam Layanan</label>
            <input id="store_hours" name="store_hours" defaultValue={store.open_hours} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="store_city">Kota</label>
            <input id="store_city" name="store_city" defaultValue={store.city} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="store_province">Provinsi</label>
            <input id="store_province" name="store_province" defaultValue={store.province} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="store_address">Alamat</label>
            <input id="store_address" name="store_address" defaultValue={store.address} className={field} />
          </div>
          <div>
            <label className={label} htmlFor="store_instagram">Instagram</label>
            <input
              id="store_instagram"
              name="store_instagram"
              defaultValue={store.instagram ?? ''}
              className={field}
            />
          </div>
          <div>
            <label className={label} htmlFor="store_tiktok">TikTok</label>
            <input id="store_tiktok" name="store_tiktok" defaultValue={store.tiktok ?? ''} className={field} />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- margin */}
      <section className="card-surface p-5">
        <h2 className="text-sm font-bold text-fg">Margin &amp; Harga Jual</h2>
        <p className="mt-1 text-xs leading-relaxed text-fg-faint">
          Harga jual = harga modal + margin, dibulatkan ke atas. Menyimpan halaman ini otomatis
          menghitung ulang seluruh harga produk yang tidak punya margin khusus.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={label} htmlFor="margin_type">Jenis Margin</label>
            <select id="margin_type" name="margin_type" defaultValue={pricing.margin_type} className={field}>
              <option value="percent">Persentase (%)</option>
              <option value="fixed">Nominal tetap (Rp)</option>
            </select>
          </div>
          <div>
            <label className={label} htmlFor="margin_value">Nilai Margin</label>
            <input
              id="margin_value"
              name="margin_value"
              inputMode="decimal"
              defaultValue={pricing.margin_value}
              className={field}
            />
          </div>
          <div>
            <label className={label} htmlFor="min_margin">Laba Minimum (Rp)</label>
            <input
              id="min_margin"
              name="min_margin"
              inputMode="numeric"
              defaultValue={pricing.min_margin}
              className={field}
            />
          </div>
          <div>
            <label className={label} htmlFor="rounding">Pembulatan (Rp)</label>
            <select id="rounding" name="rounding" defaultValue={String(pricing.rounding)} className={field}>
              <option value="1">Tanpa pembulatan</option>
              <option value="100">Rp100</option>
              <option value="500">Rp500</option>
              <option value="1000">Rp1.000</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-fg-body">
            <input type="checkbox" name="unique_code" defaultChecked={pricing.unique_code} />
            Pakai kode unik pada pembayaran manual
          </label>
          <div>
            <label className={label} htmlFor="unique_code_max">Kode Unik Maksimum</label>
            <input
              id="unique_code_max"
              name="unique_code_max"
              inputMode="numeric"
              defaultValue={pricing.unique_code_max}
              className={field}
            />
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------- pesanan */}
      <section className="card-surface p-5">
        <h2 className="text-sm font-bold text-fg">Aturan Pesanan</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={label} htmlFor="expire_minutes">Batas Bayar (menit)</label>
            <input
              id="expire_minutes"
              name="expire_minutes"
              inputMode="numeric"
              defaultValue={order.expire_minutes}
              className={field}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-fg-body">
            <input type="checkbox" name="auto_process" defaultChecked={order.auto_process} />
            Proses otomatis setelah lunas
          </label>
          <label className="flex items-center gap-2 text-sm text-fg-body">
            <input type="checkbox" name="require_whatsapp" defaultChecked={order.require_whatsapp} />
            Wajib isi WhatsApp
          </label>
          <label className="flex items-center gap-2 text-sm text-fg-body">
            <input type="checkbox" name="require_email" defaultChecked={order.require_email} />
            Wajib isi email
          </label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-strong px-5 py-3 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          Simpan Pengaturan
        </button>
        {message && <span className="text-sm text-fg-body">{message}</span>}
      </div>
    </form>
  );
}
