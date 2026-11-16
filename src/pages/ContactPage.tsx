import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Globe, MapPin, MessageCircle, Navigation, Phone, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSeoMeta } from '../utils/seo';
import { buildTelHref, buildWhatsAppUrl } from '../utils/whatsapp';
import { GoogleMapLocation } from '../components/GoogleMapLocation';
import { SafeImage } from '../components/SafeImage';
import {
  FadeInSection,
  HeroReveal,
  StaggerCard,
  StaggerContainer,
} from '../components/MotionPrimitives';

export function ContactPage({
  onNotify,
  quotaExceeded = false,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
  quotaExceeded?: boolean;
}) {
  const { settings, galleryImages, submitContactMessage, user, customerLogin } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const contactCopy = settings.pageContent.contact;

  useSeoMeta({
    title: 'Contact Refix Pro | SCF-92,SECTOR-14 MAIN MARKET, Gurugram',
    description:
      'Visit Refix Pro at SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007. Call or WhatsApp +91 96139 32932 for MacBook, iPad, and iPhone repair guidance.',
    keywords: settings.seoKeywords,
    canonicalPath: '/contact',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot.trim()) return;

    if (name.trim().length < 2 || phone.replace(/[^0-9]/g, '').length < 7 || message.trim().length < 5) {
      onNotify('error', 'Please complete your name, phone number, and message.');
      return;
    }

    setSubmitting(true);
    try {
      await submitContactMessage({ name, phone, email, subject: subject || 'MacBook Enquiry', message });
      setSent(true);
      setName('');
      setPhone('');
      setEmail('');
      setSubject('');
      setMessage('');
      onNotify('success', 'Your message has been received by Refix Pro.');
    } catch (err) {
      console.error(err);
      onNotify('error', 'Unable to send message right now. Please WhatsApp or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-[#F5F5F7] to-white border-b border-[#E5E5EA] py-12 lg:py-16">
        <HeroReveal className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-4">
          <nav aria-label="Breadcrumb" className="text-xs text-[#6E6E73] flex items-center gap-2">
            <Link to="/" className="hover:text-[#1D1D1F]">Home</Link>
            <span>/</span>
            <span className="text-[#1D1D1F] font-medium">Contact Us</span>
          </nav>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1D1D1F]">
            {contactCopy.headline}
          </h1>
          <p className="text-base text-[#424245] max-w-2xl">
            {contactCopy.subheadline}
          </p>
        </HeroReveal>
      </section>

      {/* Main Grid: Details + Form */}
      <section className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <FadeInSection className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl border border-[#E5E5EA] bg-[#F5F5F7] space-y-5">
            <h2 className="text-xl font-bold text-[#1D1D1F]">{settings.businessName}</h2>
            <div className="space-y-4 text-sm text-[#424245]">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#0066CC] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1D1D1F]">Exact Studio Address</p>
                  <p>SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#0066CC] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1D1D1F]">Phone</p>
                  <a href={buildTelHref(settings.phone)} className="font-mono hover:text-[#0066CC]">
                    {settings.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1D1D1F]">WhatsApp</p>
                  <a
                    href={buildWhatsAppUrl(settings.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono hover:text-[#16A34A]"
                  >
                    {settings.whatsapp}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-[#0066CC] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1D1D1F]">Website</p>
                  <a href={settings.websiteUrl} className="hover:text-[#0066CC]">
                    {settings.websiteUrl}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#0066CC] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1D1D1F]">Business Hours</p>
                  <p>{settings.businessHours}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-2">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=SCF-92,+SECTOR-14+MAIN+MARKET,+Gurugram,+Haryana+122007"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                Get Directions
              </a>
              <a
                href={buildTelHref(settings.phone)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                Call Now
              </a>
              <a
                href={buildWhatsAppUrl(settings.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp Chat
              </a>
            </div>
          </div>
        </FadeInSection>

        <FadeInSection delay={0.08} className="lg:col-span-7">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl border border-[#E5E5EA] bg-white space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-2xl font-bold text-[#1D1D1F]">{contactCopy.formHeading}</h2>
              {user ? (
                <Link to="/dashboard" className="text-xs font-semibold text-[#0066CC] hover:underline">
                  View Admin Replies in Dashboard →
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => customerLogin().catch(() => {})}
                  className="text-xs font-semibold text-[#0066CC] hover:underline"
                >
                  Customer Login to Track Replies →
                </button>
              )}
            </div>

            {sent && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900">
                Thank you! Your message is saved and any reply from our Admin team will appear in your{' '}
                <Link to="/dashboard" className="font-semibold underline">
                  Customer Dashboard
                </Link>.
              </div>
            )}

            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                tabIndex={-1}
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Name *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Phone *
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-email" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Email (Optional)
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                />
              </div>
              <div>
                <label htmlFor="contact-subject" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                  Subject *
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. MacBook Air M2 Screen Availability"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                Message *
              </label>
              <textarea
                id="contact-message"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your MacBook model and question..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </FadeInSection>
      </section>

      {/* Google Map */}
      <FadeInSection className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 pb-16">
        <h2 className="text-2xl font-bold text-[#1D1D1F] mb-5">{contactCopy.mapHeading}</h2>
        <GoogleMapLocation heightClass="h-[420px]" quotaExceeded={quotaExceeded} />
      </FadeInSection>

      {/* Repair Shop Gallery */}
      <section className="bg-[#F5F5F7] border-t border-[#E5E5EA] py-14">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
          <h2 className="text-2xl font-bold text-[#1D1D1F] mb-6">Repair Studio & Bench Gallery</h2>
          <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.slice(0, 3).map((g) => (
              <StaggerCard
                key={g.id}
                className="rounded-2xl overflow-hidden bg-white border border-[#E5E5EA]"
              >
                <div className="aspect-[4/3] bg-[#E5E5EA]">
                  <SafeImage src={g.imageUrl} alt={g.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-[#1D1D1F]">{g.title}</h3>
                  {g.caption && <p className="text-xs text-[#6E6E73] mt-1">{g.caption}</p>}
                </div>
              </StaggerCard>
            ))}
          </StaggerContainer>
        </div>
      </section>
    </div>
  );
}
