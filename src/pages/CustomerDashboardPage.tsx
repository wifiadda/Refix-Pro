import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  LogIn,
  LogOut,
  MessageCircle,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSeoMeta } from '../utils/seo';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { TrackRepairTool } from '../components/TrackRepairTool';
import { RepairPaymentPanel } from '../components/RepairPaymentPanel';
import type { EnquiryStatus } from '../types';

const STATUS_PROGRESS: EnquiryStatus[] = [
  'New',
  'Contacted',
  'Inspection',
  'Estimate Sent',
  'Approved',
  'In Repair',
  'Ready for Delivery',
  'Completed',
];

function formatDate(val: unknown): string {
  if (!val) return 'Just now';
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
  return 'Recently submitted';
}

export function CustomerDashboardPage({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const {
    user,
    authReady,
    isAdmin,
    customerLogin,
    customerLogout,
    customerEnquiries,
    customerMessages,
    customerPayments,
    customerLoading,
    refreshCustomerData,
    settings,
  } = useApp();

  const [signingIn, setSigningIn] = useState(false);
  const [payingEnquiryId, setPayingEnquiryId] = useState<string | null>(null);

  useSeoMeta({
    title: 'Customer Dashboard – Track Repairs & Admin Replies | Refix Pro',
    description:
      'Sign in to your Refix Pro Customer Dashboard to view all submitted MacBook repair enquiries, live technician estimates, status updates, and replies to your messages.',
    canonicalPath: '/dashboard',
  });

  const handleLogin = async () => {
    setSigningIn(true);
    try {
      await customerLogin();
      onNotify('success', 'Signed in to your Refix Pro Customer Dashboard.');
    } catch (err) {
      console.error('Customer sign-in error:', err);
      onNotify('error', 'Google sign-in was cancelled or blocked. Please allow popups and try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleRefresh = async () => {
    await refreshCustomerData();
    onNotify('success', 'Latest technician updates loaded.');
  };

  if (!authReady) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F5F5F7]">
        <p className="text-sm text-[#6E6E73]">Loading your account...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-[80vh] py-12 lg:py-16">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-6 p-8 sm:p-10 rounded-2xl bg-white border border-[#E5E5EA] shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-[#0066CC]">Refix Pro Customer Portal</p>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
                  Customer Login & Live Repair Dashboard
                </h1>
                <p className="text-sm sm:text-base text-[#424245] leading-relaxed">
                  Sign in with your Google account to automatically view every repair request you booked, see live technician updates made by our admin desk, and read replies to any contact messages you sent.
                </p>

                <ul className="space-y-3 pt-2 text-sm text-[#424245]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
                    <span>See live bench status, technician notes, and official repair estimates</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
                    <span>Read direct Admin replies to your Contact Us enquiries</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
                    <span>All bookings submitted while signed in (or using the same email) sync automatically</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#E5E5EA] flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={signingIn}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <LogIn className="w-4 h-4" />
                  {signingIn ? 'Signing in...' : 'Sign In with Google'}
                </button>
                <Link
                  to="/book"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-[#D2D2D7] hover:bg-[#F5F5F7] text-sm font-semibold text-[#1D1D1F] transition-colors whitespace-nowrap"
                >
                  Book a Repair First
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6">
              <TrackRepairTool onNotify={onNotify} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeRepairsCount = customerEnquiries.filter(
    (e) => e.status !== 'Completed' && e.status !== 'Cancelled'
  ).length;
  const repliedMessagesCount = customerMessages.filter((m) => Boolean(m.adminReply)).length;

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen py-10 lg:py-14">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-8">
        {/* Top Customer Header */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0066CC]/10 border border-[#0066CC]/20 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6 text-[#0066CC]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0066CC]">Customer Repair Portal</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
                Welcome, {user.displayName || user.email}
              </h1>
              <p className="text-xs text-[#6E6E73] font-mono mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#60A5FA]" />
                Admin Console
              </Link>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={customerLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${customerLoading ? 'animate-spin' : ''}`} />
              Refresh Updates
            </button>
            <Link
              to="/pay"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#0066CC] text-[#0066CC] hover:bg-[#0066CC]/5 text-xs font-semibold whitespace-nowrap"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Pay Bill Online
            </Link>
            <Link
              to="/book"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold whitespace-nowrap"
            >
              New Repair Booking
            </Link>
            <button
              type="button"
              onClick={() => customerLogout()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#D2D2D7] hover:bg-red-50 hover:text-red-700 text-xs font-semibold text-[#424245] whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5EA]">
            <p className="text-xs text-[#6E6E73]">Repair Enquiries</p>
            <p className="text-3xl font-bold font-mono tabular-nums text-[#1D1D1F] mt-1">
              {customerEnquiries.length}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5EA]">
            <p className="text-xs text-[#6E6E73]">Active In Progress</p>
            <p className="text-3xl font-bold font-mono tabular-nums text-[#0066CC] mt-1">
              {activeRepairsCount}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5EA]">
            <p className="text-xs text-[#6E6E73]">Contact Messages</p>
            <p className="text-3xl font-bold font-mono tabular-nums text-[#1D1D1F] mt-1">
              {customerMessages.length}
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[#E5E5EA]">
            <p className="text-xs text-[#6E6E73]">Admin Replies Received</p>
            <p className="text-3xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
              {repliedMessagesCount}
            </p>
          </div>
        </div>

        {/* Main 2-Column Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Repair Requests & Technician Updates */}
          <section className="xl:col-span-7 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#0066CC]" />
                <h2 className="text-xl font-bold text-[#1D1D1F]">
                  My Repair Requests & Live Desk Updates
                </h2>
              </div>
              <Link to="/book" className="text-xs font-semibold text-[#0066CC] hover:underline">
                + Book Another Repair
              </Link>
            </div>

            {customerEnquiries.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-[#E5E5EA] text-center space-y-3">
                <ClipboardList className="w-8 h-8 text-[#6E6E73] mx-auto" />
                <h3 className="text-base font-bold text-[#1D1D1F]">No Repair Requests Linked Yet</h3>
                <p className="text-xs sm:text-sm text-[#424245] max-w-md mx-auto">
                  Requests booked while signed in with <span className="font-mono">{user.email}</span> automatically appear here with live technician updates.
                </p>
                <div className="pt-2">
                  <Link
                    to="/book"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
                  >
                    Book a MacBook Repair
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {customerEnquiries.map((enq) => {
                  const stageIdx = STATUS_PROGRESS.indexOf(enq.status);
                  const isCancelled = enq.status === 'Cancelled';
                  const waFollowUrl = buildWhatsAppUrl(
                    settings.whatsapp,
                    `Hello Refix Pro, checking update on my booking ${enq.enquiryCode} (${enq.macbookModel}).`
                  );
                  return (
                    <div
                      key={enq.id}
                      className="p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-5 shadow-[0_6px_20px_-14px_rgba(0,0,0,0.08)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E5E5EA] pb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-mono text-sm font-bold text-[#0066CC] tabular-nums">
                              {enq.enquiryCode}
                            </span>
                            <span className="text-xs text-[#6E6E73]">{formatDate(enq.createdAt)}</span>
                          </div>
                          <h3 className="text-lg font-bold text-[#1D1D1F] mt-1">
                            {enq.macbookModel}
                          </h3>
                          <p className="text-xs text-[#424245]">{enq.serviceName}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] text-[#6E6E73]">Current Status</p>
                          <p
                            className={`text-sm font-bold ${
                              isCancelled
                                ? 'text-red-600'
                                : enq.status === 'Completed' || enq.status === 'Ready for Delivery'
                                  ? 'text-emerald-700'
                                  : 'text-[#0066CC]'
                            }`}
                          >
                            {enq.status}
                          </p>
                        </div>
                      </div>

                      {/* Progress Tracker */}
                      {!isCancelled && (
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                          {STATUS_PROGRESS.map((step, i) => {
                            const done = stageIdx >= i;
                            const active = stageIdx === i;
                            return (
                              <div
                                key={step}
                                className={`px-2 py-2 rounded-lg border text-center ${
                                  active
                                    ? 'bg-[#0066CC] text-white border-[#0066CC]'
                                    : done
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                      : 'bg-[#F5F5F7] text-[#6E6E73] border-[#E5E5EA]'
                                }`}
                              >
                                <p className="text-[10px] font-mono tabular-nums">0{i + 1}</p>
                                <p className="text-[10px] font-semibold truncate mt-0.5">{step}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Admin Updates: Estimate, Follow-up, Notes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F5F5F7] p-4 rounded-xl border border-[#E5E5EA] text-xs">
                        <div>
                          <p className="text-[#6E6E73]">Technician Repair Estimate</p>
                          <p className="font-mono font-bold text-[#1D1D1F] mt-0.5">
                            {enq.repairEstimate || 'Pending bench inspection'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#6E6E73]">Scheduled Follow-Up / Ready Date</p>
                          <p className="font-semibold text-[#1D1D1F] mt-0.5 inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-[#0066CC]" />
                            {enq.followUpDate || 'To be confirmed'}
                          </p>
                        </div>
                      </div>

                      {enq.technicianNotes && (
                        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs sm:text-sm text-[#1D1D1F] space-y-1">
                          <p className="text-xs font-bold text-[#0066CC]">
                            Latest Technician / Admin Update
                          </p>
                          <p className="leading-relaxed">{enq.technicianNotes}</p>
                        </div>
                      )}

                      {enq.problemDescription && (
                        <p className="text-xs text-[#424245]">
                          <span className="font-semibold text-[#1D1D1F]">Your Reported Fault: </span>
                          {enq.problemDescription}
                        </p>
                      )}

                      {enq.imageUrls && enq.imageUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {enq.imageUrls.map((url, idx) => (
                            <img
                              key={idx}
                              src={url}
                              alt={`Uploaded MacBook issue ${idx + 1}`}
                              className="w-16 h-16 rounded-lg object-cover border border-[#E5E5EA]"
                            />
                          ))}
                        </div>
                      )}

                      {/* Billing & Online/Manual Payment Section */}
                      {!isCancelled && (
                        <div className="space-y-3 pt-1">
                          <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div>
                              <p className="text-[#6E6E73]">
                                Payment Status:{' '}
                                <span
                                  className={`font-semibold ${
                                    enq.paymentStatus === 'Paid'
                                      ? 'text-emerald-700'
                                      : enq.paymentStatus === 'Pending Verification'
                                        ? 'text-amber-700'
                                        : 'text-[#1D1D1F]'
                                  }`}
                                >
                                  {enq.paymentStatus || 'Unpaid'}
                                </span>
                                {enq.paymentReference ? ` · Ref: ${enq.paymentReference}` : ''}
                              </p>
                              <p className="font-mono font-bold text-[#1D1D1F] mt-0.5 tabular-nums">
                                {enq.payableAmount && enq.payableAmount > 0
                                  ? `Final Payable Amount: ₹${enq.payableAmount.toLocaleString('en-IN')}`
                                  : 'Payable bill amount will appear once finalized'}
                              </p>
                            </div>

                            {enq.paymentStatus !== 'Paid' && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPayingEnquiryId((prev) => (prev === enq.id ? null : enq.id))
                                }
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold whitespace-nowrap"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                {payingEnquiryId === enq.id
                                  ? 'Close Payment Box'
                                  : 'Pay Now (Razorpay / UPI)'}
                              </button>
                            )}
                          </div>

                          {payingEnquiryId === enq.id && (
                            <RepairPaymentPanel
                              compact
                              enquiryId={enq.id}
                              enquiryCode={enq.enquiryCode}
                              customerName={enq.customerName || user.displayName || ''}
                              mobile={enq.mobile}
                              email={enq.email || user.email || ''}
                              defaultAmount={enq.payableAmount || 0}
                              allowCustomAmount={!enq.payableAmount || enq.payableAmount <= 0}
                              paymentStatus={enq.paymentStatus || 'Unpaid'}
                              existingReference={enq.paymentReference || ''}
                              deviceLabel={enq.macbookModel}
                              onSuccess={(msg) => onNotify('success', msg)}
                              onError={(msg) => onNotify('error', msg)}
                            />
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E5E5EA]">
                        <span className="text-[11px] text-[#6E6E73]">
                          Desk: {settings.address}
                        </span>
                        <a
                          href={waFollowUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold whitespace-nowrap"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp Desk About {enq.enquiryCode}
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Contact Messages & Admin Replies */}
          <section className="xl:col-span-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#0066CC]" />
                <h2 className="text-xl font-bold text-[#1D1D1F]">
                  My Contact Messages & Admin Replies
                </h2>
              </div>
              <Link to="/contact" className="text-xs font-semibold text-[#0066CC] hover:underline">
                + Send New Message
              </Link>
            </div>

            {customerMessages.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white border border-[#E5E5EA] text-center space-y-3">
                <MessageSquare className="w-8 h-8 text-[#6E6E73] mx-auto" />
                <h3 className="text-base font-bold text-[#1D1D1F]">No Messages Found</h3>
                <p className="text-xs sm:text-sm text-[#424245]">
                  Any message submitted via our Contact page while signed in or with your account email will show here along with direct replies from our Admin team.
                </p>
                <div className="pt-2">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#D2D2D7] hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F]"
                  >
                    Go to Contact Page
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {customerMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-5 rounded-2xl bg-white border border-[#E5E5EA] space-y-3 shadow-[0_6px_20px_-14px_rgba(0,0,0,0.08)]"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-[#F5F5F7] pb-3">
                      <div>
                        <p className="text-sm font-bold text-[#1D1D1F]">{msg.subject}</p>
                        <p className="text-[11px] text-[#6E6E73] mt-0.5">{formatDate(msg.createdAt)}</p>
                      </div>
                      <span
                        className={`text-[11px] font-semibold shrink-0 ${
                          msg.adminReply
                            ? 'text-emerald-700'
                            : msg.isRead
                              ? 'text-[#0066CC]'
                              : 'text-[#6E6E73]'
                        }`}
                      >
                        {msg.adminReply ? 'Admin Replied' : msg.isRead ? 'Seen by Admin' : 'Pending Review'}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[#424245] leading-relaxed">
                      {msg.message}
                    </p>

                    {msg.adminReply ? (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-emerald-900">Reply from Refix Pro Admin</p>
                          {msg.repliedAt && (
                            <span className="text-[10px] text-emerald-800">{msg.repliedAt}</span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                          {msg.adminReply}
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#6E6E73] italic">
                        Our SCF-92 desk will post a reply here or reach out to you on {msg.phone}.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {customerPayments.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#0066CC]" />
                  My Submitted Payment Receipts
                </h3>
                <div className="space-y-2.5">
                  {customerPayments.map((pay) => (
                    <div
                      key={pay.id}
                      className="p-4 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-mono font-bold text-[#1D1D1F] truncate">
                          {pay.enquiryCode} · ₹{pay.amount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[#6E6E73] truncate">
                          {pay.method} · Ref: <span className="font-mono">{pay.transactionRef}</span>
                        </p>
                      </div>
                      <span
                        className={`font-semibold shrink-0 ${
                          pay.status === 'Verified Paid'
                            ? 'text-emerald-700'
                            : pay.status === 'Rejected'
                              ? 'text-red-600'
                              : 'text-amber-700'
                        }`}
                      >
                        {pay.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Tracking Box for older guest bookings */}
            <div className="pt-2">
              <TrackRepairTool compact onNotify={onNotify} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
