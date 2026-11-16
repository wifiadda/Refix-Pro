import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Check, Info, MessageCircle, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SERVICE_CATEGORIES } from '../types';
import { useSeoMeta } from '../utils/seo';
import { buildServiceWhatsAppMessage, buildWhatsAppUrl } from '../utils/whatsapp';
import { SafeImage } from '../components/SafeImage';
import { PriceEstimatorTool } from '../components/PriceEstimatorTool';

export function ServicesPage() {
  const { services, settings } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get('category') || 'All';
  const [activeCategory, setActiveCategory] = useState<string>(initialCat);
  const [searchQuery, setSearchQuery] = useState('');

  const srvCopy = settings.pageContent.services;

  useSeoMeta({
    title: 'MacBook Repair Services in Gurugram | Refix Pro Sector 14',
    description:
      'Complete Apple MacBook repair services in Gurugram: motherboard & logic board chip-level repair, Retina screen replacement, battery service, liquid damage recovery, and macOS diagnostics.',
    keywords: settings.seoKeywords,
    canonicalPath: '/services',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Apple MacBook Repair Service',
      provider: {
        '@type': 'LocalBusiness',
        name: settings.businessName,
        address: settings.address,
        telephone: settings.phone,
      },
      areaServed: [
        'Sector 14, Gurugram',
        'DLF Cyber City, Gurugram',
        'MG Road, Gurugram',
        'Golf Course Road, Gurugram',
        'Sohna Road, Gurugram',
      ],
    },
  });

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return services.filter((srv) => {
      const catMatch = activeCategory === 'All' || srv.category === activeCategory;
      const textMatch =
        !q ||
        srv.title.toLowerCase().includes(q) ||
        srv.shortDescription.toLowerCase().includes(q) ||
        srv.symptoms.some((s) => s.toLowerCase().includes(q));
      return catMatch && textMatch;
    });
  }, [services, activeCategory, searchQuery]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    if (cat === 'All') {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Page Header */}
      <section className="bg-[#F5F5F7] border-b border-[#E5E5EA] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <nav aria-label="Breadcrumb" className="text-xs text-[#6E6E73] flex items-center gap-2">
            <Link to="/" className="hover:text-[#1D1D1F]">Home</Link>
            <span>/</span>
            <span className="text-[#1D1D1F] font-medium">MacBook Services</span>
          </nav>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1D1D1F]">
            {srvCopy.headline}
          </h1>
          <p className="text-base text-[#424245] max-w-3xl leading-relaxed">
            {srvCopy.subheadline}
          </p>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="border-b border-[#E5E5EA] bg-white sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', ...SERVICE_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  activeCategory === cat
                    ? 'bg-[#1D1D1F] text-white'
                    : 'bg-[#F5F5F7] text-[#424245] hover:text-[#1D1D1F]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symptoms or repairs..."
              aria-label="Search MacBook repair services"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#D2D2D7] bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            />
          </div>
        </div>
      </section>

      {/* Availability Notice & Interactive Estimator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-start gap-3 text-xs sm:text-sm text-[#424245]">
          <Info className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
          <p>
            {srvCopy.noticeText}
          </p>
        </div>
        <PriceEstimatorTool />
      </div>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {filteredServices.length === 0 ? (
          <div className="py-16 text-center border border-[#E5E5EA] rounded-2xl bg-[#F5F5F7]">
            <p className="text-base font-semibold text-[#1D1D1F]">No matching MacBook services found.</p>
            <p className="text-sm text-[#6E6E73] mt-1">Try clearing your search or select another repair category.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                handleCategoryChange('All');
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-semibold"
            >
              Show All Services
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredServices.map((srv) => {
              const waUrl = buildWhatsAppUrl(
                settings.whatsapp,
                buildServiceWhatsAppMessage(srv.title)
              );
              return (
                <article
                  key={srv.id}
                  className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] bg-[#F5F5F7] overflow-hidden">
                      <SafeImage
                        src={srv.imageUrl}
                        alt={srv.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <p className="text-xs text-[#6E6E73]">
                          {srv.category}
                          {srv.showPrice && srv.priceDisplay ? ` · ${srv.priceDisplay}` : ''}
                        </p>
                        <h2 className="text-xl font-bold text-[#1D1D1F] mt-1.5">
                          {srv.title}
                        </h2>
                        <p className="text-sm text-[#424245] mt-2 leading-relaxed">
                          {srv.shortDescription}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-xs font-semibold text-[#1D1D1F] mb-2">
                          Common Symptoms
                        </h3>
                        <ul className="space-y-1.5">
                          {srv.symptoms.map((sym) => (
                            <li key={sym} className="flex items-start gap-2 text-xs text-[#424245]">
                              <Check className="w-3.5 h-3.5 text-[#0066CC] shrink-0 mt-0.5" />
                              <span>{sym}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-3 border-t border-[#F5F5F7]">
                        <h3 className="text-xs font-semibold text-[#1D1D1F] mb-1">
                          Repair Information
                        </h3>
                        <p className="text-xs text-[#6E6E73] leading-relaxed">
                          {srv.repairInfo}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2 flex flex-wrap gap-2.5">
                    <Link
                      to={`/book?service=${encodeURIComponent(srv.title)}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      Book This Service
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
