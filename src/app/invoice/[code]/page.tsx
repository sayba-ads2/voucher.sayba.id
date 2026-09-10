import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { AlertTriangle, MessageCircle } from 'lucide-react';

import { CopyButton } from '@/components/copy-button';
import { OrderStatusLive } from '@/components/order-status-live';
import { supabaseAdmin } from '@/lib/supabase';
import { getPaymentMethodByCode, getStoreSettings } from '@/lib/queries';
import { formatDateTime, formatRupiah, waLink } from '@/lib/utils';
import { site } from '@/lib/site';
import type { Order, PublicOrder } from '@/types';

export const dynamic = 'force-dynamic';

/** Halaman invoice bersifat privat bagi pemilik kode — jangan sampai terindeks. */
export const metadata: Metadata = {
  title: 'Detail Pesanan',
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ code: string }> };

export default async function InvoicePage({ params }: Props) {
  const { code } = await params;

  const { data } = await supabaseAdmin()
    .from('orders')
    .select('*')
    .eq('order_code', code.trim().toUpperCase())
    .maybeSingle();

  if (!data) notFound();
  const order = data as Order;

  const [method, store] = await Promise.all([
    order.payment_method ? getPaymentMethodByCode(order.payment_method) : null,
    getStoreSettings(),
  ]);

  const publicOrder: PublicOrder = {
    order_code: order.order_code,
    game_name: order.game_name,
    game_slug: order.game_slug,
    product_name: order.product_name,
    target: order.target,
    server_id: order.server_id,
    nickname: order.nickname,
    total_amount: order.total_amount,
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    fulfillment_status: order.fulfillment_status,
    serial_number: order.serial_number,
    created_at: order.created_at,
    paid_at: order.paid_at,
    completed_at: order.completed_at,
    expires_at: order.expires_at,
  };

  const whatsapp = store.whatsapp || site.contact.whatsapp;
  const showPaymentBox = order.payment_status === 'PENDING';
  const instructions = Array.isArray(method?.instructions) ? (method.instructions as string[]) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-fg">Detail Pesanan</h1>
          <p className="mt-1 text-xs text-fg-faint">
            Dibuat {formatDateTime(order.created_at)} WIB
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2">
          <span className="font-mono text-sm font-bold text-brand-strong">{order.order_code}</span>
          <CopyButton value={order.order_code} label="Salin" />
        </div>
      </div>

      <div className="space-y-4">
        <OrderStatusLive initial={publicOrder} />

        {/* ------------------------------------------------------ pembayaran */}
        {showPaymentBox && method && (
          <section className="card-surface p-5">
            <h2 className="text-sm font-bold text-fg">Selesaikan Pembayaran</h2>

            <div className="mt-4 rounded-lg border border-brand-border/40 bg-brand-strong/5 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">
                Total yang harus dibayar
              </span>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <span className="text-2xl font-extrabold text-brand-strong">
                  {formatRupiah(order.total_amount)}
                </span>
                <CopyButton value={String(order.total_amount)} label="Salin nominal" />
              </div>
              {order.unique_code > 0 && (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-warning">
                  <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
                  Transfer <strong>sama persis</strong> sampai 3 digit terakhir (
                  {order.unique_code}). Angka unik ini yang membuat pembayaranmu terdeteksi
                  otomatis.
                </p>
              )}
            </div>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-fg-faint">Metode</dt>
                <dd className="font-semibold text-fg">{method.name}</dd>
              </div>
              {method.account_number && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-fg-faint">Nomor Tujuan</dt>
                  <dd className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-fg">
                      {method.account_number}
                    </span>
                    <CopyButton value={method.account_number} label="Salin" />
                  </dd>
                </div>
              )}
              {method.account_name && (
                <div className="flex justify-between gap-4">
                  <dt className="text-fg-faint">Atas Nama</dt>
                  <dd className="font-semibold text-fg">{method.account_name}</dd>
                </div>
              )}
              {order.expires_at && (
                <div className="flex justify-between gap-4">
                  <dt className="text-fg-faint">Bayar Sebelum</dt>
                  <dd className="font-semibold text-warning">
                    {formatDateTime(order.expires_at)} WIB
                  </dd>
                </div>
              )}
            </dl>

            {method.qris_image_url && (
              <div className="mt-4 flex justify-center rounded-lg bg-white p-4">
                <Image
                  src={method.qris_image_url}
                  alt="Kode QRIS pembayaran"
                  width={280}
                  height={280}
                  className="h-auto w-64"
                />
              </div>
            )}

            {instructions.length > 0 && (
              <>
                <h3 className="mt-5 text-xs font-bold uppercase tracking-wider text-fg-faint">
                  Cara Membayar
                </h3>
                <ol className="mt-2.5 space-y-2">
                  {instructions.map((step, index) => (
                    <li key={index} className="flex gap-2.5 text-sm text-fg-muted">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-surface-3 text-[11px] font-bold text-brand-strong">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </>
            )}

            <a
              href={waLink(
                whatsapp,
                `Halo admin, saya sudah bayar pesanan ${order.order_code} sebesar Rp${order.total_amount.toLocaleString('id-ID')} lewat ${method.name}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3 text-sm font-bold text-white transition-colors hover:bg-success/90"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Konfirmasi Pembayaran ke Admin
            </a>
          </section>
        )}

        {/* --------------------------------------------------------- rincian */}
        <section className="card-surface p-5">
          <h2 className="text-sm font-bold text-fg">Rincian Pesanan</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-fg-faint">Game</dt>
              <dd className="text-right font-semibold text-fg">
                {order.game_slug ? (
                  <Link href={`/${order.game_slug}`} className="hover:text-brand-strong">
                    {order.game_name}
                  </Link>
                ) : (
                  order.game_name
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg-faint">Produk</dt>
              <dd className="text-right font-semibold text-fg">{order.product_name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-fg-faint">User ID</dt>
              <dd className="text-right font-mono font-semibold text-fg">
                {order.target}
                {order.server_id ? ` (${order.server_id})` : ''}
              </dd>
            </div>
            {order.nickname && (
              <div className="flex justify-between gap-4">
                <dt className="text-fg-faint">Nickname</dt>
                <dd className="text-right font-semibold text-success">{order.nickname}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-line pt-2.5">
              <dt className="text-fg-faint">Harga Produk</dt>
              <dd className="font-semibold text-fg">{formatRupiah(order.base_amount)}</dd>
            </div>
            {order.fee_amount > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-fg-faint">Biaya Pembayaran</dt>
                <dd className="font-semibold text-fg">{formatRupiah(order.fee_amount)}</dd>
              </div>
            )}
            {order.unique_code > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-fg-faint">Kode Unik</dt>
                <dd className="font-semibold text-fg">{formatRupiah(order.unique_code)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 border-t border-line pt-2.5">
              <dt className="font-semibold text-fg">Total</dt>
              <dd className="text-lg font-extrabold text-brand-strong">
                {formatRupiah(order.total_amount)}
              </dd>
            </div>
          </dl>
        </section>

        <p className="text-center text-xs text-fg-faint">
          Simpan kode <span className="font-mono text-fg-body">{order.order_code}</span> untuk
          melacak pesanan ini kapan saja di halaman{' '}
          <Link href="/cek-pesanan" className="text-brand-strong underline">
            Cek Pesanan
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
