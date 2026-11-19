import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  FileText,
  IndianRupee,
  Package,
  Plus,
  ShieldCheck,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useErp } from '../../context/ErpContext';
import { StatusBadge } from '../ui/DesignSystem';
import type { AdminModuleKey } from '../../types';

function toMillis(val: unknown): number {
  if (!val) return 0;
  if (
    typeof val === 'object' &&
    val !== null &&
    'toMillis' in val &&
    typeof (val as { toMillis: () => number }).toMillis === 'function'
  ) {
    return (val as { toMillis: () => number }).toMillis();
  }
  if (typeof val === 'string') {
    const p = Date.parse(val);
    return Number.isNaN(p) ? 0 : p;
  }
  return 0;
}

export function AdminOverviewDashboard({
  onNavigate,
}: {
  onNavigate: (tab: AdminModuleKey) => void;
}) {
  const {
    enquiries,
    paymentSubmissions,
    hasPermission,
    isSuperAdmin,
    currentPermissions,
  } = useApp();
  const {
    repairJobs,
    customers,
    technicians,
    appointments,
    inventory,
    invoices,
    expenses,
    activityLogs,
    erpLoading,
  } = useErp();

  const [rangePreset, setRangePreset] = useState<'all' | '30d' | 'month' | 'today' | 'custom'>('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const { fromMs, toMs } = useMemo(() => {
    const now = new Date();
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    ).getTime();
    if (rangePreset === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
      return { fromMs: start, toMs: endOfToday };
    }
    if (rangePreset === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
      return { fromMs: start, toMs: endOfToday };
    }
    if (rangePreset === '30d') {
      return { fromMs: Date.now() - 30 * 24 * 60 * 60 * 1000, toMs: endOfToday };
    }
    if (rangePreset === 'custom') {
      const f = customFrom ? Date.parse(customFrom) : 0;
      const t = customTo ? Date.parse(customTo) + 86399999 : Number.MAX_SAFE_INTEGER;
      return { fromMs: Number.isNaN(f) ? 0 : f, toMs: Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t };
    }
    return { fromMs: 0, toMs: Number.MAX_SAFE_INTEGER };
  }, [rangePreset, customFrom, customTo]);

  const inRange = (val: unknown) => {
    if (rangePreset === 'all') return true;
    const ms = toMillis(val);
    if (!ms) return true;
    return ms >= fromMs && ms <= toMs;
  };

  const todayIso = new Date().toISOString().slice(0, 10);
  const currentMonthPrefix = todayIso.slice(0, 7);

  const metrics = useMemo(() => {
    const scopedEnquiries = enquiries.filter((e) => inRange(e.createdAt));
    const scopedJobs = repairJobs.filter((j) => inRange(j.createdAt || j.updatedAt));
    const scopedPayments = paymentSubmissions.filter((p) => inRange(p.createdAt));
    const scopedInvoices = invoices.filter((i) => inRange(i.createdAt || i.issuedDate));

    const newEnquiries = scopedEnquiries.filter((e) => e.status === 'New').length;
    const pendingInspections =
      scopedJobs.filter((j) => ['New Booking', 'Received', 'Inspection', 'Diagnosis'].includes(j.status)).length +
      scopedEnquiries.filter((e) => ['Contacted', 'Inspection'].includes(e.status)).length;
    const awaitingApproval =
      scopedJobs.filter(
        (j) => ['Estimate Sent', 'Awaiting Approval'].includes(j.status) || j.approvalStatus === 'Pending'
      ).length + scopedEnquiries.filter((e) => e.status === 'Estimate Sent').length;
    const repairsInProgress =
      scopedJobs.filter((j) => ['Approved', 'In Repair', 'Quality Check'].includes(j.status)).length +
      scopedEnquiries.filter((e) => ['Approved', 'In Repair'].includes(e.status)).length;
    const readyForDelivery =
      scopedJobs.filter((j) => j.status === 'Ready for Delivery').length +
      scopedEnquiries.filter((e) => e.status === 'Ready for Delivery').length;
    const completedRepairs =
      scopedJobs.filter((j) => ['Delivered', 'Completed'].includes(j.status)).length +
      scopedEnquiries.filter((e) => e.status === 'Completed').length;
    const cancelledRepairs =
      scopedJobs.filter((j) => ['Cancelled Repair', 'Rejected Estimate'].includes(j.status)).length +
      scopedEnquiries.filter((e) => e.status === 'Cancelled').length;

    const todaysAppointments = appointments.filter(
      (a) => a.scheduledDate === todayIso && a.status !== 'Cancelled'
    ).length;
    const pendingPaymentsCount = scopedPayments.filter((p) => p.status === 'Pending Verification').length;

    const verifiedPayRevenue = scopedPayments
      .filter((p) => p.status === 'Verified Paid')
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const invoicePaidTotal = scopedInvoices.reduce((acc, i) => acc + (Number(i.amountPaid) || 0), 0);
    const totalCollectedRevenue = Math.max(verifiedPayRevenue, invoicePaidTotal);

    const monthlyRevenue = paymentSubmissions
      .filter((p) => {
        if (p.status !== 'Verified Paid') return false;
        const ms = toMillis(p.createdAt);
        if (!ms) return false;
        return new Date(ms).toISOString().slice(0, 7) === currentMonthPrefix;
      })
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    const outstandingPayments = invoices
      .filter((i) => i.status === 'Unpaid' || i.status === 'Partial')
      .reduce((acc, i) => acc + (Number(i.outstandingAmount) || 0), 0);

    const lowStockParts = inventory.filter((item) => item.quantity <= item.minStock).length;

    return {
      totalCustomers: customers.length,
      totalEnquiries: scopedEnquiries.length,
      newEnquiries,
      pendingInspections,
      awaitingApproval,
      repairsInProgress,
      readyForDelivery,
      completedRepairs,
      cancelledRepairs,
      todaysAppointments,
      pendingPaymentsCount,
      totalCollectedRevenue,
      monthlyRevenue,
      outstandingPayments,
      lowStockParts,
    };
  }, [
    enquiries,
    repairJobs,
    paymentSubmissions,
    invoices,
    appointments,
    inventory,
    customers.length,
    todayIso,
    currentMonthPrefix,
    rangePreset,
    fromMs,
    toMs,
  ]);

  const monthlySeries = useMemo(() => {
    const months: { key: string; label: string; revenue: number; expense: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short' });
      months.push({ key, label, revenue: 0, expense: 0 });
    }
    paymentSubmissions.forEach((p) => {
      if (p.status !== 'Verified Paid') return;
      const ms = toMillis(p.createdAt);
      if (!ms) return;
      const key = new Date(ms).toISOString().slice(0, 7);
      const slot = months.find((m) => m.key === key);
      if (slot) slot.revenue += Number(p.amount) || 0;
    });
    expenses.forEach((exp) => {
      const key = (exp.expenseDate || '').slice(0, 7);
      const slot = months.find((m) => m.key === key);
      if (slot) slot.expense += Number(exp.amount) || 0;
    });
    return months;
  }, [paymentSubmissions, expenses]);

  const maxChartValue = Math.max(1000, ...monthlySeries.map((m) => Math.max(m.revenue, m.expense)));

  const kpiCards: {
    label: string;
    value: string | number;
    module: AdminModuleKey;
    accent?: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { label: 'Total Customers', value: metrics.totalCustomers, module: 'customers', icon: Users },
    { label: 'Total Repair Enquiries', value: metrics.totalEnquiries, module: 'enquiries', icon: ClipboardList },
    { label: 'New Enquiries', value: metrics.newEnquiries, module: 'enquiries', accent: 'text-[#0066CC]', icon: ArrowUpRight },
    { label: 'Pending Inspections', value: metrics.pendingInspections, module: 'jobs', accent: 'text-amber-700', icon: Clock },
    { label: 'Awaiting Approval', value: metrics.awaitingApproval, module: 'jobs', accent: 'text-amber-700', icon: FileText },
    { label: 'Repairs In Progress', value: metrics.repairsInProgress, module: 'jobs', accent: 'text-[#0066CC]', icon: Wrench },
    { label: 'Ready For Delivery', value: metrics.readyForDelivery, module: 'jobs', accent: 'text-emerald-700', icon: CheckCircle2 },
    { label: 'Completed Repairs', value: metrics.completedRepairs, module: 'jobs', accent: 'text-emerald-700', icon: CheckCircle2 },
    { label: 'Cancelled Repairs', value: metrics.cancelledRepairs, module: 'jobs', accent: 'text-red-600', icon: XCircle },
    { label: "Today's Appointments", value: metrics.todaysAppointments, module: 'appointments', accent: 'text-[#0066CC]', icon: Calendar },
    { label: 'Pending Payments', value: metrics.pendingPaymentsCount, module: 'payments', accent: 'text-amber-700', icon: CreditCard },
    {
      label: 'Total Collected Revenue',
      value: `₹${metrics.totalCollectedRevenue.toLocaleString('en-IN')}`,
      module: 'invoices',
      accent: 'text-emerald-700',
      icon: IndianRupee,
    },
    {
      label: 'Monthly Revenue',
      value: `₹${metrics.monthlyRevenue.toLocaleString('en-IN')}`,
      module: 'reports',
      accent: 'text-[#0066CC]',
      icon: IndianRupee,
    },
    {
      label: 'Outstanding Payments',
      value: `₹${metrics.outstandingPayments.toLocaleString('en-IN')}`,
      module: 'invoices',
      accent: metrics.outstandingPayments > 0 ? 'text-red-600' : 'text-[#1D1D1F]',
      icon: CreditCard,
    },
    {
      label: 'Low-Stock Spare Parts',
      value: metrics.lowStockParts,
      module: 'inventory',
      accent: metrics.lowStockParts > 0 ? 'text-red-600' : 'text-emerald-700',
      icon: AlertTriangle,
    },
  ];

  const visibleKpis = isSuperAdmin
    ? kpiCards
    : kpiCards.filter((k) => hasPermission(k.module, 'view'));

  const statusDistribution = useMemo(() => {
    const counts = [
      { label: 'Intake & Inspection', count: metrics.pendingInspections, color: '#64748B' },
      { label: 'Awaiting Approval', count: metrics.awaitingApproval, color: '#D97706' },
      { label: 'In Repair & QC', count: metrics.repairsInProgress, color: '#0066CC' },
      { label: 'Ready / Completed', count: metrics.readyForDelivery + metrics.completedRepairs, color: '#16A34A' },
      { label: 'Cancelled / Declined', count: metrics.cancelledRepairs, color: '#DC2626' },
    ];
    const total = Math.max(1, counts.reduce((s, c) => s + c.count, 0));
    return counts.map((c) => ({ ...c, pct: Math.round((c.count / total) * 100) }));
  }, [metrics]);

  const techPerformance = useMemo(() => {
    return technicians.map((t) => {
      const assigned = repairJobs.filter((j) => j.technicianUid === t.uid || j.technicianName === t.name);
      const completed = assigned.filter((j) => ['Delivered', 'Completed', 'Ready for Delivery'].includes(j.status));
      const active = assigned.filter(
        (j) => !['Delivered', 'Completed', 'Cancelled Repair', 'Rejected Estimate'].includes(j.status)
      );
      return {
        id: t.id,
        name: t.name,
        availability: t.availability,
        activeCount: active.length,
        completedCount: completed.length,
        total: assigned.length,
      };
    });
  }, [technicians, repairJobs]);

  const upcomingAppointments = useMemo(
    () => appointments.filter((a) => a.status !== 'Cancelled' && a.status !== 'Completed').slice(0, 5),
    [appointments]
  );

  return (
    <div className="space-y-8">
      {/* Scoped Admin Boundary Notice (Different from Super Admin) */}
      {!isSuperAdmin && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0F172A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#60A5FA] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white">
                Scoped Operations Administrator Console
              </p>
              <p className="text-xs text-slate-300">
                Active permissions: {currentPermissions?.actions.join(', ') || 'view'} · Modules granted:{' '}
                {currentPermissions?.modules.length || 0}. System configuration &amp; Super Admin roles remain protected.
              </p>
            </div>
          </div>
          <StatusBadge label="Delegated Admin" tone="info" />
        </div>
      )}

      {/* Quick Actions & Date Filter Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#6E6E73] mr-1">Period:</span>
          {(
            [
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'month', label: 'This Month' },
              { id: '30d', label: 'Last 30 Days' },
              { id: 'custom', label: 'Custom Range' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setRangePreset(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                rangePreset === p.id
                  ? 'bg-[#0F172A] text-white'
                  : 'bg-[#F5F5F7] text-[#424245] hover:text-[#1D1D1F]'
              }`}
            >
              {p.label}
            </button>
          ))}
          {rangePreset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[#D2D2D7] text-xs"
              />
              <span className="text-xs text-[#6E6E73]">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[#D2D2D7] text-xs"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasPermission('jobs', 'create') && (
            <button
              type="button"
              onClick={() => onNavigate('jobs')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              New Job Card
            </button>
          )}
          {hasPermission('customers', 'create') && (
            <button
              type="button"
              onClick={() => onNavigate('customers')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F]"
            >
              <Users className="w-3.5 h-3.5 text-[#0066CC]" />
              Add Customer
            </button>
          )}
          {hasPermission('invoices', 'create') && (
            <button
              type="button"
              onClick={() => onNavigate('invoices')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F]"
            >
              <FileText className="w-3.5 h-3.5 text-[#0066CC]" />
              New Invoice
            </button>
          )}
          {hasPermission('inventory', 'view') && (
            <button
              type="button"
              onClick={() => onNavigate('inventory')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F]"
            >
              <Package className="w-3.5 h-3.5 text-[#0066CC]" />
              Spare Parts
            </button>
          )}
        </div>
      </div>

      {/* Clickable KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {visibleKpis.map((kpi) => {
          const Icon = kpi.icon;
          const allowed = hasPermission(kpi.module, 'view');
          return (
            <button
              key={kpi.label}
              type="button"
              disabled={!allowed}
              onClick={() => allowed && onNavigate(kpi.module)}
              className="text-left p-5 rounded-2xl bg-white border border-[#E5E5EA] hover:border-[#0066CC] transition-all group disabled:opacity-70"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[#6E6E73] group-hover:text-[#1D1D1F]">
                  {kpi.label}
                </p>
                <Icon className="w-4 h-4 text-[#0066CC] shrink-0 opacity-80 group-hover:opacity-100" />
              </div>
              <p className={`text-2xl font-bold font-mono tabular-nums mt-2.5 ${kpi.accent || 'text-[#1D1D1F]'}`}>
                {erpLoading ? '—' : kpi.value}
              </p>
              <p className="text-[11px] text-[#0066CC] font-semibold mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Open Module →
              </p>
            </button>
          );
        })}
      </div>

      {/* Charts Row: Revenue vs Expense SVG Chart + Repair Status Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {(isSuperAdmin || hasPermission('reports', 'view')) && (
          <div className="xl:col-span-7 p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#1D1D1F]">
                  6-Month Collected Revenue vs Operating Expenses
                </h2>
                <p className="text-xs text-[#6E6E73]">
                  Verified payments &amp; logged workshop expenses (INR)
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#1D1D1F]">
                  <span className="w-3 h-3 rounded-xs bg-[#0066CC]" />
                  Revenue
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-[#6E6E73]">
                  <span className="w-3 h-3 rounded-xs bg-[#94A3B8]" />
                  Expenses
                </span>
              </div>
            </div>

            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 620 210"
                className="w-full h-52 min-w-[460px]"
                role="img"
                aria-label="6-month revenue and expenses bar chart"
              >
                {[0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = 175 - ratio * 145;
                  return (
                    <g key={ratio}>
                      <line x1="48" y1={y} x2="600" y2={y} stroke="#E5E5EA" strokeDasharray="3 3" />
                      <text x="42" y={y + 4} textAnchor="end" fontSize="10" fill="#6E6E73">
                        {Math.round((maxChartValue * ratio) / 1000)}k
                      </text>
                    </g>
                  );
                })}
                <line x1="48" y1="175" x2="600" y2="175" stroke="#CBD5E1" />
                {monthlySeries.map((m, idx) => {
                  const groupX = 72 + idx * 88;
                  const revH = Math.max(3, (m.revenue / maxChartValue) * 145);
                  const expH = Math.max(3, (m.expense / maxChartValue) * 145);
                  return (
                    <g key={m.key}>
                      <rect x={groupX} y={175 - revH} width="24" height={revH} rx="4" fill="#0066CC" />
                      <rect x={groupX + 28} y={175 - expH} width="24" height={expH} rx="4" fill="#94A3B8" />
                      <text x={groupX + 26} y="195" textAnchor="middle" fontSize="11" fill="#424245" fontWeight="600">
                        {m.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}

        <div
          className={`${
            isSuperAdmin || hasPermission('reports', 'view') ? 'xl:col-span-5' : 'xl:col-span-12'
          } p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-5`}
        >
          <div>
            <h2 className="text-base font-bold text-[#1D1D1F]">Repair Status Distribution</h2>
            <p className="text-xs text-[#6E6E73]">
              Combined Job Cards &amp; active Repair Enquiries breakdown
            </p>
          </div>
          <div className="space-y-3.5">
            {statusDistribution.map((row) => (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#1D1D1F]">{row.label}</span>
                  <span className="font-mono tabular-nums text-[#424245]">
                    {row.count} ({row.pct}%)
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-[#F5F5F7] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(row.count > 0 ? 4 : 0, row.pct)}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {hasPermission('enquiries', 'view') && (
          <div className="p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1D1D1F]">Recent Customer Enquiries</h3>
              <button
                type="button"
                onClick={() => onNavigate('enquiries')}
                className="text-xs font-semibold text-[#0066CC] hover:underline"
              >
                Open All →
              </button>
            </div>
            <div className="divide-y divide-[#E5E5EA] text-xs">
              {enquiries.slice(0, 5).map((e) => (
                <div key={e.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1D1D1F] truncate">
                      <span className="font-mono text-[#0066CC] mr-1.5">{e.enquiryCode}</span>
                      {e.customerName}
                    </p>
                    <p className="text-[#6E6E73] truncate">
                      {e.macbookModel} · {e.serviceName}
                    </p>
                  </div>
                  <StatusBadge label={e.status} />
                </div>
              ))}
              {enquiries.length === 0 && (
                <p className="py-6 text-center text-[#6E6E73]">No repair enquiries recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {hasPermission('payments', 'view') && (
          <div className="p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1D1D1F]">Recent Payments</h3>
              <button
                type="button"
                onClick={() => onNavigate('payments')}
                className="text-xs font-semibold text-[#0066CC] hover:underline"
              >
                Verify &amp; Manage →
              </button>
            </div>
            <div className="divide-y divide-[#E5E5EA] text-xs">
              {paymentSubmissions.slice(0, 5).map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1D1D1F] truncate">
                      {p.customerName} · <span className="font-mono text-[#0066CC]">{p.enquiryCode}</span>
                    </p>
                    <p className="text-[#6E6E73] truncate">
                      {p.method} · {p.transactionRef}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="font-mono font-bold text-[#1D1D1F] tabular-nums">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </p>
                    <StatusBadge label={p.status} />
                  </div>
                </div>
              ))}
              {paymentSubmissions.length === 0 && (
                <p className="py-6 text-center text-[#6E6E73]">No payment submissions logged yet.</p>
              )}
            </div>
          </div>
        )}

        {hasPermission('appointments', 'view') && (
          <div className="p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1D1D1F]">Upcoming Appointments</h3>
              <button
                type="button"
                onClick={() => onNavigate('appointments')}
                className="text-xs font-semibold text-[#0066CC] hover:underline"
              >
                Schedule Calendar →
              </button>
            </div>
            <div className="divide-y divide-[#E5E5EA] text-xs">
              {upcomingAppointments.map((a) => (
                <div key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#1D1D1F] truncate">
                      {a.customerName} · <span className="font-mono">{a.customerPhone}</span>
                    </p>
                    <p className="text-[#6E6E73] truncate">
                      {a.macbookModel} · {a.serviceType}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-semibold text-[#0066CC]">{a.scheduledDate}</p>
                    <p className="text-[#6E6E73]">
                      {a.scheduledSlot} · {a.status}
                    </p>
                  </div>
                </div>
              ))}
              {upcomingAppointments.length === 0 && (
                <p className="py-6 text-center text-[#6E6E73]">
                  No upcoming studio appointments scheduled.
                </p>
              )}
            </div>
          </div>
        )}

        {hasPermission('technicians', 'view') && (
          <div className="p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[#1D1D1F]">Technician Performance</h3>
                <button
                  type="button"
                  onClick={() => onNavigate('technicians')}
                  className="text-xs font-semibold text-[#0066CC] hover:underline"
                >
                  Roster →
                </button>
              </div>
              {techPerformance.length === 0 ? (
                <p className="text-xs text-[#6E6E73]">
                  Add technician profiles in Staff Roster to track bench workload.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {techPerformance.map((tp) => (
                    <div key={tp.id} className="p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1D1D1F]">{tp.name}</span>
                        <StatusBadge label={tp.availability} />
                      </div>
                      <p className="text-[#6E6E73] font-mono tabular-nums mt-1.5">
                        Active: {tp.activeCount} · Done: {tp.completedCount}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {hasPermission('logs', 'view') && (
              <div className="pt-3 border-t border-[#E5E5EA] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1D1D1F] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#0066CC]" />
                    Recent System Activities
                  </h3>
                  <button
                    type="button"
                    onClick={() => onNavigate('logs')}
                    className="text-xs font-semibold text-[#0066CC] hover:underline"
                  >
                    Full Audit Log →
                  </button>
                </div>
                <div className="space-y-1.5 text-xs">
                  {activityLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="flex items-center justify-between gap-2 text-[#424245]">
                      <span className="truncate">{log.summary}</span>
                      <span className="font-mono text-[10px] text-[#6E6E73] shrink-0">
                        {log.actorRole}
                      </span>
                    </div>
                  ))}
                  {activityLogs.length === 0 && (
                    <p className="text-[#6E6E73]">
                      Activity entries appear automatically as staff update records.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
