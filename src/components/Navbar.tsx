import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, ShieldCheck, User, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { STUDIO_EASE } from './MotionPrimitives';

export function Navbar() {
  const { settings, user, isStaff, isSuperAdmin, isAdmin, isFrontDeskStaff, isTechnician } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleLinks = (settings.navLinks || []).filter((item) => item.visible !== false);
  const ctaText = settings.headerCtaText || 'Book a Repair';
  const ctaUrl = settings.headerCtaUrl || '/book';

  const consoleLabel = isSuperAdmin
    ? 'Super Admin'
    : isAdmin
      ? 'Admin Panel'
      : isFrontDeskStaff
        ? 'Front Desk'
        : isTechnician
          ? 'Technician Desk'
          : 'Staff Console';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#E5E5EA]/90">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: STUDIO_EASE }}
          className="shrink-0"
        >
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
        </motion.div>

        {/* Zone 2: Concise single-line navigation links with animated active indicator */}
        <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-6 xl:gap-8 text-sm font-medium text-[#424245]">
          {visibleLinks.map((item, idx) => (
            <motion.div
              key={`${item.to}-${item.label}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.04 * idx, ease: STUDIO_EASE }}
            >
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative whitespace-nowrap shrink-0 py-2 transition-colors duration-150 ${
                    isActive
                      ? 'text-[#1D1D1F] font-semibold'
                      : 'hover:text-[#1D1D1F]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.span
                        layoutId="navbar-active-indicator"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#0066CC] rounded-full"
                      />
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* Zone 3: Staff Console / Customer Portal + Primary CTA */}
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: STUDIO_EASE }}
          className="flex items-center gap-2.5 shrink-0"
        >
          {user && isStaff && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-black text-xs sm:text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>{consoleLabel}</span>
            </Link>
          )}

          <Link
            to="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-2 rounded-lg border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs sm:text-sm font-semibold text-[#1D1D1F] transition-colors whitespace-nowrap shrink-0"
          >
            <User className="w-3.5 h-3.5 text-[#0066CC]" />
            <span>{user ? 'Dashboard' : 'Login'}</span>
          </Link>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="hidden sm:block">
            <Link
              to={ctaUrl}
              className="inline-flex items-center justify-center min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0066CC] hover:bg-[#0052A3] rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 shadow-[0_4px_14px_-4px_rgba(0,102,204,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] focus-visible:ring-offset-2"
            >
              {ctaText}
            </Link>
          </motion.div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </motion.div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: STUDIO_EASE }}
            className="lg:hidden overflow-hidden border-t border-[#E5E5EA] bg-white px-4 py-4 space-y-1"
          >
            {visibleLinks.map((item) => (
              <NavLink
                key={`${item.to}-${item.label}`}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center min-h-[44px] px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#F5F5F7] text-[#0066CC] font-semibold'
                      : 'text-[#1D1D1F] hover:bg-[#F5F5F7]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-2 grid grid-cols-2 gap-2">
              {user && isStaff && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="col-span-2 flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2.5 text-sm font-semibold text-white bg-[#0F172A] hover:bg-black rounded-lg transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-[#60A5FA]" />
                  {consoleLabel}
                </Link>
              )}
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2.5 text-sm font-semibold text-[#1D1D1F] border border-[#D2D2D7] hover:bg-[#F5F5F7] rounded-lg transition-colors"
              >
                <User className="w-4 h-4 text-[#0066CC]" />
                {user ? 'Dashboard' : 'Login'}
              </Link>
              <Link
                to={ctaUrl}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center min-h-[44px] px-4 py-2.5 text-sm font-semibold text-white bg-[#0066CC] hover:bg-[#0052A3] rounded-lg transition-colors"
              >
                {ctaText}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
