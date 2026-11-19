import { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Package,
  Search,
  Wrench,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useErp } from '../../context/ErpContext';
import { JobDetailsModal } from './JobDetailsModal';
import {
  Button,
  EmptyState,
  KpiCard,
  StatusBadge,
  Tabs,
} from '../ui/DesignSystem';
import type { RepairJobCard } from '../../types';

export function TechnicianWorkspace({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const { user, userProfile } = useApp();
  const { repairJobs, appointments, inventory, erpLoading, refreshErpData } = useErp();

  const [benchTab, setBenchTab] = useState<'jobs' | 'schedule' | 'parts'>('jobs');
  const [filterMode, setFilterMode] = useState<'active' | 'qc' | 'completed' | 'all'>('active');
  const [search, setSearch] = useState('');
  const [partSearch, setPartSearch] = useState('');
  const [activeJob, setActiveJob] = useState<RepairJobCard | null>(null);

  const metrics = useMemo(() => {
    const active = repairJobs.filter(
      (j) => !['Delivered', 'Completed', 'Cancelled Repair', 'Rejected Estimate'].includes(j.status)
    ).length;
    const inspection = repairJobs.filter((j) =>
      ['New Booking', 'Received', 'Inspection', 'Diagnosis'].includes(j.status)
    ).length;
    const inRepair = repairJobs.filter((j) =>
      ['Approved', 'In Repair'].includes(j.status)
    ).length;
    const qcReady = repairJobs.filter((j) =>
      ['Quality Check', 'Ready for Delivery'].includes(j.status)
    ).length;
    return { active, inspection, inRepair, qcReady };
  }, [repairJobs]);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return repairJobs.filter((j) => {
      const matchesMode =
        filterMode === 'all'
          ? true
          : filterMode === 'active'
            ? !['Delivered', 'Completed', 'Cancelled Repair', 'Rejected Estimate'].includes(j.status)
            : filterMode === 'qc'
              ? ['Quality Check', 'Ready for Delivery'].includes(j.status)
              : ['Delivered', 'Completed'].includes(j.status);
      const matchesText =
        !q ||
        j.jobCardCode.toLowerCase().includes(q) ||
        j.macbookModel.toLowerCase().includes(q) ||
        j.reportedProblem.toLowerCase().includes(q) ||
        (j.serialNumber || '').toLowerCase().includes(q);
      return matchesMode && matchesText;
    });
  }, [repairJobs, filterMode, search]);

  const filteredParts = useMemo(() => {
    const q = partSearch.trim().toLowerCase();
    return inventory.filter(
      (item) =>
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.compatibleModels.toLowerCase().includes(q)
    );
  }, [inventory, partSearch]);

  return (
    <div className="space-y-6">
      {/* Technician Bench Greeting Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0F172A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#60A5FA]">Technician Bench Workspace</p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {userProfile?.displayName || user?.displayName || 'Refix Pro Engineer'}
          </h2>
          <p className="text-xs text-slate-300">
            Assigned hardware queue, diagnostic bench notes, parts deduction, and 6-point QC checklist.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void refreshErpData()}
          loading={erpLoading}
        >
          Sync Bench Queue
        </Button>
      </div>

      {/* Bench KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Assigned Active Jobs"
          value={metrics.active}
          tone="info"
          icon={<Wrench className="w-4 h-4" />}
        />
        <KpiCard
          label="Awaiting Inspection"
          value={metrics.inspection}
          tone="warning"
          icon={<Clock className="w-4 h-4" />}
        />
        <KpiCard
          label="On Bench / In Repair"
          value={metrics.inRepair}
          tone="info"
          icon={<ClipboardCheck className="w-4 h-4" />}
        />
        <KpiCard
          label="QC & Ready Pickup"
          value={metrics.qcReady}
          tone="success"
          icon={<CheckCircle2 className="w-4 h-4" />}
        />
      </div>

      {/* Sub-navigation Tabs */}
      <Tabs
        items={[
          { id: 'jobs', label: 'My Assigned Jobs', count: repairJobs.length, icon: <Wrench className="w-3.5 h-3.5" /> },
          { id: 'schedule', label: 'My Schedule', count: appointments.length, icon: <Calendar className="w-3.5 h-3.5" /> },
          { id: 'parts', label: 'Spare Parts Stock', count: inventory.length, icon: <Package className="w-3.5 h-3.5" /> },
        ]}
        value={benchTab}
        onChange={setBenchTab}
      />

      {benchTab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {([
                { id: 'active', label: 'Active Queue' },
                { id: 'qc', label: 'Quality Check' },
                { id: 'completed', label: 'Completed' },
                { id: 'all', label: 'All Assigned' },
              ] as const).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterMode(f.id)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    filterMode === f.id
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-white text-[#424245] border-[#D2D2D7] hover:bg-[#F5F5F7]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search JC ID, model, serial..."
                className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-xl border border-[#D2D2D7] bg-white text-xs sm:text-sm"
              />
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <EmptyState
              title="No Assigned Jobs In This View"
              description="When an administrator assigns a MacBook repair job card to your account, it will appear here immediately."
              icon={<Wrench className="w-5 h-5" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col justify-between gap-4 hover:border-[#0066CC] transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono font-bold text-sm text-[#0066CC]">{job.jobCardCode}</p>
                        <h3 className="text-base font-bold text-[#1D1D1F] mt-0.5">{job.macbookModel}</h3>
                        <p className="text-xs text-[#6E6E73]">
                          {job.modelNumber || 'Apple Hardware'}
                          {job.serialNumber ? ` · SN: ${job.serialNumber}` : ''}
                        </p>
                      </div>
                      <StatusBadge label={job.status} />
                    </div>

                    <div className="p-3 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] text-xs space-y-1">
                      <p className="font-semibold text-[#1D1D1F]">Reported Issue</p>
                      <p className="text-[#424245] line-clamp-2">{job.reportedProblem || 'Diagnostic evaluation'}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E6E73]">
                      <span>Estimate Approval: <strong className="text-[#1D1D1F]">{job.approvalStatus}</strong></span>
                      <span>Parts Logged: <strong className="font-mono text-[#1D1D1F]">{job.partsUsed?.length || 0}</strong></span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E5E5EA] flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#6E6E73] truncate">
                      {job.deliveryDate ? `Due: ${job.deliveryDate}` : 'Standard Turnaround'}
                    </span>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => setActiveJob(job)}
                    >
                      Inspect &amp; Update Bench
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {benchTab === 'schedule' && (
        <div className="space-y-3">
          {appointments.length === 0 ? (
            <EmptyState
              title="No Bench Appointments Scheduled"
              description="Customer drop-offs and consultation slots assigned to you appear here."
              icon={<Calendar className="w-5 h-5" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((appt) => (
                <div key={appt.id} className="p-4 rounded-2xl bg-white border border-[#E5E5EA] flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-mono text-xs font-bold text-[#0066CC]">{appt.appointmentCode}</p>
                    <p className="text-sm font-bold text-[#1D1D1F] truncate">{appt.macbookModel}</p>
                    <p className="text-xs text-[#6E6E73] truncate">{appt.serviceType}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="font-mono text-xs font-bold text-[#1D1D1F]">{appt.scheduledDate}</p>
                    <p className="text-xs text-[#6E6E73]">{appt.scheduledSlot}</p>
                    <StatusBadge label={appt.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {benchTab === 'parts' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={partSearch}
              onChange={(e) => setPartSearch(e.target.value)}
              placeholder="Search spare parts by name, SKU, or compatible model..."
              className="w-full min-h-[42px] pl-9 pr-3 py-2 rounded-xl border border-[#D2D2D7] bg-white text-xs sm:text-sm"
            />
          </div>

          <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7] text-xs font-semibold text-[#424245]">
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Spare Part</th>
                  <th className="py-3 px-4">Compatible Models</th>
                  <th className="py-3 px-4">Shelf</th>
                  <th className="py-3 px-4 text-right">Stock Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {filteredParts.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F5F5F7]/60">
                    <td className="py-3 px-4 font-mono text-[#0066CC] whitespace-nowrap">{item.sku}</td>
                    <td className="py-3 px-4 font-semibold text-[#1D1D1F]">{item.name}</td>
                    <td className="py-3 px-4 text-xs text-[#6E6E73]">{item.compatibleModels || 'Universal'}</td>
                    <td className="py-3 px-4 text-xs text-[#424245]">{item.location || 'Main Shelf'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                      <span className={item.quantity <= item.minStock ? 'text-red-600' : 'text-emerald-700'}>
                        {item.quantity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeJob && (
        <JobDetailsModal
          job={activeJob}
          isNew={false}
          initialTab="diagnosis"
          onClose={() => setActiveJob(null)}
          onSaved={() => setActiveJob(null)}
          onNotify={onNotify}
        />
      )}
    </div>
  );
}
