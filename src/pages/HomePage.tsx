import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Droplets,
  ExternalLink,
  Laptop,
  Mail,
  MapPin,
  MessageCircle,
  Monitor,
  Navigation,
  Phone,
  Search,
  ShieldCheck,
  Star,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSeoMeta } from '../utils/seo';
import { buildTelHref, buildWhatsAppUrl } from '../utils/whatsapp';
import { SafeImage } from '../components/SafeImage';
import { GoogleMapLocation } from '../components/GoogleMapLocation';
import { PriceEstimatorTool } from '../components/PriceEstimatorTool';
import { TrackRepairTool } from '../components/TrackRepairTool';
import { IMG_MICROSCOPE } from '../data/seedServicesAndModels';

const COMMON_PROBLEMS = [
  {
    title: 'MacBook Not Turning On',
    desc: 'Dead power rails, shorted capacitors, or stuck 5V USB-C negotiation diagnosed under microscope.',
    service: 'MacBook Motherboard Repair',
  },
  {
    title: 'Liquid & Coffee Spills',
    desc: 'Immediate battery disconnect, ultrasonic decontamination, and corrosion trace restoration.',
    service: 'Water Damage MacBook Repair',
  },
  {
    title: 'Cracked or Black Screen',
    desc: 'Retina display assembly swaps, backlight circuit fixes, and display flex diagnostics.',
    service: 'MacBook Screen Replacement',
  },
  {
    title: 'Battery Drain & Swelling',
    desc: 'Safe cell replacement for Service Recommended alerts and uneven trackpads.',
    service: 'MacBook Battery Replacement',
  },
  {
    title: 'USB-C & MagSafe Faults',
    desc: 'Port replacement and CD3215/CD3217 controller repairs when your Mac refuses charge.',
    service: 'Charging Circuit Repair',
  },
  {
    title: 'Overheating & Loud Fans',
    desc: 'Heatsink cleaning, thermal compound renewal, and replacement of noisy cooling fans.',
    service: 'Overheating Problems',
  },
];

const CATEGORY_HIGHLIGHTS = [
  {
    title: 'Hardware & Logic Board',
    desc: 'Motherboard diagnostics, chip-level micro-soldering, Power IC, USB-C ports, keyboards, and trackpads.',
    category: 'Hardware Repair',
    icon: Cpu,
  },
  {
    title: 'Display & Retina Repair',
    desc: 'Screen replacement, backlight circuit repair, flickering diagnosis, and eDP connector work.',
    category: 'Display Repair',
    icon: Monitor,
  },
  {
    title: 'Battery & Charging',
    desc: 'Battery replacement, adapter detection, charging circuits, and MagSafe/USB-C power fixes.',
    category: 'Battery & Charging',
    icon: BatteryCharging,
  },
  {
    title: 'Liquid Damage Recovery',
    desc: 'Ultrasonic spill cleaning, oxidation removal, and logic board inspection after water accidents.',
    category: 'Liquid Damage Repair',
    icon: Droplets,
  },
  {
    title: 'macOS & Performance',
    desc: 'Clean macOS installation, Apple Silicon DFU recovery, booting fixes, and slow Mac diagnostics.',
    category: 'Software & Performance',
    icon: Laptop,
  },
  {
    title: 'Storage, Data & Thermal',
    desc: 'SSD upgrades where supported, data recovery assessment, cooling optimization, and Wi-Fi fixes.',
    category: 'Other Repairs',
    icon: Wrench,
  },
];

