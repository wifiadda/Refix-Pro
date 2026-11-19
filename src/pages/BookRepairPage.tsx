import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  LogIn,
  MessageCircle,
  Phone,
  Search,
  ShieldAlert,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { extractReadableError } from '../lib/firebase';
import { useSeoMeta } from '../utils/seo';
import {
  buildTelHref,
  buildWhatsAppUrl,
  compressImageToDataUrl,
} from '../utils/whatsapp';
import { HeroReveal } from '../components/MotionPrimitives';

export function BookRepairPage({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const { models, settings, submitRepairEnquiry, user, customerLogin } = useApp();
  const [searchParams] = useSearchParams();

  const initialService =
    searchParams.get('service') || 'General MacBook Diagnostic Inspection';
  const initialModel = searchParams.get('model') || '';
  const initialProblem = searchParams.get('problem') || '';
  const hasPrefilledService = Boolean(searchParams.get('service'));

  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [macbookModel, setMacbookModel] = useState(initialModel);
  const [problemDescription, setProblemDescription] = useState(initialProblem);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [honeypot, setHoneypot] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [confirmedEnquiry, setConfirmedEnquiry] = useState<{
    enquiryCode: string;
    customerName: string;
    mobile: string;
    macbookModel: string;
    serviceName: string;
  } | null>(null);

  const pageCopy = settings.pageContent.book;

  useSeoMeta({
    title: 'Book Your MacBook Repair in Gurugram | Refix Pro',
    description:
      'Quick 30-second repair booking at Refix Pro, SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007. Share your name, mobile, and MacBook, iPad, or iPhone model.',
    keywords: settings.seoKeywords,
    canonicalPath: '/book',
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (imageUrls.length + files.length > 3) {
      onNotify('error', 'You can attach up to 3 problem images.');
      return;
    }

    try {
      const compressed = await Promise.all(files.map((f) => compressImageToDataUrl(f)));
      setImageUrls((prev) => [...prev, ...compressed].slice(0, 3));
    } catch {
      onNotify('error', 'Could not process one of the selected images. Please use JPG or PNG.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot.trim()) {
      return;
    }

    if (customerName.trim().length < 2) {
      onNotify('error', 'Please enter your name.');
      return;
    }
    if (mobile.replace(/[^0-9]/g, '').length < 7) {
      onNotify('error', 'Please enter a valid mobile number.');
      return;
    }
    if (macbookModel.trim().length < 2) {
      onNotify('error', 'Please enter your MacBook model.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitRepairEnquiry({
        customerName,
        mobile,
        whatsapp: mobile,
        macbookModel,
        serviceName: initialService,
        problemDescription,
        imageUrls,
      });

      setConfirmedEnquiry({
        enquiryCode: result.enquiryCode,
        customerName: customerName.trim(),
        mobile: mobile.trim(),
        macbookModel: macbookModel.trim(),
        serviceName: initialService,
      });
      onNotify('success', `Repair request ${result.enquiryCode} submitted successfully.`);
    } catch (error) {
      console.error(error);
      onNotify(
        'error',
        extractReadableError(error, 'Unable to submit booking right now. Please try WhatsApp or Call.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedEnquiry) {
    const waFollowUp = buildWhatsAppUrl(
      settings.whatsapp,
      `Hello Refix Pro, I just booked a repair.\nEnquiry ID: ${confirmedEnquiry.enquiryCode}\nName: ${confirmedEnquiry.customerName}\nModel: ${confirmedEnquiry.macbookModel}\nService: ${confirmedEnquiry.serviceName}\nPlease confirm inspection availability.`
    );
    const trackHref = `/track?code=${encodeURIComponent(
      confirmedEnquiry.enquiryCode
    )}&mobile=${encodeURIComponent(confirmedEnquiry.mobile)}`;

    return (
      <div className="bg-[#F5F5F7] min-h-screen py-14 w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <HeroReveal className="max-w-3xl mx-auto bg-white rounded-2xl border border-[#E5E5EA] p-8 sm:p-10 text-center space-y-6 shadow-[0_14px_40px_-20px_rgba(0,0,0,0.1)]">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-emerald-700">Saved in Refix Pro Repair Queue</p>
            <h1 className="text-3xl font-bold text-[#1D1D1F]">Repair Request Confirmed</h1>
            <p className="text-sm text-[#424245]">
              Save your Enquiry ID below to track live repair progress anytime on our website. Our SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 desk will contact you shortly.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] text-left space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-[#6E6E73]">Enquiry ID</span>
              <span className="font-mono font-bold text-[#0066CC] tabular-nums">
                {confirmedEnquiry.enquiryCode}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#6E6E73]">Customer Name</span>
              <span className="font-semibold text-[#1D1D1F]">{confirmedEnquiry.customerName}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#6E6E73]">Device Model</span>
              <span className="font-semibold text-[#1D1D1F]">{confirmedEnquiry.macbookModel}</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <UserCheck className="w-4 h-4 text-[#60A5FA]" />
              Open My Dashboard
            </Link>
            <Link
              to={trackHref}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              Track My Repair
            </Link>
            <a
              href={waFollowUp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Desk
            </a>
            <a
              href={buildTelHref(settings.phone)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#D2D2D7] hover:bg-[#F5F5F7] text-[#1D1D1F] text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <Phone className="w-4 h-4 text-[#0066CC]" />
              Call Desk
            </a>
          </div>

          <div className="pt-4 border-t border-[#E5E5EA]">
            <button
              type="button"
              onClick={() => {
                setConfirmedEnquiry(null);
                setProblemDescription('');
                setImageUrls([]);
              }}
              className="text-xs font-semibold text-[#0066CC] hover:underline"
            >
              Submit Another Repair Request
            </button>
          </div>
        </HeroReveal>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F5F7] min-h-screen py-12 lg:py-16">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-8">
        <HeroReveal className="space-y-3">
          <nav aria-label="Breadcrumb" className="text-xs text-[#6E6E73] flex items-center gap-2">
            <Link to="/" className="hover:text-[#1D1D1F]">Home</Link>
            <span>/</span>
            <span className="text-[#1D1D1F] font-medium">Book a Repair</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
            {pageCopy.headline}
          </h1>
          <p className="text-sm sm:text-base text-[#424245] max-w-3xl">
            {pageCopy.subheadline}
          </p>
        </HeroReveal>

        {/* Optional Customer Account Sync Bar */}
        <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {user ? (
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#1D1D1F]">
              <UserCheck className="w-4 h-4 text-[#0066CC] shrink-0" />
              <span>
                Signed in as <strong className="font-mono">{user.email}</strong> — this repair booking & all live admin updates will appear inside your{' '}
                <Link to="/dashboard" className="font-semibold text-[#0066CC] hover:underline">
                  Customer Dashboard
                </Link>.
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-[#424245]">
                <LogIn className="w-4 h-4 text-[#0066CC] shrink-0" />
                <span>
                  Optional: Sign in with Google before submitting to view technician estimates & live updates in your personal Customer Dashboard.
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await customerLogin();
                    onNotify('success', 'Signed in! Your booking will automatically link to your dashboard.');
                  } catch {
                    onNotify('error', 'Sign-in cancelled.');
                  }
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[#D2D2D7] bg-[#F5F5F7] hover:bg-[#E5E5EA]/70 text-xs font-semibold text-[#1D1D1F] whitespace-nowrap shrink-0"
              >
                Sign In with Google
              </button>
            </>
          )}
        </div>

        <HeroReveal delay={0.06}>
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_12px_36px_-18px_rgba(0,0,0,0.08)] p-6 sm:p-8 space-y-6"
          >
          {/* Spam honeypot */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="companyWebsite">Leave empty</label>
            <input
              id="companyWebsite"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {hasPrefilledService && (
            <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] text-xs text-[#424245]">
              Selected Service Focus: <span className="font-semibold text-[#1D1D1F]">{initialService}</span>
            </div>
          )}

          {/* Strictly 3 Compulsory Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="customerName" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                Customer Name *
              </label>
              <input
                id="customerName"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your full name"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>

            <div>
              <label htmlFor="mobile" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                Mobile Number *
              </label>
              <input
                id="mobile"
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98XXXXXXXX"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="macbookModel" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                MacBook Model *
              </label>
              <input
                id="macbookModel"
                type="text"
                required
                list="macbook-model-suggestions"
                value={macbookModel}
                onChange={(e) => setMacbookModel(e.target.value)}
                placeholder="e.g. MacBook Air M1 (A2337), MacBook Pro 14 M3, iPad Pro M2, iPhone 15 Pro..."
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
              <datalist id="macbook-model-suggestions">
                {models.map((m) => (
                  <option key={m.id} value={`${m.name}${m.modelIdentifiers ? ` (${m.modelIdentifiers})` : ''}`} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Core Optional Repair Description & Image Upload */}
          <div className="pt-5 border-t border-[#E5E5EA] space-y-5">
            <div>
              <label htmlFor="problemDescription" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                Describe Problem <span className="font-normal text-[#6E6E73]">(Optional)</span>
              </label>
              <textarea
                id="problemDescription"
                rows={3}
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Briefly describe the issue (e.g. not turning on, cracked display, water spill, battery drain)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                Upload Problem Image <span className="font-normal text-[#6E6E73]">(Optional · Max 3 Photos)</span>
              </label>
              <label className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl border border-dashed border-[#D2D2D7] hover:border-[#0066CC] cursor-pointer bg-[#F5F5F7]/60 text-xs sm:text-sm text-[#424245] transition-colors">
                <Upload className="w-4 h-4 text-[#0066CC]" />
                <span>Upload photo of screen, port, keyboard, or spill area</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {imageUrls.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {imageUrls.map((url, idx) => (
                    <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-[#E5E5EA]">
                      <img src={url} alt={`Problem upload ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        aria-label="Remove image"
                        onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/75 text-white flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-start gap-2.5 text-xs text-[#424245]">
            <ShieldAlert className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
            <p>{pageCopy.securityNote}</p>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] px-7 py-3.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              {submitting ? 'Submitting Repair Request...' : 'Submit Repair Request'}
            </button>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6E6E73]">
              <Link to="/track" className="font-semibold text-[#0066CC] hover:underline whitespace-nowrap">
                Already booked? Track Repair
              </Link>
              <span>·</span>
              <a
                href={buildWhatsAppUrl(settings.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#16A34A] hover:underline whitespace-nowrap"
              >
                WhatsApp {settings.whatsapp}
              </a>
            </div>
          </div>
          </form>
        </HeroReveal>

        <div className="mt-6 p-4 rounded-xl bg-white border border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#6E6E73]">
          <span>By submitting, you confirm diagnostic review terms apply only after your approval.</span>
          <div className="flex flex-wrap items-center gap-3 font-semibold shrink-0">
            <Link to="/warranty-and-refund-policy" className="text-[#0066CC] hover:underline whitespace-nowrap">
              Warranty & Refund
            </Link>
            <span>·</span>
            <Link to="/data-protection-policy" className="text-[#0066CC] hover:underline whitespace-nowrap">
              Data Safety
            </Link>
            <span>·</span>
            <Link to="/privacy-policy" className="text-[#0066CC] hover:underline whitespace-nowrap">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
