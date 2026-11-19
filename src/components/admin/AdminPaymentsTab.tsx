import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Landmark,
  QrCode,
  RotateCcw,
  Save,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { extractReadableError } from '../../lib/firebase';
import { compressImageToDataUrl } from '../../utils/whatsapp';
import { ConfirmDialog } from '../ConfirmDialog';
import type { WebsiteSettings } from '../../types';

export function AdminPaymentsTab({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const {
    settings,
    saveWebsiteSettings,
    paymentSubmissions,
    verifyPaymentSubmission,
    deletePaymentSubmission,
    hasPermission,
  } = useApp();

  const [form, setForm] = useState<WebsiteSettings>({ ...settings });
  const [savingConfig, setSavingConfig] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<{ id: string; code: string; amount: number } | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNote, setRefundNote] = useState('');

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      await saveWebsiteSettings(form);
      onNotify('success', 'Razorpay & Manual UPI payment configuration saved live.');
    } catch (err) {
      console.error('Save payment config error:', err);
      onNotify('error', extractReadableError(err, 'Failed to save payment configuration.'));
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDecision = async (
    paymentId: string,
    decision: 'Verified Paid' | 'Rejected' | 'Refunded',
    notes?: string,
    refAmt?: number
  ) => {
    setBusyId(paymentId);
    try {
      await verifyPaymentSubmission(paymentId, decision, notes, refAmt);
      onNotify(
        'success',
        decision === 'Verified Paid'
          ? 'Payment verified & enquiry marked Paid.'
          : decision === 'Refunded'
            ? 'Payment marked Refunded and enquiry updated.'
            : 'Payment confirmation rejected.'
      );
    } catch (err) {
      console.error('Verify payment error:', err);
      onNotify('error', 'Could not update payment verification status.');
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = paymentSubmissions.filter(
    (p) => p.status === 'Pending Verification'
  ).length;
  const verifiedTotal = paymentSubmissions
    .filter((p) => p.status === 'Verified Paid')
    .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return (
    <div className="space-y-8">
      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
          <p className="text-xs text-[#6E6E73]">Awaiting Verification</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
            {pendingCount}
          </p>
        </div>
        <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
          <p className="text-xs text-[#6E6E73]">Total Submissions</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#1D1D1F] mt-1">
            {paymentSubmissions.length}
          </p>
        </div>
        <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
          <p className="text-xs text-[#6E6E73]">Verified Collected</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            ₹{verifiedTotal.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Payment Gateway & Manual UPI Configuration */}
      <form
        onSubmit={handleSavePaymentConfig}
        className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5EA] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1D1D1F] flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#0066CC]" />
              Razorpay & Manual UPI / Bank Settings
            </h2>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              Connect your Razorpay Key ID (publishable) and/or Manual UPI ID, QR code, and bank
              details so customers can pay after their repair is ready.
            </p>
          </div>
          <button
            type="submit"
            disabled={savingConfig}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap"
          >
            <Save className="w-4 h-4" />
            {savingConfig ? 'Saving...' : 'Save Payment Settings'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Razorpay Settings */}
          <div className="p-5 rounded-xl bg-[#F5F5F7]/70 border border-[#E5E5EA] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#1D1D1F] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0066CC]" />
                Razorpay Online Checkout
              </h3>
              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form.razorpayEnabled)}
                  onChange={(e) =>
                    setForm({ ...form, razorpayEnabled: e.target.checked })
                  }
                />
                Enable Razorpay
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Razorpay Publishable Key ID
              </label>
              <input
                type="text"
                value={form.razorpayKeyId || ''}
                onChange={(e) => setForm({ ...form, razorpayKeyId: e.target.value })}
                placeholder="rzp_live_xxxxxxxxxxxxxx or rzp_test_xxxxxxxxxxxxxx"
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs font-mono"
              />
              <p className="text-[11px] text-[#6E6E73] mt-1">
                Security note: Enter only your public Razorpay Key ID (rzp_live_... / rzp_test_...). Never enter your Key Secret here.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Razorpay Payment Link URL (Optional Fallback)
              </label>
              <input
                type="url"
                value={form.razorpayPaymentLinkUrl || ''}
                onChange={(e) =>
                  setForm({ ...form, razorpayPaymentLinkUrl: e.target.value })
                }
                placeholder="https://rzp.io/l/your-payment-page"
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs font-mono"
              />
            </div>
          </div>

          {/* Manual UPI / QR / Bank Settings */}
          <div className="p-5 rounded-xl bg-[#F5F5F7]/70 border border-[#E5E5EA] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#1D1D1F] flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#0066CC]" />
                Manual UPI, QR & Bank Transfer
              </h3>
              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.manualPaymentEnabled !== false}
                  onChange={(e) =>
                    setForm({ ...form, manualPaymentEnabled: e.target.checked })
                  }
                />
                Enable Manual Option
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Official UPI ID</label>
              <input
                type="text"
                value={form.manualUpiId || ''}
                onChange={(e) => setForm({ ...form, manualUpiId: e.target.value })}
                placeholder="e.g. refixpro@okicici"
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#0066CC]" />
                UPI QR Code Image (URL or Upload)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.manualUpiQrUrl || ''}
                  onChange={(e) =>
                    setForm({ ...form, manualUpiQrUrl: e.target.value })
                  }
                  placeholder="Paste QR image URL or upload PNG/JPG"
                  className="flex-1 px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs font-mono"
                />
                <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold cursor-pointer whitespace-nowrap">
                  <Upload className="w-3.5 h-3.5" />
                  Upload QR
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = await compressImageToDataUrl(file, 600, 0.8);
                      setForm({ ...form, manualUpiQrUrl: url });
                    }}
                  />
                </label>
              </div>
              {form.manualUpiQrUrl && (
                <img
                  src={form.manualUpiQrUrl}
                  alt="Uploaded UPI QR preview"
                  className="mt-2 w-28 h-28 object-contain rounded-lg border border-[#E5E5EA] bg-white p-1"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-[#0066CC]" />
                Bank Account Details (Optional)
              </label>
              <textarea
                rows={3}
                value={form.manualBankDetails || ''}
                onChange={(e) =>
                  setForm({ ...form, manualBankDetails: e.target.value })
                }
                placeholder={'Account Name: Refix Pro\nAccount No: XXXXXXXX\nIFSC: XXXXXXXX\nBank: HDFC / ICICI'}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Customer Payment Instructions Note
              </label>
              <input
                type="text"
                value={form.manualPaymentNote || ''}
                onChange={(e) =>
                  setForm({ ...form, manualPaymentNote: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs"
              />
            </div>
          </div>
        </div>
      </form>

      {/* Customer Payment Submissions & Verification Table */}
      <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-4">
        <div>
          <h3 className="text-base font-bold text-[#1D1D1F]">
            Customer Payment Confirmations ({paymentSubmissions.length})
          </h3>
          <p className="text-xs text-[#6E6E73]">
            Verify Razorpay payment IDs and manual UPI UTR references submitted by customers on the
            website. Approving automatically updates matching Repair Enquiry & Tracking status to Paid.
          </p>
        </div>

        <div className="rounded-xl border border-[#E5E5EA] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7] text-xs font-semibold text-[#424245]">
                <th className="py-3 px-4">Enquiry ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method & Ref</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA] text-xs sm:text-sm">
              {paymentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#6E6E73]">
                    No customer payments submitted yet.
                  </td>
                </tr>
              ) : (
                paymentSubmissions.map((pay) => (
                  <tr key={pay.id} className="hover:bg-[#F5F5F7]/60">
                    <td className="py-3 px-4 font-mono font-bold text-[#0066CC] whitespace-nowrap">
                      {pay.enquiryCode}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#1D1D1F]">{pay.customerName}</p>
                      <p className="text-xs font-mono text-[#6E6E73]">{pay.mobile}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold tabular-nums text-[#1D1D1F] whitespace-nowrap">
                      ₹{Number(pay.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-semibold text-[#1D1D1F]">{pay.method}</p>
                      <p className="text-xs font-mono text-[#424245] break-all">
                        {pay.transactionRef}
                      </p>
                      {pay.notes && (
                        <p className="text-[11px] text-[#6E6E73] mt-0.5">{pay.notes}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-bold ${
                          pay.status === 'Verified Paid'
                            ? 'text-emerald-700'
                            : pay.status === 'Rejected'
                              ? 'text-red-600'
                              : 'text-amber-700'
                        }`}
                      >
                        {pay.status}
                      </span>
                      {pay.verifiedAt && (
                        <p className="text-[10px] text-[#6E6E73]">{pay.verifiedAt}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      {pay.status === 'Verified Paid' && hasPermission('payments', 'approve') && (
                        <button
                          type="button"
                          disabled={busyId === pay.id}
                          onClick={() => {
                            setRefundTarget({ id: pay.id, code: pay.enquiryCode, amount: pay.amount });
                            setRefundAmount(String(pay.amount));
                            setRefundNote('Customer refund issued');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-50 text-xs font-semibold"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Refund
                        </button>
                      )}
                      {pay.status !== 'Verified Paid' && pay.status !== 'Refunded' && (
                        <button
                          type="button"
                          disabled={busyId === pay.id}
                          onClick={() => handleDecision(pay.id, 'Verified Paid')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verify Paid
                        </button>
                      )}
                      {pay.status !== 'Rejected' && pay.status !== 'Refunded' && (
                        <button
                          type="button"
                          disabled={busyId === pay.id}
                          onClick={() => handleDecision(pay.id, 'Rejected')}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      )}
                      {hasPermission('payments', 'delete') && (
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(pay.id)}
                          aria-label={`Delete payment ${pay.id}`}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 align-middle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {refundTarget && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await handleDecision(
                refundTarget.id,
                'Refunded',
                refundNote,
                Math.max(0, Number(refundAmount) || refundTarget.amount)
              );
              setRefundTarget(null);
            }}
            className="bg-white rounded-2xl border border-[#E5E5EA] max-w-md w-full p-6 space-y-4 text-xs"
          >
            <h3 className="text-base font-bold text-[#1D1D1F]">
              Issue Refund for {refundTarget.code}
            </h3>
            <div>
              <label className="block font-semibold mb-1">Refund Amount (₹)</label>
              <input
                type="number"
                min={1}
                max={refundTarget.amount}
                required
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Refund Reference / Reason</label>
              <input
                type="text"
                required
                value={refundNote}
                onChange={(e) => setRefundNote(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setRefundTarget(null)} className="px-4 py-2 rounded-lg border border-[#D2D2D7]">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-amber-600 text-white font-semibold">
                Confirm Refund
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Delete Payment Submission?"
        description="Removes this payment confirmation record permanently."
        confirmLabel="Delete"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (!deleteTargetId) return;
          await deletePaymentSubmission(deleteTargetId);
          setDeleteTargetId(null);
          onNotify('success', 'Payment record removed.');
        }}
      />
    </div>
  );
}