export function HomePage({ quotaExceeded = false }: { quotaExceeded?: boolean }) {
  const { settings, models, reviews, blogPosts } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const homeCopy = settings.pageContent.home;
  const faqs = settings.homeFaqs || [];

  useSeoMeta({
    title: settings.seoTitle || 'Refix Pro – Best MacBook Repair in Gurugram | Sector 14 Gurgaon',
    description:
      settings.seoDescription ||
      'Top-rated MacBook repair in Sector 14, Gurugram. Logic board chip-level repair, Retina screen replacement, battery service, liquid damage recovery, plus iPad & iPhone support.',
    keywords: settings.seoKeywords,
    canonicalPath: '/',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: settings.businessName,
        url: settings.websiteUrl,
        telephone: settings.phone,
        email: settings.email || 'refixpro.in@gmail.com',
        priceRange: '₹₹',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'SCF-92, Sector 14 Main Market',
          addressLocality: 'Gurugram',
          addressRegion: 'Haryana',
          postalCode: '122007',
          addressCountry: 'IN',
        },
        areaServed: [
          'Sector 14, Gurugram',
          'DLF Cyber City, Gurugram',
          'DLF Phase 1–5, Gurugram',
          'MG Road, Gurugram',
          'Golf Course Road, Gurugram',
          'Sohna Road, Gurugram',
          'Sushant Lok, Gurugram',
          'Udyog Vihar, Gurugram',
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: String(settings.googleRating),
          reviewCount: String(settings.googleReviewCount),
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.a,
          },
        })),
      },
    ],
  });

  const whatsappUrl = buildWhatsAppUrl(settings.whatsapp);
  const telHref = buildTelHref(settings.phone);
  const latestBlogs = blogPosts.slice(0, 3);
  const googleProfileEmail = settings.email || 'refixpro.in@gmail.com';
  const googleProfileUrl =
    settings.googleReviewsUrl ||
    'https://www.google.com/maps/search/?api=1&query=Refix+Pro+SCF-92+Sector+14+Main+Market+Gurugram';

  return (
    <div className="bg-white text-[#1D1D1F]">
      {/* HERO SECTION */}
      <section className="relative border-b border-[#E5E5EA] bg-gradient-to-b from-[#F5F5F7] via-[#F9F9FB] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs sm:text-sm font-semibold text-[#0066CC] tracking-tight">
                {homeCopy.heroEyebrow}
              </p>
              <h1 className="text-[clamp(2.25rem,4.3vw,3.85rem)] font-bold tracking-[-0.035em] leading-[1.06] text-[#1D1D1F]">
                {settings.heroHeadline}
              </h1>
              <p className="text-base sm:text-lg text-[#424245] leading-relaxed max-w-xl">
                {settings.heroSubheadline}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  to="/book"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-sm font-semibold transition-colors whitespace-nowrap shadow-sm"
                >
                  Book a Repair
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Us
                </a>
                <a
                  href={telHref}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <Phone className="w-4 h-4 text-[#0066CC]" />
                  Call Now
                </a>
                <Link
                  to="/track"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] hover:bg-[#E5E5EA]/70 text-[#1D1D1F] text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <Search className="w-4 h-4 text-[#0066CC]" />
                  Track Repair
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="h-full min-h-[280px] sm:min-h-[380px] rounded-2xl overflow-hidden border border-[#E5E5EA] bg-[#1D1D1F] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.28)]">
                <SafeImage
                  src={settings.heroImageUrl}
                  alt="Refix Pro MacBook Pro diagnostic and repair workbench in Sector 14, Gurugram"
                  className="w-full h-full lg:h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 4-column Trust Strip below Hero Split */}
          <div className="mt-12 pt-8 border-t border-[#E5E5EA] grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center gap-1.5 text-[#1D1D1F]">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-xl font-bold tabular-nums">{settings.googleRating}/5</span>
              </div>
              <p className="text-xs sm:text-sm text-[#6E6E73] mt-1">Google Rating</p>
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums text-[#1D1D1F]">
                {settings.googleReviewCount} Reviews
              </p>
              <p className="text-xs sm:text-sm text-[#6E6E73] mt-1">Verified Google Profile</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[#1D1D1F]">Skilled Service Team</p>
              <p className="text-xs sm:text-sm text-[#6E6E73] mt-1">Chip-Level & Display Bench</p>
            </div>
            <div>
              <p className="text-xl font-bold text-[#1D1D1F]">Sector 14, Gurugram</p>
              <p className="text-xs sm:text-sm text-[#6E6E73] mt-1">SCF-92 Main Market</p>
            </div>
          </div>
        </div>
      </section>

      {/* 1. OUR MACBOOK REPAIR SERVICES */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-xs font-semibold text-[#0066CC] mb-2">{homeCopy.servicesEyebrow}</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
              {homeCopy.servicesHeading}
            </h2>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0066CC] hover:underline whitespace-nowrap"
          >
            Explore All Services
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORY_HIGHLIGHTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.category}
                to={`/services?category=${encodeURIComponent(item.category)}`}
                className="group p-6 rounded-2xl border border-[#E5E5EA] bg-white hover:border-[#0066CC]/50 hover:shadow-[0_12px_32px_-16px_rgba(0,102,204,0.18)] transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-mono text-[#6E6E73] tabular-nums">
                      0{idx + 1}.
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#F5F5F7] group-hover:bg-[#0066CC]/10 flex items-center justify-center transition-colors">
                      <Icon className="w-5 h-5 text-[#0066CC]" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-[#1D1D1F] group-hover:text-[#0066CC] transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm text-[#424245] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <span className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-[#0066CC]">
                  View {item.category}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* INTERACTIVE REPAIR TOOLS: PRICE ESTIMATOR & TRACK MY REPAIR */}
      <section className="py-16 lg:py-24 bg-[#F5F5F7] border-y border-[#E5E5EA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#0066CC] mb-2">{homeCopy.toolsEyebrow}</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
              {homeCopy.toolsHeading}
            </h2>
            <p className="text-sm sm:text-base text-[#424245] mt-2">
              {homeCopy.toolsSubheading}
            </p>
          </div>

          <div id="price-estimator">
            <PriceEstimatorTool />
          </div>

          <div id="track-repair">
            <TrackRepairTool compact />
          </div>
        </div>
      </section>

      {/* 2. WHY CHOOSE REFIX PRO? (Obsidian Contrast Band) */}
      <section className="bg-[#0A0A0C] text-white py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6">
            <div className="h-full min-h-[320px] rounded-2xl overflow-hidden border border-[#2C2C2E]">
              <SafeImage
                src={IMG_MICROSCOPE}
                alt="Technician performing MacBook logic board micro-soldering under Leica stereo microscope at Refix Pro"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <p className="text-xs font-semibold text-[#60A5FA]">{homeCopy.whyEyebrow}</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {homeCopy.whyHeading}
            </h2>
            <p className="text-sm sm:text-base text-[#A1A1A6] leading-relaxed">
              {homeCopy.whyDescription}
            </p>
            <ul className="space-y-4 pt-2">
              {[
                {
                  title: 'Dedicated MacBook Focus',
                  text: 'We specialize in Apple MacBook hardware, logic boards, Retina panels, and macOS diagnostics.',
                },
                {
                  title: 'Microscope & Chip-Level Capability',
                  text: 'Equipped with Leica stereo optics, USB-C power analyzers, and ultrasonic liquid-cleaning baths.',
                },
                {
                  title: 'Transparent Estimate First',
                  text: 'You receive clear diagnostic findings and repair approval before any component work begins.',
                },
                {
                  title: 'Convenient Sector 14 Walk-In',
                  text: 'Located in SCF-92, Sector 14 Main Market, Gurugram — easy parking and direct technician communication.',
                },
              ].map((point) => (
                <li key={point.title} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#60A5FA] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">{point.title}</h3>
                    <p className="text-xs sm:text-sm text-[#A1A1A6] mt-0.5">{point.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3. MACBOOK MODELS WE SUPPORT */}
      <section className="py-16 lg:py-24 bg-[#F5F5F7] border-b border-[#E5E5EA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold text-[#0066CC] mb-2">{homeCopy.modelsEyebrow}</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
                {homeCopy.modelsHeading}
              </h2>
              <p className="text-sm sm:text-base text-[#424245] mt-2 max-w-2xl">
                {homeCopy.modelsSubheading}
              </p>
            </div>
            <Link
              to="/models"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0066CC] hover:underline whitespace-nowrap"
            >
              View All MacBook, iPad & iPhone Models
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              ...models.filter((m) => m.category !== 'iPad & Tablet' && m.category !== 'iPhone').slice(0, 4),
              ...models.filter((m) => m.category === 'iPad & Tablet').slice(0, 2),
              ...models.filter((m) => m.category === 'iPhone').slice(0, 2),
            ].map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white border border-[#E5E5EA] hover:border-[#0066CC]/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs text-[#6E6E73]">
                    {m.category} · {m.yearRange}
                  </p>
                  <h3 className="text-base font-bold text-[#1D1D1F] mt-1.5">{m.name}</h3>
                  <p className="text-xs text-[#424245] mt-1 font-mono">{m.processor}</p>
                  {m.modelIdentifiers && (
                    <p className="text-[11px] text-[#6E6E73] mt-1 font-mono truncate">{m.modelIdentifiers}</p>
                  )}
                </div>
                <Link
                  to={`/book?model=${encodeURIComponent(m.name)}`}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0066CC] hover:underline"
                >
                  Book for This Model
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. COMMON MACBOOK PROBLEMS & 5. OUR REPAIR PROCESS */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7">
            <p className="text-xs font-semibold text-[#0066CC] mb-2">Symptom Troubleshooting</p>
            <h2 className="text-3xl font-bold tracking-tight text-[#1D1D1F] mb-8">
              {homeCopy.problemsHeading}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COMMON_PROBLEMS.map((prob) => (
                <Link
                  key={prob.title}
                  to={`/book?service=${encodeURIComponent(prob.service)}`}
                  className="p-5 rounded-2xl border border-[#E5E5EA] hover:border-[#0066CC]/50 hover:bg-[#F5F5F7]/50 bg-white transition-all"
                >
                  <h3 className="text-base font-bold text-[#1D1D1F]">{prob.title}</h3>
                  <p className="text-xs sm:text-sm text-[#424245] mt-1.5 leading-relaxed">
                    {prob.desc}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0066CC]">
                    Book Assessment <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <p className="text-xs font-semibold text-[#0066CC] mb-2">Structured Workflow</p>
            <h2 className="text-3xl font-bold tracking-tight text-[#1D1D1F] mb-8">
              {homeCopy.processHeading}
            </h2>
            <div className="space-y-6 border-t border-[#E5E5EA] pt-6">
              {[
                {
                  step: '01.',
                  title: 'Walk-In or Quick Booking',
                  desc: 'Book in 30 seconds online or visit SCF-92, Sector 14 with your MacBook.',
                },
                {
                  step: '02.',
                  title: 'Workbench & Microscope Diagnostics',
                  desc: 'We inspect power rails, battery health, ports, and display circuits systematically.',
                },
                {
                  step: '03.',
                  title: 'Clear Estimate & Confirmation',
                  desc: 'You receive a transparent repair quote and parts confirmation before we proceed.',
                },
                {
                  step: '04.',
                  title: 'Precision Repair & Live Tracking',
                  desc: 'Track repair stages online until QA testing passes and your MacBook is ready.',
                },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-4 pb-5 border-b border-[#E5E5EA] last:border-b-0">
                  <span className="text-sm font-mono font-semibold text-[#0066CC] tabular-nums shrink-0 mt-0.5">
                    {s.step}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#1D1D1F]">{s.title}</h3>
                    <p className="text-sm text-[#424245] mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. CUSTOMER REVIEWS (Direct Google Business Profile Connection: refixpro.in@gmail.com) */}
      <section className="py-16 lg:py-24 bg-[#F5F5F7] border-y border-[#E5E5EA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-amber-500">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-bold text-[#1D1D1F] tabular-nums">
                  {settings.googleRating}/5 · {settings.googleReviewCount} Google Reviews
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
                {homeCopy.reviewsHeading}
              </h2>
              <p className="text-xs sm:text-sm text-[#424245] flex flex-wrap items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#0066CC] shrink-0" />
                <span>
                  Connected to Refix Pro Google Business Profile (
                  <a
                    href={`mailto:${googleProfileEmail}`}
                    className="font-mono font-semibold text-[#1D1D1F] hover:text-[#0066CC] underline underline-offset-2"
                  >
                    {googleProfileEmail}
                  </a>
                  ) · SCF-92, Sector 14, Gurugram
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={googleProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#D2D2D7] hover:bg-[#E5E5EA]/40 text-sm font-semibold text-[#1D1D1F] transition-colors whitespace-nowrap"
              >
                View All on Google
                <ExternalLink className="w-4 h-4 text-[#0066CC]" />
              </a>
              <a
                href={googleProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Star className="w-4 h-4" />
                Write a Google Review
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <blockquote
                key={rev.id}
                className="p-6 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col justify-between shadow-[0_8px_24px_-16px_rgba(0,0,0,0.08)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, idx) => (
                        <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium text-[#6E6E73]">
                      {rev.dateLabel || 'Verified'}
                    </span>
                  </div>
                  <p className="text-base text-[#1D1D1F] leading-relaxed font-medium">
                    “{rev.quote}”
                  </p>
                </div>
                <footer className="mt-6 pt-4 border-t border-[#F5F5F7] flex items-center justify-between gap-2 text-xs text-[#6E6E73]">
                  <span className="font-medium text-[#424245]">{rev.authorLabel}</span>
                  <span>{rev.source}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-16 lg:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-[#0066CC] mb-2">Clear Answers</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
            {homeCopy.faqHeading}
          </h2>
        </div>

        <div className="divide-y divide-[#E5E5EA] border-y border-[#E5E5EA]">
          {faqs.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={`${idx}-${item.q}`}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full py-5 flex items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]"
                >
                  <span className="text-base font-semibold text-[#1D1D1F]">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#6E6E73] shrink-0 transition-transform duration-150 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="pb-5 text-sm text-[#424245] leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. LATEST MACBOOK REPAIR BLOGS */}
      <section className="py-16 lg:py-24 bg-[#F5F5F7] border-t border-[#E5E5EA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold text-[#0066CC] mb-2">Repair Knowledge Base</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
                {homeCopy.blogHeading}
              </h2>
            </div>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0066CC] hover:underline whitespace-nowrap"
            >
              Read All Articles
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestBlogs.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group rounded-2xl overflow-hidden bg-white border border-[#E5E5EA] hover:border-[#0066CC]/50 transition-colors flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#E5E5EA]">
                  <SafeImage
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-[#6E6E73]">
                      {post.category} · {post.publishedAt}
                    </p>
                    <h3 className="text-lg font-bold text-[#1D1D1F] mt-2 group-hover:text-[#0066CC] transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-sm text-[#424245] mt-2 line-clamp-2">{post.excerpt}</p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0066CC]">
                    Read Guide <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CONTACT AND LOCATION */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            <div>
              <p className="text-xs font-semibold text-[#0066CC] mb-2">Visit Refix Pro</p>
              <h2 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">
                {homeCopy.locationHeading}
              </h2>
            </div>
            <div className="space-y-4 text-sm text-[#424245]">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#0066CC] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1D1D1F]">Address</p>
                  <p>{settings.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#0066CC] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1D1D1F]">Phone & WhatsApp</p>
                  <p className="font-mono tabular-nums">{settings.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#0066CC] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1D1D1F]">Official Email</p>
                  <p className="font-mono">{googleProfileEmail}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#0066CC] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1D1D1F]">Service Hours</p>
                  <p>{settings.businessHours}</p>
                </div>
              </div>
              {settings.serviceAreasText && (
                <p className="text-xs text-[#6E6E73] pt-2 border-t border-[#E5E5EA] leading-relaxed">
                  {settings.serviceAreasText}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=SCF-92,+Sector+14+Main+Market,+Gurugram,+Haryana+122007,+India"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-sm font-semibold transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#D2D2D7] hover:bg-[#F5F5F7] text-sm font-semibold text-[#1D1D1F] transition-colors"
              >
                Contact Page
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <GoogleMapLocation heightClass="h-[360px] lg:h-[400px]" quotaExceeded={quotaExceeded} />
          </div>
        </div>
      </section>

      {/* 10. FINAL BOOK YOUR REPAIR CTA */}
      <section className="bg-[#1D1D1F] text-white py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {homeCopy.finalCtaHeadline}
          </h2>
          <p className="text-sm sm:text-base text-[#A1A1A6] max-w-2xl mx-auto">
            {homeCopy.finalCtaSubheadline}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/book"
              className="px-6 py-3 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-sm font-semibold transition-colors"
            >
              Book Your MacBook Repair
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
