import { Link } from 'react-router-dom';
import { MapPin, Phone, MessageCircle, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildTelHref, buildWhatsAppUrl } from '../utils/whatsapp';

export function Footer() {
  const { settings } = useApp();
  const whatsappUrl = buildWhatsAppUrl(settings.whatsapp);
  const telHref = buildTelHref(settings.phone);

  const quickLinks = settings.footerQuickLinks || [];
  const serviceLinks = settings.footerServiceLinks || [];

  return (
    <footer className="bg-[#0A0A0C] text-[#F5F5F7] border-t border-[#1D1D1F]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
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
            <h3 className="text-sm font-semibold text-white mb-4">Visit Our Sector 14 Desk</h3>
            <ul className="space-y-3 text-sm text-[#A1A1A6]">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#60A5FA] shrink-0 mt-0.5" />
                <span>{settings.address}</span>
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
            {settings.serviceAreasText && (
              <p className="mt-4 pt-3 border-t border-[#1D1D1F] text-[11px] text-[#86868B] leading-relaxed">
                {settings.serviceAreasText}
              </p>
            )}
          </div>
        </div>

        {/* Bottom Legal Row */}
        <div className="mt-12 pt-8 border-t border-[#1D1D1F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#86868B]">
          <div className="space-y-1">
            <p>© {new Date().getFullYear()} {settings.businessName}. Independent Apple MacBook Repair Specialist in Gurugram.</p>
            <p>
              {settings.footerLegalText ||
                'Refix Pro is an independent repair studio and is not affiliated with or an Apple Authorized Service Provider.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <Link to="/repair-disclaimer" className="hover:text-white transition-colors">Repair Disclaimer</Link>
            <Link to="/admin" className="hover:text-white transition-colors">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
