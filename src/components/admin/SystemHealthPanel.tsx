import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  Database,
  Mail,
  Package,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useErp } from '../../context/ErpContext';
import { Button, StatusBadge } from '../ui/DesignSystem';
import type { AdminModuleKey } from '../../types';

interface PendingTaskAlert {
  id: string;
  label: string;
  count: number;
  detail: string;
  severity: 'critical' | 'warning' | 'ok';
  module: AdminModuleKey;
  icon: React.ComponentType<{ className?: string }>;
}

export function SystemHealthPanel({
  onNavigate,
}: {
  onNavigate: (tab: AdminModuleKey) => void;
}) {
  const {
    settings,
    enquiries,
    paymentSubmissions,
    contactMessages,
    hasFirestoreSeed,
    hasPermission,
    refreshAdminData,
    isAdmin,
  } = useApp();
  const {
    repairJobs,
    appointments,
    inventory,
    invoices,
    refreshErpData,
    erpLoading,
  } = useErp();

  const [scanning, setScanning] = useState(false);
  const [lastScannedAt, setLastScannedAt] = useState<string>(() =>
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const todayIso = new Date().toISOString().slice(0, 10);

  const handleRunHealthCheck = async () => {
    setScanning(true);
    try {
      await Promise.all([refreshErpData(), refreshAdminData()]);
      setLastScannedAt(
        new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } finally {
      setScanning(false);
    }
  };

  const { pendingTasks, lowStockParts, outOfStockCount, healthScore, healthStatus } = useMemo(() => {
    const newEnquiriesCount = enquiries.filter((e) => e.status === 'New').length;
    const activeJobs = repairJobs.filter(
      (j) => !['Delivered', 'Completed', 'Cancelled Repair', 'Rejected Estimate'].includes(j.status)
    );
    const unassignedJobsCount = activeJobs.filter((j) => !j.technicianName?.trim()).length;
    const overdueJobsCount = activeJobs.filter(
      (j) => Boolean(j.deliveryDate) && j.deliveryDate! < todayIso
    ).length;
    const awaitingApprovalCount = repairJobs.filter(
      (j) => j.approvalStatus === 'Pending' || j.status === 'Awaiting Approval' || j.status === 'Estimate Sent'
    ).length;
    const pendingPaymentsCount = paymentSubmissions.filter(
      (p) => p.status === 'Pending Verification'
    ).length;
    const unpaidInvoicesCount = invoices.filter(
      (i) => (i.status === 'Unpaid' || i.status === 'Partial') && (i.outstandingAmount || 0) > 0
    ).length;
    const unreadMessagesCount = contactMessages.filter((m) => !m.isRead).length;
    const todayApptsPending = appointments.filter(
      (a) => a.scheduledDate === todayIso && a.status === 'Scheduled'
    ).length;

    const allTasks: PendingTaskAlert[] = [
      {
        id: 'overdue-jobs',
        label: 'Overdue Delivery Targets',
        count: overdueJobsCount,
        detail: overdueJobsCount > 0 ? 'Job cards past scheduled delivery date' : 'All delivery targets on track',
        severity: overdueJobsCount > 0 ? 'critical' : 'ok',
        module: 'jobs',
        icon: Clock,
      },
      {
        id: 'unassigned-jobs',
        label: 'Unassigned Bench Jobs',
        count: unassignedJobsCount,
        detail: unassignedJobsCount > 0 ? 'Active jobs waiting technician assignment' : 'All active jobs assigned',
        severity: unassignedJobsCount > 2 ? 'critical' : unassignedJobsCount > 0 ? 'warning' : 'ok',
        module: 'jobs',
        icon: Wrench,
      },
      {
        id: 'new-enquiries',
        label: 'Unactioned Enquiries',
        count: newEnquiriesCount,
        detail: newEnquiriesCount > 0 ? 'New customer bookings awaiting callback' : 'No unactioned enquiries',
        severity: newEnquiriesCount > 3 ? 'warning' : newEnquiriesCount > 0 ? 'warning' : 'ok',
        module: 'enquiries',
        icon: ClipboardList,
      },
      {
        id: 'pending-approvals',
        label: 'Pending Estimate Approvals',
        count: awaitingApprovalCount,
        detail: awaitingApprovalCount > 0 ? 'Customers reviewing repair quotes' : 'No pending quote approvals',
        severity: awaitingApprovalCount > 0 ? 'warning' : 'ok',
        module: 'jobs',
        icon: ShieldCheck,
      },
      {
        id: 'pending-payments',
        label: 'UPI / Payment Verifications',
        count: pendingPaymentsCount,
        detail: pendingPaymentsCount > 0 ? 'Submitted UTR refs awaiting verification' : 'All submitted payments verified',
        severity: pendingPaymentsCount > 0 ? 'critical' : 'ok',
        module: 'payments',
        icon: CreditCard,
      },
      {
        id: 'unpaid-invoices',
        label: 'Outstanding Invoices',
        count: unpaidInvoicesCount,
        detail: unpaidInvoicesCount > 0 ? 'Invoices with unpaid balance due' : 'Zero overdue invoice balances',
        severity: unpaidInvoicesCount > 0 ? 'warning' : 'ok',
        module: 'invoices',
        icon: CreditCard,
      },
      {
        id: 'unread-messages',
        label: 'Unread Customer Messages',
        count: unreadMessagesCount,
        detail: unreadMessagesCount > 0 ? 'Contact desk messages needing reply' : 'Inbox cleared',
        severity: unreadMessagesCount > 0 ? 'warning' : 'ok',
        module: 'messages',
        icon: Mail,
      },
      {
        id: 'today-appts',
        label: "Today's Unconfirmed Slots",
        count: todayApptsPending,
        detail: todayApptsPending > 0 ? 'Appointments scheduled for today need confirmation' : 'Today schedule confirmed',
        severity: todayApptsPending > 0 ? 'warning' : 'ok',
        module: 'appointments',
        icon: Calendar,
      },
    ];
    const tasks = allTasks.filter((task) => hasPermission(task.module, 'view'));

    const lowParts = inventory
      .filter((item) => item.quantity <= item.minStock)
      .sort((a, b) => a.quantity - b.quantity);
    const outCount = lowParts.filter((item) => item.quantity <= 0).length;

    let penalty = 0;
    penalty += overdueJobsCount * 10;
    penalty += pendingPaymentsCount * 8;
    penalty += outCount * 9;
    penalty += Math.max(0, lowParts.length - outCount) * 4;
    penalty += unassignedJobsCount * 4;
    penalty += Math.min(12, newEnquiriesCount * 2);
    penalty += Math.min(8, unreadMessagesCount * 2);

    const score = Math.max(20, Math.min(100, 100 - penalty));
    const status =
      score >= 85 && outCount === 0 && overdueJobsCount === 0
        ? 'Healthy'
        : score >= 60
          ? 'Attention Needed'
          : 'Action Required';

    return {
      pendingTasks: tasks,
      lowStockParts: lowParts,
      outOfStockCount: outCount,
      healthScore: score,
      healthStatus: status,
    };
  }, [
    enquiries,
    repairJobs,
    paymentSubmissions,
    invoices,
    contactMessages,
    appointments,
    inventory,
    todayIso,
    hasPermission,
  ]);

  const totalPendingAlerts =
    pendingTasks.reduce((sum, t) => sum + (t.severity !== 'ok' ? t.count : 0), 0) +
    lowStockParts.length;

  const estimatedRestockValue = useMemo(
    () =>
      lowStockParts.reduce((sum, part) => {
        const deficit = Math.max(1, part.minStock * 2 - part.quantity);
        return sum + deficit * (Number(part.purchasePrice) || 0);
      }, 0),
    [lowStockParts]
  );

  return (
    <section
      aria-label="Automated System Health Monitor"
      className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden shadow-[0_10px_30px_-20px_rgba(15,23,42,0.12)]"
    >
      {/* Top Health Banner */}
      <div className="px-5 sm:px-6 py-4 bg-[#0F172A] text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              healthStatus === 'Healthy'
                ? 'bg-emerald-500/20 text-emerald-300'
                : healthStatus === 'Attention Needed'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-red-500/20 text-red-300'
            }`}
          >
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Automated System Health &amp; Operations Monitor
              </h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                  healthStatus === 'Healthy'
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                    : healthStatus === 'Attention Needed'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
                      : 'bg-red-500/20 text-red-200 border border-red-400/30'
                }`}
              >
                {healthStatus} · {healthScore}%
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Live scan at <span className="font-mono text-white">{lastScannedAt}</span> ·{' '}
              {totalPendingAlerts === 0
                ? 'All queues clear & inventory thresholds healthy'
                : `${totalPendingAlerts} pending item(s) & stock alert(s) detected`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-[11px] text-slate-200">
            <Database className="w-3.5 h-3.5 text-blue-300" />
            <span>Firestore: {erpLoading ? 'Syncing...' : 'Live'}</span>
            <span>·</span>
            <span>Catalog: {hasFirestoreSeed ? 'Synced' : 'Default'}</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={scanning}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => void handleRunHealthCheck()}
          >
            Re-Scan Now
          </Button>
        </div>
      </div>

      {/* Main Split: Pending Task Queues + Inventory Low-Stock Alerts */}
      <div className="p-5 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Pending Operational Tasks */}
        <div className="xl:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#1D1D1F] flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#0066CC]" />
              Pending Tasks &amp; Bottleneck Queues
            </h3>
            <span className="text-[11px] font-medium text-[#6E6E73]">
              Click any card to resolve
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingTasks.map((task) => {
              const Icon = task.icon;
              const pillTone =
                task.severity === 'critical'
                  ? 'border-red-200 bg-red-50/70 hover:border-red-300'
                  : task.severity === 'warning'
                    ? 'border-amber-200 bg-amber-50/60 hover:border-amber-300'
                    : 'border-[#E5E5EA] bg-[#F5F5F7]/50 hover:border-[#0066CC]';

              const countColor =
                task.severity === 'critical'
                  ? 'text-red-700'
                  : task.severity === 'warning'
                    ? 'text-amber-800'
                    : 'text-emerald-700';

              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onNavigate(task.module)}
                  className={`text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 group ${pillTone}`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-[#0066CC] shrink-0" />
                      <p className="text-xs font-bold text-[#1D1D1F] truncate">{task.label}</p>
                    </div>
                    <p className="text-[11px] text-[#6E6E73] leading-snug">{task.detail}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-lg font-bold font-mono tabular-nums ${countColor}`}>
                      {task.count}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#0066CC] ml-auto mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Automated Inventory Low-Stock Alerts */}
        <div className="xl:col-span-5 flex flex-col rounded-xl border border-[#E5E5EA] bg-[#F5F5F7]/50 overflow-hidden">
          <div className="px-4 py-3.5 bg-white border-b border-[#E5E5EA] flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#1D1D1F] flex items-center gap-1.5">
                <AlertTriangle
                  className={`w-4 h-4 ${
                    lowStockParts.length > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                />
                Inventory Low-Stock Alerts ({lowStockParts.length})
              </h3>
              <p className="text-[11px] text-[#6E6E73]">
                {outOfStockCount > 0
                  ? `${outOfStockCount} out of stock · Est. reorder: ₹${estimatedRestockValue.toLocaleString('en-IN')}`
                  : lowStockParts.length > 0
                    ? `Parts at/below min threshold · Est. reorder: ₹${estimatedRestockValue.toLocaleString('en-IN')}`
                    : 'All spare parts above minimum threshold'}
              </p>
            </div>
            {hasPermission('inventory', 'view') && (
              <button
                type="button"
                onClick={() => onNavigate('inventory')}
                className="text-xs font-semibold text-[#0066CC] hover:underline whitespace-nowrap"
              >
                Open Stock →
              </button>
            )}
          </div>

          <div className="flex-1 p-3 space-y-2 max-h-[300px] overflow-y-auto">
            {lowStockParts.length === 0 ? (
              <div className="p-6 text-center space-y-1.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-[#1D1D1F]">Spare Parts Stock Healthy</p>
                <p className="text-[11px] text-[#6E6E73]">
                  Every tracked Apple spare part SKU meets its safety stock level.
                </p>
              </div>
            ) : (
              lowStockParts.map((part) => {
                const isZero = part.quantity <= 0;
                return (
                  <div
                    key={part.id}
                    className="p-3 rounded-xl bg-white border border-[#E5E5EA] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#0066CC]">{part.sku}</span>
                        <StatusBadge
                          label={isZero ? 'Out of Stock' : 'Low Stock'}
                          tone={isZero ? 'danger' : 'warning'}
                        />
                      </div>
                      <p className="font-semibold text-[#1D1D1F] truncate mt-0.5">{part.name}</p>
                      <p className="text-[11px] text-[#6E6E73] truncate">
                        {part.compatibleModels || 'Universal'} · Shelf: {part.location}
                      </p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="font-mono font-bold tabular-nums">
                        <span className={isZero ? 'text-red-600' : 'text-amber-700'}>
                          {part.quantity}
                        </span>
                        <span className="text-[#6E6E73] font-normal"> / min {part.minStock}</span>
                      </p>
                      {hasPermission('inventory', 'edit') && (
                        <button
                          type="button"
                          onClick={() => onNavigate('inventory')}
                          className="text-[11px] font-semibold text-[#0066CC] hover:underline"
                        >
                          Restock
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {isAdmin && (
            <div className="px-4 py-2.5 bg-white border-t border-[#E5E5EA] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6E6E73]">
              <span className="inline-flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-[#0066CC]" />
                {inventory.length} SKUs monitored
              </span>
              <span>
                UPI: {settings.manualUpiId ? 'Configured' : 'Missing'} · Razorpay:{' '}
                {settings.razorpayEnabled ? 'On' : 'Off'}
                {settings.erpConfig?.lastBackupAt
                  ? ` · Backup: ${settings.erpConfig.lastBackupAt.slice(0, 10)}`
                  : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
