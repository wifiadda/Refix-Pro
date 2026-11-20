import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  FileText,
  MapPin,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useErp } from '../context/ErpContext';
import { useSeoMeta } from '../utils/seo';
import { extractReadableError, normalizeMobileKey } from '../lib/firebase';
import { RepairPaymentPanel } from '../components/RepairPaymentPanel';
import { FadeInSection, HeroReveal } from '../components/MotionPrimitives';
import { StatusBadge } from '../components/ui/DesignSystem';
import type { InvoiceRecord, RepairTrackingRecord } from '../types';

export function PayRepairPage({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const { settings, trackRepairEnquiry, user } = useApp();
  const { customerInvoices } = useErp();
  const [searchParams] = useSearchParams();

  const initialCode = searchParams.get('code') || '';
  const initialMobile = searchParams.get('mobile') || '';
  const initialInvoiceParam = (searchParams.get('invoice') || '').trim();
  const initialAmountParam = Math.max(0, Math.round(Number(searchParams.get('amount')) || 0));

  const [lookupCode, setLookupCode] = useState(initialCode);
  const [lookupMobile, setLookupMobile] = useState(initialMobile);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [record, setRecord] = useState<RepairTrackingRecord | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [manualBillMode, setManualBillMode] = useState(!initialCode && !initialInvoiceParam);

  const pendingCustomerInvoices = useMemo(
    () =>
      customerInvoices.filter(
        (inv) =>
          inv.status === 'Unpaid' ||
          inv.status === 'Partial' ||
          (inv.outstandingAmount > 0 && inv.status !== 'Refunded')
      ),
    [customerInvoices]
  );

  useEffect(() => {
    if (!initialInvoiceParam || selectedInvoice) return;
    const match = customerInvoices.find(
      (inv) => inv.invoiceNumber.toLowerCase() === initialInvoiceParam.toLowerCase()
    );
    if (match) {
      setSelectedInvoice(match);
      setManualBillMode(false);
    }
  }, [initialInvoiceParam, customerInvoices, selectedInvoice]);

  useSeoMeta({
    title: 'Pay Repair Bill Online (Razorpay & UPI QR) | Refix Pro Gurugram',
    description:
      'Pay your confirmed Refix Pro MacBook, iPad, or iPhone repair invoice securely online via dynamic UPI QR code, Razorpay Checkout, or Bank Transfer.',
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
        setSelectedInvoice(null);
        setManualBillMode(false);
      }
    } catch (err) {
      console.error('Pay lookup error:', err);
      setLookupError(extractReadableError(err, 'Unable to fetch repair details right now.'));
    } finally {
      setLookingUp(false);
    }
  };

  const activeInvoiceAmount = selectedInvoice
    ? selectedInvoice.outstandingAmount > 0
      ? selectedInvoice.outstandingAmount
      : selectedInvoice.totalAmount
    : 0;
  const effectiveDefaultAmount =
    activeInvoiceAmount > 0
      ? activeInvoiceAmount
      : record?.payableAmount && record.payableAmount > 0
        ? record.payableAmount
        : initialAmountParam;
  const effectiveInvoiceNumber =
    selectedInvoice?.invoiceNumber || initialInvoiceParam || '';
  const effectiveEnquiryCode =
    selectedInvoice?.enquiryCode ||
    selectedInvoice?.jobCardCode ||
    record?.enquiryCode ||
    lookupCode;

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
          {/* Left: Signed-in Pending Invoices + Enquiry Lookup or Switch to Direct Manual Payment */}
          <FadeInSection className="xl:col-span-5 space-y-5">
            {user && pendingCustomerInvoices.length > 0 && (
              <div className="p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#0066CC]">Signed-in Account Invoices</p>
                    <h2 className="text-base font-bold text-[#1D1D1F] mt-0.5">
                      Select a Pending Invoice to Generate UPI QR
                    </h2>
                  </div>
                  <FileText className="w-5 h-5 text-[#0066CC] shrink-0" />
                </div>

                <div className="space-y-2.5">
                  {pendingCustomerInvoices.map((inv) => {
                    const due = inv.outstandingAmount > 0 ? inv.outstandingAmount : inv.totalAmount;
                    const isSelected = selectedInvoice?.id === inv.id;
                    return (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setRecord(null);
                          setManualBillMode(false);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-[#0066CC] bg-blue-50/70 ring-1 ring-[#0066CC]'
                            : 'border-[#E5E5EA] bg-[#F5F5F7]/50 hover:bg-[#F5F5F7]'
                        }`}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-[#0066CC]">
                              {inv.invoiceNumber}
                            </span>
                            <StatusBadge label={inv.status} />
                          </div>
                          <p className="text-xs font-semibold text-[#1D1D1F] truncate">
                            {inv.deviceSummary}
                          </p>
                          <p className="text-[11px] text-[#6E6E73] truncate">{inv.repairSummary}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-sm font-bold text-[#1D1D1F] tabular-nums">
                            ₹{due.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] font-semibold text-[#0066CC]">
                            {isSelected ? 'Selected' : 'Load QR →'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                    setSelectedInvoice(null);
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
                    Step 2 · Instant Dynamic UPI QR & Online Settlement
                  </p>
                  <h2 className="text-xl font-bold text-[#1D1D1F] mt-0.5">
                    {selectedInvoice
                      ? `Settlement for ${selectedInvoice.invoiceNumber} (${selectedInvoice.deviceSummary})`
                      : record
                        ? `Settlement for ${record.enquiryCode} (${record.macbookModel})`
                        : manualBillMode
                          ? 'Direct Repair Payment (Dynamic UPI QR, Razorpay & Bank)'
                          : 'Select Payment Mode'}
                  </h2>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>

              <RepairPaymentPanel
                key={selectedInvoice ? selectedInvoice.id : record ? record.id : 'manual-bill'}
                enquiryCode={effectiveEnquiryCode}
                invoiceNumber={effectiveInvoiceNumber}
                customerName={selectedInvoice?.customerName || user?.displayName || ''}
                mobile={selectedInvoice?.customerMobile || lookupMobile}
                email={selectedInvoice?.customerEmail || user?.email || ''}
                defaultAmount={effectiveDefaultAmount}
                allowCustomAmount={effectiveDefaultAmount <= 0}
                paymentStatus={
                  selectedInvoice
                    ? selectedInvoice.status === 'Paid'
                      ? 'Paid'
                      : 'Unpaid'
                    : record?.paymentStatus || 'Unpaid'
                }
                existingReference={record?.paymentReference || ''}
                deviceLabel={
                  selectedInvoice?.deviceSummary || record?.macbookModel || 'MacBook Repair Service'
                }
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
