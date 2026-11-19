import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ClipboardList,
  Compass,
  CreditCard,
  Download,
  Eye,
  FileText,
  History,
  Laptop,
  LayoutDashboard,
  LifeBuoy,
  LogIn,
  LogOut,
  MessageCircle,
  Plus,
  Printer,
  RefreshCw,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  User,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useErp } from '../context/ErpContext';
import { extractReadableError } from '../lib/firebase';
import { useSeoMeta } from '../utils/seo';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { generatePDF } from '../utils/generatePDF';
import { TrackRepairTool } from '../components/TrackRepairTool';
import { RepairPaymentPanel } from '../components/RepairPaymentPanel';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
  Button,
  EmptyState,
  InputField,
  KpiCard,
  SelectField,
  StatusBadge,
  TextareaField,
} from '../components/ui/DesignSystem';
import { PRIMARY_WORKFLOW_TIMELINE, type EnquiryStatus } from '../types';

type CustomerPortalSection =
  | 'dashboard'
  | 'book'
  | 'devices'
  | 'jobs'
  | 'tracking'
  | 'estimates'
  | 'payments'
  | 'invoices'
  | 'history'
  | 'notifications'
  | 'profile'
  | 'support';

const PORTAL_NAV: {
  id: CustomerPortalSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { id: 'book', label: 'Book Repair', icon: Plus },
  { id: 'devices', label: 'My Devices', icon: Laptop },
  { id: 'jobs', label: 'My Repair Jobs', icon: Wrench },
  { id: 'tracking', label: 'Live Repair Tracking', icon: Compass },
  { id: 'estimates', label: 'Estimate Approval', icon: ShieldCheck },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'history', label: 'Repair History', icon: History },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'support', label: 'Support', icon: LifeBuoy },
];

