import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Droplets,
  ExternalLink,
  Laptop,
  Mail,
  MapPin,
  MessageCircle,
  Monitor,
  Navigation,
  PenSquare,
  Phone,
  Search,
  ShieldCheck,
  Star,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSeoMeta } from '../utils/seo';
import { buildTelHref, buildWhatsAppUrl } from '../utils/whatsapp';
import { SafeImage } from '../components/SafeImage';
import { GoogleMapLocation } from '../components/GoogleMapLocation';
import { PriceEstimatorTool } from '../components/PriceEstimatorTool';
import { TrackRepairTool } from '../components/TrackRepairTool';
import { RepairProcessTimeline } from '../components/RepairProcessTimeline';
import { WriteReviewForm } from '../components/WriteReviewForm';
import {
  FadeInSection,
  HeroReveal,
  STUDIO_EASE,
  StaggerCard,
  StaggerContainer,
} from '../components/MotionPrimitives';
import {
  IMG_BATTERY,
  IMG_DISPLAY,
  IMG_KEYBOARD,
  IMG_LIQUID,
  IMG_MACOS,
  IMG_MICROSCOPE,
  IMG_THERMAL,
  IMG_USBC,
  IMG_WORKSHOP,
} from '../data/seedServicesAndModels';

const EXACT_ADDRESS = 'SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007';

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
    image: IMG_MICROSCOPE,
    alt: 'Chip-level MacBook logic board micro-soldering under stereo microscope',
    featured: true,
  },
  {
    title: 'Display & Retina Repair',
    desc: 'Screen replacement, backlight circuit repair, flickering diagnosis, and eDP connector work.',
    category: 'Display Repair',
    icon: Monitor,
    image: IMG_DISPLAY,
    alt: 'MacBook Retina display calibration and panel replacement bench',
    featured: true,
  },
  {
    title: 'Battery & Charging',
    desc: 'Battery replacement, adapter detection, charging circuits, and MagSafe/USB-C power fixes.',
    category: 'Battery & Charging',
    icon: BatteryCharging,
    image: IMG_BATTERY,
    alt: 'Apple MacBook battery cell replacement and power rail testing',
    featured: false,
  },
  {
    title: 'Liquid Damage Recovery',
    desc: 'Ultrasonic spill cleaning, oxidation removal, and logic board inspection after water accidents.',
    category: 'Liquid Damage Repair',
    icon: Droplets,
    image: IMG_LIQUID,
    alt: 'Ultrasonic PCB cleaning for liquid-damaged MacBook logic boards',
    featured: false,
  },
  {
    title: 'macOS & Performance',
    desc: 'Clean macOS installation, Apple Silicon DFU recovery, booting fixes, and slow Mac diagnostics.',
    category: 'Software & Performance',
    icon: Laptop,
    image: IMG_MACOS,
    alt: 'macOS DFU restore and Apple Silicon firmware diagnostics workstation',
    featured: false,
  },
  {
    title: 'Storage, Data & Thermal',
    desc: 'SSD upgrades where supported, data recovery assessment, cooling optimization, and Wi-Fi fixes.',
    category: 'Other Repairs',
    icon: Wrench,
    image: IMG_THERMAL,
    alt: 'MacBook cooling fan servicing and thermal paste replacement bench',
    featured: false,
  },
];

const STUDIO_BENCH_HIGHLIGHTS = [
  {
    index: '01',
    title: 'Walk-In Inspection Desk',
    desc: `Direct technician handover at ${EXACT_ADDRESS} with upfront physical evaluation before any tools touch sealed components.`,
    image: IMG_WORKSHOP,
    alt: 'Refix Pro Apple repair studio interior at SCF-92 Sector 14 Main Market Gurugram',
  },
  {
    index: '02',
    title: 'USB-C & Power Rail Analyzer Lab',
    desc: 'Real-time current draw profiling detects 5V/20V negotiation stalls, CD3217 controller faults, and board shorts accurately.',
    image: IMG_USBC,
    alt: 'USB-C port diagnostics and current testing on MacBook logic board',
  },
  {
    index: '03',
    title: 'Top Case, Keyboard & Hinge Precision',
    desc: 'Clean scissor-switch keyboard replacement, swollen trackpad relief, and torque-matched display hinge adjustments.',
    image: IMG_KEYBOARD,
    alt: 'MacBook keyboard and top-case precision assembly workbench',
  },
];

