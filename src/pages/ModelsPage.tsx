import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Info, Laptop, MessageCircle, Smartphone, Tablet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MACBOOK_CATEGORIES, MacBookCategory } from '../types';
import { useSeoMeta } from '../utils/seo';
import { buildServiceWhatsAppMessage, buildWhatsAppUrl } from '../utils/whatsapp';
import {
  FadeInSection,
  HeroReveal,
  StaggerCard,
  StaggerContainer,
} from '../components/MotionPrimitives';

const COMMON_MODEL_PROBLEMS_BY_CATEGORY: Record<string, string[]> = {
  'iPad & Tablet': [
    'Cracked Front Glass / Touch Digitizer',
    'Black Display / LCD Assembly Fault',
    'USB-C / Lightning Charging Fault',
    'Battery Replacement / Rapid Drain',
    'Not Turning On / Liquid Spill Damage',
    'Frame Bent / Touch ID Issue',
  ],
  iPhone: [
    'Cracked OLED / LCD Screen Replacement',
    'Battery Health Below 80% / Battery Replacement',
    'Back Glass or Camera Lens Replacement',
    'Not Turning On / Logic Board Short',
    'USB-C / Lightning Charging Port Issue',
    'Water / Liquid Spill Cleaning & Recovery',
  ],
};

const DEFAULT_MAC_PROBLEMS = [
  'Not Turning On / No Power',
  'Liquid / Water Spill Damage',
  'Cracked Screen / Display Issue',
  'Battery Not Charging / Draining Fast',
  'USB-C / MagSafe Port Issue',
  'Keyboard or Trackpad Not Working',
  'Overheating / Loud Fan',
  'macOS Booting / Software Error',
  'Data Recovery Assessment',
];

function getDeviceIcon(category: MacBookCategory) {
  if (category === 'iPad & Tablet') return Tablet;
  if (category === 'iPhone') return Smartphone;
  return Laptop;
}

