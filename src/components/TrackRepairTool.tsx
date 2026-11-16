import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  MessageCircle,
  Phone,
  Search,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { normalizeMobileKey } from '../lib/firebase';
import type { EnquiryStatus, RepairTrackingRecord } from '../types';
import { buildTelHref, buildWhatsAppUrl } from '../utils/whatsapp';

const REPAIR_PIPELINE: {
  status: EnquiryStatus;
  label: string;
  caption: string;
}[] = [
  { status: 'New', label: 'Request Logged', caption: 'Enquiry received in queue' },
  { status: 'Contacted', label: 'Team Contacted', caption: 'Coordinator reached out' },
  { status: 'Inspection', label: 'Bench Inspection', caption: 'Diagnostics under microscope' },
  { status: 'Estimate Sent', label: 'Estimate Shared', caption: 'Fault & quote confirmed' },
  { status: 'Approved', label: 'Approved', caption: 'Customer confirmed repair' },
  { status: 'In Repair', label: 'In Repair', caption: 'Component work underway' },
  { status: 'Ready for Delivery', label: 'Ready for Pickup', caption: 'QA passed & tested' },
  { status: 'Completed', label: 'Delivered', caption: 'MacBook handed over' },
];

function formatUpdatedAt(val: unknown): string {
  if (!val) return 'Just updated';
  if (
    typeof val === 'object' &&
    val !== null &&
    'toDate' in val &&
    typeof (val as { toDate: () => Date }).toDate === 'function'
  ) {
    return (val as { toDate: () => Date }).toDate().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return 'Recently updated';
}

export function TrackRepairTool({
  initialCode = '',
  initialMobile = '',
  compact = false,
}: {
  initialCode?: string;
  initialMobile?: string;
  compact?: boolean;
}) {
  const { trackRepairEnquiry, settings } = useApp();
  const [enquiryCode, setEnquiryCode] = useState(initialCode);
  const [mobile, setMobile] = useState(initialMobile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [result, setResult] = useState<RepairTrackingRecord | null>(null);

  const runLookup = async (codeVal: string, mobileVal: string) => {
    const cleanCode = codeVal.trim().toUpperCase();
    const cleanDigits = normalizeMobileKey(mobileVal);

    if (!/^RP-[A-Z0-9-]+$/.test(cleanCode)) {
      setError('Please enter a valid Enquiry ID starting with RP- (for example, RP-A1B2C3).');
      setResult(null);
      setNotFound(false);
      return;
    }
    if (cleanDigits.length < 7) {
      setError('Please enter the mobile number used during booking (at least 7 digits).');
      setResult(null);
      setNotFound(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const record = await trackRepairEnquiry(cleanCode, mobileVal);
      if (!record) {
        setResult(null);
        setNotFound(true);
      } else {
        setResult(record);
        setNotFound(false);
      }
    } catch (err) {
      console.error('Track enquiry error:', err);
      setError('Unable to check repair status right now. Please try again or contact us on WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode && initialMobile && normalizeMobileKey(initialMobile).length >= 7) {
      setEnquiryCode(initialCode);
      setMobile(initialMobile);
      void runLookup(initialCode, initialMobile);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode, initialMobile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runLookup(enquiryCode, mobile);
  };

  const currentStageIndex = result
    ? REPAIR_PIPELINE.findIndex((step) => step.status === result.status)
    : -1;

  const isCancelled = result?.status === 'Cancelled';

  const statusWhatsAppUrl = buildWhatsAppUrl(
    settings.whatsapp,
    `Hello Refix Pro, I am checking my MacBook repair status.\nEnquiry ID: ${enquiryCode.trim().toUpperCase() || 'Not listed'}\nMobile: ${mobile.trim() || 'N/A'}`
  );

  return (
    <div
      className={`rounded-2xl border border-[#E5E5EA] bg-white shadow-[0_12px_36px_-18px_rgba(0,0,0,0.08)] overflow-hidden ${
        compact ? 'p-6 sm:p-7' : 'p-6 sm:p-9'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E5EA]">
        <div>
          <p className="text-xs font-semibold text-[#0066CC] tracking-tight">Live Job Card Status</p>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] mt-1">
            Track My MacBook Repair
          </h3>
          <p className="text-xs sm:text-sm text-[#6E6E73] mt-1">
            Enter your Enquiry ID and registered mobile number to view your live bench progress and estimate.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[#424245] shrink-0">
          <Clock className="w-4 h-4 text-[#0066CC]" />
          <span>Real-time desk sync</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
        <div className="sm:col-span-5">
          <label htmlFor="track-enquiry-id" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
            Enquiry ID *
          </label>
          <input
            id="track-enquiry-id"
            type="text"
            required
            value={enquiryCode}
            onChange={(e) => setEnquiryCode(e.target.value.toUpperCase())}
            placeholder="e.g. RP-4K9M2AB"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] bg-[#F5F5F7]/40 text-sm font-mono uppercase tracking-wider text-[#1D1D1F] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0066CC]"
          />
        </div>

        <div className="sm:col-span-4">
          <label htmlFor="track-mobile" className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
            Mobile Number *
          </label>
          <input
            id="track-mobile"
            type="tel"
            required
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="10-digit mobile number"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] bg-[#F5F5F7]/40 text-sm font-mono text-[#1D1D1F] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0066CC]"
          />
        </div>

        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Checking...' : 'Check Status'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-5 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs sm:text-sm text-red-900">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {notFound && (
        <div className="mt-6 p-5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#1D1D1F]">No Matching Repair Found</p>
              <p className="text-xs sm:text-sm text-[#424245]">
                Double-check your <span className="font-mono font-semibold">RP-...</span> Enquiry ID and the exact mobile number submitted at booking.
              </p>
            </div>
          </div>
          <a
            href={statusWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold whitespace-nowrap shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Ask on WhatsApp
          </a>
        </div>
      )}

      {result && (
        <div className="mt-7 pt-7 border-t border-[#E5E5EA] space-y-6">
          {/* Summary Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
            <div>
              <p className="text-xs text-[#6E6E73]">Enquiry ID</p>
              <p className="text-sm font-mono font-bold text-[#1D1D1F] mt-0.5 tabular-nums">
                {result.enquiryCode}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6E6E73]">MacBook & Service</p>
              <p className="text-sm font-bold text-[#1D1D1F] mt-0.5">{result.macbookModel}</p>
              <p className="text-xs text-[#424245]">{result.serviceName}</p>
            </div>
            <div>
              <p className="text-xs text-[#6E6E73]">Current Status</p>
              <p
                className={`text-sm font-bold mt-0.5 ${
                  isCancelled
                    ? 'text-red-600'
                    : result.status === 'Completed' || result.status === 'Ready for Delivery'
                      ? 'text-emerald-700'
                      : 'text-[#0066CC]'
                }`}
              >
                {result.status}
              </p>
              <p className="text-[11px] text-[#6E6E73] mt-0.5">
                Updated: {formatUpdatedAt(result.updatedAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6E6E73]">Technician Estimate</p>
              <p className="text-sm font-mono font-bold text-[#1D1D1F] mt-0.5 tabular-nums">
                {result.repairEstimate || 'Pending Bench Inspection'}
              </p>
              {result.followUpDate && (
                <p className="text-[11px] text-[#424245] mt-0.5 inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#0066CC]" />
                  Follow-up: {result.followUpDate}
                </p>
              )}
            </div>
          </div>

          {/* Cancelled Banner or Step Timeline */}
          {isCancelled ? (
            <div className="p-5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-bold text-red-950">This Repair Request Was Marked Cancelled</p>
                <p className="text-red-900 text-xs sm:text-sm">
                  If you would like to reopen your MacBook inspection or reschedule a visit at Sector 14, message our desk on WhatsApp or call us directly.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-[#6E6E73] mb-3">Repair Progress Pipeline</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                {REPAIR_PIPELINE.map((stage, idx) => {
                  const completed = currentStageIndex >= idx;
                  const active = currentStageIndex === idx;
                  return (
                    <div
                      key={stage.status}
                      className={`p-3 rounded-xl border transition-colors ${
                        active
                          ? 'bg-[#0066CC]/8 border-[#0066CC]'
                          : completed
                            ? 'bg-emerald-50/70 border-emerald-200'
                            : 'bg-[#F5F5F7]/50 border-[#E5E5EA]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono text-[#6E6E73] tabular-nums">
                          0{idx + 1}
                        </span>
                        {completed ? (
                          <CheckCircle2
                            className={`w-4 h-4 ${active ? 'text-[#0066CC]' : 'text-emerald-600'}`}
                          />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-[#D2D2D7]" />
                        )}
                      </div>
                      <p
                        className={`text-xs font-bold leading-snug ${
                          active
                            ? 'text-[#0066CC]'
                            : completed
                              ? 'text-[#1D1D1F]'
                              : 'text-[#6E6E73]'
                        }`}
                      >
                        {stage.label}
                      </p>
                      <p className="text-[11px] text-[#6E6E73] mt-0.5 leading-tight hidden sm:block">
                        {stage.caption}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Technician Public Update Note */}
          {result.publicUpdateNote && (
            <div className="p-4 rounded-xl bg-white border border-[#E5E5EA] flex items-start gap-3">
              <ClipboardCheck className="w-5 h-5 text-[#0066CC] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[#1D1D1F]">Technician Bench Update</p>
                <p className="text-xs sm:text-sm text-[#424245] leading-relaxed">
                  {result.publicUpdateNote}
                </p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-xs text-[#6E6E73] flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#0066CC]" />
              Refix Pro Desk · SCF-92, Sector 14 Main Market, Gurugram
            </p>
            <div className="flex flex-wrap gap-2.5">
              <a
                href={statusWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold whitespace-nowrap"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Chat About This Repair
              </a>
              <a
                href={buildTelHref(settings.phone)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#D2D2D7] hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold whitespace-nowrap"
              >
                <Phone className="w-3.5 h-3.5 text-[#0066CC]" />
                Call Desk
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
