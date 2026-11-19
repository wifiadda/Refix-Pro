import { useEffect, useMemo, useState } from 'react';
import { Download, Plus, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useErp } from '../../context/ErpContext';
import { extractReadableError } from '../../lib/firebase';
import { downloadCsvFile } from '../../utils/pdfExport';
import { ConfirmDialog } from '../ConfirmDialog';
import { Button, EmptyState, PaginationBar, StatusBadge } from '../ui/DesignSystem';
import type { CustomerRecord } from '../../types';

const PAGE_SIZE = 12;

const EMPTY_CUSTOMER: Omit<CustomerRecord, 'createdAt' | 'updatedAt'> = {
  id: '',
  customerCode: '',
  uid: '',
  name: '',
  mobile: '',
  whatsapp: '',
  email: '',
  address: '',
  deviceHistory: [],
  notes: '',
  followUpDate: '',
  totalBusinessValue: 0,
  repairCount: 0,
};

export function AdminCustomersTab({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const { hasPermission, enquiries } = useApp();
  const { customers, repairJobs, invoices, saveCustomer, upsertCustomerFromRecord, deleteCustomer } = useErp();

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'value' | 'repairs'>('recent');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Omit<CustomerRecord, 'createdAt' | 'updatedAt'> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [deviceDraft, setDeviceDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CustomerRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = customers.filter(
      (c) =>
        !q ||
        c.customerCode.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.mobile.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
    if (sortBy === 'value') {
      return [...list].sort((a, b) => b.totalBusinessValue - a.totalBusinessValue);
    }
    if (sortBy === 'repairs') {
      return [...list].sort((a, b) => b.repairCount - a.repairCount);
    }
    return list;
  }, [customers, search, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const handleSyncFromEnquiries = async () => {
    setSyncing(true);
    try {
      let synced = 0;
      for (const e of enquiries) {
        const exists = customers.some(
          (c) =>
            c.mobile.replace(/\D/g, '').slice(-10) === e.mobile.replace(/\D/g, '').slice(-10) ||
            (e.email && c.email.toLowerCase() === e.email.toLowerCase())
        );
        if (!exists) {
          await upsertCustomerFromRecord({
            uid: e.userId,
            name: e.customerName,
            mobile: e.mobile,
            whatsapp: e.whatsapp,
            email: e.email,
            deviceModel: e.macbookModel,
            valueDelta: e.payableAmount || 0,
          });
          synced += 1;
        }
      }
      onNotify(
        'success',
        synced > 0
          ? `Imported ${synced} customer profiles from existing enquiries.`
          : 'All enquiry customers are already in your CRM database.'
      );
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Failed to sync enquiry customers.'));
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.name.trim() || !editing.mobile.trim()) {
      onNotify('error', 'Customer name and mobile number are required.');
      return;
    }
    setSaving(true);
    try {
      await saveCustomer(editing, isNew);
      setEditing(null);
      onNotify('success', `Customer profile saved.`);
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Failed to save customer profile.'));
    } finally {
      setSaving(false);
    }
  };

  const linkedJobs = useMemo(() => {
    if (!editing) return [];
    const key = editing.mobile.replace(/\D/g, '').slice(-10);
    return repairJobs.filter(
      (j) =>
        j.customerId === editing.id ||
        (key && j.customerMobile.replace(/\D/g, '').slice(-10) === key)
    );
  }, [editing, repairJobs]);

  const linkedInvoices = useMemo(() => {
    if (!editing) return [];
    const key = editing.mobile.replace(/\D/g, '').slice(-10);
    return invoices.filter(
      (inv) =>
        inv.customerId === editing.id ||
        (key && inv.customerMobile.replace(/\D/g, '').slice(-10) === key)
    );
  }, [editing, invoices]);

  const handleExportCsv = () => {
    const headers = [
      'Customer ID',
      'Name',
      'Mobile',
      'WhatsApp',
      'Email',
      'Address',
      'Repairs',
      'Lifetime Value (INR)',
      'Follow Up',
    ];
    const rows = filtered.map((c) => [
      c.customerCode,
      c.name,
      c.mobile,
      c.whatsapp,
      c.email,
      c.address,
      c.repairCount,
      c.totalBusinessValue,
      c.followUpDate,
    ]);
    downloadCsvFile(`refix-pro-customers-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, name, mobile, email..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'value' | 'repairs')}
            aria-label="Sort customers"
            className="px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm"
          >
            <option value="recent">Sort: Most Recent</option>
            <option value="value">Sort: Highest Business Value</option>
            <option value="repairs">Sort: Most Repairs</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={syncing}
            onClick={() => void handleSyncFromEnquiries()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#0066CC]" />
            {syncing ? 'Syncing...' : 'Sync from Enquiries'}
          </button>

          {hasPermission('customers', 'export') && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}

          {hasPermission('customers', 'create') && (
            <button
              type="button"
              onClick={() => {
                setIsNew(true);
                setEditing({ ...EMPTY_CUSTOMER });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          )}
        </div>
      </div>

      {/* Customer CRM Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No customers found"
          description='Try adjusting your search or click "Sync from Enquiries" to import existing booking contacts.'
          icon={<Users className="w-5 h-5" />}
          action={
            hasPermission('customers', 'create') ? (
              <Button
                type="button"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setIsNew(true);
                  setEditing({ ...EMPTY_CUSTOMER });
                }}
              >
                Add Customer
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
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Name &amp; Contact</th>
                  <th className="py-3 px-4">Device History</th>
                  <th className="py-3 px-4">Repairs</th>
                  <th className="py-3 px-4">Lifetime Value</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA] text-xs sm:text-sm">
                {paginated.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F5F5F7]/60">
                    <td className="py-3 px-4 font-mono font-bold text-[#0066CC] whitespace-nowrap">
                      {c.customerCode}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#1D1D1F]">{c.name}</p>
                      <p className="text-xs font-mono text-[#6E6E73]">
                        {c.mobile} {c.email ? `· ${c.email}` : ''}
                      </p>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-xs text-[#424245] truncate">
                        {c.deviceHistory?.length ? c.deviceHistory.join(', ') : 'No devices listed'}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">{c.repairCount}</td>
                    <td className="py-3 px-4 font-mono font-bold tabular-nums text-emerald-700">
                      ₹{c.totalBusinessValue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNew(false);
                          setEditing({ ...c });
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
                      >
                        View / Edit
                      </button>
                      {hasPermission('customers', 'delete') && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(c)}
                          aria-label={`Delete customer ${c.name}`}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 align-middle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl border border-[#E5E5EA] max-w-3xl w-full p-6 space-y-5 my-8 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between border-b border-[#E5E5EA] pb-3">
              <div>
                <p className="text-xs font-mono text-[#0066CC] font-semibold">
                  {isNew ? 'New Customer Profile' : editing.customerCode}
                </p>
                <h3 className="text-xl font-bold text-[#1D1D1F]">
                  {isNew ? 'Create CRM Record' : editing.name}
                </h3>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-[#F5F5F7]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Mobile *</label>
                <input
                  type="text"
                  required
                  value={editing.mobile}
                  onChange={(e) => setEditing({ ...editing, mobile: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={editing.whatsapp}
                  onChange={(e) => setEditing({ ...editing, whatsapp: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Email</label>
                <input
                  type="email"
                  value={editing.email}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Address</label>
                <input
                  type="text"
                  value={editing.address}
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Follow-Up Reminder Date</label>
                <input
                  type="date"
                  value={editing.followUpDate}
                  onChange={(e) => setEditing({ ...editing, followUpDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Lifetime Value (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={editing.totalBusinessValue}
                  onChange={(e) => setEditing({ ...editing, totalBusinessValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono"
                />
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-semibold">Registered Devices</label>
              <div className="flex flex-wrap gap-1.5">
                {editing.deviceHistory.map((d, idx) => (
                  <span key={`${d}-${idx}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F5F5F7] border border-[#D2D2D7]">
                    {d}
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          deviceHistory: editing.deviceHistory.filter((_, i) => i !== idx),
                        })
                      }
                      className="text-red-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={deviceDraft}
                  onChange={(e) => setDeviceDraft(e.target.value)}
                  placeholder="Add MacBook / iPad model..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#D2D2D7]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!deviceDraft.trim()) return;
                    setEditing({
                      ...editing,
                      deviceHistory: [...editing.deviceHistory, deviceDraft.trim()],
                    });
                    setDeviceDraft('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#0F172A] text-white font-semibold"
                >
                  Add Device
                </button>
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold mb-1">CRM Notes</label>
              <textarea
                rows={2}
                value={editing.notes}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
              />
            </div>

            {!isNew && (linkedJobs.length > 0 || linkedInvoices.length > 0) && (
              <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-2 text-xs">
                <p className="font-bold text-[#1D1D1F]">
                  Linked Repair History ({linkedJobs.length} Jobs · {linkedInvoices.length} Invoices)
                </p>
                {linkedJobs.map((j) => (
                  <div key={j.id} className="flex items-center justify-between gap-2">
                    <span>
                      <span className="font-mono text-[#0066CC] font-semibold mr-1.5">{j.jobCardCode}</span>
                      {j.macbookModel}
                    </span>
                    <StatusBadge label={j.status} />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-[#D2D2D7] text-xs font-semibold">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete Customer ${deleteTarget?.name}?`}
        description="This deletes the CRM profile record. Linked invoices and job cards are preserved."
        confirmLabel="Delete Customer"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteCustomer(deleteTarget.id);
            setDeleteTarget(null);
            onNotify('success', 'Customer record deleted.');
          } catch (err) {
            onNotify('error', extractReadableError(err, 'Failed to delete customer record.'));
          }
        }}
      />
    </div>
  );
}
