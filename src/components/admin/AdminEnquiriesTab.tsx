import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Download, Inbox, Mail, MessageCircle, Search, Trash2, Wrench, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useErp } from '../../context/ErpContext';
import { extractReadableError } from '../../lib/firebase';
import { ENQUIRY_STATUSES, EnquiryStatus, PaymentStatus, RepairEnquiry } from '../../types';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { buildEnquiryEmailDraft } from '../../utils/emailHelper';
import { openEmailComposer } from '../../utils/pdfExport';
import { ConfirmDialog } from '../ConfirmDialog';
import { Button, EmptyState, PaginationBar, StatusBadge } from '../ui/DesignSystem';

const PAGE_SIZE = 12;

export function AdminEnquiriesTab({
  onNotify,
  onCreatedJob,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
  onCreatedJob?: () => void;
}) {
  const { settings, enquiries, updateEnquiry, deleteEnquiry, hasPermission } = useApp();
  const { repairJobs, createJobFromEnquiry } = useErp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selected, setSelected] = useState<RepairEnquiry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [creatingJobId, setCreatingJobId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<EnquiryStatus>('Contacted');
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  const [editStatus, setEditStatus] = useState<EnquiryStatus>('New');
  const [editNotes, setEditNotes] = useState('');
  const [editEstimate, setEditEstimate] = useState('');
  const [editFollowUp, setEditFollowUp] = useState('');
  const [editPayableAmount, setEditPayableAmount] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('Unpaid');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editPaymentRef, setEditPaymentRef] = useState('');
  const [saving, setSaving] = useState(false);

  const canEditEnquiry = hasPermission('enquiries', 'edit');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enquiries.filter((e) => {
      const statusOk = statusFilter === 'All' || e.status === statusFilter;
      const textOk =
        !q ||
        e.enquiryCode.toLowerCase().includes(q) ||
        e.customerName.toLowerCase().includes(q) ||
        e.mobile.toLowerCase().includes(q) ||
        e.macbookModel.toLowerCase().includes(q) ||
        e.serviceName.toLowerCase().includes(q);
      return statusOk && textOk;
    });
  }, [enquiries, search, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const paginatedIds = useMemo(() => paginated.map((e) => e.id), [paginated]);
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

  const handleBulkEnquiryUpdate = async () => {
    if (selectedIds.length === 0) return;
    setBulkSaving(true);
    try {
      await Promise.all(selectedIds.map((id) => updateEnquiry(id, { status: bulkStatus })));
      const count = selectedIds.length;
      setSelectedIds([]);
      setConfirmBulkOpen(false);
      onNotify('success', `Updated ${count} enquiry record(s) to "${bulkStatus}".`);
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Failed to bulk update enquiries.'));
    } finally {
      setBulkSaving(false);
    }
  };

  const openDetail = (enq: RepairEnquiry) => {
    setSelected(enq);
    setEditStatus(enq.status);
    setEditNotes(enq.technicianNotes || '');
    setEditEstimate(enq.repairEstimate || '');
    setEditFollowUp(enq.followUpDate || '');
    setEditPayableAmount(
      enq.payableAmount && enq.payableAmount > 0 ? String(enq.payableAmount) : ''
    );
    setEditPaymentStatus(enq.paymentStatus || 'Unpaid');
    setEditPaymentMethod(enq.paymentMethod || '');
    setEditPaymentRef(enq.paymentReference || '');
  };

  const handleSaveDetail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await updateEnquiry(selected.id, {
        status: editStatus,
        technicianNotes: editNotes,
        repairEstimate: editEstimate,
        followUpDate: editFollowUp,
        payableAmount: Math.max(0, Math.round(Number(editPayableAmount) || 0)),
        paymentStatus: editPaymentStatus,
        paymentMethod: editPaymentMethod,
        paymentReference: editPaymentRef,
        paidAt:
          editPaymentStatus === 'Paid'
            ? selected.paidAt ||
              new Date().toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '',
      });
      onNotify('success', `Updated enquiry ${selected.enquiryCode}`);
      setSelected(null);
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Failed to update enquiry.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEnquiry(id);
      setConfirmDeleteId(null);
      if (selected?.id === id) setSelected(null);
      onNotify('success', 'Enquiry deleted.');
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Failed to delete enquiry.'));
    }
  };

  const exportCsv = () => {
    const headers = [
      'Enquiry Code',
      'Customer Name',
      'Mobile',
      'WhatsApp',
      'Email',
      'MacBook Model',
      'Year',
      'Processor',
      'Service',
      'Status',
      'Estimate',
      'Follow Up Date',
      'Technician Notes',
      'Problem Description',
    ];
    const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;
    const rows = filtered.map((e) =>
      [
        e.enquiryCode,
        e.customerName,
        e.mobile,
        e.whatsapp,
        e.email,
        e.macbookModel,
        e.macbookYear,
        e.processorType,
        e.serviceName,
        e.status,
        e.repairEstimate,
        e.followUpDate,
        e.technicianNotes,
        e.problemDescription,
      ]
        .map(escape)
        .join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refix-pro-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, customer, model..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter enquiries by status"
            className="px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
          >
            <option value="All">All Statuses</option>
            {ENQUIRY_STATUSES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<Download className="w-4 h-4" />}
          onClick={exportCsv}
        >
          Download CSV
        </Button>
      </div>

      {canEditEnquiry && selectedIds.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0F172A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <CheckSquare className="w-4 h-4 text-blue-300 shrink-0" />
            <span className="font-bold">{selectedIds.length} enquiry(s) selected</span>
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
              onChange={(e) => setBulkStatus(e.target.value as EnquiryStatus)}
              aria-label="Bulk enquiry status"
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white text-[#1D1D1F] text-xs font-semibold"
            >
              {ENQUIRY_STATUSES.map((st) => (
                <option key={st} value={st}>
                  Set Status: {st}
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
              Apply Bulk Status
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No repair enquiries match your filter"
          description="Try clearing the search query or switching back to All Statuses."
          icon={<Inbox className="w-5 h-5" />}
          action={
            search || statusFilter !== 'All' ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('All');
                }}
              >
                Reset Filters
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
                  {canEditEnquiry && (
                    <th className="py-3 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectPage}
                        aria-label="Select all enquiries on current page"
                        className="w-4 h-4 rounded border-[#D2D2D7] text-[#0066CC]"
                      />
                    </th>
                  )}
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">MacBook & Service</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Estimate</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA] text-xs sm:text-sm">
                {paginated.map((enq) => {
                  const isChecked = selectedIds.includes(enq.id);
                  return (
                  <tr
                    key={enq.id}
                    className={isChecked ? 'bg-blue-50/50' : 'hover:bg-[#F5F5F7]/60'}
                  >
                    {canEditEnquiry && (
                      <td className="py-3 pl-4 pr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(enq.id)}
                          aria-label={`Select ${enq.enquiryCode}`}
                          className="w-4 h-4 rounded border-[#D2D2D7] text-[#0066CC]"
                        />
                      </td>
                    )}
                    <td className="py-3 px-4 font-mono font-semibold text-[#0066CC] tabular-nums whitespace-nowrap">
                      {enq.enquiryCode}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#1D1D1F]">{enq.customerName}</p>
                      <p className="text-xs font-mono text-[#6E6E73] tabular-nums">{enq.mobile}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-[#1D1D1F]">{enq.macbookModel}</p>
                      <p className="text-xs text-[#6E6E73]">{enq.serviceName}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge label={enq.status} />
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-[#424245]">
                      <p>{enq.repairEstimate || '—'}</p>
                      {enq.payableAmount && enq.payableAmount > 0 ? (
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="font-semibold text-[#1D1D1F]">
                            ₹{enq.payableAmount.toLocaleString('en-IN')}
                          </span>
                          <StatusBadge label={enq.paymentStatus || 'Unpaid'} />
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      {hasPermission('jobs', 'create') && !repairJobs.some((j) => j.enquiryCode === enq.enquiryCode) && (
                        <button
                          type="button"
                          disabled={creatingJobId === enq.id}
                          onClick={async () => {
                            setCreatingJobId(enq.id);
                            try {
                              const jc = await createJobFromEnquiry(enq);
                              onNotify('success', `Job Card ${jc.jobCardCode} created from ${enq.enquiryCode}.`);
                              onCreatedJob?.();
                            } catch (err) {
                              onNotify('error', extractReadableError(err, 'Failed to create Job Card.'));
                            } finally {
                              setCreatingJobId(null);
                            }
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0F172A] hover:bg-black text-white text-xs font-semibold disabled:opacity-50"
                        >
                          <Wrench className="w-3 h-3" />
                          {creatingJobId === enq.id ? 'Creating...' : 'Create Job Card'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openDetail(enq)}
                        className="px-3 py-1.5 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
                      >
                        Manage
                      </button>
                      <button
                        type="button"
                        onClick={() => openEmailComposer(buildEnquiryEmailDraft(enq, settings))}
                        title="Send Email Update"
                        aria-label={`Email update for ${enq.enquiryCode}`}
                        className="p-1.5 rounded-lg border border-[#D2D2D7] hover:bg-[#F5F5F7] text-[#0066CC] align-middle"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <a
                        href={buildWhatsAppUrl(
                          enq.whatsapp || enq.mobile,
                          `Hello ${enq.customerName}, regarding your Refix Pro repair booking ${enq.enquiryCode} (${enq.macbookModel}): Status is "${enq.status}".`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WA
                      </a>
                      {hasPermission('enquiries', 'delete') && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(enq.id)}
                          aria-label={`Delete enquiry ${enq.enquiryCode}`}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 align-middle"
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

      <ConfirmDialog
        open={confirmBulkOpen}
        destructive={false}
        title={`Update ${selectedIds.length} Enquiry Record(s)?`}
        description={`This will update the status of ${selectedIds.length} selected enquiry(s) to "${bulkStatus}" across the Repair Desk and Customer Tracking portal.`}
        confirmLabel="Apply Bulk Status"
        busy={bulkSaving}
        onCancel={() => setConfirmBulkOpen(false)}
        onConfirm={() => void handleBulkEnquiryUpdate()}
      />

      <ConfirmDialog
        open={Boolean(confirmDeleteId)}
        title="Delete Repair Enquiry?"
        description="This action permanently removes the enquiry record from Firestore."
        confirmLabel="Delete"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) return handleDelete(confirmDeleteId);
        }}
      />

      {/* Detail & Edit Drawer/Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E5E5EA] max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#E5E5EA] pb-4">
              <div>
                <p className="text-xs font-mono text-[#0066CC] font-semibold">{selected.enquiryCode}</p>
                <h3 className="text-xl font-bold text-[#1D1D1F]">{selected.customerName}</h3>
                <p className="text-xs text-[#6E6E73]">
                  Mobile: {selected.mobile} · WhatsApp: {selected.whatsapp} · Preferred: {selected.preferredContactMethod}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg hover:bg-[#F5F5F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm bg-[#F5F5F7] p-4 rounded-xl">
              <div>
                <p className="text-[#6E6E73]">MacBook Model</p>
                <p className="font-semibold text-[#1D1D1F]">{selected.macbookModel} {selected.macbookYear && `(${selected.macbookYear})`}</p>
              </div>
              <div>
                <p className="text-[#6E6E73]">Processor</p>
                <p className="font-semibold text-[#1D1D1F]">{selected.processorType || 'Confirmed at Inspection'}</p>
              </div>
              <div>
                <p className="text-[#6E6E73]">Requested Service</p>
                <p className="font-semibold text-[#1D1D1F]">{selected.serviceName}</p>
              </div>
              <div>
                <p className="text-[#6E6E73]">Preferred Visit</p>
                <p className="font-semibold text-[#1D1D1F]">{selected.preferredVisitDate || 'Not specified'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[#6E6E73]">Problem Description</p>
                <p className="text-[#1D1D1F] mt-0.5">{selected.problemDescription || 'No written description provided (inspection requested).'}</p>
              </div>
              {selected.additionalNotes && (
                <div className="sm:col-span-2">
                  <p className="text-[#6E6E73]">Additional Notes</p>
                  <p className="text-[#1D1D1F] mt-0.5">{selected.additionalNotes}</p>
                </div>
              )}
            </div>

            {selected.imageUrls?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#1D1D1F] mb-2">Attached Customer Photos</p>
                <div className="flex flex-wrap gap-3">
                  {selected.imageUrls.map((src, i) => (
                    <img key={i} src={src} alt={`Attachment ${i + 1}`} className="w-28 h-28 object-cover rounded-lg border border-[#E5E5EA]" />
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveDetail} className="space-y-4 pt-2 border-t border-[#E5E5EA]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as EnquiryStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm bg-white"
                  >
                    {ENQUIRY_STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Repair Estimate</label>
                  <input
                    type="text"
                    value={editEstimate}
                    onChange={(e) => setEditEstimate(e.target.value)}
                    placeholder="e.g. ₹6,500"
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Follow-Up Date</label>
                  <input
                    type="date"
                    value={editFollowUp}
                    onChange={(e) => setEditFollowUp(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Final Payable Bill (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={500000}
                    value={editPayableAmount}
                    onChange={(e) => setEditPayableAmount(e.target.value)}
                    placeholder="e.g. 6500"
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Payment Status
                  </label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-sm"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Payment Method
                  </label>
                  <input
                    type="text"
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value)}
                    placeholder="Razorpay / UPI / Cash"
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">
                    Payment Ref / UTR
                  </label>
                  <input
                    type="text"
                    value={editPaymentRef}
                    onChange={(e) => setEditPaymentRef(e.target.value)}
                    placeholder="pay_... or UTR"
                    className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Technician Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Inspection findings, parts confirmed, or board rail readings..."
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap gap-2">
                  <a
                    href={buildWhatsAppUrl(
                      selected.whatsapp || selected.mobile,
                      `Hello ${selected.customerName}, Refix Pro (SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007) update for ${selected.enquiryCode} (${selected.macbookModel}): Status: ${editStatus}${editEstimate ? `, Estimate: ${editEstimate}` : ''}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Update
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      openEmailComposer(
                        buildEnquiryEmailDraft(
                          {
                            ...selected,
                            status: editStatus,
                            repairEstimate: editEstimate,
                            followUpDate: editFollowUp,
                            technicianNotes: editNotes,
                          },
                          settings
                        )
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#0066CC]/30 bg-blue-50 text-[#0066CC] hover:bg-blue-100 text-xs font-semibold"
                  >
                    <Mail className="w-4 h-4" />
                    Send Email
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="px-4 py-2 rounded-lg border border-[#D2D2D7] text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
