import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Navbar() {
  const { settings } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = (settings.navLinks || []).filter((item) => item.visible !== false);
  const ctaText = settings.headerCtaText || 'Book a Repair';
  const ctaUrl = settings.headerCtaUrl || '/book';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E5E5EA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 text-[#1D1D1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] rounded-md"
        >
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.businessName}
              referrerPolicy="no-referrer"
              className="h-8 w-auto object-contain"
            />
          ) : (
            <svg
              aria-hidden="true"
              className="w-7 h-7 text-[#1D1D1F]"
              viewBox="0 0 28 28"
              fill="none"
            >
              <rect x="2" y="4" width="24" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M1 22.5H27" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M11 12L13.2 14.2L17.5 9.8" stroke="#0066CC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span className="text-lg font-bold tracking-tight whitespace-nowrap shrink-0">
            {settings.businessName || 'Refix Pro'}
          </span>
        </Link>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#424245]">
          {visibleLinks.map((item) => (
            <NavLink
              key={`${item.to}-${item.label}`}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors duration-150 ${
                  isActive
                    ? 'text-[#1D1D1F] border-[#0066CC] font-semibold'
                    : 'border-transparent hover:text-[#1D1D1F] hover:border-[#D2D2D7]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={ctaUrl}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0066CC] hover:bg-[#0052A3] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2"
          >
            {ctaText}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E5E5EA] bg-white px-4 py-4 space-y-1">
          {visibleLinks.map((item) => (
            <NavLink
              key={`${item.to}-${item.label}`}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#F5F5F7] text-[#0066CC] font-semibold'
                    : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="pt-2">
            <Link
              to={ctaUrl}
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-[#0066CC] hover:bg-[#0052A3] rounded-lg transition-colors"
            >
              {ctaText}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