export function ModelsPage() {
  const { models, settings } = useApp();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [formCategory, setFormCategory] = useState<string>(MACBOOK_CATEGORIES[0]);
  const [formModelYear, setFormModelYear] = useState<string>('');
  const [formProblem, setFormProblem] = useState<string>(DEFAULT_MAC_PROBLEMS[0]);

  const modelsCopy = settings.pageContent.models;

  useSeoMeta({
    title: 'Supported Apple Models | MacBook, iPad & iPhone Repair Gurugram | Refix Pro',
    description:
      'Check original Apple model repair support at Refix Pro Sector 14, Gurugram across MacBook Air & Pro (Intel & M1–M4), iPad Pro / Air / Mini, and iPhone 11–16 series.',
    keywords: settings.seoKeywords,
    canonicalPath: '/models',
  });

  const filteredModels = useMemo(() => {
    if (selectedCategory === 'All') return models;
    return models.filter((m) => m.category === selectedCategory);
  }, [models, selectedCategory]);

  const modelsForSelectedCategory = useMemo(() => {
    const matched = models.filter((m) => m.category === formCategory);
    return matched.length > 0 ? matched : models;
  }, [models, formCategory]);

  const problemOptions = useMemo(
    () => COMMON_MODEL_PROBLEMS_BY_CATEGORY[formCategory] || DEFAULT_MAC_PROBLEMS,
    [formCategory]
  );

  const handleSelectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenModel = formModelYear.trim() || `${formCategory} (Confirm Model / A-Number)`;
    navigate(
      `/book?model=${encodeURIComponent(chosenModel)}&problem=${encodeURIComponent(formProblem)}`
    );
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-[#F5F5F7] to-white border-b border-[#E5E5EA] py-12 lg:py-16">
        <HeroReveal className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-4">
          <nav aria-label="Breadcrumb" className="text-xs text-[#6E6E73] flex items-center gap-2">
            <Link to="/" className="hover:text-[#1D1D1F]">Home</Link>
            <span>/</span>
            <span className="text-[#1D1D1F] font-medium">Supported Models</span>
          </nav>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1D1D1F]">
            {modelsCopy.headline}
          </h1>
          <p className="text-base text-[#424245] max-w-3xl leading-relaxed">
            {modelsCopy.subheadline}
          </p>
        </HeroReveal>
      </section>

      {/* Interactive 4-Step Model Compatibility & Enquiry Selector */}
      <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-12">
        <FadeInSection className="rounded-2xl border border-[#E5E5EA] bg-[#F5F5F7] p-6 sm:p-8">
          <div className="max-w-2xl mb-6">
            <h2 className="text-2xl font-bold text-[#1D1D1F]">
              {modelsCopy.selectorHeading}
            </h2>
            <p className="text-sm text-[#424245] mt-1">
              {modelsCopy.selectorSubheading}
            </p>
          </div>

          <form onSubmit={handleSelectorSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label htmlFor="selector-category" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                1. Device / Series Category
              </label>
              <select
                id="selector-category"
                value={formCategory}
                onChange={(e) => {
                  const nextCat = e.target.value;
                  setFormCategory(nextCat);
                  setFormModelYear('');
                  const nextProbs = COMMON_MODEL_PROBLEMS_BY_CATEGORY[nextCat] || DEFAULT_MAC_PROBLEMS;
                  setFormProblem(nextProbs[0]);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D2D2D7] bg-white text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              >
                {MACBOOK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="selector-model" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                2. Original Model / A-Number
              </label>
              <input
                id="selector-model"
                type="text"
                list="apple-model-suggestions"
                value={formModelYear}
                onChange={(e) => setFormModelYear(e.target.value)}
                placeholder="e.g. A2337, iPad Pro M2, iPhone 15 Pro"
                className="w-full px-3 py-2.5 rounded-xl border border-[#D2D2D7] bg-white text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
              <datalist id="apple-model-suggestions">
                {modelsForSelectedCategory.map((m) => (
                  <option
                    key={m.id}
                    value={`${m.name}${m.modelIdentifiers ? ` (${m.modelIdentifiers})` : ''}`}
                  />
                ))}
              </datalist>
            </div>

            <div>
              <label htmlFor="selector-problem" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                3. Primary Problem
              </label>
              <select
                id="selector-problem"
                value={formProblem}
                onChange={(e) => setFormProblem(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D2D2D7] bg-white text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              >
                {problemOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                4. Book Repair
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href={buildWhatsAppUrl(
                  settings.whatsapp,
                  buildServiceWhatsAppMessage(formProblem, formModelYear || formCategory)
                )}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Confirm model support on WhatsApp"
                className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </form>

          <p className="mt-4 text-xs text-[#6E6E73] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#0066CC] shrink-0" />
            {modelsCopy.selectorNotice}
          </p>
        </FadeInSection>
      </section>

      {/* Model Category Tabs & Catalog */}
      <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 pb-16">
        <div className="flex flex-wrap items-center gap-1.5 mb-8">
          {['All', ...MACBOOK_CATEGORIES].map((cat) => (
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

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredModels.map((m) => {
            const DeviceIcon = getDeviceIcon(m.category);
            return (
              <StaggerCard
                key={m.id}
                className="p-6 rounded-2xl border border-[#E5E5EA] hover:border-[#0066CC]/45 hover:shadow-[0_12px_30px_-18px_rgba(0,102,204,0.16)] transition-all bg-white flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-[#6E6E73]">
                        {m.category} · {m.yearRange}
                      </p>
                      <h3 className="text-xl font-bold text-[#1D1D1F] mt-1">{m.name}</h3>
                    </div>
                    <DeviceIcon className="w-5 h-5 text-[#0066CC] shrink-0" />
                  </div>

                  <div className="text-xs text-[#424245] space-y-1">
                    <p>
                      <span className="font-semibold text-[#1D1D1F]">Processor / SoC:</span>{' '}
                      <span className="font-mono">{m.processor}</span>
                    </p>
                    {m.modelIdentifiers && (
                      <p>
                        <span className="font-semibold text-[#1D1D1F]">Original Model IDs:</span>{' '}
                        <span className="font-mono">{m.modelIdentifiers}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <p className="text-xs font-semibold text-[#1D1D1F] mb-2">Common Service Requests</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {m.commonIssues.map((issue) => (
                        <li key={issue} className="flex items-start gap-1.5 text-xs text-[#424245]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0066CC] shrink-0 mt-0.5" />
                          <span>{issue}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {m.availabilityNote && (
                    <p className="text-xs text-[#6E6E73] pt-2 border-t border-[#F5F5F7]">
                      {m.availabilityNote}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <Link
                    to={`/book?model=${encodeURIComponent(m.name)}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold transition-colors"
                  >
                    Book Repair for This Model
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <a
                    href={buildWhatsAppUrl(
                      settings.whatsapp,
                      `Hello Refix Pro, I want to check repair compatibility for my ${m.name} (${m.modelIdentifiers || 'confirming A-number'}) in Gurugram.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#D2D2D7] hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#16A34A]" />
                    Ask Technician
                  </a>
                </div>
              </StaggerCard>
            );
          })}
        </StaggerContainer>
      </section>
    </div>
  );
}
