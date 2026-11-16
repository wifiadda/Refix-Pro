import { useMemo, useState } from 'react';
import { Download, MessageCircle, Search, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ENQUIRY_STATUSES, EnquiryStatus, PaymentStatus, RepairEnquiry } from '../../types';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

export function AdminEnquiriesTab({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const { enquiries, updateEnquiry, deleteEnquiry } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selected, setSelected] = useState<RepairEnquiry | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [editStatus, setEditStatus] = useState<EnquiryStatus>('New');
  const [editNotes, setEditNotes] = useState('');
  const [editEstimate, setEditEstimate] = useState('');
  const [editFollowUp, setEditFollowUp] = useState('');
  const [editPayableAmount, setEditPayableAmount] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('Unpaid');
  const [editPaymentMethod, setEditPaymentMethod] = useState('');
  const [editPaymentRef, setEditPaymentRef] = useState('');
  const [saving, setSaving] = useState(false);

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
      console.error(err);
      onNotify('error', 'Failed to update enquiry.');
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
      console.error(err);
      onNotify('error', 'Failed to delete enquiry.');
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

        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Download CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[#E5E5EA] bg-white overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7] text-xs font-semibold text-[#424245]">
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">MacBook & Service</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Estimate</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5EA] text-xs sm:text-sm">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[#6E6E73]">
                  No repair enquiries match your current filter.
                </td>
              </tr>
            ) : (
              filtered.map((enq) => (
                <tr key={enq.id} className="hover:bg-[#F5F5F7]/60">
                  <td className="py-3 px-4 font-mono font-semibold tabular-nums whitespace-nowrap">
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
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-[#1D1D1F]">
                    {enq.status}
                  </td>
                  <td className="py-3 px-4 font-mono tabular-nums text-xs text-[#424245]">
                    <p>{enq.repairEstimate || '—'}</p>
                    {enq.payableAmount && enq.payableAmount > 0 ? (
                      <p
                        className={`text-[11px] font-semibold mt-0.5 ${
                          enq.paymentStatus === 'Paid'
                            ? 'text-emerald-700'
                            : enq.paymentStatus === 'Pending Verification'
                              ? 'text-amber-700'
                              : 'text-[#0066CC]'
                        }`}
                      >
                        Bill: ₹{enq.payableAmount.toLocaleString('en-IN')} ({enq.paymentStatus || 'Unpaid'})
                      </p>
                    ) : null}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                    <button
                      type="button"
                      onClick={() => openDetail(enq)}
                      className="px-3 py-1.5 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
                    >
                      Manage
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
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(enq.id)}
                      aria-label={`Delete enquiry ${enq.enquiryCode}`}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E5E5EA] max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#1D1D1F]">Delete Repair Enquiry?</h3>
            <p className="text-sm text-[#424245]">
              This action permanently removes the enquiry record from Firestore.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-[#D2D2D7] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Send Status on WhatsApp
                </a>
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
