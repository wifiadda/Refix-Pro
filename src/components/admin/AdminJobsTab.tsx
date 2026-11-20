import { useMemo, useState } from 'react';
import {
  CheckSquare,
  Download,
  FileText,
  Mail,
  Plus,
  Printer,
  Search,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useErp } from '../../context/ErpContext';
import { extractReadableError } from '../../lib/firebase';
import { buildJobCardEmailDraft } from '../../utils/emailHelper';
import {
  downloadCsvFile,
  openEmailComposer,
  printJobCardDocument,
} from '../../utils/pdfExport';
import { ConfirmDialog } from '../ConfirmDialog';
import { JobDetailsModal } from './JobDetailsModal';
import {
  Button,
  EmptyState,
  PaginationBar,
  StatusBadge,
} from '../ui/DesignSystem';
import {
  DEFAULT_JOB_WORKFLOW_STATUSES,
  type AdminModuleKey,
  type JobWorkflowStatus,
  type RepairJobCard,
} from '../../types';

const PAGE_SIZE = 10;

const EMPTY_JOB: Omit<RepairJobCard, 'createdAt' | 'updatedAt'> = {
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
  deviceCondition: 'Normal wear; no missing screws',
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
  status: 'New Booking',
  deliveryDate: '',
  warrantyPeriod: '90 Days Service Warranty',
  beforeImages: [],
  afterImages: [],
  internalNotes: '',
  customerUpdates: '',
  paymentStatus: 'Unpaid',
};

