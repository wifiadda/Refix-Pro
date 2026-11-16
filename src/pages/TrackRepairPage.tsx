import { Link, useSearchParams } from 'react-router-dom';
import { Clock, HelpCircle, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { TrackRepairTool } from '../components/TrackRepairTool';
import { useApp } from '../context/AppContext';
import { useSeoMeta } from '../utils/seo';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import {
  FadeInSection,
  HeroReveal,
  StaggerCard,
  StaggerContainer,
} from '../components/MotionPrimitives';

export function TrackRepairPage() {
  const { settings } = useApp();
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  const initialMobile = searchParams.get('mobile') || '';

  const trackCopy = settings.pageContent.track;

  useSeoMeta({
    title: 'Track My Repair Status | Refix Pro Gurugram',
    description:
      'Check live MacBook, iPad, or iPhone repair progress, diagnostic estimate, and pickup readiness at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 using your RP- Enquiry ID and mobile number.',
    keywords: settings.seoKeywords,
    canonicalPath: '/track',
  });

  return (
    <div className="bg-[#F5F5F7] min-h-screen py-12 lg:py-16">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-10">
        <HeroReveal className="space-y-3">
          <nav aria-label="Breadcrumb" className="text-xs text-[#6E6E73] flex items-center gap-2">
            <Link to="/" className="hover:text-[#1D1D1F]">Home</Link>
            <span>/</span>
            <span className="text-[#1D1D1F] font-medium">Track My Repair</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
            {trackCopy.headline}
          </h1>
          <p className="text-sm sm:text-base text-[#424245] max-w-2xl">
            {trackCopy.subheadline}
          </p>
        </HeroReveal>

        <FadeInSection delay={0.05}>
          <TrackRepairTool initialCode={initialCode} initialMobile={initialMobile} />
        </FadeInSection>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StaggerCard className="p-5 rounded-2xl bg-white border border-[#E5E5EA] space-y-2">
            <HelpCircle className="w-5 h-5 text-[#0066CC]" />
            <h2 className="text-sm font-bold text-[#1D1D1F]">Where is my Enquiry ID?</h2>
            <p className="text-xs text-[#424245] leading-relaxed">
              Your <span className="font-mono font-semibold">RP-...</span> booking reference appears immediately after submitting our online booking form and in your desk receipt.
            </p>
          </StaggerCard>

          <StaggerCard className="p-5 rounded-2xl bg-white border border-[#E5E5EA] space-y-2">
            <ShieldCheck className="w-5 h-5 text-[#0066CC]" />
            <h2 className="text-sm font-bold text-[#1D1D1F]">Privacy Protected Lookup</h2>
            <p className="text-xs text-[#424245] leading-relaxed">
              Both your Enquiry ID and registered mobile number are required together, and no personal contact details are exposed publicly.
            </p>
          </StaggerCard>

          <StaggerCard className="p-5 rounded-2xl bg-white border border-[#E5E5EA] space-y-2.5">
            <div className="flex items-center gap-2 text-xs text-[#424245]">
              <Clock className="w-4 h-4 text-[#0066CC] shrink-0" />
              <span>{settings.businessHours}</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-[#424245]">
              <MapPin className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
              <span>SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007</span>
            </div>
            <a
              href={buildWhatsAppUrl(settings.whatsapp, 'Hello Refix Pro, I need help checking my MacBook repair status.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A] hover:underline pt-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Message Refix Pro Desk on WhatsApp
            </a>
          </StaggerCard>
        </StaggerContainer>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[#6E6E73]">
          <span>Finished repairing with us? Share your experience to help Gurugram Apple owners.</span>
          <div className="flex items-center gap-4 font-semibold">
            <Link to="/reviews" className="text-[#0066CC] hover:underline whitespace-nowrap">
              Write a Review
            </Link>
            <Link to="/faq" className="text-[#0066CC] hover:underline whitespace-nowrap">
              Repair FAQs
            </Link>
            <Link to="/warranty-and-refund-policy" className="text-[#0066CC] hover:underline whitespace-nowrap">
              Warranty Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