const ENQUIRY_STATUS_PROGRESS: EnquiryStatus[] = [
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
  if (!val) return 'Recently updated';
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
  if (typeof val === 'string') return val;
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
    isStaff,
    userRole,
    userProfile,
    refreshUserRole,
    updateOwnProfile,
    customerLogin,
    customerLogout,
    customerEnquiries,
    customerMessages,
    customerPayments,
    customerLoading,
    refreshCustomerData,
    submitRepairEnquiry,
    submitContactMessage,
    services,
    models,
    settings,
  } = useApp();

  const {
    customerJobs,
    customerInvoices,
    notifications,
    markNotificationRead,
    customerRespondEstimate,
    refreshErpData,
    erpLoading,
  } = useErp();

  const [section, setSection] = useState<CustomerPortalSection>('dashboard');
  const [signingIn, setSigningIn] = useState(false);
  const [payingKey, setPayingKey] = useState<string | null>(null);

  // Profile state
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileWhatsapp, setProfileWhatsapp] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Inline Quick Booking state
  const [bookModel, setBookModel] = useState('');
  const [bookService, setBookService] = useState('');
  const [bookPhone, setBookPhone] = useState('');
  const [bookProblem, setBookProblem] = useState('');
  const [bookVisitDate, setBookVisitDate] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Inline Support message state
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [submittingSupport, setSubmittingSupport] = useState(false);

  // Estimate decision modal
  const [estimateConfirm, setEstimateConfirm] = useState<{
    jobId: string;
    jobCardCode: string;
    decision: 'Approved' | 'Rejected';
    cost: number;
  } | null>(null);
  const [respondingEstimate, setRespondingEstimate] = useState(false);

  useEffect(() => {
    setProfileName(userProfile?.displayName || user?.displayName || '');
    setProfilePhone(userProfile?.phone || '');
    setProfileWhatsapp(userProfile?.whatsapp || '');
    setProfileAddress(userProfile?.address || '');
    if (!bookPhone && userProfile?.phone) setBookPhone(userProfile.phone);
  }, [userProfile, user, bookPhone]);

  useSeoMeta({
    title: 'Customer Portal – Live Repair Tracking, Estimates & Invoices | Refix Pro',
    description:
      'Sign in to your Refix Pro Customer Portal to book repairs, track MacBook job cards across 12 stages, approve estimates, pay invoices online, and contact support.',
    canonicalPath: '/dashboard',
  });

  const handleLogin = async () => {
    setSigningIn(true);
    try {
      await customerLogin();
      onNotify('success', 'Signed in to your Refix Pro Customer Portal.');
    } catch (err) {
      console.error('Customer sign-in error:', err);
      onNotify('error', 'Google sign-in was cancelled or blocked. Please allow popups and try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([refreshUserRole(), refreshCustomerData(), refreshErpData()]);
    onNotify('success', 'Latest job cards, estimates, and invoices synced.');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileName.trim().length < 2) {
      onNotify('error', 'Display name must be at least 2 characters.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateOwnProfile({
        displayName: profileName.trim(),
        phone: profilePhone.trim(),
        whatsapp: profileWhatsapp.trim(),
        address: profileAddress.trim(),
      });
      onNotify('success', 'Customer profile updated.');
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Failed to update profile.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePortalBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!bookModel.trim() || !bookService.trim() || bookPhone.trim().length < 8) {
      onNotify('error', 'Select your Apple device, service required, and valid contact phone.');
      return;
    }
    setSubmittingBooking(true);
    try {
      const res = await submitRepairEnquiry({
        customerName: profileName || user.displayName || 'Refix Pro Customer',
        mobile: bookPhone.trim(),
        whatsapp: profileWhatsapp || bookPhone.trim(),
        email: user.email || '',
        macbookModel: bookModel.trim(),
        serviceName: bookService.trim(),
        problemDescription: bookProblem.trim(),
        preferredContactMethod: 'WhatsApp',
        preferredVisitDate: bookVisitDate,
      });
      onNotify('success', `Booking submitted! Reference: ${res.enquiryCode}`);
      setBookProblem('');
      setSection('jobs');
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Unable to submit booking right now.'));
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handlePortalSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!supportSubject.trim() || !supportMessage.trim()) {
      onNotify('error', 'Please enter both a subject and message for our desk.');
      return;
    }
    setSubmittingSupport(true);
    try {
      await submitContactMessage({
        name: profileName || user.displayName || 'Customer',
        phone: profilePhone || userProfile?.phone || 'N/A',
        email: user.email || '',
        subject: supportSubject.trim(),
        message: supportMessage.trim(),
      });
      setSupportSubject('');
      setSupportMessage('');
      onNotify('success', 'Support message sent. Replies from our Gurugram desk appear here.');
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Failed to send support message.'));
    } finally {
      setSubmittingSupport(false);
    }
  };

  const handleConfirmEstimateDecision = async () => {
    if (!estimateConfirm) return;
    setRespondingEstimate(true);
    try {
      await customerRespondEstimate(estimateConfirm.jobId, estimateConfirm.decision);
      onNotify(
        'success',
        estimateConfirm.decision === 'Approved'
          ? `Estimate approved for ${estimateConfirm.jobCardCode}. Bench repair starting shortly.`
          : `Estimate declined for ${estimateConfirm.jobCardCode}. Our desk will reach out.`
      );
      setEstimateConfirm(null);
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Unable to submit estimate decision.'));
    } finally {
      setRespondingEstimate(false);
    }
  };

  const unreadNotifs = useMemo(
    () => notifications.filter((n) => !n.isRead),
    [notifications]
  );

  const pendingEstimateJobs = useMemo(
    () =>
      customerJobs.filter(
        (j) =>
          j.approvalStatus === 'Pending' ||
          j.status === 'Estimate Sent' ||
          j.status === 'Awaiting Approval'
      ),
    [customerJobs]
  );

  const activeJobs = useMemo(
    () =>
      customerJobs.filter(
        (j) =>
          j.status !== 'Delivered' &&
          j.status !== 'Completed' &&
          j.status !== 'Cancelled Repair'
      ),
    [customerJobs]
  );

  const historyJobs = useMemo(
    () =>
      customerJobs.filter(
        (j) =>
          j.status === 'Delivered' ||
          j.status === 'Completed' ||
          j.status === 'Cancelled Repair'
      ),
    [customerJobs]
  );

  const myDevices = useMemo(() => {
    const map = new Map<
      string,
      { model: string; serial: string; modelNumber: string; repairs: number; lastStatus: string; warranty: string }
    >();
    customerJobs.forEach((j) => {
      const key = `${j.macbookModel}::${j.serialNumber || j.modelNumber || ''}`;
      const existing = map.get(key);
      if (existing) {
        existing.repairs += 1;
      } else {
        map.set(key, {
          model: j.macbookModel,
          serial: j.serialNumber || 'Recorded at counter',
          modelNumber: j.modelNumber || '',
          repairs: 1,
          lastStatus: j.status,
          warranty: j.warrantyExpiry || j.warrantyPeriod || '90 Days Warranty',
        });
      }
    });
    customerEnquiries.forEach((e) => {
      const key = `${e.macbookModel}::`;
      if (!map.has(key)) {
        map.set(key, {
          model: e.macbookModel,
          serial: 'Pending counter check-in',
          modelNumber: e.macbookYear || '',
          repairs: 1,
          lastStatus: e.status,
          warranty: 'Standard Repair Warranty',
        });
      }
    });
    return Array.from(map.values());
  }, [customerJobs, customerEnquiries]);

  if (!authReady) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F5F5F7]">
        <div className="text-center space-y-2">
          <div className="w-7 h-7 border-2 border-[#0066CC] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#6E6E73]">Loading your customer account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-[80vh] py-12 lg:py-16">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-6 p-8 sm:p-10 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-[#0066CC]">Refix Pro Customer Portal</p>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1D1D1F]">
                  Customer Login &amp; Live Repair Portal
                </h1>
                <p className="text-sm sm:text-base text-[#424245] leading-relaxed">
                  Sign in with Google to track repair job cards across 12 live workshop stages, approve diagnostic estimates, pay bills via Razorpay or UPI, download GST invoices, and reach support.
                </p>

                <ul className="space-y-3 pt-2 text-sm text-[#424245]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
                    <span>12-stage live Job Card timeline with technician inspection &amp; photos</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
                    <span>One-click Estimate Approval &amp; verified online payment checkout</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
                    <span>PDF Job Cards, GST Invoices &amp; warranty records on demand</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#E5E5EA] flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  loading={signingIn}
                  icon={<LogIn className="w-4 h-4" />}
                  onClick={handleLogin}
                >
                  Sign In with Google
                </Button>
                <Link
                  to="/book"
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-xl border border-[#D2D2D7] hover:bg-[#F5F5F7] text-sm font-semibold text-[#1D1D1F] transition-colors whitespace-nowrap"
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

  const outstandingBalance = customerInvoices.reduce((acc, inv) => acc + (inv.outstandingAmount || 0), 0);

  const renderJobCard = (job: (typeof customerJobs)[number]) => {
    const stageIdx = PRIMARY_WORKFLOW_TIMELINE.indexOf(job.status);
    const isException = stageIdx === -1;
    const needsEstimateDecision =
      job.approvalStatus === 'Pending' ||
      job.status === 'Estimate Sent' ||
      job.status === 'Awaiting Approval';
    const finalAmount = job.finalCost && job.finalCost > 0 ? job.finalCost : job.estimatedCost;
    const payOpen = payingKey === `job-${job.id}`;

    return (
      <div
        key={job.id}
        className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E5E5EA] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-[#0066CC] tabular-nums">
                {job.jobCardCode}
              </span>
              {job.enquiryCode && (
                <span className="text-xs font-mono text-[#6E6E73]">Ref: {job.enquiryCode}</span>
              )}
              <span className="text-xs text-[#6E6E73]">{formatDate(job.updatedAt || job.createdAt)}</span>
            </div>
            <h3 className="text-lg font-bold text-[#1D1D1F] mt-1">
              {job.macbookModel} {job.modelNumber ? `(${job.modelNumber})` : ''}
            </h3>
            <p className="text-xs text-[#424245]">
              {job.reportedProblem}
              {job.serialNumber ? ` · Serial: ${job.serialNumber}` : ''}
            </p>
          </div>

          <div className="text-right space-y-2">
            <StatusBadge label={job.status} />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => generatePDF({ type: 'jobCard', job, settings }, 'preview')}
                className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-lg border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-[#0066CC]"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview PDF
              </button>
              <button
                type="button"
                onClick={() => generatePDF({ type: 'jobCard', job, settings }, 'print')}
                className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-lg bg-[#0F172A] hover:bg-black text-xs font-semibold text-white"
              >
                <Printer className="w-3.5 h-3.5" />
                Print PDF
              </button>
            </div>
          </div>
        </div>

        {/* 12-Stage Visual Repair Timeline */}
        {isException ? (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-semibold">
            Workflow Status: {job.status} · Estimate Approval: {job.approvalStatus}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {PRIMARY_WORKFLOW_TIMELINE.map((step, i) => {
              const done = stageIdx >= i;
              const active = stageIdx === i;
              return (
                <div
                  key={step}
                  className={`px-2 py-1.5 rounded-lg border text-center ${
                    active
                      ? 'bg-[#0066CC] text-white border-[#0066CC]'
                      : done
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                        : 'bg-[#F5F5F7] text-[#6E6E73] border-[#E5E5EA]'
                  }`}
                >
                  <p className="text-[10px] font-mono tabular-nums">{String(i + 1).padStart(2, '0')}</p>
                  <p className="text-[10px] font-semibold truncate">{step}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-[#F5F5F7] p-4 rounded-xl border border-[#E5E5EA] text-xs">
          <div>
            <p className="text-[#6E6E73]">Repair Estimate</p>
            <p className="font-mono font-bold text-[#1D1D1F] mt-0.5 tabular-nums">
              {finalAmount > 0 ? `₹${finalAmount.toLocaleString('en-IN')}` : 'Pending Inspection'}
            </p>
          </div>
          <div>
            <p className="text-[#6E6E73]">Estimate Approval</p>
            <p className="font-semibold text-[#1D1D1F] mt-0.5">{job.approvalStatus}</p>
          </div>
          <div>
            <p className="text-[#6E6E73]">Technician</p>
            <p className="font-semibold text-[#1D1D1F] mt-0.5">{job.technicianName || 'Bench Queue'}</p>
          </div>
          <div>
            <p className="text-[#6E6E73]">Warranty &amp; Due</p>
            <p className="font-semibold text-[#1D1D1F] mt-0.5">
              {job.deliveryDate || job.warrantyPeriod || '90 Days Warranty'}
            </p>
          </div>
        </div>

        {(job.inspectionDetails || job.diagnosis || job.customerUpdates) && (
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-1.5 text-xs sm:text-sm text-[#1D1D1F]">
            {job.inspectionDetails && (
              <p>
                <strong className="text-[#0066CC]">Inspection:</strong> {job.inspectionDetails}
              </p>
            )}
            {job.diagnosis && (
              <p>
                <strong className="text-[#0066CC]">Diagnosis:</strong> {job.diagnosis}
              </p>
            )}
            {job.customerUpdates && (
              <p>
                <strong className="text-[#0066CC]">Desk Update:</strong> {job.customerUpdates}
              </p>
            )}
          </div>
        )}

        {(job.beforeImages?.length > 0 || job.afterImages?.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {job.beforeImages?.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-[#6E6E73] mb-1.5">Before Repair Photos</p>
                <div className="flex flex-wrap gap-2">
                  {job.beforeImages.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Before repair ${i + 1}`}
                      className="w-16 h-16 rounded-lg object-cover border border-[#E5E5EA]"
                    />
                  ))}
                </div>
              </div>
            )}
            {job.afterImages?.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-[#6E6E73] mb-1.5">After Repair Photos</p>
                <div className="flex flex-wrap gap-2">
                  {job.afterImages.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`After repair ${i + 1}`}
                      className="w-16 h-16 rounded-lg object-cover border border-[#E5E5EA]"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {needsEstimateDecision && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs">
              <p className="font-bold text-amber-950">Estimate Ready for Your Decision</p>
              <p className="text-amber-900 mt-0.5">
                Approve ₹{finalAmount.toLocaleString('en-IN')} to start component repair right away.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<ThumbsUp className="w-3.5 h-3.5" />}
                onClick={() =>
                  setEstimateConfirm({
                    jobId: job.id,
                    jobCardCode: job.jobCardCode,
                    decision: 'Approved',
                    cost: finalAmount,
                  })
                }
              >
                Approve
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={<ThumbsDown className="w-3.5 h-3.5" />}
                onClick={() =>
                  setEstimateConfirm({
                    jobId: job.id,
                    jobCardCode: job.jobCardCode,
                    decision: 'Rejected',
                    cost: finalAmount,
                  })
                }
              >
                Decline
              </Button>
            </div>
          </div>
        )}

        {job.paymentStatus !== 'Paid' && finalAmount > 0 && job.status !== 'Cancelled Repair' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] text-xs">
              <span className="flex items-center gap-2">
                <StatusBadge label={job.paymentStatus} />
                <span className="font-mono font-bold text-[#1D1D1F]">
                  ₹{finalAmount.toLocaleString('en-IN')}
                </span>
              </span>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<CreditCard className="w-3.5 h-3.5" />}
                onClick={() => setPayingKey(payOpen ? null : `job-${job.id}`)}
              >
                {payOpen ? 'Close Checkout' : 'Pay Now'}
              </Button>
            </div>
            {payOpen && (
              <RepairPaymentPanel
                compact
                enquiryId={job.enquiryId}
                enquiryCode={job.enquiryCode || job.jobCardCode}
                customerName={job.customerName}
                mobile={job.customerMobile}
                email={job.customerEmail || user.email || ''}
                defaultAmount={finalAmount}
                allowCustomAmount={false}
                paymentStatus={job.paymentStatus}
                deviceLabel={job.macbookModel}
                onSuccess={(msg) => onNotify('success', msg)}
                onError={(msg) => onNotify('error', msg)}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] min-h-screen py-8 lg:py-10">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-6">
        {/* Customer Header Bar */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-[#60A5FA]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0066CC]">
                Refix Pro Customer Portal · {userRole === 'user' ? 'Verified Customer' : userRole.replace('_', ' ')}
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1D1D1F]">
                {userProfile?.displayName || user.displayName || user.email}
              </h1>
              <p className="text-xs font-mono text-[#6E6E73]">
                {user.email}
                {userProfile?.phone ? ` · ${userProfile.phone}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isStaff && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-black text-white text-xs font-semibold whitespace-nowrap"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#60A5FA]" />
                Staff ERP Console
              </Link>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={customerLoading || erpLoading}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={handleRefresh}
            >
              Sync Data
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<LogOut className="w-3.5 h-3.5" />}
              onClick={() => customerLogout()}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile Section Switcher */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {PORTAL_NAV.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border ${
                  active
                    ? 'bg-[#0F172A] text-white border-[#0F172A]'
                    : 'bg-white text-[#424245] border-[#E5E5EA]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Desktop Sidebar + Main Portal View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Desktop Navigation Rail */}
          <aside className="hidden lg:block lg:col-span-3 p-3 rounded-2xl bg-white border border-[#E5E5EA] sticky top-24 space-y-1">
            {PORTAL_NAV.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              const badge =
                item.id === 'estimates' && pendingEstimateJobs.length > 0
                  ? pendingEstimateJobs.length
                  : item.id === 'notifications' && unreadNotifs.length > 0
                    ? unreadNotifs.length
                    : undefined;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#0F172A] text-white'
                      : 'text-[#424245] hover:bg-[#F5F5F7] hover:text-[#1D1D1F]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {badge !== undefined && (
                    <span
                      className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                        active ? 'bg-[#0066CC] text-white' : 'bg-[#0066CC]/10 text-[#0066CC]'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Portal Active View */}
          <section className="lg:col-span-9 space-y-6">
            {/* 1. MY DASHBOARD */}
            {section === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KpiCard
                    label="Active Repairs"
                    value={activeJobs.length || customerEnquiries.filter((e) => e.status !== 'Completed' && e.status !== 'Cancelled').length}
                    tone="info"
                    icon={<Wrench className="w-4 h-4" />}
                  />
                  <KpiCard
                    label="Pending Estimates"
                    value={pendingEstimateJobs.length}
                    tone={pendingEstimateJobs.length > 0 ? 'warning' : 'neutral'}
                    icon={<ShieldCheck className="w-4 h-4" />}
                  />
                  <KpiCard
                    label="Registered Devices"
                    value={myDevices.length}
                    icon={<Laptop className="w-4 h-4" />}
                  />
                  <KpiCard
                    label="Outstanding Due"
                    value={`₹${outstandingBalance.toLocaleString('en-IN')}`}
                    tone={outstandingBalance > 0 ? 'danger' : 'success'}
                    icon={<CreditCard className="w-4 h-4" />}
                  />
                </div>

                {pendingEstimateJobs.length > 0 && (
                  <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-amber-950">
                        You have {pendingEstimateJobs.length} repair estimate awaiting your approval
                      </p>
                      <p className="text-xs text-amber-900 mt-0.5">
                        Review technician findings and approve or decline directly online.
                      </p>
                    </div>
                    <Button type="button" variant="dark" size="sm" onClick={() => setSection('estimates')}>
                      Review Estimate →
                    </Button>
                  </div>
                )}

                {activeJobs.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-[#1D1D1F]">Active Repair Progress</h2>
                      <button
                        type="button"
                        onClick={() => setSection('jobs')}
                        className="text-xs font-semibold text-[#0066CC] hover:underline"
                      >
                        View All Jobs →
                      </button>
                    </div>
                    {activeJobs.slice(0, 2).map(renderJobCard)}
                  </div>
                ) : (
                  <EmptyState
                    title="No Active Repairs Right Now"
                    description="Book a MacBook pickup, studio visit, or liquid-damage emergency directly from your Customer Portal."
                    icon={<Wrench className="w-5 h-5" />}
                    action={
                      <Button type="button" variant="primary" size="sm" onClick={() => setSection('book')}>
                        Book a Repair Now
                      </Button>
                    }
                  />
                )}
              </div>
            )}

            {/* 2. BOOK REPAIR */}
            {section === 'book' && (
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E5E5EA] space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5EA] pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#1D1D1F]">Book a MacBook or Apple Device Repair</h2>
                    <p className="text-xs text-[#6E6E73] mt-0.5">
                      Bookings submitted here automatically link to your Customer Portal &amp; WhatsApp alerts.
                    </p>
                  </div>
                  <Link to="/book" className="text-xs font-semibold text-[#0066CC] hover:underline">
                    Open Full Multi-Step Form with Photo Upload →
                  </Link>
                </div>

                <form onSubmit={handlePortalBooking} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SelectField
                      label="Apple Device Model"
                      required
                      value={bookModel}
                      onChange={(e) => setBookModel(e.target.value)}
                    >
                      <option value="">Select model...</option>
                      {models.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.yearRange})
                        </option>
                      ))}
                      <option value="Other MacBook / Apple Device">Other MacBook / Apple Device</option>
                    </SelectField>

                    <SelectField
                      label="Repair Service Required"
                      required
                      value={bookService}
                      onChange={(e) => setBookService(e.target.value)}
                    >
                      <option value="">Select service...</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.title}>
                          {s.title}
                        </option>
                      ))}
                      <option value="General Diagnostic & Troubleshooting">General Diagnostic &amp; Troubleshooting</option>
                    </SelectField>

                    <InputField
                      label="Contact Mobile / WhatsApp"
                      required
                      type="tel"
                      value={bookPhone}
                      onChange={(e) => setBookPhone(e.target.value)}
                      placeholder="+91 98XXXXXXXX"
                      className="font-mono"
                    />

                    <InputField
                      label="Preferred Drop-Off / Pickup Date"
                      type="date"
                      value={bookVisitDate}
                      onChange={(e) => setBookVisitDate(e.target.value)}
                    />
                  </div>

                  <TextareaField
                    label="Describe Symptoms or Issue"
                    rows={3}
                    value={bookProblem}
                    onChange={(e) => setBookProblem(e.target.value)}
                    placeholder="e.g., No power after spill, flickering Retina backlight, battery swelling..."
                  />

                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" size="md" loading={submittingBooking}>
                      Confirm Repair Booking
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* 3. MY DEVICES */}
            {section === 'devices' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#1D1D1F]">My Apple Devices ({myDevices.length})</h2>
                  <Button type="button" variant="primary" size="sm" onClick={() => setSection('book')}>
                    + Add Repair Booking
                  </Button>
                </div>
                {myDevices.length === 0 ? (
                  <EmptyState
                    title="No Devices Linked Yet"
                    description="Your MacBooks and Apple devices automatically register here when you submit a booking or receive a job card."
                    icon={<Laptop className="w-5 h-5" />}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {myDevices.map((d, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-white border border-[#E5E5EA] space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-bold text-[#1D1D1F]">{d.model}</h3>
                            <p className="text-xs font-mono text-[#6E6E73]">
                              Serial: {d.serial} {d.modelNumber ? `· ${d.modelNumber}` : ''}
                            </p>
                          </div>
                          <StatusBadge label={d.lastStatus} />
                        </div>
                        <div className="pt-2 border-t border-[#E5E5EA] flex items-center justify-between text-xs text-[#424245]">
                          <span>Total Service Visits: <strong className="font-mono">{d.repairs}</strong></span>
                          <span className="text-[#0066CC] font-semibold">{d.warranty}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. MY REPAIR JOBS */}
            {section === 'jobs' && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-[#1D1D1F]">
                  My Repair Job Cards ({customerJobs.length})
                </h2>
                {customerJobs.length === 0 ? (
                  <EmptyState
                    title="No Official Job Cards Found"
                    description="Once your MacBook checks in at our Gurugram studio, your live 12-stage job card appears here."
                    icon={<Wrench className="w-5 h-5" />}
                  />
                ) : (
                  <div className="space-y-4">{customerJobs.map(renderJobCard)}</div>
                )}

                {customerEnquiries.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <h3 className="text-base font-bold text-[#1D1D1F]">
                      Submitted Online Bookings ({customerEnquiries.length})
                    </h3>
                    <div className="space-y-3">
                      {customerEnquiries.map((enq) => {
                        const stageIdx = ENQUIRY_STATUS_PROGRESS.indexOf(enq.status);
                        const waUrl = buildWhatsAppUrl(
                          settings.whatsapp,
                          `Hello Refix Pro, checking update on booking ${enq.enquiryCode} (${enq.macbookModel}).`
                        );
                        return (
                          <div key={enq.id} className="p-5 rounded-2xl bg-white border border-[#E5E5EA] space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <span className="font-mono font-bold text-sm text-[#0066CC]">
                                  {enq.enquiryCode}
                                </span>
                                <h4 className="text-base font-bold text-[#1D1D1F]">{enq.macbookModel}</h4>
                                <p className="text-xs text-[#6E6E73]">{enq.serviceName}</p>
                              </div>
                              <StatusBadge label={enq.status} />
                            </div>
                            {enq.status !== 'Cancelled' && (
                              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
                                {ENQUIRY_STATUS_PROGRESS.map((step, idx) => (
                                  <div
                                    key={step}
                                    className={`px-1.5 py-1 rounded text-[10px] font-semibold text-center truncate ${
                                      stageIdx >= idx
                                        ? 'bg-[#0066CC] text-white'
                                        : 'bg-[#F5F5F7] text-[#6E6E73]'
                                    }`}
                                  >
                                    {step}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5E5EA] text-xs">
                              <span className="text-[#6E6E73]">
                                Estimate: <strong className="text-[#1D1D1F]">{enq.repairEstimate || 'Pending'}</strong>
                              </span>
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                WhatsApp Desk
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5. LIVE REPAIR TRACKING */}
            {section === 'tracking' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#1D1D1F]">Live Job ID &amp; Booking Tracker</h2>
                <TrackRepairTool onNotify={onNotify} />
              </div>
            )}

            {/* 6. ESTIMATE APPROVAL */}
            {section === 'estimates' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#1D1D1F]">
                  Estimate Approvals ({pendingEstimateJobs.length} pending)
                </h2>
                {pendingEstimateJobs.length === 0 ? (
                  <EmptyState
                    title="No Pending Estimates"
                    description="When a bench engineer completes inspection and submits a cost breakdown, it appears here for one-click approval or rejection."
                    icon={<ShieldCheck className="w-5 h-5" />}
                  />
                ) : (
                  <div className="space-y-4">{pendingEstimateJobs.map(renderJobCard)}</div>
                )}
              </div>
            )}

            {/* 7. PAYMENTS */}
            {section === 'payments' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-[#1D1D1F]">Payments &amp; Receipts</h2>
                  <Link
                    to="/pay"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0066CC] hover:underline"
                  >
                    Direct Pay Page →
                  </Link>
                </div>

                {customerJobs.filter((j) => j.paymentStatus !== 'Paid' && (j.finalCost || j.estimatedCost) > 0)
                  .length > 0 && (
                  <div className="space-y-3">
                    {customerJobs
                      .filter((j) => j.paymentStatus !== 'Paid' && (j.finalCost || j.estimatedCost) > 0)
                      .map((job) => (
                        <div key={job.id} className="space-y-3">
                          <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-mono font-bold text-sm text-[#0066CC]">{job.jobCardCode}</p>
                              <p className="text-xs font-semibold text-[#1D1D1F]">{job.macbookModel}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-sm">
                                ₹{(job.finalCost || job.estimatedCost).toLocaleString('en-IN')}
                              </span>
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                  setPayingKey(payingKey === `paytab-${job.id}` ? null : `paytab-${job.id}`)
                                }
                              >
                                {payingKey === `paytab-${job.id}` ? 'Close' : 'Pay Online'}
                              </Button>
                            </div>
                          </div>
                          {payingKey === `paytab-${job.id}` && (
                            <RepairPaymentPanel
                              compact
                              enquiryId={job.enquiryId}
                              enquiryCode={job.enquiryCode || job.jobCardCode}
                              customerName={job.customerName}
                              mobile={job.customerMobile}
                              email={job.customerEmail || user.email || ''}
                              defaultAmount={job.finalCost || job.estimatedCost}
                              allowCustomAmount={false}
                              paymentStatus={job.paymentStatus}
                              deviceLabel={job.macbookModel}
                              onSuccess={(msg) => onNotify('success', msg)}
                              onError={(msg) => onNotify('error', msg)}
                            />
                          )}
                        </div>
                      ))}
                  </div>
                )}

                {customerPayments.length === 0 ? (
                  <EmptyState
                    title="No Payment Submissions Yet"
                    description="Verified Razorpay and UPI payments for your repair bookings will be logged here."
                    icon={<CreditCard className="w-5 h-5" />}
                  />
                ) : (
                  <div className="rounded-2xl border border-[#E5E5EA] bg-white divide-y divide-[#E5E5EA]">
                    {customerPayments.map((pay) => (
                      <div key={pay.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-mono font-bold text-[#1D1D1F]">
                            {pay.enquiryCode} · ₹{pay.amount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[#6E6E73]">
                            {pay.method} · Ref: <span className="font-mono">{pay.transactionRef}</span>
                          </p>
                        </div>
                        <StatusBadge label={pay.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 8. INVOICES */}
            {section === 'invoices' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#1D1D1F]">
                  Official Invoices &amp; Warranty Receipts ({customerInvoices.length})
                </h2>
                {customerInvoices.length === 0 ? (
                  <EmptyState
                    title="No Invoices Issued Yet"
                    description="Official GST invoices appear here automatically once billing finalizes your repair."
                    icon={<FileText className="w-5 h-5" />}
                  />
                ) : (
                  <div className="space-y-3">
                    {customerInvoices.map((inv) => (
                      <div key={inv.id} className="p-5 rounded-2xl bg-white border border-[#E5E5EA] space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-mono font-bold text-sm text-[#0066CC]">{inv.invoiceNumber}</p>
                            <p className="text-sm font-semibold text-[#1D1D1F] mt-0.5">{inv.deviceSummary}</p>
                            <p className="text-xs text-[#6E6E73]">Issued: {inv.issuedDate}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="font-mono font-bold text-base tabular-nums text-[#1D1D1F]">
                              ₹{inv.totalAmount.toLocaleString('en-IN')}
                            </p>
                            <StatusBadge label={inv.status} />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5E5EA] text-xs">
                          <span className="text-[#6E6E73] font-mono">
                            Paid: ₹{inv.amountPaid.toLocaleString('en-IN')} · Due: ₹
                            {inv.outstandingAmount.toLocaleString('en-IN')}
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              icon={<Eye className="w-3.5 h-3.5 text-[#0066CC]" />}
                              onClick={() => generatePDF({ type: 'invoice', invoice: inv, settings }, 'preview')}
                            >
                              Preview
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              icon={<Printer className="w-3.5 h-3.5" />}
                              onClick={() => generatePDF({ type: 'invoice', invoice: inv, settings }, 'print')}
                            >
                              Print
                            </Button>
                            <Button
                              type="button"
                              variant="dark"
                              size="sm"
                              icon={<Download className="w-3.5 h-3.5" />}
                              onClick={() => generatePDF({ type: 'invoice', invoice: inv, settings }, 'download')}
                            >
                              Download PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 9. REPAIR HISTORY */}
            {section === 'history' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#1D1D1F]">
                  Completed &amp; Past Repair History ({historyJobs.length})
                </h2>
                {historyJobs.length === 0 ? (
                  <EmptyState
                    title="No Past Completed Repairs Yet"
                    description="Completed and delivered MacBook service records along with warranty expiration details stay archived here."
                    icon={<History className="w-5 h-5" />}
                  />
                ) : (
                  <div className="space-y-4">{historyJobs.map(renderJobCard)}</div>
                )}
              </div>
            )}

            {/* 10. NOTIFICATIONS */}
            {section === 'notifications' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#1D1D1F]">
                  Account Notifications ({notifications.length})
                </h2>
                {notifications.length === 0 ? (
                  <EmptyState
                    title="All Caught Up"
                    description="Estimate requests, stage updates, and invoice alerts appear here in real time."
                    icon={<Bell className="w-5 h-5" />}
                  />
                ) : (
                  <div className="space-y-2.5">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-4 rounded-2xl border flex items-start justify-between gap-3 text-xs ${
                          n.isRead ? 'bg-white border-[#E5E5EA]' : 'bg-blue-50/70 border-blue-200'
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-[#1D1D1F]">{n.title}</p>
                          <p className="text-[#424245]">{n.message}</p>
                          <p className="text-[11px] text-[#6E6E73]">{formatDate(n.createdAt)}</p>
                        </div>
                        {!n.isRead && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<Check className="w-3.5 h-3.5 text-[#0066CC]" />}
                            onClick={() => void markNotificationRead(n.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 11. PROFILE */}
            {section === 'profile' && (
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E5E5EA] space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#1D1D1F]">Personal Profile &amp; Delivery Address</h2>
                  <p className="text-xs text-[#6E6E73] mt-0.5">
                    Keep your contact phone and Gurugram address up to date for faster doorstep pickup &amp; GST billing.
                  </p>
                </div>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField
                      label="Full Name"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                    <InputField
                      label="Account Email (Read-only)"
                      disabled
                      value={user.email || ''}
                      className="bg-[#F5F5F7]"
                    />
                    <InputField
                      label="Primary Mobile Number"
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+91 98XXXXXXXX"
                      className="font-mono"
                    />
                    <InputField
                      label="WhatsApp Number"
                      type="tel"
                      value={profileWhatsapp}
                      onChange={(e) => setProfileWhatsapp(e.target.value)}
                      placeholder="+91 98XXXXXXXX"
                      className="font-mono"
                    />
                  </div>
                  <TextareaField
                    label="Pickup / Delivery Address"
                    rows={2}
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    placeholder="House / Sector / Landmark in Gurugram or NCR..."
                  />
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" size="md" loading={savingProfile}>
                      Save Profile Details
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* 12. SUPPORT */}
            {section === 'support' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-[#1D1D1F]">Message Refix Pro Support Desk</h2>
                      <p className="text-xs text-[#6E6E73]">
                        Send a direct question about your MacBook repair, warranty, or invoice.
                      </p>
                    </div>
                    <a
                      href={buildWhatsAppUrl(settings.whatsapp, `Hello Refix Pro Support (${user.email}):`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Live WhatsApp Support
                    </a>
                  </div>

                  <form onSubmit={handlePortalSupportSubmit} className="space-y-3">
                    <InputField
                      label="Subject"
                      required
                      value={supportSubject}
                      onChange={(e) => setSupportSubject(e.target.value)}
                      placeholder="e.g., Question regarding my MacBook estimate or pickup timing"
                    />
                    <TextareaField
                      label="Message"
                      required
                      rows={3}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Write your question for our Sector-14 team..."
                    />
                    <div className="flex justify-end">
                      <Button type="submit" variant="primary" size="sm" loading={submittingSupport}>
                        Send Message
                      </Button>
                    </div>
                  </form>
                </div>

                <div className="space-y-3">
                  <h3 className="text-base font-bold text-[#1D1D1F]">
                    Previous Support Messages &amp; Replies ({customerMessages.length})
                  </h3>
                  {customerMessages.length === 0 ? (
                    <EmptyState
                      title="No Support Messages Sent Yet"
                      description="Your submitted support messages and replies from our desk appear here."
                      icon={<ClipboardList className="w-5 h-5" />}
                    />
                  ) : (
                    <div className="space-y-3">
                      {customerMessages.map((msg) => (
                        <div key={msg.id} className="p-5 rounded-2xl bg-white border border-[#E5E5EA] space-y-3">
                          <div className="flex items-start justify-between gap-2 border-b border-[#F5F5F7] pb-2">
                            <div>
                              <p className="text-sm font-bold text-[#1D1D1F]">{msg.subject}</p>
                              <p className="text-[11px] text-[#6E6E73]">{formatDate(msg.createdAt)}</p>
                            </div>
                            <StatusBadge
                              label={msg.adminReply ? 'Admin Replied' : msg.isRead ? 'Seen by Desk' : 'Pending'}
                            />
                          </div>
                          <p className="text-xs sm:text-sm text-[#424245]">{msg.message}</p>
                          {msg.adminReply && (
                            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1 text-xs">
                              <p className="font-bold text-emerald-900">Reply from Refix Pro Desk</p>
                              <p className="text-emerald-950">{msg.adminReply}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(estimateConfirm)}
        destructive={estimateConfirm?.decision === 'Rejected'}
        busy={respondingEstimate}
        title={
          estimateConfirm?.decision === 'Approved'
            ? `Approve Estimate for ${estimateConfirm.jobCardCode}?`
            : `Decline Estimate for ${estimateConfirm?.jobCardCode}?`
        }
        description={
          estimateConfirm?.decision === 'Approved'
            ? `Confirm repair approval for ₹${estimateConfirm.cost.toLocaleString('en-IN')}? Our technicians will begin work immediately.`
            : 'Confirm declining this repair estimate? No component work will proceed and our desk will coordinate device pickup.'
        }
        confirmLabel={
          estimateConfirm?.decision === 'Approved' ? 'Yes, Approve Estimate' : 'Yes, Decline Estimate'
        }
        onCancel={() => setEstimateConfirm(null)}
        onConfirm={handleConfirmEstimateDecision}
      />
    </div>
  );
}
