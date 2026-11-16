import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSeoMeta } from '../utils/seo';
import { buildTelHref, buildWhatsAppUrl } from '../utils/whatsapp';
import { SafeImage } from '../components/SafeImage';
import { IMG_MICROSCOPE, IMG_WORKSHOP } from '../data/seedServicesAndModels';

export function AboutPage() {
  const { settings, galleryImages } = useApp();

  const aboutCopy = settings.pageContent.about;

  useSeoMeta({
    title: 'About Refix Pro – MacBook Repair Specialists in Gurugram',
    description:
      'Learn about Refix Pro in Sector 14 Main Market, Gurugram. Dedicated Apple MacBook diagnostics, logic board troubleshooting, chip-level repair, and customer-first care.',
    keywords: settings.seoKeywords,
    canonicalPath: '/about',
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Page Hero */}
      <section className="bg-[#F5F5F7] border-b border-[#E5E5EA] py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
            <nav aria-label="Breadcrumb" className="text-xs text-[#6E6E73] flex items-center gap-2">
              <Link to="/" className="hover:text-[#1D1D1F]">Home</Link>
              <span>/</span>
              <span className="text-[#1D1D1F] font-medium">About Us</span>
            </nav>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1D1D1F] leading-tight">
              {aboutCopy.headline}
            </h1>
            <p className="text-base text-[#424245] leading-relaxed">
              {aboutCopy.subheadline}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                to="/book"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-sm font-semibold transition-colors"
              >
                Book a Repair
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={buildWhatsAppUrl(settings.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Desk
              </a>
            </div>
          </div>
          <div className="lg:col-span-6">
            <div className="h-full min-h-[280px] rounded-2xl overflow-hidden border border-[#E5E5EA] bg-white">
              <SafeImage
                src={aboutCopy.workshopImageUrl || IMG_WORKSHOP}
                alt="Refix Pro MacBook repair studio reception and clean glass repair lab in Sector 14, Gurugram"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Diagnostic Philosophy & Expertise */}
      <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
        <div className="lg:col-span-5">
          <div className="h-full min-h-[300px] rounded-2xl overflow-hidden border border-[#E5E5EA]">
            <SafeImage
              src={IMG_MICROSCOPE}
              alt="Microscope logic board inspection at Refix Pro Gurugram"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
          <h2 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">
            {aboutCopy.approachHeading}
          </h2>
          <p className="text-base text-[#424245] leading-relaxed">
            {aboutCopy.approachDescription}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {[
              {
                title: 'Schematic-Driven Inspection',
                desc: 'We verify voltage rails, current draw, and short circuits systematically before quoting repairs.',
              },
              {
                title: 'Data-First Mindset',
                desc: 'Where storage is onboard, restoring logic board power rails helps preserve your existing files whenever feasible.',
              },
              {
                title: 'Customer-First Transparency',
                desc: 'You receive clear inspection feedback, honest parts confirmation, and upfront estimates before work begins.',
              },
              {
                title: 'Independent Specialist Care',
                desc: 'Refix Pro operates independently in Gurugram and makes no claims of Apple Authorized Service Provider affiliation.',
              },
            ].map((item) => (
              <div key={item.title} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0066CC] shrink-0" />
                  <h3 className="text-sm font-bold text-[#1D1D1F]">{item.title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-[#424245] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Repair Workstation Gallery */}
      <section className="py-16 lg:py-24 bg-[#F5F5F7] border-y border-[#E5E5EA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold text-[#0066CC] mb-2">Inside Our Studio</p>
            <h2 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">
              {aboutCopy.galleryHeading}
            </h2>
            <p className="text-sm sm:text-base text-[#424245] mt-2">
              {aboutCopy.gallerySubheading}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((img) => (
              <figure
                key={img.id}
                className="rounded-2xl overflow-hidden bg-white border border-[#E5E5EA] flex flex-col"
              >
                <div className="aspect-[4/3] bg-[#E5E5EA] overflow-hidden">
                  <SafeImage
                    src={img.imageUrl}
                    alt={img.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="p-5 space-y-1">
                  <p className="text-xs text-[#6E6E73]">{img.category}</p>
                  <h3 className="text-base font-bold text-[#1D1D1F]">{img.title}</h3>
                  {img.caption && (
                    <p className="text-xs text-[#424245] leading-relaxed">{img.caption}</p>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Direct Contact */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F]">
          Visit Our Sector 14, Gurugram Repair Desk
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[#424245]">
          <span className="inline-flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#0066CC]" />
            {settings.address}
          </span>
          <a href={buildTelHref(settings.phone)} className="inline-flex items-center gap-2 font-mono font-semibold text-[#1D1D1F] hover:text-[#0066CC]">
            <Phone className="w-4 h-4 text-[#0066CC]" />
            {settings.phone}
          </a>
        </div>
        <div className="pt-2">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-sm font-semibold transition-colors"
          >
            View Map & Contact Details
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
