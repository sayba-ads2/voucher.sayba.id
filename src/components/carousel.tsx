'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Carousel dibangun di atas scroll-snap asli browser, bukan pustaka pihak ketiga.
 *
 * Konsekuensinya bagus: di ponsel geser jari terasa native (momentum scroll
 * bawaan sistem), di desktop ada tombol panah, tidak ada JavaScript yang perlu
 * dimuat sebelum konten bisa digulir, dan isinya tetap terbaca crawler karena
 * seluruh slide ada di DOM sejak awal.
 */

function useRailState(ref: React.RefObject<HTMLDivElement | null>) {
  const [state, setState] = useState({ atStart: true, atEnd: false, scrollable: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setState({
      atStart: el.scrollLeft <= 4,
      atEnd: el.scrollLeft >= max - 4,
      scrollable: max > 8,
    });
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { passive: true });

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  }, [ref, measure]);

  return state;
}

function ArrowButton({
  direction,
  onClick,
  disabled,
}: {
  direction: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
}) {
  const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Geser ke kiri' : 'Geser ke kanan'}
      className={cn(
        'grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-fg-muted transition-colors',
        'hover:border-line-strong hover:text-fg disabled:pointer-events-none disabled:opacity-30',
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}

/**
 * Rel kartu horizontal. Judul dan tombol panah berada di satu baris header,
 * kartunya dikirim sebagai `children`.
 */
export function CardRail({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const { atStart, atEnd, scrollable } = useRailState(railRef);

  function scrollBy(direction: 1 | -1) {
    const el = railRef.current;
    if (!el) return;
    // Geser sekitar satu layar penuh, tapi selalu kelipatan kartu.
    el.scrollBy({ left: direction * Math.max(240, el.clientWidth * 0.85), behavior: 'smooth' });
  }

  return (
    <section className={className}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-fg sm:text-xl">{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-fg-muted">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {scrollable && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <ArrowButton direction="prev" onClick={() => scrollBy(-1)} disabled={atStart} />
              <ArrowButton direction="next" onClick={() => scrollBy(1)} disabled={atEnd} />
            </div>
          )}
        </div>
      </div>

      <div
        ref={railRef}
        className="snap-rail -mx-4 gap-3 px-4 pb-1 sm:mx-0 sm:px-0"
        role="region"
        aria-label={title}
        tabIndex={0}
      >
        {children}
      </div>
    </section>
  );
}

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
};

/**
 * Carousel banner beranda. Berpindah sendiri tiap 6 detik, dan berhenti saat
 * kursor di atasnya, saat salah satu slide difokuskan lewat keyboard, atau saat
 * pengguna mengaktifkan "kurangi gerakan" di sistemnya.
 */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((next: number) => {
    const el = railRef.current;
    if (!el) return;
    const target = ((next % banners.length) + banners.length) % banners.length;
    el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' });
    setIndex(target);
  }, [banners.length]);

  useEffect(() => {
    if (paused || banners.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = setInterval(() => goTo(index + 1), 6000);
    return () => clearInterval(timer);
  }, [index, paused, banners.length, goTo]);

  // Selaraskan titik indikator ketika pengguna menggeser sendiri.
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const onScroll = () => {
      const current = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
      setIndex((prev) => (prev === current ? prev : current));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  if (banners.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={railRef}
        className="snap-rail overflow-hidden rounded-2xl"
        role="region"
        aria-roledescription="carousel"
        aria-label="Promo dan pengumuman"
      >
        {banners.map((banner, i) => {
          const content = (
            <div className="relative aspect-[16/7] w-full overflow-hidden bg-surface-2 sm:aspect-[21/7]">
              {banner.image_url ? (
                <Image
                  src={banner.image_url}
                  alt={banner.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 1100px"
                  className="object-cover"
                  priority={i === 0}
                />
              ) : (
                <div className="aurora flex h-full w-full flex-col justify-center gap-2 px-6 sm:px-10">
                  <span className="text-lg font-bold text-fg sm:text-2xl">{banner.title}</span>
                  {banner.subtitle && (
                    <span className="max-w-md text-sm text-fg-muted sm:text-base">
                      {banner.subtitle}
                    </span>
                  )}
                </div>
              )}
            </div>
          );

          return (
            <div
              key={banner.id}
              className="w-full"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} dari ${banners.length}: ${banner.title}`}
            >
              {banner.link_url ? (
                <Link href={banner.link_url} className="block">
                  {content}
                </Link>
              ) : (
                content
              )}
            </div>
          );
        })}
      </div>

      {banners.length > 1 && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-3 sm:flex">
            <span className="pointer-events-auto">
              <ArrowButton direction="prev" onClick={() => goTo(index - 1)} disabled={false} />
            </span>
            <span className="pointer-events-auto">
              <ArrowButton direction="next" onClick={() => goTo(index + 1)} disabled={false} />
            </span>
          </div>

          <div className="mt-3 flex justify-center gap-1.5">
            {banners.map((banner, i) => (
              <button
                key={banner.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ke slide ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-6 bg-brand-strong' : 'w-1.5 bg-line-strong hover:bg-fg-faint',
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
