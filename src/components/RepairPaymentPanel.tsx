import { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Landmark,
  QrCode,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { extractReadableError } from '../lib/firebase';
import type { PaymentStatus } from '../types';
import { openRazorpayCheckout } from '../utils/razorpay';

interface RepairPaymentPanelProps {
  enquiryId?: string;
  enquiryCode?: string;
  customerName?: string;
  mobile?: string;
  email?: string;
  defaultAmount?: number;
  allowCustomAmount?: boolean;
  paymentStatus?: PaymentStatus;
  existingReference?: string;
  deviceLabel?: string;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  compact?: boolean;
}

export function RepairPaymentPanel({
  enquiryId,
  enquiryCode = '',
  customerName = '',
  mobile = '',
  email = '',
  defaultAmount = 0,
  allowCustomAmount = false,
  paymentStatus = 'Unpaid',
  existingReference = '',
  deviceLabel = '',
  onSuccess,
  onError,
  compact = false,
}: RepairPaymentPanelProps) {
  const { settings, submitRepairPayment } = useApp();

  const hasRazorpayKey = Boolean(settings.razorpayEnabled && settings.razorpayKeyId.trim());
  const hasRazorpayLink = Boolean(
    settings.razorpayEnabled && settings.razorpayPaymentLinkUrl.trim()
  );
  const razorpayAvailable = hasRazorpayKey || hasRazorpayLink;
  const manualAvailable = settings.manualPaymentEnabled !== false;

  const [mode, setMode] = useState<'razorpay' | 'manual'>(
    razorpayAvailable ? 'razorpay' : 'manual'
  );

  const [nameInput, setNameInput] = useState(customerName);
  const [mobileInput, setMobileInput] = useState(mobile);
  const [codeInput, setCodeInput] = useState(enquiryCode);
  const [amountInput, setAmountInput] = useState(
    defaultAmount > 0 ? String(Math.round(defaultAmount)) : ''
  );
  const [utrInput, setUtrInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState('');

  const numericAmount = Math.max(0, Math.round(Number(amountInput) || 0));
  const cleanUpiId = (settings.manualUpiId || '').trim();
  const upiDeepLink = cleanUpiId
    ? `upi://pay?pa=${encodeURIComponent(cleanUpiId)}&pn=${encodeURIComponent(
        settings.businessName || 'Refix Pro'
      )}${numericAmount > 0 ? `&am=${numericAmount}` : ''}&cu=INR&tn=${encodeURIComponent(
        `Refix Pro ${codeInput || 'Repair Payment'}`
      )}`
    : '';

  const handleCopyUpi = async () => {
    if (!cleanUpiId) return;
    try {
      await navigator.clipboard.writeText(cleanUpiId);
      setCopiedUpi(true);
      window.setTimeout(() => setCopiedUpi(false), 2200);
    } catch {
      setCopiedUpi(false);
    }
  };

  const handleRazorpayPay = async () => {
    if (numericAmount < 1) {
      onError?.('Please enter a valid payable amount in INR (minimum ₹1).');
      return;
    }
    if (nameInput.trim().length < 2 || mobileInput.trim().length < 7) {
      onError?.('Please enter your name and registered mobile number before paying.');
      return;
    }

    if (!hasRazorpayKey && hasRazorpayLink) {
      const linkEl = document.createElement('a');
      linkEl.href = settings.razorpayPaymentLinkUrl.trim();
      linkEl.target = '_blank';
      linkEl.rel = 'noopener noreferrer';
      linkEl.click();
      return;
    }

    setSubmitting(true);
    try {
      await openRazorpayCheckout({
        key: settings.razorpayKeyId.trim(),
        amountPaise: numericAmount * 100,
        name: settings.businessName || 'Refix Pro',
        description: `${codeInput || 'MacBook Repair'}${deviceLabel ? ` · ${deviceLabel}` : ''}`,
        prefill: {
          name: nameInput.trim(),
          email: email.trim() || undefined,
          contact: mobileInput.trim(),
        },
        notes: {
          enquiryCode: codeInput || 'MANUAL-BILL',
          source: 'refixpro.in',
        },
        onSuccess: async (paymentId) => {
          try {
            await submitRepairPayment({
              enquiryId,
              enquiryCode: codeInput || 'MANUAL-BILL',
              customerName: nameInput,
              mobile: mobileInput,
              amount: numericAmount,
              method: 'Razorpay',
              transactionRef: paymentId,
              notes: notesInput || 'Paid online via Razorpay Checkout',
            });
            setSubmittedRef(paymentId);
            onSuccess?.(
              `Razorpay payment recorded (${paymentId}). Refix Pro desk will confirm your receipt shortly.`
            );
          } catch (err) {
            console.error('Razorpay record save error:', err);
            onError?.(
              `Payment captured (${paymentId}), but we could not save the receipt automatically. Please submit the ID manually below.`
            );
            setMode('manual');
            setUtrInput(paymentId);
          } finally {
            setSubmitting(false);
          }
        },
        onDismiss: () => {
          setSubmitting(false);
        },
      });
    } catch (err) {
      console.error('Razorpay launch failed:', err);
      setSubmitting(false);
      onError?.(
        'Could not launch Razorpay Checkout. You can use the Manual UPI / QR payment option instead.'
      );
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim().length < 2) {
      onError?.('Please enter your full name.');
      return;
    }
    if (mobileInput.trim().length < 7) {
      onError?.('Please enter a valid mobile number.');
      return;
    }
    if (numericAmount < 1) {
      onError?.('Please enter the paid repair amount in INR.');
      return;
    }
    if (utrInput.trim().length < 4) {
      onError?.('Please enter your UPI UTR / Razorpay / Bank Transaction Reference ID.');
      return;
    }

    setSubmitting(true);
    try {
      const refVal = utrInput.trim();
      await submitRepairPayment({
        enquiryId,
        enquiryCode: codeInput || 'MANUAL-BILL',
        customerName: nameInput,
        mobile: mobileInput,
        amount: numericAmount,
        method: 'Manual UPI / Bank',
        transactionRef: refVal,
        notes: notesInput.trim(),
      });
      setSubmittedRef(refVal);
      setUtrInput('');
      setNotesInput('');
      onSuccess?.(
        `Payment confirmation submitted (Ref: ${refVal}). Our Sector 14 desk will verify and mark your job card Paid.`
      );
    } catch (err) {
      console.error('Manual payment submit failed:', err);
      onError?.(
        extractReadableError(
          err,
          'Could not submit your payment reference. Please check your details and try again.'
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (paymentStatus === 'Paid') {
    return (
      <div className="p-4 sm:p-5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm">
          <p className="font-bold text-emerald-950">Repair Payment Verified & Completed</p>
          <p className="text-emerald-900">
            {defaultAmount > 0 ? `Amount: ₹${defaultAmount.toLocaleString('en-IN')} · ` : ''}
            {existingReference ? `Reference: ${existingReference}` : 'Settled at Refix Pro Desk'}
          </p>
        </div>
      </div>
    );
  }

  if (submittedRef) {
    return (
      <div className="p-5 rounded-xl bg-blue-50 border border-[#0066CC]/30 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#0066CC] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs sm:text-sm">
          <p className="font-bold text-[#1D1D1F]">Payment Confirmation Received</p>
          <p className="text-[#424245]">
            Reference <span className="font-mono font-semibold text-[#1D1D1F]">{submittedRef}</span>{' '}
            for <span className="font-mono font-semibold tabular-nums">₹{numericAmount.toLocaleString('en-IN')}</span>{' '}
            has been queued for verification by our desk.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-[#E5E5EA] bg-[#F5F5F7]/60 ${
        compact ? 'p-4 sm:p-5' : 'p-5 sm:p-7'
      } space-y-5`}
    >
      {/* Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#0066CC]">Online & Manual Repair Settlement</p>
          <h4 className="text-base sm:text-lg font-bold text-[#1D1D1F]">
            {defaultAmount > 0
              ? `Pay Repair Bill · ₹${defaultAmount.toLocaleString('en-IN')}`
              : 'Pay for Your Completed Repair'}
          </h4>
        </div>

        {razorpayAvailable && manualAvailable && (
          <div className="inline-flex rounded-xl border border-[#D2D2D7] bg-white p-1 shrink-0">
            <button
              type="button"
              onClick={() => setMode('razorpay')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'razorpay'
                  ? 'bg-[#0066CC] text-white'
                  : 'text-[#424245] hover:text-[#1D1D1F]'
              }`}
            >
              Razorpay Online
            </button>
            <button
              type="button"
              onClick={() => setMode('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                mode === 'manual'
                  ? 'bg-[#0066CC] text-white'
                  : 'text-[#424245] hover:text-[#1D1D1F]'
              }`}
            >
              UPI / QR / Bank
            </button>
          </div>
        )}
      </div>

      {paymentStatus === 'Pending Verification' && existingReference && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
          Submitted Reference <span className="font-mono font-semibold">{existingReference}</span> is currently awaiting verification by our Sector 14 desk.
        </div>
      )}

      {/* Common Billing Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-[#424245] mb-1">
            Customer Name *
          </label>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your full name"
            className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#424245] mb-1">
            Mobile Number *
          </label>
          <input
            type="tel"
            value={mobileInput}
            onChange={(e) => setMobileInput(e.target.value)}
            placeholder="10-digit mobile"
            className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm font-mono text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#424245] mb-1">
            Enquiry ID (Optional)
          </label>
          <input
            type="text"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            placeholder="RP-XXXXXX"
            className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm font-mono uppercase text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#424245] mb-1">
            Amount (INR ₹) *
          </label>
          <input
            type="number"
            min={1}
            max={500000}
            readOnly={!allowCustomAmount && defaultAmount > 0}
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="e.g. 4500"
            className={`w-full min-h-[42px] px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs sm:text-sm font-mono font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0066CC] ${
              !allowCustomAmount && defaultAmount > 0
                ? 'bg-[#F5F5F7] text-[#1D1D1F]'
                : 'bg-white text-[#1D1D1F]'
            }`}
          />
        </div>
      </div>

      {/* Mode 1: Razorpay Checkout / Payment Link */}
      {mode === 'razorpay' && razorpayAvailable && (
        <div className="rounded-xl border border-[#E5E5EA] bg-white p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#0066CC]" />
                Pay Securely via Razorpay (UPI, Cards, NetBanking, Wallets)
              </p>
              <p className="text-xs text-[#6E6E73]">
                Instant encrypted payment gateway checkout configured by Refix Pro.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              256-bit SSL
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hasRazorpayKey && (
              <button
                type="button"
                disabled={submitting || numericAmount < 1}
                onClick={handleRazorpayPay}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <CreditCard className="w-4 h-4" />
                {submitting
                  ? 'Opening Razorpay...'
                  : numericAmount > 0
                    ? `Pay ₹${numericAmount.toLocaleString('en-IN')} with Razorpay`
                    : 'Enter Amount & Pay with Razorpay'}
              </button>
            )}

            {hasRazorpayLink && (
              <a
                href={settings.razorpayPaymentLinkUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#D2D2D7] hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <ExternalLink className="w-4 h-4 text-[#0066CC]" />
                Open Razorpay Payment Link
              </a>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Manual UPI / QR / Bank Transfer */}
      {(mode === 'manual' || !razorpayAvailable) && manualAvailable && (
        <div className="rounded-xl border border-[#E5E5EA] bg-white p-4 sm:p-5 space-y-5">
          {settings.manualPaymentNote && (
            <p className="text-xs text-[#424245] bg-[#F5F5F7] border border-[#E5E5EA] rounded-lg px-3.5 py-2.5">
              {settings.manualPaymentNote}
            </p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left: UPI / QR / Bank instructions */}
            <div className="lg:col-span-5 space-y-3">
              {cleanUpiId && (
                <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-2">
                  <p className="text-[11px] font-semibold text-[#6E6E73] flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#0066CC]" />
                    Official UPI ID
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-mono font-bold text-[#1D1D1F] break-all">
                      {cleanUpiId}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#D2D2D7] hover:bg-[#F5F5F7] text-[11px] font-semibold text-[#1D1D1F] shrink-0"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#0066CC]" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  {upiDeepLink && (
                    <a
                      href={upiDeepLink}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066CC] hover:underline pt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in GPay / PhonePe / Paytm
                    </a>
                  )}
                </div>
              )}

              {settings.manualUpiQrUrl && (
                <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-2">
                  <p className="text-[11px] font-semibold text-[#6E6E73] flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-[#0066CC]" />
                    Scan UPI QR Code
                  </p>
                  <img
                    src={settings.manualUpiQrUrl}
                    alt="Refix Pro UPI QR Code"
                    className="w-40 h-40 object-contain rounded-lg border border-[#E5E5EA] bg-white p-1.5"
                  />
                </div>
              )}

              {settings.manualBankDetails && (
                <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-1.5">
                  <p className="text-[11px] font-semibold text-[#6E6E73] flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-[#0066CC]" />
                    Bank Transfer (NEFT / IMPS)
                  </p>
                  <pre className="text-xs text-[#1D1D1F] font-mono whitespace-pre-wrap leading-relaxed">
                    {settings.manualBankDetails}
                  </pre>
                </div>
              )}
            </div>

            {/* Right: Payment Reference / UTR confirmation form */}
            <form onSubmit={handleManualSubmit} className="lg:col-span-7 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  UTR / UPI Transaction Reference ID *
                </label>
                <input
                  type="text"
                  required
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="Enter 12-digit UTR or Razorpay Payment ID"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] bg-[#F5F5F7]/40 text-sm font-mono text-[#1D1D1F] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0066CC]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="e.g. Paid via Google Pay after screen replacement"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-[#D2D2D7] bg-[#F5F5F7]/40 text-sm text-[#1D1D1F] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0066CC]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submitting ? 'Submitting Confirmation...' : 'Submit Payment Confirmation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