export function AdminJobsTab({
  onNotify,
  onCreatedInvoice,
  onNavigateTab,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
  onCreatedInvoice?: () => void;
  onNavigateTab?: (tab: AdminModuleKey) => void;
}) {
  const { settings, isAdmin, isFrontDeskStaff, hasPermission } = useApp();
  const {
    repairJobs,
    technicians,
    bulkUpdateRepairJobStatus,
    deleteRepairJob,
    generateInvoiceFromJob,
  } = useErp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [techFilter, setTechFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'recent' | 'cost_desc' | 'status'>('recent');
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<JobWorkflowStatus>('In Repair');
  const [bulkTechName, setBulkTechName] = useState<string>('');
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  const [modalJob, setModalJob] = useState<Omit<RepairJobCard, 'createdAt' | 'updatedAt'> | null>(null);
  const [isNewModal, setIsNewModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RepairJobCard | null>(null);

  const canCreateJob = (isAdmin || isFrontDeskStaff) && hasPermission('jobs', 'create');
  const canEditJob = (isAdmin || isFrontDeskStaff) && hasPermission('jobs', 'edit');
  const canDeleteJob = isAdmin && hasPermission('jobs', 'delete');
  const canExportJob = isAdmin && hasPermission('jobs', 'export');
  const canCreateInvoice = (isAdmin || isFrontDeskStaff) && hasPermission('invoices', 'create');

  const workflowOptions = useMemo(() => {
    const custom = settings.erpConfig?.workflowStatuses;
    return custom && custom.length > 0 ? (custom as JobWorkflowStatus[]) : DEFAULT_JOB_WORKFLOW_STATUSES;
  }, [settings.erpConfig?.workflowStatuses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = repairJobs.filter((j) => {
      const stOk = statusFilter === 'All' || j.status === statusFilter;
      const techOk = techFilter === 'All' || (j.technicianName || 'Unassigned') === techFilter;
      const textOk =
        !q ||
        j.jobCardCode.toLowerCase().includes(q) ||
        j.customerName.toLowerCase().includes(q) ||
        j.customerMobile.toLowerCase().includes(q) ||
        j.macbookModel.toLowerCase().includes(q) ||
        (j.serialNumber || '').toLowerCase().includes(q);
      return stOk && techOk && textOk;
    });

    if (sortBy === 'cost_desc') {
      return [...list].sort(
        (a, b) => (b.finalCost || b.estimatedCost || 0) - (a.finalCost || a.estimatedCost || 0)
      );
    }
    if (sortBy === 'status') {
      return [...list].sort((a, b) => a.status.localeCompare(b.status));
    }
    return list;
  }, [repairJobs, search, statusFilter, techFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCreateInvoice = async (job: RepairJobCard) => {
    try {
      const taxRate = settings.erpConfig?.defaultTaxRate ?? 18;
      const inv = await generateInvoiceFromJob(job, taxRate, 0);
      onNotify('success', `Generated invoice ${inv.invoiceNumber} for ${job.jobCardCode}.`);
      onCreatedInvoice?.();
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Failed to generate invoice.'));
    }
  };

  const paginatedIds = useMemo(() => paginated.map((j) => j.id), [paginated]);
  const allPageSelected =
    paginatedIds.length > 0 && paginatedIds.every((id) => selectedIds.includes(id));

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectPage = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...paginatedIds])));
    }
  };

  const handleBulkApply = async () => {
    if (selectedIds.length === 0) return;
    setBulkSaving(true);
    try {
      const chosenTech = bulkTechName
        ? technicians.find((t) => t.name === bulkTechName)
        : undefined;
      const updatedCount = await bulkUpdateRepairJobStatus(
        selectedIds,
        bulkStatus,
        chosenTech ? { name: chosenTech.name, uid: chosenTech.uid } : undefined
      );
      setSelectedIds([]);
      setConfirmBulkOpen(false);
      setBulkTechName('');
      onNotify(
        'success',
        `Updated ${updatedCount} job card(s) to "${bulkStatus}"${
          chosenTech ? ` · Assigned to ${chosenTech.name}` : ''
        }.`
      );
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Bulk status update failed.'));
    } finally {
      setBulkSaving(false);
    }
  };

  const handleExportCsv = (onlySelected = false) => {
    const sourceRows =
      onlySelected && selectedIds.length > 0
        ? filtered.filter((j) => selectedIds.includes(j.id))
        : filtered;
    const headers = [
      'Job Card ID',
      'Customer',
      'Mobile',
      'Model',
      'Serial',
      'Status',
      'Approval',
      'Technician',
      'Estimate (INR)',
      'Final Cost (INR)',
      'Payment Status',
      'Delivery Date',
    ];
    const rows = sourceRows.map((j) => [
      j.jobCardCode,
      j.customerName,
      j.customerMobile,
      j.macbookModel,
      j.serialNumber || '',
      j.status,
      j.approvalStatus,
      j.technicianName || 'Unassigned',
      j.estimatedCost,
      j.finalCost ?? j.estimatedCost,
      j.paymentStatus,
      j.deliveryDate || '',
    ]);
    downloadCsvFile(`refix-pro-job-cards-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const quickChips = useMemo(() => {
    const countOf = (st: string) => repairJobs.filter((j) => j.status === st).length;
    return [
      { id: 'All', label: `All (${repairJobs.length})` },
      { id: 'Inspection', label: `Inspection (${countOf('Inspection')})` },
      { id: 'Awaiting Approval', label: `Awaiting Approval (${countOf('Awaiting Approval')})` },
      { id: 'In Repair', label: `In Repair (${countOf('In Repair')})` },
      { id: 'Quality Check', label: `QC (${countOf('Quality Check')})` },
      { id: 'Ready for Delivery', label: `Ready (${countOf('Ready for Delivery')})` },
    ];
  }, [repairJobs]);

  return (
    <div className="space-y-5">
      {/* Quick Status Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {quickChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => {
              setStatusFilter(chip.id);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              statusFilter === chip.id
                ? 'bg-[#0F172A] text-white border-[#0F172A]'
                : 'bg-white text-[#424245] border-[#D2D2D7] hover:bg-[#F5F5F7]'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Filter & Action Toolbar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search JC ID, customer, serial..."
              className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-xl border border-[#D2D2D7] bg-white text-xs sm:text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter jobs by status"
            className="min-h-[40px] px-3 py-2 rounded-xl border border-[#D2D2D7] bg-white text-xs sm:text-sm"
          >
            <option value="All">All Workflow Stages</option>
            {workflowOptions.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            value={techFilter}
            onChange={(e) => {
              setTechFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter jobs by technician"
            className="min-h-[40px] px-3 py-2 rounded-xl border border-[#D2D2D7] bg-white text-xs sm:text-sm"
          >
            <option value="All">All Technicians</option>
            <option value="Unassigned">Unassigned</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'cost_desc' | 'status')}
            aria-label="Sort job cards"
            className="min-h-[40px] px-3 py-2 rounded-xl border border-[#D2D2D7] bg-white text-xs sm:text-sm"
          >
            <option value="recent">Sort: Most Recent</option>
            <option value="cost_desc">Sort: Highest Cost</option>
            <option value="status">Sort: Status A–Z</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canExportJob && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={() => handleExportCsv(false)}
            >
              Export CSV
            </Button>
          )}
          {canCreateJob && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setIsNewModal(true);
                setModalJob({ ...EMPTY_JOB });
              }}
            >
              New Job Card
            </Button>
          )}
        </div>
      </div>

      {/* Contextual Bulk Actions Bar */}
      {canEditJob && selectedIds.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0F172A] text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <CheckSquare className="w-4 h-4 text-blue-300 shrink-0" />
            <span className="font-bold">
              {selectedIds.length} repair job{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-300 hover:text-white underline ml-1"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as JobWorkflowStatus)}
              aria-label="Bulk target repair status"
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white text-[#1D1D1F] text-xs font-semibold"
            >
              {workflowOptions.map((st) => (
                <option key={st} value={st}>
                  Set Status: {st}
                </option>
              ))}
            </select>

            <select
              value={bulkTechName}
              onChange={(e) => setBulkTechName(e.target.value)}
              aria-label="Optional bulk assign technician"
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white text-[#1D1D1F] text-xs font-semibold"
            >
              <option value="">Keep Existing Technician</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.name}>
                  Assign: {t.name}
                </option>
              ))}
            </select>

            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={bulkSaving}
              onClick={() => setConfirmBulkOpen(true)}
            >
              Apply Bulk Update
            </Button>

            {canExportJob && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={() => handleExportCsv(true)}
              >
                Export Selected
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Job Cards Table */}
      {paginated.length === 0 ? (
        <EmptyState
          title="No Repair Job Cards Match Filters"
          description="Try clearing search filters, or convert an incoming enquiry into an official Repair Job Card."
          icon={<Wrench className="w-5 h-5" />}
          action={
            canCreateJob ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setIsNewModal(true);
                  setModalJob({ ...EMPTY_JOB });
                }}
              >
                Create First Job Card
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7] text-xs font-semibold text-[#424245]">
                  {canEditJob && (
                    <th className="py-3 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectPage}
                        aria-label="Select all repair job cards on current page"
                        className="w-4 h-4 rounded border-[#D2D2D7] text-[#0066CC]"
                      />
                    </th>
                  )}
                  <th className="py-3 px-4">Job Card</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Device &amp; Issue</th>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Status &amp; Approval</th>
                  <th className="py-3 px-4">Cost &amp; Pay</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA] text-xs sm:text-sm">
                {paginated.map((job) => {
                  const isChecked = selectedIds.includes(job.id);
                  return (
                  <tr
                    key={job.id}
                    className={`transition-colors ${
                      isChecked ? 'bg-blue-50/50' : 'hover:bg-[#F5F5F7]/60'
                    }`}
                  >
                    {canEditJob && (
                      <td className="py-3 pl-4 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(job.id)}
                          aria-label={`Select ${job.jobCardCode}`}
                          className="w-4 h-4 rounded border-[#D2D2D7] text-[#0066CC]"
                        />
                      </td>
                    )}
                    <td className="py-3 px-4 font-mono font-bold text-[#0066CC] whitespace-nowrap">
                      {job.jobCardCode}
                      {job.enquiryCode && (
                        <p className="text-[11px] font-normal text-[#6E6E73]">Ref: {job.enquiryCode}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#1D1D1F]">{job.customerName}</p>
                      <p className="text-xs font-mono text-[#6E6E73]">{job.customerMobile}</p>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-[#1D1D1F] truncate">{job.macbookModel}</p>
                      <p className="text-xs text-[#6E6E73] truncate">{job.reportedProblem}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#424245] whitespace-nowrap">
                      {job.technicianName || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap space-y-1">
                      <StatusBadge label={job.status} />
                      <p className="text-[11px] text-[#6E6E73]">Est: {job.approvalStatus}</p>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                      <p className="font-bold text-[#1D1D1F]">
                        ₹{(job.finalCost || job.estimatedCost || 0).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-[#6E6E73]">{job.paymentStatus}</p>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setIsNewModal(false);
                          setModalJob(job);
                        }}
                      >
                        Open Job
                      </Button>
                      <button
                        type="button"
                        onClick={() =>
                          printJobCardDocument(job, settings, buildJobCardEmailDraft(job, settings))
                        }
                        title="Preview & Print Job Card PDF"
                        aria-label={`Preview and print ${job.jobCardCode}`}
                        className="p-2 rounded-lg border border-[#D2D2D7] hover:bg-[#F5F5F7] text-[#1D1D1F] align-middle"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEmailComposer(buildJobCardEmailDraft(job, settings))}
                        title="Email Job Update / Estimate to Customer"
                        aria-label={`Email customer for ${job.jobCardCode}`}
                        className="p-2 rounded-lg border border-[#D2D2D7] hover:bg-[#F5F5F7] text-[#0066CC] align-middle"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      {canCreateInvoice && (
                        <button
                          type="button"
                          onClick={() => void handleCreateInvoice(job)}
                          title="Generate Invoice from Job Card"
                          aria-label={`Generate invoice for ${job.jobCardCode}`}
                          className="p-2 rounded-lg border border-[#D2D2D7] hover:bg-[#F5F5F7] text-[#0066CC] align-middle"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      {canDeleteJob && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(job)}
                          aria-label={`Delete ${job.jobCardCode}`}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 align-middle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <PaginationBar
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}

      {modalJob && (
        <JobDetailsModal
          job={modalJob}
          isNew={isNewModal}
          onClose={() => setModalJob(null)}
          onSaved={() => setModalJob(null)}
          onNotify={onNotify}
          onNavigateTab={(t) => onNavigateTab?.(t)}
        />
      )}

      <ConfirmDialog
        open={confirmBulkOpen}
        destructive={false}
        title={`Update ${selectedIds.length} Repair Job Card(s)?`}
        description={`This will set the workflow status of ${selectedIds.length} selected job card(s) to "${bulkStatus}"${
          bulkTechName ? ` and assign them to ${bulkTechName}` : ''
        }.`}
        confirmLabel="Apply Bulk Status"
        busy={bulkSaving}
        onCancel={() => setConfirmBulkOpen(false)}
        onConfirm={() => void handleBulkApply()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        destructive
        title={`Delete Job Card ${deleteTarget?.jobCardCode}?`}
        description="This permanently deletes the repair job card from Firestore. Existing invoices remain intact."
        confirmLabel="Delete Job Card"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteRepairJob(deleteTarget.id);
            setDeleteTarget(null);
            onNotify('success', 'Job Card deleted.');
          } catch (err) {
            onNotify('error', extractReadableError(err, 'Unable to delete job card.'));
          }
        }}
      />
    </div>
  );
}
