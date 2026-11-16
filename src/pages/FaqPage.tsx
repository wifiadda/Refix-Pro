import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, MessageCircle, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSeoMeta } from '../utils/seo';
import { AnimatePresence, motion } from 'motion/react';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import {
  FadeInSection,
  HeroReveal,
  STUDIO_EASE,
} from '../components/MotionPrimitives';

interface CategorizedFaq {
  category: string;
  q: string;
  a: string;
}

const EXTRA_FAQS: CategorizedFaq[] = [
  {
    category: 'Diagnostics & Pricing',
    q: 'How do I get an accurate repair estimate before visiting?',
    a: 'Use our Apple Repair Price Estimator for an immediate rough cost range based on your MacBook, iPad, or iPhone model and symptom. Final repair pricing and component availability are confirmed transparently after physical bench inspection at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.',
  },
  {
    category: 'Diagnostics & Pricing',
    q: 'Do you proceed with repair before taking my approval?',
    a: 'Never. Once we isolate the fault on our diagnostic bench, we share the exact findings, part grade, timeline, and repair cost with you. Repair work begins only after your approval.',
  },
  {
    category: 'Logic Board & Liquid',
    q: 'My MacBook spilled coffee or water and still turns on — should I still bring it in?',
    a: 'Yes. Even when a MacBook continues booting temporarily after a spill, mineral residue slowly oxidizes copper pads and SMD capacitors underneath BGA chips. Ultrasonic cleaning within 24–48 hours prevents sudden short circuits later.',
  },
  {
    category: 'Logic Board & Liquid',
    q: 'Why does Refix Pro prefer chip-level logic board repair over full motherboard swaps?',
    a: 'Full motherboard replacement is often expensive and, on T2 and Apple Silicon Macs with onboard soldered storage, erases your personal files. Replacing only the failed power IC, capacitor, or USB-C controller restores your board at a fraction of the cost while preserving data.',
  },
  {
    category: 'Display & Battery',
    q: 'How do you confirm whether a black screen needs a full Retina display or a backlight fix?',
    a: 'Our bench technicians test external display output, inspect the display flex connector under a Leica stereo microscope, and verify backlight voltage rails first. If only a backlight IC or fuse failed, you do not need to pay for a new LCD assembly.',
  },
  {
    category: 'Display & Battery',
    q: 'My MacBook battery says "Service Recommended" or trackpad feels stiff — is it urgent?',
    a: 'Yes. A stiff trackpad click or slightly raised bottom cover usually indicates a swelling lithium-polymer cell pressing against internal components. Have it safely replaced before pressure damages the trackpad or display.',
  },
  {
    category: 'Data & Warranty',
    q: 'Is my data safe during MacBook, iPad, or iPhone servicing?',
    a: 'We never ask for your macOS login password, iPhone passcode, or FileVault key on our online booking form. Whenever storage is intact, we prioritize board-level repairs that leave your existing SSD untouched, and we also recommend keeping a Time Machine or iCloud backup when feasible.',
  },
  {
    category: 'Data & Warranty',
    q: 'What warranty do replacement parts carry?',
    a: 'Standard replacement components installed by Refix Pro carry service warranty coverage against manufacturing or installation defects, excluding subsequent physical impact, liquid exposure, or third-party tampering. Full details are listed on our Warranty & Refund Policy page.',
  },
  {
    category: 'Booking & Tracking',
    q: 'How can I track my repair progress online?',
    a: 'After booking, you receive an Enquiry ID starting with RP- (for example, RP-4K9M2AB). Visit the Track My Repair page anytime and enter your Enquiry ID along with your booking mobile number to see live status stages, technician notes, and estimates.',
  },
];

const FAQ_CATEGORIES = [
  'All',
  'General',
  'Diagnostics & Pricing',
  'Logic Board & Liquid',
  'Display & Battery',
  'Data & Warranty',
  'Booking & Tracking',
];

export function FaqPage() {
  const { settings } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openKey, setOpenKey] = useState<string | null>('0');

  const allFaqs = useMemo<CategorizedFaq[]>(() => {
    const homeItems = (settings.homeFaqs || []).map((item) => ({
      category: 'General',
      q: item.q,
      a: item.a,
    }));
    return [...homeItems, ...EXTRA_FAQS];
  }, [settings.homeFaqs]);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allFaqs.filter((item) => {
      const catMatch = selectedCategory === 'All' || item.category === selectedCategory;
      const textMatch =
        !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [allFaqs, selectedCategory, searchQuery]);

  useSeoMeta({
    title: 'Frequently Asked Questions | Refix Pro MacBook Repair Gurugram',
    description:
      'Answers to common questions about MacBook logic board repair, liquid damage recovery, Retina screen replacement, warranty, data safety, and live repair tracking at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.',
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
      <section className="bg-gradient-to-b from-[#F5F5F7] to-white border-b border-[#E5E5EA] py-12 lg:py-16">
        <HeroReveal className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-4">
          <nav aria-label="Breadcrumb" className="text-xs text-[#6E6E73] flex items-center gap-2">
            <Link to="/" className="hover:text-[#1D1D1F]">Home</Link>
            <span>/</span>
            <span className="text-[#1D1D1F] font-medium">FAQs & Help Center</span>
          </nav>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1D1D1F]">
            Frequently Asked Questions
          </h1>
          <p className="text-base text-[#424245] max-w-2xl leading-relaxed">
            Clear answers on inspection workflows, chip-level repairs, parts compatibility, warranty coverage, and data privacy at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.
          </p>
        </HeroReveal>
      </section>

      <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-12 space-y-8">
        {/* Search & Category Filter */}
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#6E6E73] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. warranty, water, data, tracking)..."
              aria-label="Search FAQs"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D2D2D7] text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-[#1D1D1F] text-white'
                    : 'bg-[#F5F5F7] text-[#424245] hover:text-[#1D1D1F]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Accordions */}
        {filteredFaqs.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] text-center space-y-3">
            <p className="text-base font-bold text-[#1D1D1F]">No matching questions found.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5EA] border-y border-[#E5E5EA]">
            {filteredFaqs.map((item, idx) => {
              const key = `${idx}-${item.q}`;
              const isOpen = openKey === key || (openKey === '0' && idx === 0);
              return (
                <div key={key}>
                  <button
                    type="button"
                    onClick={() => setOpenKey(isOpen ? null : key)}
                    aria-expanded={isOpen}
                    className="w-full py-5 flex items-start justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]"
                  >
                    <div>
                      <p className="text-[11px] font-medium text-[#6E6E73] mb-1">
                        {item.category}
                      </p>
                      <span className="text-base font-semibold text-[#1D1D1F]">{item.q}</span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-[#6E6E73] shrink-0 mt-1 transition-transform duration-150 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: STUDIO_EASE }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 text-sm sm:text-base text-[#424245] leading-relaxed">
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
              Talk directly with our repair desk at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 or review our Warranty & Data Safety policies.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <a
              href={buildWhatsAppUrl(settings.whatsapp, 'Hello Refix Pro, I have a question about a repair.')}
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
      </section>
    </div>
  );
}
