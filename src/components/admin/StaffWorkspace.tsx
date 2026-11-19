import { useMemo, useState } from 'react';
import {
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  PackageCheck,
  Plus,
  Printer,
  Users,
  Wrench,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useErp } from '../../context/ErpContext';
import { JobDetailsModal } from './JobDetailsModal';
import { buildJobCardEmailDraft } from '../../utils/emailHelper';
import { printJobCardDocument } from '../../utils/pdfExport';
import { Button, KpiCard, StatusBadge } from '../ui/DesignSystem';
import type { AdminModuleKey, RepairJobCard } from '../../types';

const NEW_INTAKE_JOB: Omit<RepairJobCard, 'createdAt' | 'updatedAt'> = {
  id: '',
  jobCardCode: '',
  enquiryId: '',
  enquiryCode: '',
  customerId: '',
  customerUid: '',
  customerName: '',
  customerMobile: '',
  customerEmail: '',
  deviceType: 'MacBook',
  macbookModel: '',
  modelNumber: '',
  serialNumber: '',
  deviceCondition: 'Normal exterior wear; no missing screws',
  accessoriesReceived: 'Device only',
  reportedProblem: '',
  inspectionDetails: '',
  diagnosis: '',
  estimatedCost: 0,
  finalCost: 0,
  technicianUid: '',
  technicianName: '',
  partsUsed: [],
  approvalStatus: 'Not Sent',
  status: 'Received',
  deliveryDate: '',
  warrantyPeriod: '90 Days Service Warranty',
  beforeImages: [],
  afterImages: [],
  internalNotes: '',
  customerUpdates: '',
  paymentStatus: 'Unpaid',
};

