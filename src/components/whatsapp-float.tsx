import { MessageCircle } from 'lucide-react';
import { waLink } from '@/lib/utils';

export function WhatsAppFloat({ phone }: { phone: string }) {
  return (
    <a
      href={waLink(phone, 'Halo admin Sayba Voucher, saya butuh bantuan.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hubungi admin lewat WhatsApp"
      className="animate-pulse-ring fixed bottom-5 right-5 z-40 grid h-13 w-13 place-items-center rounded-full bg-success p-3.5 text-white shadow-lg shadow-success/20 transition-transform hover:scale-105"
    >
      <MessageCircle className="h-6 w-6" aria-hidden />
    </a>
  );
}
