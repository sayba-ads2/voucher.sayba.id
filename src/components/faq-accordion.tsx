import { ChevronDown } from 'lucide-react';
import type { Faq } from '@/types';

/**
 * Accordion memakai <details> asli browser: tetap bisa dibuka tanpa JavaScript
 * dan isinya terbaca crawler — penting agar rich result FAQ muncul di Google.
 */
export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  if (faqs.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {faqs.map((faq) => (
        <details key={faq.id} className="card-surface group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-fg">{faq.question}</h3>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-fg-faint transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-fg-muted">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