export function StaffWorkspace({
  onNavigate,
  onNotify,
}: {
  onNavigate: (tab: AdminModuleKey) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const { user, userProfile, enquiries, paymentSubmissions, settings } = useApp();
  const { repairJobs, appointments, createJobFromEnquiry } = useErp();

  const [intakeOpen, setIntakeOpen] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const todayIso = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const newEnquiries = enquiries.filter((e) => e.status === 'New' || e.status === 'Contacted').length;
    const todaysAppts = appointments.filter(
      (a) => a.scheduledDate === todayIso && a.status !== 'Cancelled'
    ).length;
    const readyPickup = repairJobs.filter((j) => j.status === 'Ready for Delivery').length;
    const pendingVerify = paymentSubmissions.filter(
      (p) => p.status === 'Pending Verification'
    ).length;
    return { newEnquiries, todaysAppts, readyPickup, pendingVerify };
  }, [enquiries, appointments, repairJobs, paymentSubmissions, todayIso]);

  const intakeEnquiries = useMemo(
    () => enquiries.filter((e) => e.status === 'New' || e.status === 'Contacted').slice(0, 6),
    [enquiries]
  );

  const readyJobs = useMemo(
    () => repairJobs.filter((j) => j.status === 'Ready for Delivery').slice(0, 6),
    [repairJobs]
  );

  const handleConvertEnquiry = async (enquiryId: string) => {
    const enq = enquiries.find((e) => e.id === enquiryId);
    if (!enq) return;
    setConvertingId(enquiryId);
    try {
      const created = await createJobFromEnquiry(enq);
      onNotify('success', `Converted ${enq.enquiryCode} to Job Card ${created.jobCardCode}.`);
      onNavigate('jobs');
    } catch (err) {
      onNotify('error', err instanceof Error ? err.message : 'Failed to convert enquiry.');
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Front-Desk Reception Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#0066CC]">Front-Desk Reception &amp; Operations</p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F]">
            {userProfile?.displayName || user?.displayName || 'Front-Desk Staff'}
          </h2>
          <p className="text-xs text-[#6E6E73]">
            Manage walk-in device intake, convert enquiries to Job Cards, coordinate pickup deliveries, and verify desk payments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIntakeOpen(true)}
          >
            Walk-In Job Intake
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Calendar className="w-4 h-4 text-[#0066CC]" />}
            onClick={() => onNavigate('appointments')}
          >
            Appointments
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Users className="w-4 h-4 text-[#0066CC]" />}
            onClick={() => onNavigate('customers')}
          >
            Customers CRM
          </Button>
        </div>
      </div>

      {/* Front-Desk KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="New Bookings To Intake"
          value={stats.newEnquiries}
          tone="info"
          icon={<ClipboardList className="w-4 h-4" />}
        />
        <KpiCard
          label="Today's Appointments"
          value={stats.todaysAppts}
          tone="info"
          icon={<Calendar className="w-4 h-4" />}
        />
        <KpiCard
          label="Ready For Customer Pickup"
          value={stats.readyPickup}
          tone="success"
          icon={<PackageCheck className="w-4 h-4" />}
        />
        <KpiCard
          label="Pending Payment Checks"
          value={stats.pendingVerify}
          tone={stats.pendingVerify > 0 ? 'warning' : 'neutral'}
          icon={<CreditCard className="w-4 h-4" />}
        />
      </div>

      {/* Two-Column Action Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Intake Conversion Queue */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#0066CC]" />
              Enquiries Ready For Job Card Intake
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('enquiries')}
              className="text-xs font-semibold text-[#0066CC] hover:underline"
            >
              All Enquiries →
            </button>
          </div>

          {intakeEnquiries.length === 0 ? (
            <p className="text-xs text-[#6E6E73] py-6 text-center">
              All recent repair enquiries have been converted or processed.
            </p>
          ) : (
            <div className="divide-y divide-[#E5E5EA]">
              {intakeEnquiries.map((e) => (
                <div key={e.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1D1D1F] truncate">
                      <span className="font-mono text-[#0066CC] mr-1.5">{e.enquiryCode}</span>
                      {e.customerName}
                    </p>
                    <p className="text-xs text-[#6E6E73] truncate">
                      {e.macbookModel} · {e.serviceName} · {e.mobile}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={convertingId === e.id}
                    onClick={() => void handleConvertEnquiry(e.id)}
                  >
                    Create Job Card
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ready For Pickup / Delivery Desk */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              Ready For Pickup &amp; Billing Desk
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('jobs')}
              className="text-xs font-semibold text-[#0066CC] hover:underline"
            >
              All Job Cards →
            </button>
          </div>

          {readyJobs.length === 0 ? (
            <p className="text-xs text-[#6E6E73] py-6 text-center">
              No devices waiting at pickup counter right now.
            </p>
          ) : (
            <div className="divide-y divide-[#E5E5EA]">
              {readyJobs.map((job) => (
                <div key={job.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#0066CC]">{job.jobCardCode}</span>
                      <StatusBadge label={job.paymentStatus} />
                    </div>
                    <p className="text-xs font-semibold text-[#1D1D1F] truncate mt-0.5">
                      {job.customerName} · {job.macbookModel}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={<Printer className="w-3.5 h-3.5" />}
                      onClick={() =>
                        printJobCardDocument(job, settings, buildJobCardEmailDraft(job, settings))
                      }
                    >
                      Print
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      icon={<FileText className="w-3.5 h-3.5" />}
                      onClick={() => onNavigate('invoices')}
                    >
                      Billing
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Module Launchers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { tab: 'jobs' as const, label: 'All Job Cards', icon: Wrench },
          { tab: 'payments' as const, label: 'Verify Payments', icon: CreditCard },
          { tab: 'invoices' as const, label: 'Issue Invoice', icon: FileText },
          { tab: 'messages' as const, label: 'Support Inbox', icon: ClipboardList },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.tab}
              type="button"
              onClick={() => onNavigate(item.tab)}
              className="p-4 rounded-xl bg-white border border-[#E5E5EA] hover:border-[#0066CC] text-left flex items-center gap-3 transition-colors"
            >
              <Icon className="w-4 h-4 text-[#0066CC] shrink-0" />
              <span className="text-xs font-bold text-[#1D1D1F]">{item.label}</span>
            </button>
          );
        })}
      </div>

      {intakeOpen && (
        <JobDetailsModal
          job={{ ...NEW_INTAKE_JOB }}
          isNew
          initialTab="customer"
          onClose={() => setIntakeOpen(false)}
          onSaved={() => setIntakeOpen(false)}
          onNotify={onNotify}
          onNavigateTab={(t) => onNavigate(t)}
        />
      )}
    </div>
  );
}
