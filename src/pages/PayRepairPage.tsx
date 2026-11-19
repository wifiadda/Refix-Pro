import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  MapPin,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSeoMeta } from '../utils/seo';
import { extractReadableError, normalizeMobileKey } from '../lib/firebase';
import { RepairPaymentPanel } from '../components/RepairPaymentPanel';
import { FadeInSection, HeroReveal } from '../components/MotionPrimitives';
import { StatusBadge } from '../components/ui/DesignSystem';
import type { RepairTrackingRecord } from '../types';

export function PayRepairPage({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const { settings, trackRepairEnquiry, user } = useApp();
  const [searchParams] = useSearchParams();

  const initialCode = searchParams.get('code') || '';
  const initialMobile = searchParams.get('mobile') || '';

  const [lookupCode, setLookupCode] = useState(initialCode);
  const [lookupMobile, setLookupMobile] = useState(initialMobile);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [record, setRecord] = useState<RepairTrackingRecord | null>(null);
  const [manualBillMode, setManualBillMode] = useState(!initialCode);

  useSeoMeta({
    title: 'Pay Repair Bill Online (Razorpay & UPI) | Refix Pro Gurugram',
    description:
      'Pay your confirmed Refix Pro MacBook, iPad, or iPhone repair invoice securely online via Razorpay Checkout or direct UPI / QR / Bank Transfer.',
    canonicalPath: '/pay',
  });

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = lookupCode.trim().toUpperCase();
    const cleanDigits = normalizeMobileKey(lookupMobile);

    if (!/^RP-[A-Z0-9-]+$/.test(cleanCode)) {
      setLookupError('Enter a valid Enquiry ID starting with RP- (for example, RP-4K9M2AB).');
      return;
    }
    if (cleanDigits.length < 7) {
      setLookupError('Enter your registered mobile number (at least 7 digits).');
      return;
    }

    setLookingUp(true);
    setLookupError(null);
    try {
      const found = await trackRepairEnquiry(cleanCode, lookupMobile);
      if (!found) {
        setRecord(null);
        setLookupError('No matching repair job found for that Enquiry ID and mobile number.');
      } else {
        setRecord(found);
        setManualBillMode(false);
      }
    } catch (err) {
      console.error('Pay lookup error:', err);
      setLookupError(extractReadableError(err, 'Unable to fetch repair details right now.'));
    } finally {
      setLookingUp(false);
    }
  };

  return (
    <div className="bg-[#F5F5F7] min-h-screen py-12 lg:py-16">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-8">
        <HeroReveal className="space-y-3">
          <nav aria-label="Breadcrumb" className="text-xs text-[#6E6E73] flex items-center gap-2">
            <Link to="/" className="hover:text-[#1D1D1F]">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#1D1D1F] font-medium">Pay Online</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
            Pay Your Repair Bill Online
          </h1>
          <p className="text-sm sm:text-base text-[#424245] max-w-2xl">
            Once your device repair is completed or ready for delivery at {settings.address}, pay
            securely via Razorpay or direct UPI / QR / Bank Transfer and submit your reference ID.
          </p>
        </HeroReveal>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left: Enquiry Lookup or Switch to Direct Manual Payment */}
          <FadeInSection className="xl:col-span-5 space-y-5">
            <div className="p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#0066CC]">Step 1 · Optional Lookup</p>
                  <h2 className="text-lg font-bold text-[#1D1D1F] mt-0.5">
                    Fetch Repair Invoice by Enquiry ID
                  </h2>
                </div>
                <CreditCard className="w-5 h-5 text-[#0066CC] shrink-0" />
              </div>

              <form onSubmit={handleLookup} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Enquiry ID
                  </label>
                  <input
                    type="text"
                    value={lookupCode}
                    onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
                    placeholder="e.g. RP-4K9M2AB"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] bg-[#F5F5F7]/40 text-sm font-mono uppercase focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0066CC]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Registered Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={lookupMobile}
                    onChange={(e) => setLookupMobile(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] bg-[#F5F5F7]/40 text-sm font-mono focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0066CC]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={lookingUp}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D1D1F] hover:bg-black disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  <Search className="w-4 h-4" />
                  {lookingUp ? 'Fetching Invoice...' : 'Load My Repair Bill'}
                </button>
              </form>

              {lookupError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-900">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p>{lookupError}</p>
                </div>
              )}

              {record && (
                <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[#0066CC]">{record.enquiryCode}</span>
                    <StatusBadge label={record.status} />
                  </div>
                  <p className="font-semibold text-[#1D1D1F]">{record.macbookModel}</p>
                  <p className="text-[#424245]">{record.serviceName}</p>
                  <p className="text-[#424245]">
                    Confirmed Payable:{' '}
                    <span className="font-mono font-bold text-[#1D1D1F]">
                      {record.payableAmount && record.payableAmount > 0
                        ? `₹${record.payableAmount.toLocaleString('en-IN')}`
                        : record.repairEstimate || 'Enter invoice amount'}
                    </span>
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-[#E5E5EA] flex flex-wrap items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setRecord(null);
                    setManualBillMode(true);
                  }}
                  className="font-semibold text-[#0066CC] hover:underline"
                >
                  Pay a Custom Invoice / Walk-In Bill Instead
                </button>
                <Link to="/dashboard" className="text-[#424245] hover:text-[#1D1D1F] underline">
                  Go to Dashboard
                </Link>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E5E5EA] space-y-2.5 text-xs text-[#424245]">
              <p className="font-bold text-[#1D1D1F] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0066CC]" />
                Safe Payment Policy
              </p>
              <p className="leading-relaxed">
                Pay only after your repair status is Ready for Delivery / Completed or after
                receiving a confirmed final quote from our desk.
              </p>
              <p className="flex items-start gap-1.5 text-[#6E6E73]">
                <MapPin className="w-3.5 h-3.5 text-[#0066CC] shrink-0 mt-0.5" />
                <span>{settings.address}</span>
              </p>
            </div>
          </FadeInSection>

          {/* Right: Active Payment Panel */}
          <FadeInSection delay={0.06} className="xl:col-span-7">
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E5E5EA] space-y-5">
              <div className="flex items-center justify-between gap-3 border-b border-[#E5E5EA] pb-4">
                <div>
                  <p className="text-xs font-semibold text-[#0066CC]">
                    Step 2 · Choose Payment Method
                  </p>
                  <h2 className="text-xl font-bold text-[#1D1D1F] mt-0.5">
                    {record
                      ? `Settlement for ${record.enquiryCode} (${record.macbookModel})`
                      : manualBillMode
                        ? 'Direct Repair Payment (Razorpay or UPI / QR / Bank)'
                        : 'Select Payment Mode'}
                  </h2>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>

              <RepairPaymentPanel
                key={record ? record.id : 'manual-bill'}
                enquiryCode={record?.enquiryCode || lookupCode}
                customerName={user?.displayName || ''}
                mobile={lookupMobile}
                email={user?.email || ''}
                defaultAmount={record?.payableAmount || 0}
                allowCustomAmount={!record?.payableAmount || record.payableAmount <= 0}
                paymentStatus={record?.paymentStatus || 'Unpaid'}
                existingReference={record?.paymentReference || ''}
                deviceLabel={record?.macbookModel || 'MacBook Repair Service'}
                onSuccess={(msg) => onNotify('success', msg)}
                onError={(msg) => onNotify('error', msg)}
              />
            </div>
          </FadeInSection>
        </div>
      </div>
    </div>
  );
}
