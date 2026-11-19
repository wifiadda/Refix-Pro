import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  Clock,
  CreditCard,
  MessageCircle,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSeoMeta } from '../utils/seo';
import { AnimatePresence, motion } from 'motion/react';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { Button, EmptyState } from '../components/ui/DesignSystem';
import {
  FadeInSection,
  HeroReveal,
  STUDIO_EASE,
} from '../components/MotionPrimitives';

type FaqCategory =
  | 'Turnaround Times'
  | 'Warranty Periods'
  | 'Payment Methods'
  | 'Diagnostics & Pricing'
  | 'General & Tracking';

interface CategorizedFaq {
  id: string;
  category: FaqCategory;
  q: string;
  a: string;
}

const FAQ_CATEGORIES: ('All' | FaqCategory)[] = [
  'All',
  'Turnaround Times',
  'Warranty Periods',
  'Payment Methods',
  'Diagnostics & Pricing',
  'General & Tracking',
];

export function FaqPage() {
  const { settings } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<'All' | FaqCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'turnaround-1': true,
  });

  const allFaqs = useMemo<CategorizedFaq[]>(() => {
    const paymentMethodsText = [
      settings.razorpayEnabled ? 'Razorpay online checkout (cards, netbanking, and UPI)' : null,
      settings.manualPaymentEnabled !== false
        ? `Manual UPI${settings.manualUpiId ? ` (${settings.manualUpiId})` : ''}, QR scan, or bank transfer`
        : null,
      'cash or UPI at pickup at our Sector 14 desk',
    ]
      .filter(Boolean)
      .join(', ');

    const curatedFaqs: CategorizedFaq[] = [
      // Turnaround Times
      {
        id: 'turnaround-1',
        category: 'Turnaround Times',
        q: 'How long does initial MacBook diagnostic inspection take?',
        a: `Same-day initial diagnostics are completed at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 during business hours (${settings.businessHours}). Most power-rail checks, battery tests, and display signal inspections are confirmed on the same day.`,
      },
      {
        id: 'turnaround-2',
        category: 'Turnaround Times',
        q: 'What is the typical turnaround time for battery, keyboard, or Retina screen replacement?',
        a: 'Once exact model compatibility (Apple A-number) is confirmed and the required component is in stock at our Gurugram studio, standard battery, charging port, and display replacements are typically completed within the same day to 24 hours. Special-order Retina XDR or M-series assemblies are quoted with an exact arrival timeline upfront.',
      },
      {
        id: 'turnaround-3',
        category: 'Turnaround Times',
        q: 'How many days does chip-level logic board or liquid damage repair take?',
        a: 'Micro-soldering repairs (power ICs, USB-C controllers, backlight circuits) and ultrasonic liquid spill decontamination typically take 1–3 working days depending on corrosion severity and multi-rail stress testing after rework.',
      },
      {
        id: 'turnaround-4',
        category: 'Turnaround Times',
        q: 'Will I be notified as soon as my MacBook is ready for pickup?',
        a: 'Yes. As soon as your device clears post-repair QA testing, our technician updates your job card status to Ready for Delivery on the Track My Repair page and notifies you via WhatsApp or phone call.',
      },

      // Warranty Periods
      {
        id: 'warranty-1',
        category: 'Warranty Periods',
        q: 'What warranty period is provided on replacement parts and repairs?',
        a: 'Refix Pro provides service warranty coverage on installed replacement components and completed hardware repairs against manufacturing or workmanship defects (typically 90 days to 6 months depending on the specific component tier, clearly noted on your repair estimate and final bill).',
      },
      {
        id: 'warranty-2',
        category: 'Warranty Periods',
        q: 'Are chip-level logic board and liquid-damage repairs covered under warranty?',
        a: 'Completed chip-level component repairs carry targeted warranty on the specific circuit or IC replaced. Because liquid spills can cause progressive latent oxidation in unrelated areas, ultrasonic liquid-recovery warranty terms and any pre-existing corrosion notes are explained transparently before repair approval.',
      },
      {
        id: 'warranty-3',
        category: 'Warranty Periods',
        q: 'What situations void a repair warranty?',
        a: 'Service warranty does not cover subsequent physical impact, cracked glass after handover, fresh liquid or moisture exposure, unauthorized third-party opening, or damage caused by non-certified power adapters. Full details are published on our Warranty & Refund Policy page.',
      },

      // Payment Methods
      {
        id: 'payment-1',
        category: 'Payment Methods',
        q: 'What payment methods are accepted at Refix Pro?',
        a: `We accept ${paymentMethodsText}. You can pay directly from the Track My Repair page, your Customer Dashboard, or the dedicated Pay Online page once your invoice is ready.`,
      },
      {
        id: 'payment-2',
        category: 'Payment Methods',
        q: 'Do I have to pay any advance before my MacBook is inspected?',
        a: 'No advance payment is required when booking a repair slot online. Our technician inspects your device first, shares a transparent estimate and turnaround timeline, and final billing is settled only after repair work is approved and completed.',
      },
      {
        id: 'payment-3',
        category: 'Payment Methods',
        q: 'How does manual UPI / QR payment verification work on the website?',
        a: 'If you pay via UPI ID, QR code, or bank transfer on our Pay Online page, enter your Enquiry ID (e.g., RP-...) and 12-digit UTR / transaction reference. Our desk verifies the transfer and updates your job card payment status to Paid.',
      },
      {
        id: 'payment-4',
        category: 'Payment Methods',
        q: 'Is online checkout via Razorpay secure?',
        a: 'Yes. When Razorpay checkout is enabled, payments are processed directly through Razorpay’s encrypted checkout flow supporting UPI apps, debit/credit cards, and netbanking without storing card numbers on Refix Pro.',
      },

      // Diagnostics & Pricing
      {
        id: 'diag-1',
        category: 'Diagnostics & Pricing',
        q: 'How do I get an accurate repair estimate before visiting?',
        a: 'Use our Apple Repair Price Estimator on the home page for a rough cost range based on your MacBook, iPad, or iPhone model and issue. Final pricing and component availability are confirmed after physical bench inspection.',
      },
      {
        id: 'diag-2',
        category: 'Diagnostics & Pricing',
        q: 'Do you proceed with repair before taking my approval?',
        a: 'Never. Once we isolate the fault on our bench, we share the exact findings, part grade, warranty term, turnaround time, and total cost. Work starts only after your confirmation.',
      },
      {
        id: 'diag-3',
        category: 'Diagnostics & Pricing',
        q: 'Is my data safe during MacBook, iPad, or iPhone servicing?',
        a: 'We never ask for your macOS password, iPhone passcode, or FileVault recovery key on our booking form. Whenever storage is intact, component-level repair keeps your SSD untouched.',
      },

      // General & Tracking
      {
        id: 'track-1',
        category: 'General & Tracking',
        q: 'How can I track my repair progress online?',
        a: 'Every booking generates a unique Enquiry ID starting with RP- (for example, RP-4K9M2AB). Enter your Enquiry ID and registered mobile number on the Track My Repair page, or sign in to the Customer Dashboard for live status and billing updates.',
      },
    ];

    const homeItems: CategorizedFaq[] = (settings.homeFaqs || []).map((item, idx) => ({
      id: `home-faq-${idx}`,
      category: 'General & Tracking',
      q: item.q,
      a: item.a,
    }));

    return [...curatedFaqs, ...homeItems];
  }, [settings]);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allFaqs.filter((item) => {
      const catMatch = selectedCategory === 'All' || item.category === selectedCategory;
      const textMatch =
        !q ||
        item.q.toLowerCase().includes(q) ||
        item.a.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [allFaqs, selectedCategory, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: allFaqs.length };
    for (const item of allFaqs) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [allFaqs]);

  const allFilteredExpanded =
    filteredFaqs.length > 0 && filteredFaqs.every((item) => Boolean(openIds[item.id]));

  const toggleItem = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleExpandAll = () => {
    if (allFilteredExpanded) {
      const next = { ...openIds };
      for (const item of filteredFaqs) {
        next[item.id] = false;
      }
      setOpenIds(next);
    } else {
      const next = { ...openIds };
      for (const item of filteredFaqs) {
        next[item.id] = true;
      }
      setOpenIds(next);
    }
  };

  useSeoMeta({
    title: 'Frequently Asked Questions | Refix Pro MacBook Repair Gurugram',
    description:
      'Answers on repair turnaround times, warranty periods, Razorpay & UPI payment methods, diagnostics, and live repair tracking at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.',
    keywords: settings.seoKeywords,
    canonicalPath: '/faq',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: allFaqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Header Band */}
      <section className="bg-[#F5F5F7] border-b border-[#E5E5EA] py-12 lg:py-16">
        <HeroReveal className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-5">
          <nav aria-label="Breadcrumb" className="text-xs text-[#6E6E73] flex items-center gap-2">
            <Link to="/" className="hover:text-[#1D1D1F]">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#1D1D1F] font-medium">FAQs & Help Center</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 space-y-3">
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1D1D1F] text-balance">
                Frequently Asked Questions
              </h1>
              <p className="text-base text-[#424245] max-w-2xl leading-relaxed">
                Clear answers on repair turnaround times, warranty coverage, online and UPI payment
                methods, and diagnostics at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.
              </p>
            </div>

            <div className="lg:col-span-5 grid grid-cols-3 gap-4 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l border-[#D2D2D7] lg:pl-8">
              <div>
                <p className="text-xs text-[#6E6E73] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0066CC]" />
                  Inspection
                </p>
                <p className="text-sm sm:text-base font-bold text-[#1D1D1F] font-mono tabular-nums mt-1">
                  Same Day
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6E6E73] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0066CC]" />
                  Warranty
                </p>
                <p className="text-sm sm:text-base font-bold text-[#1D1D1F] font-mono tabular-nums mt-1">
                  Parts & Labor
                </p>
              </div>
              <div>
                <p className="text-xs text-[#6E6E73] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#0066CC]" />
                  Payments
                </p>
                <p className="text-sm sm:text-base font-bold text-[#1D1D1F] font-mono tabular-nums mt-1">
                  UPI / Card
                </p>
              </div>
            </div>
          </div>
        </HeroReveal>
      </section>

      {/* Main FAQ Workspace */}
      <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Sticky Filter Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div>
              <label htmlFor="faq-search" className="block text-xs font-semibold text-[#1D1D1F] mb-2">
                Search Questions
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#6E6E73] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="faq-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Turnaround, warranty, UPI, Razorpay..."
                  className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-[#D2D2D7] bg-white text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#6E6E73]">Browse by Topic</p>
              <div className="flex flex-wrap lg:flex-col gap-1.5">
                {FAQ_CATEGORIES.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        const firstInCat = allFaqs.find(
                          (f) => cat === 'All' || f.category === cat
                        );
                        if (firstInCat) {
                          setOpenIds((prev) => ({ ...prev, [firstInCat.id]: true }));
                        }
                      }}
                      className={`min-h-[42px] flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap text-left ${
                        active
                          ? 'bg-[#1D1D1F] text-white'
                          : 'bg-[#F5F5F7] text-[#424245] hover:text-[#1D1D1F] hover:bg-[#EBEBF0]'
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`text-xs font-mono tabular-nums ${
                          active ? 'text-[#A1A1A6]' : 'text-[#6E6E73]'
                        }`}
                      >
                        {categoryCounts[cat] || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E5E5EA] space-y-2.5 text-xs text-[#424245]">
              <p className="font-semibold text-[#1D1D1F]">Related Policy & Service Links</p>
              <div className="flex flex-col gap-2">
                <Link
                  to="/warranty-and-refund-policy"
                  className="text-[#0066CC] hover:underline font-medium inline-flex items-center gap-1"
                >
                  Warranty & Refund Policy
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/pay"
                  className="text-[#0066CC] hover:underline font-medium inline-flex items-center gap-1"
                >
                  Pay Repair Invoice Online
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/track"
                  className="text-[#0066CC] hover:underline font-medium inline-flex items-center gap-1"
                >
                  Track My Repair Status
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </aside>

          {/* Right Accordion List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E5E5EA]">
              <div className="text-xs sm:text-sm text-[#424245] flex items-center gap-2">
                <span className="font-semibold text-[#1D1D1F]">{selectedCategory}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-[#6E6E73]">
                  {filteredFaqs.length} {filteredFaqs.length === 1 ? 'question' : 'questions'}
                </span>
              </div>

              {filteredFaqs.length > 0 && (
                <button
                  type="button"
                  onClick={toggleExpandAll}
                  className="px-3.5 py-1.5 rounded-lg border border-[#D2D2D7] hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] transition-colors whitespace-nowrap"
                >
                  {allFilteredExpanded ? 'Collapse All' : 'Expand All'}
                </button>
              )}
            </div>

            {filteredFaqs.length === 0 ? (
              <EmptyState
                title="No matching questions found"
                description="Try clearing your search term or selecting All topics."
                action={
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                  >
                    Reset Filters
                  </Button>
                }
              />
            ) : (
              <div className="divide-y divide-[#E5E5EA] border-b border-[#E5E5EA]">
                {filteredFaqs.map((item, idx) => {
                  const isOpen = Boolean(openIds[item.id]);
                  const panelId = `faq-panel-${item.id}`;
                  const buttonId = `faq-button-${item.id}`;
                  const numberLabel = String(idx + 1).padStart(2, '0');

                  return (
                    <div key={item.id}>
                      <h3>
                        <button
                          id={buttonId}
                          type="button"
                          onClick={() => toggleItem(item.id)}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          className="w-full py-5 flex items-start justify-between gap-4 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC] rounded-lg"
                        >
                          <div className="space-y-1 pr-2">
                            <div className="flex items-center gap-2 text-xs text-[#6E6E73]">
                              <span className="font-mono tabular-nums">{numberLabel}.</span>
                              <span aria-hidden="true">·</span>
                              <span>{item.category}</span>
                            </div>
                            <span className="block text-base sm:text-lg font-semibold text-[#1D1D1F] group-hover:text-[#0066CC] transition-colors">
                              {item.q}
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-[#6E6E73] shrink-0 mt-1.5 transition-transform duration-200 ${
                              isOpen ? 'rotate-180 text-[#0066CC]' : ''
                            }`}
                          />
                        </button>
                      </h3>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            id={panelId}
                            role="region"
                            aria-labelledby={buttonId}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: STUDIO_EASE }}
                            className="overflow-hidden"
                          >
                            <p className="pb-5 pl-0 sm:pl-7 text-sm sm:text-base text-[#424245] leading-relaxed max-w-3xl">
                              {item.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Helpful Footer CTA */}
            <FadeInSection className="p-7 sm:p-8 rounded-2xl bg-[#0A0A0C] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold">Still Have a Technical Question?</h2>
                <p className="text-sm text-[#A1A1A6]">
                  Talk directly with our repair desk at SCF-92,SECTOR-14 MAIN MARKET, Gurugram,
                  Haryana 122007 or book an upfront bench diagnostic.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <a
                  href={buildWhatsAppUrl(
                    settings.whatsapp,
                    'Hello Refix Pro, I have a question about a repair turnaround, warranty, or payment.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs sm:text-sm font-semibold whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Desk
                </a>
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs sm:text-sm font-semibold whitespace-nowrap"
                >
                  Book a Repair
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>
    </div>
  );
}
