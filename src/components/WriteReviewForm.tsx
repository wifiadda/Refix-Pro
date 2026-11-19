import { useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, Send, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { extractReadableError } from '../lib/firebase';
import { buildGoogleWriteReviewUrl } from './LiveGoogleReviewsSync';

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent Experience',
};

export function WriteReviewForm({
  onNotify,
  onSubmitted,
  compact = false,
}: {
  onNotify?: (type: 'success' | 'error', message: string) => void;
  onSubmitted?: () => void;
  compact?: boolean;
}) {
  const { submitPublicReview, googleLiveProfile, settings } = useApp();

  const [name, setName] = useState('');
  const [device, setDevice] = useState('');
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [quote, setQuote] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeStars = hoveredRating ?? rating;
  const googleWriteUrl =
    googleLiveProfile.writeAReviewUri ||
    buildGoogleWriteReviewUrl(
      googleLiveProfile.placeId || settings.googlePlaceId,
      googleLiveProfile.googleMapsUri || settings.googleReviewsUrl
    );

  const handleCopyAndOpenGoogle = async () => {
    if (submittedQuote) {
      try {
        await navigator.clipboard.writeText(submittedQuote);
        setCopied(true);
        onNotify?.('success', 'Review text copied — paste it in the Google Business tab!');
      } catch {
        setCopied(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot.trim()) return;

    const cleanName = name.trim();
    const cleanQuote = quote.trim();

    if (cleanName.length < 2) {
      const msg = 'Please enter your name (at least 2 characters).';
      setErrorMsg(msg);
      onNotify?.('error', msg);
      return;
    }
    if (cleanQuote.length < 5) {
      const msg = 'Please write at least a short sentence about your repair experience.';
      setErrorMsg(msg);
      onNotify?.('error', msg);
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);
    try {
      await submitPublicReview({
        name: cleanName,
        device,
        rating,
        quote: cleanQuote,
      });
      setSubmittedQuote(cleanQuote);
      setCopied(false);
      setName('');
      setDevice('');
      setRating(5);
      setQuote('');
      onNotify?.(
        'success',
        'Review published on Refix Pro! You can also cross-post it to Google Business Profile below.'
      );
      onSubmitted?.();
    } catch (err) {
      console.error('Review submit error:', err);
      const msg = extractReadableError(
        err,
        'Unable to publish your review right now. Please try again shortly.'
      );
      setErrorMsg(msg);
      onNotify?.('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border border-[#E5E5EA] bg-white ${
        compact ? 'p-5 sm:p-6' : 'p-6 sm:p-8'
      } space-y-5 shadow-[0_12px_32px_-20px_rgba(0,0,0,0.08)]`}
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold text-[#0066CC]">
          Connected to Refix Pro Google Business Profile ({settings.email || 'refixpro.in@gmail.com'})
        </p>
        <h3 className="text-lg sm:text-xl font-bold text-[#1D1D1F]">
          Share Your Refix Pro Experience
        </h3>
        <p className="text-xs sm:text-sm text-[#6E6E73]">
          Your review publishes live on Refix Pro right away, with a one-click option to also post on our Google Business listing.
        </p>
      </div>

      {/* Anti-spam honeypot */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="reviewWebsiteUrl">Leave blank</label>
        <input
          id="reviewWebsiteUrl"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {submittedQuote !== null && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 text-xs sm:text-sm text-emerald-950">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                Published live on Refix Pro!
              </p>
              <p className="text-xs text-emerald-900 mt-0.5">
                Google requires reviewers to confirm posts from their Google account. Copy your text and click below to mirror it directly onto Refix Pro&apos;s Google Business Profile:
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-6">
            <button
              type="button"
              onClick={handleCopyAndOpenGoogle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-100 text-xs font-semibold text-emerald-950 whitespace-nowrap"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied Review Text' : 'Copy My Review'}
            </button>
            <a
              href={googleWriteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (submittedQuote) {
                  void navigator.clipboard?.writeText(submittedQuote).catch(() => {});
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold whitespace-nowrap"
            >
              Post Same Review on Google Profile
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-900">
          {errorMsg}
        </div>
      )}

      {/* Star Picker */}
      <div>
        <span className="block text-xs font-semibold text-[#1D1D1F] mb-2">
          Your Rating *
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1" role="radiogroup" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((starVal) => {
              const filled = starVal <= activeStars;
              return (
                <button
                  key={starVal}
                  type="button"
                  role="radio"
                  aria-checked={rating === starVal}
                  aria-label={`${starVal} star${starVal > 1 ? 's' : ''}`}
                  onClick={() => setRating(starVal)}
                  onMouseEnter={() => setHoveredRating(starVal)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className="p-1.5 rounded-lg hover:bg-[#F5F5F7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066CC]"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      filled ? 'fill-amber-400 text-amber-400' : 'text-[#D2D2D7]'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <span className="text-xs font-medium text-[#424245] tabular-nums">
            {activeStars}/5 · {RATING_LABELS[activeStars]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="review-author-name" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
            Your Name *
          </label>
          <input
            id="review-author-name"
            type="text"
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rohan Verma"
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] bg-white text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
          />
        </div>

        <div>
          <label htmlFor="review-device" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
            Device / Service <span className="font-normal text-[#6E6E73]">(Optional)</span>
          </label>
          <input
            id="review-device"
            type="text"
            maxLength={35}
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            placeholder="e.g. MacBook Pro M2 Screen"
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] bg-white text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="review-quote" className="block text-xs font-semibold text-[#1D1D1F]">
            Your Review *
          </label>
          <span className="text-[11px] text-[#6E6E73] tabular-nums">{quote.length}/800</span>
        </div>
        <textarea
          id="review-quote"
          rows={compact ? 3 : 4}
          required
          minLength={5}
          maxLength={800}
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Tell others how your MacBook, iPad, or iPhone repair went at Refix Pro Sector 14..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] bg-white text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Publishing Review...' : 'Publish Review on Website'}
        </button>

        <a
          href={googleWriteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] transition-colors whitespace-nowrap"
        >
          Write Directly on Google Business
          <ExternalLink className="w-3.5 h-3.5 text-[#0066CC]" />
        </a>
      </div>
    </form>
  );
}
