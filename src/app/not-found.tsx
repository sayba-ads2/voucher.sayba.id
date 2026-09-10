import Link from 'next/link';
import { Gamepad2, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-2 ring-1 ring-line">
        <Gamepad2 className="h-8 w-8 text-brand" aria-hidden />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold text-fg">Halaman Tidak Ditemukan</h1>
      <p className="mt-3 text-sm leading-relaxed text-fg-muted">
        Alamat yang kamu buka tidak ada, sudah dipindahkan, atau game yang dimaksud belum kami
        aktifkan di etalase.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-strong px-5 py-3 text-sm font-bold text-white hover:bg-brand-hover"
        >
          <Home className="h-4 w-4" aria-hidden />
          Kembali ke Beranda
        </Link>
        <Link
          href="/games"
          className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-sm font-bold text-fg hover:border-line-strong"
        >
          <Search className="h-4 w-4" aria-hidden />
          Cari Game
        </Link>
      </div>
    </div>
  );
}
