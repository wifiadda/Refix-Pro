import { Link } from 'react-router-dom';
import { MapPin, Phone, MessageCircle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildTelHref, buildWhatsAppUrl } from '../utils/whatsapp';
import { SocialLinksBar } from './SocialLinksBar';

export function Footer() {
  const { settings } = useApp();
  const whatsappUrl = buildWhatsAppUrl(settings.whatsapp);
  const telHref = buildTelHref(settings.phone);

  const quickLinks = settings.footerQuickLinks || [];
  const serviceLinks = settings.footerServiceLinks || [];

  return (
    <footer className="bg-[#0A0A0C] text-[#F5F5F7] border-t border-[#1D1D1F]">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Summary */}
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 text-white">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.businessName}
                  referrerPolicy="no-referrer"
                  className="h-8 w-auto object-contain brightness-0 invert"
                />
              ) : (
                <svg aria-hidden="true" className="w-7 h-7 text-white" viewBox="0 0 28 28" fill="none">
                  <rect x="2" y="4" width="24" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M1 22.5H27" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M11 12L13.2 14.2L17.5 9.8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              <span className="text-lg font-bold tracking-tight">{settings.businessName}</span>
            </Link>
            <p className="text-sm text-[#A1A1A6] leading-relaxed">
              {settings.footerDescription}
            </p>
            <p className="text-xs font-medium text-[#D2D2D7]">
              {settings.footerTagline || 'Your MacBook Deserves Expert Care. Trust Refix Pro.'}
            </p>
            <div className="pt-2 space-y-2">
              <p className="text-xs font-semibold text-white">Follow Refix Pro</p>
              <SocialLinksBar settings={settings} variant="dark" size="sm" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm text-[#A1A1A6]">
              {quickLinks.map((item) => (
                <li key={`${item.to}-${item.label}`}>
                  <Link
                    to={item.to}
                    className={`hover:text-white transition-colors ${
                      item.to === '/book' ? 'text-[#60A5FA] font-medium' : ''
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Services */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Popular Services</h3>
            <ul className="space-y-2.5 text-sm text-[#A1A1A6]">
              {serviceLinks.map((item) => (
                <li key={`${item.to}-${item.label}`}>
                  <Link to={item.to} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Location */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Visit Our Repair Studio</h3>
            <ul className="space-y-3 text-sm text-[#A1A1A6]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#60A5FA] shrink-0 mt-0.5" />
                <span>SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#60A5FA] shrink-0" />
                <a href={telHref} className="hover:text-white transition-colors font-mono tabular-nums">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#22C55E] shrink-0" />
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  WhatsApp: {settings.whatsapp}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#60A5FA] shrink-0" />
                <span>{settings.businessHours}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Row */}
        <div className="mt-12 pt-8 border-t border-[#1D1D1F] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs text-[#86868B]">
          <div className="space-y-1 max-w-2xl">
            <p>© {new Date().getFullYear()} {settings.businessName}. Independent Apple MacBook Repair Specialist · SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.</p>
            <p>
              {settings.footerLegalText ||
                'Refix Pro is an independent repair studio and is not affiliated with or an Apple Authorized Service Provider.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/pay" className="hover:text-white transition-colors whitespace-nowrap text-[#60A5FA]">Pay Online</Link>
            <Link to="/dashboard" className="hover:text-white transition-colors whitespace-nowrap text-[#60A5FA]">Customer Dashboard</Link>
            <Link to="/privacy-policy" className="hover:text-white transition-colors whitespace-nowrap">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="hover:text-white transition-colors whitespace-nowrap">Terms & Conditions</Link>
            <Link to="/warranty-and-refund-policy" className="hover:text-white transition-colors whitespace-nowrap">Warranty & Refund</Link>
            <Link to="/data-protection-policy" className="hover:text-white transition-colors whitespace-nowrap">Data Safety</Link>
            <Link to="/cookie-policy" className="hover:text-white transition-colors whitespace-nowrap">Cookie Policy</Link>
            <Link to="/repair-disclaimer" className="hover:text-white transition-colors whitespace-nowrap">Repair Disclaimer</Link>
            <Link to="/admin" className="hover:text-white transition-colors whitespace-nowrap">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
