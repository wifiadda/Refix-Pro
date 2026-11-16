import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useSeoMeta } from '../utils/seo';

export function LegalPage({ type }: { type: 'privacy' | 'terms' | 'disclaimer' }) {
  const { settings } = useApp();

  const meta = {
    privacy: {
      title: 'Privacy Policy | Refix Pro Gurugram',
      heading: 'Privacy Policy',
      path: '/privacy-policy',
    },
    terms: {
      title: 'Terms & Conditions | Refix Pro Gurugram',
      heading: 'Terms & Conditions',
      path: '/terms-and-conditions',
    },
    disclaimer: {
      title: 'Repair Disclaimer | Refix Pro Gurugram',
      heading: 'Repair Disclaimer',
      path: '/repair-disclaimer',
    },
  }[type];

  useSeoMeta({
    title: meta.title,
    description: `${meta.heading} for ${settings.businessName}, ${settings.address}.`,
    canonicalPath: meta.path,
  });

  return (
    <div className="bg-white min-h-screen py-14 lg:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <nav aria-label="Breadcrumb" className="text-xs text-[#6E6E73] flex items-center gap-2">
          <Link to="/" className="hover:text-[#1D1D1F]">Home</Link>
          <span>/</span>
          <span className="text-[#1D1D1F] font-medium">{meta.heading}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
          {meta.heading}
        </h1>

        {type === 'privacy' && (
          <div className="space-y-4 text-sm sm:text-base text-[#424245] leading-relaxed">
            <p>
              {settings.businessName} collects only the contact and MacBook diagnostic details you submit through our booking and contact forms (name, phone number, WhatsApp number, optional email, MacBook model, and problem description) solely to respond to your repair request.
            </p>
            <p>
              We never ask for or store your macOS account passwords, FileVault keys, or personal credentials via this website. Customer enquiries are accessible only to authorized Refix Pro personnel.
            </p>
            <p>
              This website integrates Google Maps features to help you locate our Sector 14, Gurugram repair desk. Use of map features is subject to the Google Maps / Google Earth Additional Terms of Service and Google Privacy Policy.
            </p>
          </div>
        )}

        {type === 'terms' && (
          <div className="space-y-4 text-sm sm:text-base text-[#424245] leading-relaxed">
            <p>
              All repair bookings submitted online are diagnostic requests. Final repair feasibility, part compatibility, turnaround time, and cost estimates are confirmed only after physical bench inspection at {settings.address}.
            </p>
            <p>
              Customers are advised to maintain a backup of important data whenever possible prior to hardware or macOS servicing. Refix Pro proceeds with component-level or part replacement work only after receiving customer approval of the repair estimate.
            </p>
          </div>
        )}

        {type === 'disclaimer' && (
          <div className="space-y-4 text-sm sm:text-base text-[#424245] leading-relaxed">
            <p>
              {settings.businessName} is an independent Apple MacBook repair specialist located in Sector 14, Gurugram, India. We are not an Apple Authorized Service Provider and are not affiliated with Apple Inc.
            </p>
            <p>
              Apple, MacBook, MacBook Air, MacBook Pro, Retina, MagSafe, and macOS are trademarks of Apple Inc., used strictly for descriptive compatibility identification.
            </p>
            <p>
              Repair outcomes for severe liquid spills or prior third-party board tampering depend on physical circuit condition verified during inspection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
