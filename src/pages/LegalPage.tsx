import { Link } from 'react-router-dom';
import { ArrowRight, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSeoMeta } from '../utils/seo';
import { buildTelHref } from '../utils/whatsapp';

export type LegalPageType =
  | 'privacy'
  | 'terms'
  | 'warranty'
  | 'data'
  | 'cookies'
  | 'disclaimer';

interface PolicySection {
  title: string;
  body: string[];
}

const POLICY_LINKS: { type: LegalPageType; label: string; to: string }[] = [
  { type: 'privacy', label: 'Privacy Policy', to: '/privacy-policy' },
  { type: 'terms', label: 'Terms & Conditions', to: '/terms-and-conditions' },
  { type: 'warranty', label: 'Warranty & Refund Policy', to: '/warranty-and-refund-policy' },
  { type: 'data', label: 'Data Safety & Pickup Policy', to: '/data-protection-policy' },
  { type: 'cookies', label: 'Cookie & Storage Policy', to: '/cookie-policy' },
  { type: 'disclaimer', label: 'Repair & Trademark Disclaimer', to: '/repair-disclaimer' },
];

export function LegalPage({ type }: { type: LegalPageType }) {
  const { settings } = useApp();
  const businessName = settings.businessName || 'Refix Pro';
  const contactEmail = settings.email || 'refixpro.in@gmail.com';
  const address = settings.address || 'SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007';

  const pageMeta: Record<
    LegalPageType,
    { title: string; heading: string; subtitle: string; path: string; sections: PolicySection[] }
  > = {
    privacy: {
      title: `Privacy Policy | ${businessName} Gurugram`,
      heading: 'Privacy Policy',
      subtitle:
        'How we collect, protect, and limit customer contact and device diagnostic details at Refix Pro.',
      path: '/privacy-policy',
      sections: [
        {
          title: '01. Information We Collect',
          body: [
            `When you book a repair, request a contact callback, or submit a review on ${businessName}, we collect only the details you voluntarily provide — such as your name, mobile/WhatsApp number, optional email address, Apple device model, fault description, and optional problem photos.`,
            'When you publish a customer review on our Reviews section, only your submitted reviewer display label, star rating, and feedback text are displayed publicly. Phone numbers and private repair notes are never published.',
          ],
        },
        {
          title: '02. Zero-Credential & Passcode Rule',
          body: [
            `${businessName} never requests or stores your macOS login password, Apple Account password, iPhone/iPad passcode, or FileVault recovery key via this website.`,
            'If diagnostic testing at our SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 desk requires verifying hardware behavior inside an operating system, you may enter credentials directly in person or authorize temporary guest/diagnostic testing.',
          ],
        },
        {
          title: '03. How We Use & Isolate Data',
          body: [
            'Your enquiry details are used strictly to diagnose your Apple device, share transparent cost estimates, coordinate pickup readiness, and maintain live status tracking keyed by your Enquiry ID.',
            'We never sell, rent, or distribute customer contact information to third-party telemarketers or data brokers.',
          ],
        },
        {
          title: '04. Third-Party Services & Maps',
          body: [
            'Our website uses Google Firebase for secure enquiry storage and Google Maps Platform to display directions to SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007. Use of integrated map views is governed by the Google Maps / Google Earth Additional Terms of Service and Google Privacy Policy.',
          ],
        },
        {
          title: '05. Data Retention & Deletion Requests',
          body: [
            `You may request correction or deletion of your contact enquiry history anytime by emailing ${contactEmail} or calling ${settings.phone} with your Enquiry ID.`,
          ],
        },
      ],
    },
    terms: {
      title: `Terms & Conditions | ${businessName} Gurugram`,
      heading: 'Terms & Conditions',
      subtitle:
        'Service agreement governing device diagnostics, repair approval, parts sourcing, and collections.',
      path: '/terms-and-conditions',
      sections: [
        {
          title: '01. Diagnostic & Inspection Workflow',
          body: [
            `Online bookings, WhatsApp quotes, and Price Estimator ranges are preliminary guides. Final repair feasibility, part compatibility, turnaround time, and cost are confirmed only after physical bench inspection at ${address}.`,
            `${businessName} seeks your explicit approval via phone, WhatsApp, or in person before performing chargeable hardware replacements or logic board work.`,
          ],
        },
        {
          title: '02. Customer Responsibilities & Backups',
          body: [
            'While our technicians take utmost care during component repair, customers are strongly encouraged to maintain an external Time Machine or cloud backup prior to hardware or software servicing whenever the device is functional.',
            'Customers must disclose any prior third-party repair attempts, liquid spills, or drop history at intake so technicians can evaluate risks accurately.',
          ],
        },
        {
          title: '03. Parts & Turnaround Estimates',
          body: [
            'Turnaround timelines depend on fault complexity and exact component availability for your MacBook, iPad, or iPhone A-number. Where an OEM/compatible part must be sourced specially, we communicate estimated arrival before proceeding.',
          ],
        },
        {
          title: '04. Unclaimed Devices & Storage',
          body: [
            'Once a repair is completed or marked unrepairable and the customer is notified, devices should be collected within 30 days. Devices left uncollected beyond 60 days after repeated contact attempts may be moved to secure off-site storage with applicable storage handling notices.',
          ],
        },
        {
          title: '05. Governing Law',
          body: [
            'All repair services and terms are governed by the laws of India, with jurisdiction in Gurugram, Haryana.',
          ],
        },
      ],
    },
    warranty: {
      title: `Warranty, Cancellation & Refund Policy | ${businessName} Gurugram`,
      heading: 'Warranty, Cancellation & Refund Policy',
      subtitle:
        'Clear commitments on component service warranty, diagnostic transparency, cancellations, and refunds.',
      path: '/warranty-and-refund-policy',
      sections: [
        {
          title: '01. Component & Workmanship Warranty',
          body: [
            'Replacement parts installed by Refix Pro (such as Retina displays, batteries, keyboards, trackpads, fans, and USB-C port assemblies) carry service warranty coverage specified on your job invoice against functional or installation defects.',
            'Board-level micro-soldering work covers the specific repaired circuit/IC noted on your service record for the stated warranty period.',
          ],
        },
        {
          title: '02. Warranty Exclusions',
          body: [
            'Service warranty does not cover new physical damage (cracked glass, dented chassis, torn flex cables from drops), subsequent liquid/moisture exposure, voltage surges from non-standard third-party chargers, or tampering/opening by another repair shop during the warranty window.',
            'Severe liquid-damaged logic boards are inherently high-risk; warranty scope for liquid recovery is explicitly confirmed on your job card at delivery.',
          ],
        },
        {
          title: '03. No-Approval / Cancellation Policy',
          body: [
            'If you decline the repair estimate shared after initial bench inspection, no component repair charge applies. You may cancel a booking prior to part ordering or micro-soldering work at no repair cost.',
            'Special-order parts requested and paid in advance by a customer cannot be cancelled once dispatched by the supplier.',
          ],
        },
        {
          title: '04. Refund & Re-Service Resolution',
          body: [
            'If a covered replacement part exhibits a defect within its warranty window, Refix Pro will re-inspect and rectify or replace the component at zero additional labor cost.',
            'If a covered defect cannot be resolved satisfactorily within reasonable attempts, approved refunds for that component are processed via the original payment method (UPI/card/bank transfer) within 5–7 working days.',
          ],
        },
      ],
    },
    data: {
      title: `Data Safety & Device Pickup Policy | ${businessName} Gurugram`,
      heading: 'Data Safety & Device Pickup Policy',
      subtitle:
        'How we safeguard customer files during chip-level servicing and verify identity at device handover.',
      path: '/data-protection-policy',
      sections: [
        {
          title: '01. Data Confidentiality & Storage Care',
          body: [
            'On modern MacBooks, iPads, and iPhones, storage NAND chips are encrypted and soldered directly to the logic board. Our chip-level repair methodology focuses on repairing failed power rails and controllers without erasing your storage wherever technically possible.',
            'Technicians do not browse personal folders, photos, emails, or external drives. Testing is restricted strictly to hardware diagnostics (display, ports, audio, charging, battery, and thermals).',
          ],
        },
        {
          title: '02. High-Risk Data Scenarios',
          body: [
            'For macOS reinstallations, Apple Silicon DFU restores, severe SSD controller faults, or badly corroded boards, data erasure or loss may be unavoidable. We inform you upfront before performing any operation that modifies storage partitions.',
          ],
        },
        {
          title: '03. Device Drop-Off & Pickup Verification',
          body: [
            'At intake, we generate a unique RP- Enquiry ID linked to your registered mobile number. You can monitor live repair status anytime on our Track My Repair page.',
            'At pickup from SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007, please present your Enquiry ID or registered mobile number (plus government ID if an authorized representative collects the device on your behalf).',
          ],
        },
      ],
    },
    cookies: {
      title: `Cookie & Local Storage Policy | ${businessName} Gurugram`,
      heading: 'Cookie & Local Storage Policy',
      subtitle:
        'Details on essential browser storage used for smooth navigation, authentication, and maps.',
      path: '/cookie-policy',
      sections: [
        {
          title: '01. Essential Functional Storage Only',
          body: [
            `${businessName} avoids intrusive third-party advertising trackers. Essential browser storage (cookies and IndexedDB/localStorage) is used strictly for core website reliability, admin Google authentication sessions, and UI state.`,
          ],
        },
        {
          title: '02. Integrated Map & Infrastructure Services',
          body: [
            'Embedded Google Maps features on our Home and Contact pages may store functional map preferences or session cookies governed by Google’s cookie policies.',
          ],
        },
        {
          title: '03. Managing Browser Controls',
          body: [
            'You can clear or block cookies anytime through your browser privacy settings. Disabling essential storage may require re-authenticating if you sign into the protected Admin portal.',
          ],
        },
      ],
    },
    disclaimer: {
      title: `Repair & Trademark Disclaimer | ${businessName} Gurugram`,
      heading: 'Repair & Trademark Disclaimer',
      subtitle:
        'Independent Apple hardware repair disclosure, trademark ownership, and technical risk notice.',
      path: '/repair-disclaimer',
      sections: [
        {
          title: '01. Independent Specialist Status',
          body: [
            `${businessName} is an independent Apple MacBook, iPad, and iPhone repair studio located at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007. We are NOT an Apple Authorized Service Provider (AASP) and have no affiliation, partnership, or endorsement from Apple Inc.`,
          ],
        },
        {
          title: '02. Trademark Attribution',
          body: [
            'Apple, MacBook, MacBook Air, MacBook Pro, iPad, iPad Air, iPad Pro, iPhone, Retina, Liquid Retina, MagSafe, Face ID, Touch ID, Apple Silicon, and macOS are registered trademarks of Apple Inc. All model names and A-numbers are used solely to help customers identify repair compatibility.',
          ],
        },
        {
          title: '03. Technical Outcome Disclaimer',
          body: [
            'Repair outcomes for severely liquid-damaged logic boards, multi-layer PCB shorts, or devices previously tampered with by unverified technicians depend entirely on physical circuit integrity inspected under stereo microscopy.',
            'Standard manufacturer warranties (if active) may be affected by third-party hardware servicing; customers are advised to verify warranty status prior to authorizing independent repairs.',
          ],
        },
      ],
    },
  };

  const active = pageMeta[type];

  useSeoMeta({
    title: active.title,
    description: `${active.heading} for ${businessName} at ${address}.`,
    keywords: settings.seoKeywords,
    canonicalPath: active.path,
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-[#F5F5F7] to-white border-b border-[#E5E5EA] py-12 lg:py-16">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-4">
          <nav aria-label="Breadcrumb" className="text-xs text-[#6E6E73] flex items-center gap-2">
            <Link to="/" className="hover:text-[#1D1D1F]">Home</Link>
            <span>/</span>
            <span className="text-[#1D1D1F] font-medium">{active.heading}</span>
          </nav>
          <p className="text-xs font-semibold text-[#0066CC]">
            Official Policy Center · Effective November 2026
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1D1D1F]">
            {active.heading}
          </h1>
          <p className="text-base text-[#424245] max-w-2xl leading-relaxed">
            {active.subtitle}
          </p>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Sidebar Cross-Links */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <div className="p-5 rounded-2xl border border-[#E5E5EA] bg-[#F5F5F7]/70 space-y-3">
            <p className="text-xs font-bold text-[#1D1D1F] px-2">All Website Policies</p>
            <nav aria-label="Policy Navigation" className="space-y-1">
              {POLICY_LINKS.map((item) => {
                const isActive = item.type === type;
                return (
                  <Link
                    key={item.type}
                    to={item.to}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#1D1D1F] text-white font-semibold'
                        : 'text-[#424245] hover:bg-white hover:text-[#1D1D1F]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-6 rounded-2xl border border-[#E5E5EA] bg-white space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#0066CC]">
              <ShieldCheck className="w-4 h-4" />
              <span>Studio Contact Desk</span>
            </div>
            <div className="space-y-2.5 text-xs text-[#424245]">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
                <span>{address}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#0066CC] shrink-0" />
                <a href={buildTelHref(settings.phone)} className="font-mono hover:text-[#0066CC]">
                  {settings.phone}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0066CC] shrink-0" />
                <a href={`mailto:${contactEmail}`} className="font-mono hover:text-[#0066CC]">
                  {contactEmail}
                </a>
              </p>
            </div>
            <Link
              to="/faq"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066CC] hover:underline"
            >
              Visit FAQs & Help Center
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </aside>

        {/* Policy Body */}
        <div className="lg:col-span-8 space-y-8">
          <div className="divide-y divide-[#E5E5EA] border-t border-b border-[#E5E5EA]">
            {active.sections.map((sec) => (
              <div key={sec.title} className="py-7 space-y-3">
                <h2 className="text-xl font-bold text-[#1D1D1F]">{sec.title}</h2>
                {sec.body.map((paragraph, idx) => (
                  <p key={idx} className="text-sm sm:text-base text-[#424245] leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="p-6 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[#1D1D1F]">Ready to Book a Diagnostic Check?</p>
              <p className="text-xs text-[#424245] mt-0.5">
                Quick 30-second repair booking with transparent inspection upfront.
              </p>
            </div>
            <Link
              to="/book"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0"
            >
              Book a Repair
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
