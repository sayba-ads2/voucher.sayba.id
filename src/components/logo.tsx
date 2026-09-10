import Image from 'next/image';
import { cn } from '@/lib/utils';
import { site } from '@/lib/site';

/**
 * Lambang Sayba.
 *
 * `public/logo-mark.png` adalah potongan persegi dari `public/logo.png` yang
 * kamu unggah — lambang "SY." beserta latar gelapnya, dipangkas rapat supaya
 * tetap terbaca di ukuran kecil. Kalau logo utamanya diganti, jalankan ulang
 * skrip pembuat aset agar potongan dan favicon ikut diperbarui.
 */
export function LogoMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/logo-mark.png"
      alt=""
      width={size}
      height={size}
      priority
      className={cn('rounded-lg object-cover', className)}
    />
  );
}

export function Logo({
  className,
  compact = false,
  tone = 'light',
}: {
  className?: string;
  compact?: boolean;
  /** 'light' untuk latar terang, 'dark' untuk header & footer abu hitam. */
  tone?: 'light' | 'dark';
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className="h-9 w-9 shrink-0" size={72} />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'text-[15px] font-bold tracking-tight',
              tone === 'dark' ? 'text-cream' : 'text-fg',
            )}
          >
            {site.name}
          </span>
          <span
            className={cn(
              'mt-1 text-[10px] font-medium uppercase tracking-[0.16em]',
              tone === 'dark' ? 'text-cream-muted' : 'text-fg-faint',
            )}
          >
            {site.shortTagline}
          </span>
        </span>
      )}
    </span>
  );
}
