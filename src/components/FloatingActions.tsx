import { MessageCircle, Phone } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { buildTelHref, buildWhatsAppUrl } from '../utils/whatsapp';

export function FloatingActions() {
  const { settings } = useApp();
  const { pathname } = useLocation();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const whatsappUrl = buildWhatsAppUrl(settings.whatsapp);
  const telHref = buildTelHref(settings.phone);

  return (
    <div
      aria-label="Quick Contact Actions"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5"
    >
      <a
        href={telHref}
        aria-label={`Call Refix Pro at ${settings.phone}`}
        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#1D1D1F] text-white text-xs sm:text-sm font-semibold shadow-lg hover:bg-[#000000] transition-transform duration-150 hover:-translate-y-0.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]"
      >
        <Phone className="w-4 h-4 text-[#60A5FA]" />
        <span>Call Now</span>
      </a>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with Refix Pro"
        className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#16A34A] text-white text-xs sm:text-sm font-semibold shadow-lg hover:bg-[#15803D] transition-transform duration-150 hover:-translate-y-0.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]"
      >
        <MessageCircle className="w-4 h-4" />
        <span>WhatsApp</span>
      </a>
    </div>
  );
}