interface UnifiedReviewSlide {
  id: string;
  rating: number;
  text: string;
  authorName: string;
  authorPhotoUri?: string;
  authorUri?: string;
  googleMapsUri?: string;
  relativeTime: string;
  sourceLabel: string;
  isGoogleLive: boolean;
}

type HomeModelTab = 'All Devices' | 'MacBook' | 'iPad & Tablet' | 'iPhone';

export function HomePage({
  quotaExceeded = false,
  onNotify,
}: {
  quotaExceeded?: boolean;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}) {
  const { settings, models, reviews, blogPosts, googleLiveProfile, user } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeModelTab, setActiveModelTab] = useState<HomeModelTab>('All Devices');
  const [showReviewComposer, setShowReviewComposer] = useState(false);

  // Hero slider state
  const heroSlides = useMemo(() => {
    const slides = (settings.heroSlides || []).filter((s) => s.imageUrl && s.imageUrl.trim());
    if (slides.length > 0) return slides;
    return [
      {
        id: 'fallback-hero',
        title: 'Refix Pro Diagnostic Studio',
        subtitle: EXACT_ADDRESS,
        imageUrl: settings.heroImageUrl || IMG_WORKSHOP,
      },
    ];
  }, [settings.heroSlides, settings.heroImageUrl]);

  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);

  useEffect(() => {
    if (heroIndex >= heroSlides.length) {
      setHeroIndex(0);
    }
  }, [heroIndex, heroSlides.length]);

  useEffect(() => {
    if (heroSlides.length <= 1 || heroPaused) return;
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length, heroPaused]);

  const activeHeroSlide = heroSlides[heroIndex] || heroSlides[0];

  // Unified Reviews Carousel Slider state (live Google Business Profile + Website customer reviews)
  const unifiedReviews = useMemo<UnifiedReviewSlide[]>(() => {
    const googleList: UnifiedReviewSlide[] = googleLiveProfile.reviews.map((gRev) => ({
      id: `google-${gRev.id}`,
      rating: Math.max(1, Math.min(5, Math.round(gRev.rating))),
      text: gRev.text,
      authorName: gRev.authorName,
      authorPhotoUri: gRev.authorPhotoUri || undefined,
      authorUri: gRev.authorUri || undefined,
      googleMapsUri: gRev.googleMapsUri || undefined,
      relativeTime: gRev.relativeTime || 'Google Review',
      sourceLabel: 'Live Google Review',
      isGoogleLive: true,
    }));

    const siteList: UnifiedReviewSlide[] = reviews.map((rev) => ({
      id: `site-${rev.id}`,
      rating: Math.max(1, Math.min(5, Math.round(rev.rating))),
      text: rev.quote,
      authorName: rev.authorLabel,
      relativeTime: rev.dateLabel || 'Verified',
      sourceLabel: rev.source || 'Customer Review',
      isGoogleLive: false,
    }));

    return [...googleList, ...siteList];
  }, [googleLiveProfile.reviews, reviews]);

  const [slidesPerView, setSlidesPerView] = useState(3);
  const [reviewSlideIndex, setReviewSlideIndex] = useState(0);
  const [reviewPaused, setReviewPaused] = useState(false);

  useEffect(() => {
    const updatePerView = () => {
      const w = window.innerWidth;
      if (w < 768) {
        setSlidesPerView(1);
      } else if (w < 1200) {
        setSlidesPerView(2);
      } else {
        setSlidesPerView(3);
      }
    };
    updatePerView();
    window.addEventListener('resize', updatePerView);
    return () => window.removeEventListener('resize', updatePerView);
  }, []);

  const totalReviewPages = Math.max(1, Math.ceil(unifiedReviews.length / slidesPerView));

  useEffect(() => {
    if (reviewSlideIndex >= totalReviewPages) {
      setReviewSlideIndex(0);
    }
  }, [reviewSlideIndex, totalReviewPages]);

  useEffect(() => {
    if (totalReviewPages <= 1 || reviewPaused) return;
    const timer = window.setInterval(() => {
      setReviewSlideIndex((prev) => (prev + 1) % totalReviewPages);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [totalReviewPages, reviewPaused]);

  const visibleReviewSlice = useMemo(() => {
    const start = reviewSlideIndex * slidesPerView;
    const chunk = unifiedReviews.slice(start, start + slidesPerView);
    if (chunk.length < slidesPerView && unifiedReviews.length > slidesPerView) {
      const wrapNeeded = slidesPerView - chunk.length;
      return [...chunk, ...unifiedReviews.slice(0, wrapNeeded)];
    }
    return chunk;
  }, [unifiedReviews, reviewSlideIndex, slidesPerView]);

  const homeCopy = settings.pageContent.home;
  const faqs = settings.homeFaqs || [];

  const liveGoogleRating = googleLiveProfile.rating ?? settings.googleRating;
  const liveGoogleReviewCount = googleLiveProfile.userRatingCount ?? settings.googleReviewCount;
  const googleProfileEmail = settings.email || 'refixpro.in@gmail.com';
  const googleProfileUrl =
    googleLiveProfile.googleMapsUri ||
    settings.googleReviewsUrl ||
    'https://www.google.com/maps/search/?api=1&query=Refix+Pro+SCF-92+Sector+14+Main+Market+Gurugram';

  useSeoMeta({
    title: settings.seoTitle || 'Refix Pro – Best MacBook Repair in Gurugram | SCF-92 Sector 14',
    description:
      settings.seoDescription ||
      `Top-rated Apple MacBook, iPad, and iPhone repair specialist at ${EXACT_ADDRESS}. Logic board micro-soldering, Retina screen replacement, battery service, and liquid damage recovery.`,
    keywords: settings.seoKeywords,
    canonicalPath: '/',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: settings.businessName,
        url: settings.websiteUrl,
        telephone: settings.phone,
        email: googleProfileEmail,
        priceRange: '₹₹',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'SCF-92,SECTOR-14 MAIN MARKET',
          addressLocality: 'Gurugram',
          addressRegion: 'Haryana',
          postalCode: '122007',
          addressCountry: 'IN',
        },
        areaServed: [EXACT_ADDRESS],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: String(liveGoogleRating),
          reviewCount: String(Math.max(liveGoogleReviewCount, reviews.length)),
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

  const displayedModels = useMemo(() => {
    if (activeModelTab === 'MacBook') {
      return models
        .filter((m) => m.category !== 'iPad & Tablet' && m.category !== 'iPhone')
        .slice(0, 8);
    }
    if (activeModelTab === 'iPad & Tablet') {
      return models.filter((m) => m.category === 'iPad & Tablet').slice(0, 8);
    }
    if (activeModelTab === 'iPhone') {
      return models.filter((m) => m.category === 'iPhone').slice(0, 8);
    }
    return [
      ...models.filter((m) => m.category !== 'iPad & Tablet' && m.category !== 'iPhone').slice(0, 4),
      ...models.filter((m) => m.category === 'iPad & Tablet').slice(0, 2),
      ...models.filter((m) => m.category === 'iPhone').slice(0, 2),
    ];
  }, [models, activeModelTab]);

  const whatsappUrl = buildWhatsAppUrl(settings.whatsapp);
  const telHref = buildTelHref(settings.phone);
  const latestBlogs = blogPosts.slice(0, 3);

  return (
    <div className="bg-white text-[#1D1D1F] w-full">
      {/* 1. HERO SECTION WITH ADMIN-EDITABLE IMAGE SLIDER */}
      <section className="relative border-b border-[#E5E5EA] bg-gradient-to-b from-[#F5F5F7] via-[#FAFAFC] to-white overflow-hidden">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-10 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <HeroReveal className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs sm:text-sm font-semibold text-[#0066CC] tracking-tight">
                {homeCopy.heroEyebrow} · {EXACT_ADDRESS}
              </p>
              <h1 className="text-[clamp(2.2rem,4.1vw,3.9rem)] font-bold tracking-[-0.035em] leading-[1.06] text-[#1D1D1F]">
                {settings.heroHeadline}
              </h1>
              <p className="text-base sm:text-lg text-[#424245] leading-relaxed max-w-2xl">
                {settings.heroSubheadline}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.985 }}>
                  <Link
                    to="/book"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-sm font-semibold transition-colors whitespace-nowrap shadow-[0_8px_20px_-8px_rgba(0,102,204,0.45)]"
                  >
                    Book a Repair
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
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
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <UserCheck className="w-4 h-4 text-[#0066CC]" />
                  {user ? 'My Dashboard' : 'Customer Login'}
                </Link>
              </div>
            </HeroReveal>

            {/* Right Interactive Image Slider */}
            <HeroReveal delay={0.08} className="lg:col-span-6 flex flex-col">
              <div
                onMouseEnter={() => setHeroPaused(true)}
                onMouseLeave={() => setHeroPaused(false)}
                className="relative flex-1 min-h-[300px] sm:min-h-[420px] rounded-2xl overflow-hidden border border-[#E5E5EA] bg-[#141416] shadow-[0_24px_48px_-24px_rgba(0,0,0,0.3)] group"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeHeroSlide.id || heroIndex}
                    initial={{ opacity: 0.35, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0.35 }}
                    transition={{ duration: 0.45, ease: STUDIO_EASE }}
                    className="absolute inset-0"
                  >
                    <SafeImage
                      src={activeHeroSlide.imageUrl}
                      alt={activeHeroSlide.title || 'Refix Pro Apple MacBook repair studio workstation'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none" />
                  </motion.div>
                </AnimatePresence>

                {/* Prev / Next Slider Controls */}
                {heroSlides.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setHeroIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
                      }
                      aria-label="Previous hero slide"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-black/55 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-opacity border border-white/15"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroIndex((prev) => (prev + 1) % heroSlides.length)}
                      aria-label="Next hero slide"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-black/55 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-opacity border border-white/15"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Bottom Overlay Caption & Indicator Dots */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between gap-4 text-white">
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold truncate">
                      {activeHeroSlide.title || 'Refix Pro Diagnostic Studio'}
                    </p>
                    <p className="text-xs text-[#D2D2D7] line-clamp-1 mt-0.5">
                      {activeHeroSlide.subtitle || EXACT_ADDRESS}
                    </p>
                  </div>
                  {heroSlides.length > 1 && (
                    <div className="flex items-center gap-1.5 shrink-0 pb-1">
                      {heroSlides.map((sl, idx) => (
                        <button
                          key={sl.id || idx}
                          type="button"
                          onClick={() => setHeroIndex(idx)}
                          aria-label={`View slide ${idx + 1}`}
                          className={`h-2 rounded-full transition-all ${
                            idx === heroIndex ? 'w-6 bg-[#60A5FA]' : 'w-2 bg-white/50 hover:bg-white'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E6E73] px-1">
                <span className="font-medium text-[#1D1D1F]">
                  {EXACT_ADDRESS} · ESD-Safe Micro-Soldering & Retina Calibration
                </span>
                <span className="font-mono tabular-nums">
                  Slide {heroIndex + 1}/{heroSlides.length} · Mon–Sun
                </span>
              </div>
            </HeroReveal>
          </div>

          {/* 4-column Trust Strip below Hero Split */}
          <FadeInSection delay={0.1} className="mt-10 pt-8 border-t border-[#E5E5EA] grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/reviews" className="group block">
              <div className="flex items-center gap-1.5 text-[#1D1D1F]">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-xl font-bold tabular-nums group-hover:text-[#0066CC] transition-colors">
                  {liveGoogleRating}/5
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#6E6E73] mt-1">
                {googleLiveProfile.reviews.length > 0 ? 'Live Google Rating · Read Reviews' : 'Google Rating · Read Reviews'}
              </p>
            </Link>
            <Link to="/reviews" className="group block">
              <p className="text-xl font-bold tabular-nums text-[#1D1D1F] group-hover:text-[#0066CC] transition-colors">
                {liveGoogleReviewCount}+ Reviews
              </p>
              <p className="text-xs sm:text-sm text-[#6E6E73] mt-1">Verified Google & Customer Feedback</p>
            </Link>
            <Link to="/warranty-and-refund-policy" className="group block">
              <p className="text-xl font-bold text-[#1D1D1F] group-hover:text-[#0066CC] transition-colors">
                Service Warranty
              </p>
              <p className="text-xs sm:text-sm text-[#6E6E73] mt-1">Clear Diagnostic Approval First</p>
            </Link>
            <Link to="/contact" className="group block">
              <p className="text-lg sm:text-xl font-bold text-[#1D1D1F] group-hover:text-[#0066CC] transition-colors">
                SCF-92,SECTOR-14 MAIN MARKET
              </p>
              <p className="text-xs sm:text-sm text-[#6E6E73] mt-1">Gurugram, Haryana 122007</p>
            </Link>
          </FadeInSection>
        </div>
      </section>

      {/* 2. OUR MACBOOK REPAIR SERVICES (Full-Width Bento Architecture) */}
      <section className="py-16 lg:py-20 w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <FadeInSection className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold text-[#0066CC] mb-2">{homeCopy.servicesEyebrow}</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
              {homeCopy.servicesHeading}
            </h2>
          </div>
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0066CC] hover:underline whitespace-nowrap shrink-0"
          >
            Explore All Services
            <ArrowRight className="w-4 h-4" />
          </Link>
        </FadeInSection>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
          {CATEGORY_HIGHLIGHTS.map((item, idx) => {
            const Icon = item.icon;
            const spanClass = item.featured ? 'lg:col-span-6' : 'lg:col-span-3';
            return (
              <StaggerCard key={item.category} className={spanClass}>
                <Link
                  to={`/services?category=${encodeURIComponent(item.category)}`}
                  className={`h-full group rounded-2xl border border-[#E5E5EA] overflow-hidden ${
                    idx === 0
                      ? 'bg-gradient-to-br from-[#F5F5F7] to-white'
                      : 'bg-white'
                  } hover:border-[#0066CC]/50 hover:shadow-[0_14px_34px_-18px_rgba(0,102,204,0.2)] transition-all duration-200 ${
                    item.featured ? 'flex flex-col sm:flex-row' : 'flex flex-col'
                  }`}
                >
                  <div
                    className={
                      item.featured
                        ? 'sm:w-48 lg:w-56 shrink-0 aspect-[16/10] sm:aspect-auto bg-[#F5F5F7] overflow-hidden border-b sm:border-b-0 sm:border-r border-[#E5E5EA]'
                        : 'aspect-[16/10] bg-[#F5F5F7] overflow-hidden border-b border-[#E5E5EA]'
                    }
                  >
                    <SafeImage
                      src={item.image}
                      alt={item.alt}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                  </div>

                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="text-xs font-mono text-[#6E6E73] tabular-nums">
                          0{idx + 1}.
                        </span>
                        <div className="w-9 h-9 rounded-lg bg-[#F5F5F7] group-hover:bg-[#0066CC]/10 border border-[#E5E5EA] flex items-center justify-center transition-colors">
                          <Icon className="w-4 h-4 text-[#0066CC]" />
                        </div>
                      </div>
                      <h3
                        className={`${
                          item.featured ? 'text-xl' : 'text-lg'
                        } font-bold text-[#1D1D1F] group-hover:text-[#0066CC] transition-colors`}
                      >
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm text-[#424245] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                    <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-[#0066CC]">
                      View {item.category}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </StaggerCard>
            );
          })}
        </StaggerContainer>
      </section>

      {/* 3. INTERACTIVE TOOLS: PRICE ESTIMATOR (MIN TO HIGH) & TRACK MY REPAIR */}
      <section className="py-16 lg:py-20 bg-[#F5F5F7] border-y border-[#E5E5EA]">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-10">
          <FadeInSection className="max-w-3xl">
            <p className="text-xs font-semibold text-[#0066CC] mb-2">{homeCopy.toolsEyebrow}</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
              {homeCopy.toolsHeading}
            </h2>
            <p className="text-sm sm:text-base text-[#424245] mt-2">
              {homeCopy.toolsSubheading}
            </p>
          </FadeInSection>

          <FadeInSection delay={0.05} className="scroll-mt-24">
            <div id="price-estimator">
              <PriceEstimatorTool />
            </div>
          </FadeInSection>

          <FadeInSection delay={0.08} className="scroll-mt-24">
            <div id="track-repair">
              <TrackRepairTool compact />
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* 4. INTERACTIVE STEP-BY-STEP REPAIR PROCESS TIMELINE */}
      <section className="py-16 lg:py-20 w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <FadeInSection>
          <RepairProcessTimeline />
        </FadeInSection>
      </section>

      {/* 5. WHY CHOOSE REFIX PRO? (Obsidian Contrast Band) */}
      <section className="bg-[#0A0A0C] text-white py-16 lg:py-20">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <FadeInSection className="lg:col-span-6">
              <div className="h-full min-h-[320px] rounded-2xl overflow-hidden border border-[#2C2C2E]">
                <SafeImage
                  src={IMG_MICROSCOPE}
                  alt="Technician performing MacBook logic board micro-soldering under Leica stereo microscope at Refix Pro"
                  className="w-full h-full object-cover"
                />
              </div>
            </FadeInSection>
            <FadeInSection delay={0.08} className="lg:col-span-6 flex flex-col justify-center space-y-6">
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
                    title: 'Dedicated Apple Hardware Focus',
                    text: 'We specialize in Apple MacBook logic boards, Retina panels, and macOS diagnostics alongside iPad and iPhone hardware.',
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
                    title: 'Single Convenient Gurugram Repair Studio',
                    text: `Visit us directly at ${EXACT_ADDRESS} — clean customer reception and direct technician communication.`,
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
            </FadeInSection>
          </div>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#2C2C2E]">
            {STUDIO_BENCH_HIGHLIGHTS.map((bench) => (
              <StaggerCard
                key={bench.index}
                className="rounded-2xl overflow-hidden border border-[#2C2C2E] bg-[#141416] flex flex-col"
              >
                <div className="aspect-[16/10] overflow-hidden bg-[#1D1D1F]">
                  <SafeImage
                    src={bench.image}
                    alt={bench.alt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 space-y-2">
                  <span className="text-xs font-mono text-[#60A5FA] tabular-nums">{bench.index}.</span>
                  <h3 className="text-base font-bold text-white">{bench.title}</h3>
                  <p className="text-xs sm:text-sm text-[#A1A1A6] leading-relaxed">{bench.desc}</p>
                </div>
              </StaggerCard>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* 6. MACBOOK, IPAD & IPHONE MODELS WE SUPPORT */}
      <section className="py-16 lg:py-20 bg-[#F5F5F7] border-b border-[#E5E5EA]">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
          <FadeInSection className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-xs font-semibold text-[#0066CC] mb-2">{homeCopy.modelsEyebrow}</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
                {homeCopy.modelsHeading}
              </h2>
              <p className="text-sm sm:text-base text-[#424245] mt-2 max-w-3xl">
                {homeCopy.modelsSubheading}
              </p>
            </div>
            <Link
              to="/models"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0066CC] hover:underline whitespace-nowrap shrink-0"
            >
              View All MacBook, iPad & iPhone Models
              <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeInSection>

          <div className="flex flex-wrap items-center gap-2 mb-8">
            {(['All Devices', 'MacBook', 'iPad & Tablet', 'iPhone'] as HomeModelTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveModelTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  activeModelTab === tab
                    ? 'bg-[#1D1D1F] text-white'
                    : 'bg-white border border-[#E5E5EA] text-[#424245] hover:text-[#1D1D1F]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {displayedModels.map((m) => (
              <StaggerCard
                key={m.id}
                className="p-5 rounded-2xl bg-white border border-[#E5E5EA] hover:border-[#0066CC]/45 hover:shadow-[0_10px_28px_-18px_rgba(0,102,204,0.2)] transition-all flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs text-[#6E6E73] tabular-nums">
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
              </StaggerCard>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* 7. COMMON MACBOOK PROBLEMS */}
      <section className="py-16 lg:py-20 w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <FadeInSection className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold text-[#0066CC] mb-2">Symptom Troubleshooting</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
              {homeCopy.problemsHeading}
            </h2>
          </div>
          <Link
            to="/book"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0066CC] hover:underline whitespace-nowrap shrink-0"
          >
            Submit Your Symptom
            <ArrowRight className="w-4 h-4" />
          </Link>
        </FadeInSection>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {COMMON_PROBLEMS.map((prob) => (
            <StaggerCard key={prob.title}>
              <Link
                to={`/book?service=${encodeURIComponent(prob.service)}`}
                className="h-full block group p-6 rounded-2xl border border-[#E5E5EA] hover:border-[#0066CC]/50 hover:bg-[#F5F5F7]/60 bg-white transition-all"
              >
                <h3 className="text-lg font-bold text-[#1D1D1F] group-hover:text-[#0066CC] transition-colors">
                  {prob.title}
                </h3>
                <p className="text-sm text-[#424245] mt-2 leading-relaxed">
                  {prob.desc}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0066CC]">
                  Book Assessment <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            </StaggerCard>
          ))}
        </StaggerContainer>
      </section>

      {/* 8. REVIEWS SLIDER (HORIZONTAL CAROUSEL SLIDES — NOT A PRODUCT LISTING GRID) */}
      <section
        id="reviews"
        onMouseEnter={() => setReviewPaused(true)}
        onMouseLeave={() => setReviewPaused(false)}
        className="py-16 lg:py-20 bg-[#F5F5F7] border-y border-[#E5E5EA]"
      >
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-8">
          <FadeInSection className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-amber-500">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-bold text-[#1D1D1F] tabular-nums">
                  {liveGoogleRating}/5 · {liveGoogleReviewCount}+ Google Reviews · {reviews.length} Customer Reviews
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
                  )
                  {googleLiveProfile.reviews.length > 0
                    ? ` · Live Places Feed (${googleLiveProfile.reviews.length} Original Google Reviews Synced)`
                    : ' · Everyone can share verified feedback directly in the slider below.'}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowReviewComposer((prev) => !prev)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <PenSquare className="w-4 h-4" />
                {showReviewComposer ? 'Close Review Form' : 'Write a Review'}
              </button>
              <Link
                to="/reviews"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#D2D2D7] hover:bg-[#E5E5EA]/40 text-sm font-semibold text-[#1D1D1F] transition-colors whitespace-nowrap"
              >
                View All Reviews
                <ArrowRight className="w-4 h-4 text-[#0066CC]" />
              </Link>
              <a
                href={googleProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#E5E5EA]/40 text-sm font-semibold text-[#1D1D1F] transition-colors whitespace-nowrap"
              >
                Google Profile
                <ExternalLink className="w-4 h-4 text-[#0066CC]" />
              </a>
            </div>
          </FadeInSection>

          <AnimatePresence>
            {showReviewComposer && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: STUDIO_EASE }}
                className="max-w-3xl"
              >
                <WriteReviewForm
                  compact
                  onNotify={onNotify}
                  onSubmitted={() => setShowReviewComposer(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Horizontal Carousel Slider Controls + Viewport */}
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 border-b border-[#E5E5EA] pb-3">
              <p className="text-xs font-semibold text-[#1D1D1F]">
                Verified Google & Customer Reviews Carousel · Slide {reviewSlideIndex + 1} of {totalReviewPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setReviewSlideIndex((prev) => (prev - 1 + totalReviewPages) % totalReviewPages)
                  }
                  aria-label="Previous reviews slide"
                  className="w-9 h-9 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#1D1D1F] hover:text-white text-[#1D1D1F] flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setReviewSlideIndex((prev) => (prev + 1) % totalReviewPages)}
                  aria-label="Next reviews slide"
                  className="w-9 h-9 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#1D1D1F] hover:text-white text-[#1D1D1F] flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${reviewSlideIndex}-${slidesPerView}`}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.28, ease: STUDIO_EASE }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {visibleReviewSlice.map((item, idx) => (
                  <blockquote
                    key={`${item.id}-${idx}`}
                    className="h-full min-h-[235px] p-6 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col justify-between shadow-[0_8px_24px_-16px_rgba(0,0,0,0.08)]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: item.rating }).map((_, starIdx) => (
                            <Star key={starIdx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-[11px] font-medium text-[#6E6E73] tabular-nums">
                          {item.relativeTime}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-[#1D1D1F] leading-relaxed font-medium line-clamp-5">
                        “{item.text}”
                      </p>
                    </div>

                    <footer className="mt-6 pt-4 border-t border-[#F5F5F7] flex items-center justify-between gap-2 text-xs text-[#6E6E73]">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.authorPhotoUri && (
                          <img
                            src={item.authorPhotoUri}
                            alt={item.authorName}
                            referrerPolicy="no-referrer"
                            className="w-6 h-6 rounded-full object-cover shrink-0 border border-[#E5E5EA]"
                          />
                        )}
                        {item.authorUri ? (
                          <a
                            href={item.authorUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-[#1D1D1F] hover:text-[#0066CC] truncate"
                          >
                            {item.authorName}
                          </a>
                        ) : (
                          <span className="font-semibold text-[#1D1D1F] truncate">
                            {item.authorName}
                          </span>
                        )}
                      </div>
                      {item.googleMapsUri ? (
                        <a
                          href={item.googleMapsUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-[#0066CC] hover:underline font-medium"
                        >
                          {item.sourceLabel}
                        </a>
                      ) : (
                        <span className="shrink-0">{item.sourceLabel}</span>
                      )}
                    </footer>
                  </blockquote>
                ))}
              </motion.div>
            </AnimatePresence>

            {/* Pagination Dots */}
            {totalReviewPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                {Array.from({ length: totalReviewPages }).map((_, pageIdx) => (
                  <button
                    key={pageIdx}
                    type="button"
                    onClick={() => setReviewSlideIndex(pageIdx)}
                    aria-label={`Show review slide group ${pageIdx + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      pageIdx === reviewSlideIndex
                        ? 'w-7 bg-[#0066CC]'
                        : 'w-2 bg-[#D2D2D7] hover:bg-[#6E6E73]'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 9. LATEST MACBOOK REPAIR BLOGS */}
      <section className="py-16 lg:py-20 bg-white border-b border-[#E5E5EA]">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
          <FadeInSection className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
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
          </FadeInSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestBlogs.map((post) => (
              <StaggerCard key={post.id}>
                <Link
                  to={`/blog/${post.slug}`}
                  className="h-full group rounded-2xl overflow-hidden bg-white border border-[#E5E5EA] hover:border-[#0066CC]/50 transition-colors flex flex-col"
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
              </StaggerCard>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* 10. FREQUENTLY ASKED QUESTIONS (MOVED TOWARD BOTTOM BEFORE CONTACT) */}
      <section className="py-16 lg:py-20 bg-[#F5F5F7] border-b border-[#E5E5EA]">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
          <FadeInSection className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold text-[#0066CC] mb-2">Clear Answers</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
                {homeCopy.faqHeading}
              </h2>
            </div>
            <Link to="/faq" className="text-sm font-semibold text-[#0066CC] hover:underline whitespace-nowrap">
              Browse Full FAQ Center →
            </Link>
          </FadeInSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 border-t border-[#E5E5EA]">
            {faqs.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={`${idx}-${item.q}`} className="border-b border-[#E5E5EA]">
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
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: STUDIO_EASE }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 text-sm text-[#424245] leading-relaxed">{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. BASIC CONTACT & SINGLE LOCATION AT BOTTOM */}
      <section className="py-16 lg:py-20 w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <FadeInSection className="lg:col-span-5 flex flex-col justify-center space-y-6">
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
                  <p className="font-semibold text-[#1D1D1F]">Exact Studio Address</p>
                  <p>{EXACT_ADDRESS}</p>
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
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=SCF-92,+SECTOR-14+MAIN+MARKET,+Gurugram,+Haryana+122007"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#D2D2D7] hover:bg-[#F5F5F7] text-sm font-semibold text-[#1D1D1F] transition-colors whitespace-nowrap"
              >
                Send a Message
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#D2D2D7] hover:bg-[#F5F5F7] text-sm font-semibold text-[#0066CC] transition-colors whitespace-nowrap"
              >
                Customer Dashboard
              </Link>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.08} className="lg:col-span-7">
            <GoogleMapLocation heightClass="h-[360px] lg:h-[420px]" quotaExceeded={quotaExceeded} />
          </FadeInSection>
        </div>
      </section>

      {/* 12. FINAL BOOK YOUR REPAIR CTA */}
      <section className="bg-[#1D1D1F] text-white py-16 lg:py-20">
        <FadeInSection className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {homeCopy.finalCtaHeadline}
          </h2>
          <p className="text-sm sm:text-base text-[#A1A1A6] max-w-2xl mx-auto">
            {homeCopy.finalCtaSubheadline}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/book"
              className="px-6 py-3 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Book Your MacBook Repair
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
            </a>
          </div>
        </FadeInSection>
      </section>
    </div>
  );
}
