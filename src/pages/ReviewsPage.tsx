import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Mail, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSeoMeta } from '../utils/seo';
import { WriteReviewForm } from '../components/WriteReviewForm';
import {
  FadeInSection,
  HeroReveal,
  StaggerCard,
  StaggerContainer,
} from '../components/MotionPrimitives';

type ReviewFilter = 'All' | '5 Stars' | 'Website Customers' | 'Google Profile';

export function ReviewsPage({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const { reviews, settings, googleLiveProfile } = useApp();
  const [filter, setFilter] = useState<ReviewFilter>('All');

  useSeoMeta({
    title: 'Customer Reviews & Testimonials | Refix Pro Gurugram',
    description:
      'Read live verified Google Business Profile and real customer reviews for Refix Pro Apple MacBook, iPad & iPhone Repair at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007, or share your own feedback.',
    keywords: settings.seoKeywords,
    canonicalPath: '/reviews',
  });

  const liveGoogleRating = googleLiveProfile.rating ?? settings.googleRating;
  const liveGoogleCount = googleLiveProfile.userRatingCount ?? settings.googleReviewCount;
  const googleProfileEmail = settings.email || 'refixpro.in@gmail.com';
  const googleProfileUrl =
    googleLiveProfile.googleMapsUri ||
    settings.googleReviewsUrl ||
    'https://www.google.com/maps/search/?api=1&query=SCF-92%2CSECTOR-14+MAIN+MARKET%2C+Gurugram%2C+Haryana+122007';

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg =
      total > 0
        ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / total).toFixed(1)
        : String(liveGoogleRating);
    const counts = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => Math.round(r.rating) === star).length,
    }));
    return { total, avg, counts };
  }, [reviews, liveGoogleRating]);

  const filteredReviews = useMemo(() => {
    if (filter === '5 Stars') return reviews.filter((r) => r.rating >= 5);
    if (filter === 'Website Customers') {
      return reviews.filter((r) => r.source.toLowerCase().includes('website'));
    }
    if (filter === 'Google Profile') {
      return reviews.filter((r) => r.source.toLowerCase().includes('google'));
    }
    return reviews;
  }, [reviews, filter]);

  return (
    <div className="bg-white min-h-screen">
      {/* Page Hero */}
      <section className="bg-gradient-to-b from-[#F5F5F7] to-white border-b border-[#E5E5EA] py-12 lg:py-16">
        <HeroReveal className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-5">
          <nav aria-label="Breadcrumb" className="text-xs text-[#6E6E73] flex items-center gap-2">
            <Link to="/" className="hover:text-[#1D1D1F]">Home</Link>
            <span>/</span>
            <span className="text-[#1D1D1F] font-medium">Customer Reviews</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs font-semibold text-[#0066CC]">Verified & Live Feedback</p>
              <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1D1D1F]">
                Customer Reviews in Gurugram
              </h1>
              <p className="text-base text-[#424245] leading-relaxed">
                Read genuine feedback synced from Refix Pro&apos;s Google Business Profile alongside public reviews from MacBook, iPad, and iPhone owners serviced at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <a
                href={googleProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-sm font-semibold text-[#1D1D1F] transition-colors whitespace-nowrap"
              >
                Google Business Profile
                <ExternalLink className="w-4 h-4 text-[#0066CC]" />
              </a>
              <Link
                to="/book"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Book a Repair
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </HeroReveal>
      </section>

      {/* Summary + Write Review Composer */}
      <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Rating Breakdown Card */}
        <FadeInSection className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#0A0A0C] text-white space-y-6">
            <div className="flex items-end justify-between gap-4 border-b border-[#2C2C2E] pb-6">
              <div>
                <p className="text-xs text-[#A1A1A6]">
                  {googleLiveProfile.rating ? 'Live Google Business Rating' : 'Google Business Rating'}
                </p>
                <p className="text-4xl sm:text-5xl font-bold tabular-nums mt-1">
                  {liveGoogleRating}
                  <span className="text-xl text-[#A1A1A6] font-normal">/5</span>
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums text-[#60A5FA]">
                  {liveGoogleCount}+
                </p>
                <p className="text-xs text-[#A1A1A6]">Google Reviews</p>
                <p className="text-xs text-[#A1A1A6] mt-1 tabular-nums">
                  {stats.total} Published on Site ({stats.avg}/5)
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {stats.counts.map((row) => {
                const pct = stats.total > 0 ? Math.round((row.count / stats.total) * 100) : 0;
                return (
                  <div key={row.star} className="flex items-center gap-3 text-xs">
                    <span className="w-10 font-mono tabular-nums text-[#D2D2D7]">{row.star} Star</span>
                    <div className="flex-1 h-2 rounded-full bg-[#1D1D1F] overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-mono tabular-nums text-[#A1A1A6]">
                      {row.count}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-[#2C2C2E] text-xs text-[#A1A1A6] flex items-start gap-2">
              <Mail className="w-4 h-4 text-[#60A5FA] shrink-0 mt-0.5" />
              <span>
                Connected to Google Business Profile ({googleProfileEmail}) · SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.
              </span>
            </div>
          </div>
        </FadeInSection>

        {/* Right: Write a Review Form */}
        <FadeInSection delay={0.08} className="lg:col-span-7">
          <WriteReviewForm onNotify={onNotify} />
        </FadeInSection>
      </section>

      {/* Live Original Google Business Profile Reviews */}
      {googleLiveProfile.reviews.length > 0 && (
        <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 pb-14 space-y-6">
          <FadeInSection className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#E5E5EA] pt-10">
            <div>
              <p className="text-xs font-semibold text-[#0066CC]">
                Direct Google Places API Feed
              </p>
              <h2 className="text-2xl font-bold text-[#1D1D1F] mt-1">
                Original Google Business Profile Reviews ({googleLiveProfile.reviews.length})
              </h2>
            </div>
            <a
              href={googleProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066CC] hover:underline"
            >
              View Listing on Google Maps
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </FadeInSection>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {googleLiveProfile.reviews.map((gRev) => (
              <StaggerCard key={gRev.id}>
                <blockquote className="h-full p-6 rounded-2xl bg-[#F5F5F7]/70 border border-[#E5E5EA] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({
                          length: Math.max(1, Math.min(5, Math.round(gRev.rating))),
                        }).map((_, idx) => (
                          <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs text-[#6E6E73] tabular-nums">{gRev.relativeTime}</span>
                    </div>
                    <p className="text-sm sm:text-base text-[#1D1D1F] leading-relaxed font-medium">
                      “{gRev.text}”
                    </p>
                  </div>
                  <footer className="mt-6 pt-4 border-t border-[#E5E5EA] flex items-center justify-between gap-2 text-xs text-[#6E6E73]">
                    <div className="flex items-center gap-2 min-w-0">
                      {gRev.authorPhotoUri && (
                        <img
                          src={gRev.authorPhotoUri}
                          alt={gRev.authorName}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover shrink-0 border border-[#E5E5EA]"
                        />
                      )}
                      {gRev.authorUri ? (
                        <a
                          href={gRev.authorUri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[#1D1D1F] hover:text-[#0066CC] truncate"
                        >
                          {gRev.authorName}
                        </a>
                      ) : (
                        <span className="font-semibold text-[#1D1D1F] truncate">{gRev.authorName}</span>
                      )}
                    </div>
                    {gRev.googleMapsUri ? (
                      <a
                        href={gRev.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-[#0066CC] hover:underline font-medium"
                      >
                        Google Review
                      </a>
                    ) : (
                      <span className="shrink-0">Google Review</span>
                    )}
                  </footer>
                </blockquote>
              </StaggerCard>
            ))}
          </StaggerContainer>
        </section>
      )}

      {/* Filter & All Reviews List */}
      <section className="bg-[#F5F5F7] border-t border-[#E5E5EA] py-14">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-8">
          <FadeInSection className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#1D1D1F]">
              Customer Reviews ({filteredReviews.length})
            </h2>

            <div className="flex flex-wrap gap-1.5">
              {(['All', '5 Stars', 'Website Customers', 'Google Profile'] as ReviewFilter[]).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilter(tab)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      filter === tab
                        ? 'bg-[#1D1D1F] text-white'
                        : 'bg-white border border-[#E5E5EA] text-[#424245] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {tab}
                  </button>
                )
              )}
            </div>
          </FadeInSection>

          {filteredReviews.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white border border-[#E5E5EA] text-center space-y-2">
              <p className="text-base font-bold text-[#1D1D1F]">No reviews match this filter yet.</p>
              <button
                type="button"
                onClick={() => setFilter('All')}
                className="text-xs font-semibold text-[#0066CC] hover:underline"
              >
                Show All Reviews
              </button>
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReviews.map((rev) => (
                <StaggerCard key={rev.id}>
                  <blockquote className="h-full p-6 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col justify-between shadow-[0_8px_24px_-18px_rgba(0,0,0,0.08)]">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, idx) => (
                            <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-xs text-[#6E6E73] tabular-nums">
                          {rev.dateLabel || 'Verified'}
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-[#1D1D1F] leading-relaxed font-medium">
                        “{rev.quote}”
                      </p>
                    </div>
                    <footer className="mt-6 pt-4 border-t border-[#F5F5F7] flex items-center justify-between gap-2 text-xs text-[#6E6E73]">
                      <span className="font-semibold text-[#1D1D1F] truncate">{rev.authorLabel}</span>
                      <span className="shrink-0">{rev.source}</span>
                    </footer>
                  </blockquote>
                </StaggerCard>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>
    </div>
  );
}
