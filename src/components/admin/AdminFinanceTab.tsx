import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, FileText, Mail, Plus, Printer, Receipt, Search, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useErp } from '../../context/ErpContext';
import { extractReadableError } from '../../lib/firebase';
import { buildInvoiceEmailDraft } from '../../utils/emailHelper';
import { generatePDF } from '../../utils/generatePDF';
import { downloadCsvFile, openEmailComposer } from '../../utils/pdfExport';
import { ConfirmDialog } from '../ConfirmDialog';
import { EmptyState, PaginationBar, StatusBadge } from '../ui/DesignSystem';
import type { ExpenseRecord, InvoiceRecord } from '../../types';

const PAGE_SIZE = 12;

const EMPTY_INVOICE: Omit<InvoiceRecord, 'createdAt' | 'updatedAt'> = {
  id: '',
  invoiceNumber: '',
  jobCardCode: '',
  enquiryCode: '',
  customerId: '',
  customerUid: '',
  customerName: '',
  customerMobile: '',
  customerEmail: '',
  customerAddress: '',
  deviceSummary: '',
  repairSummary: '',
  serviceCharges: 0,
  partsCharges: 0,
  taxRate: 18,
  taxAmount: 0,
  discount: 0,
  totalAmount: 0,
  amountPaid: 0,
  outstandingAmount: 0,
  status: 'Unpaid',
  warrantyNote: '90 Days Service Warranty on repaired section.',
  issuedDate: new Date().toISOString().slice(0, 10),
};

const EMPTY_EXPENSE: Omit<ExpenseRecord, 'createdAt'> = {
  id: '',
  category: 'Spare Parts',
  description: '',
  amount: 0,
  expenseDate: new Date().toISOString().slice(0, 10),
  paymentMethod: 'UPI',
  referenceNumber: '',
  documentNote: '',
};

export function AdminFinanceTab({
  mode,
  onNotify,
}: {
  mode: 'invoices' | 'expenses';
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const { settings, hasPermission } = useApp();
  const { invoices, expenses, saveInvoice, deleteInvoice, saveExpense, deleteExpense } = useErp();

  const [invSearch, setInvSearch] = useState('');
  const [invStatusFilter, setInvStatusFilter] = useState<string>('All');
  const [invPage, setInvPage] = useState(1);

  const [expSearch, setExpSearch] = useState('');
  const [expCatFilter, setExpCatFilter] = useState<string>('All');
  const [expPage, setExpPage] = useState(1);

  const [editingInv, setEditingInv] = useState<Omit<InvoiceRecord, 'createdAt' | 'updatedAt'> | null>(null);
  const [isNewInv, setIsNewInv] = useState(false);
  const [deleteInvTarget, setDeleteInvTarget] = useState<InvoiceRecord | null>(null);

  const [editingExp, setEditingExp] = useState<Omit<ExpenseRecord, 'createdAt'> | null>(null);
  const [isNewExp, setIsNewExp] = useState(false);
  const [deleteExpTarget, setDeleteExpTarget] = useState<ExpenseRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const summary = useMemo(() => {
    const billed = invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const collected = invoices.reduce((s, i) => s + (Number(i.amountPaid) || 0), 0);
    const outstanding = invoices.reduce((s, i) => s + (Number(i.outstandingAmount) || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return { billed, collected, outstanding, totalExpenses, net: collected - totalExpenses };
  }, [invoices, expenses]);

  const filteredInvoices = useMemo(() => {
    const q = invSearch.trim().toLowerCase();
    return invoices.filter((i) => {
      const statusOk = invStatusFilter === 'All' || i.status === invStatusFilter;
      const qOk =
        !q ||
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q) ||
        i.customerMobile.toLowerCase().includes(q) ||
        i.deviceSummary.toLowerCase().includes(q);
      return statusOk && qOk;
    });
  }, [invoices, invSearch, invStatusFilter]);

  const filteredExpenses = useMemo(() => {
    const q = expSearch.trim().toLowerCase();
    return expenses.filter((e) => {
      const catOk = expCatFilter === 'All' || e.category === expCatFilter;
      const qOk =
        !q ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.referenceNumber || '').toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [expenses, expSearch, expCatFilter]);

  useEffect(() => {
    setInvPage(1);
  }, [invSearch, invStatusFilter]);

  useEffect(() => {
    setExpPage(1);
  }, [expSearch, expCatFilter]);

  const invTotalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const paginatedInvoices = useMemo(
    () => filteredInvoices.slice((invPage - 1) * PAGE_SIZE, invPage * PAGE_SIZE),
    [filteredInvoices, invPage]
  );

  const expTotalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const paginatedExpenses = useMemo(
    () => filteredExpenses.slice((expPage - 1) * PAGE_SIZE, expPage * PAGE_SIZE),
    [filteredExpenses, expPage]
  );

  if (mode === 'expenses') {
    const handleSaveExp = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingExp || !editingExp.description.trim() || editingExp.amount <= 0) {
        onNotify('error', 'Description and positive amount are required.');
        return;
      }
      setSaving(true);
      try {
        await saveExpense(editingExp, isNewExp);
        setEditingExp(null);
        onNotify('success', 'Expense recorded.');
      } catch (err) {
        onNotify('error', extractReadableError(err, 'Failed to save expense.'));
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
            <p className="text-xs text-[#6E6E73]">Total Logged Expenses</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-red-600 mt-1">
              ₹{summary.totalExpenses.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
            <p className="text-xs text-[#6E6E73]">Invoice Collections</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
              ₹{summary.collected.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
            <p className="text-xs text-[#6E6E73]">Net Operating Balance</p>
            <p className={`text-2xl font-bold font-mono tabular-nums mt-1 ${summary.net >= 0 ? 'text-[#0066CC]' : 'text-red-600'}`}>
              ₹{summary.net.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <h2 className="text-lg font-bold text-[#1D1D1F] flex items-center gap-2 mr-2">
              <Receipt className="w-5 h-5 text-[#0066CC]" />
              Expenses ({filteredExpenses.length})
            </h2>
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={expSearch}
                onChange={(e) => setExpSearch(e.target.value)}
                placeholder="Search description, ref..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm"
              />
            </div>
            <select
              value={expCatFilter}
              onChange={(e) => setExpCatFilter(e.target.value)}
              aria-label="Filter expenses by category"
              className="px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm"
            >
              <option value="All">All Categories</option>
              <option value="Spare Parts">Spare Parts</option>
              <option value="Rent & Utilities">Rent & Utilities</option>
              <option value="Tools & Equipment">Tools & Equipment</option>
              <option value="Salaries">Salaries</option>
              <option value="Marketing">Marketing</option>
              <option value="Courier & Logistics">Courier & Logistics</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                downloadCsvFile(
                  `refix-pro-expenses-${new Date().toISOString().slice(0, 10)}.csv`,
                  ['Date', 'Category', 'Description', 'Amount (INR)', 'Method', 'Reference'],
                  filteredExpenses.map((e) => [e.expenseDate, e.category, e.description, e.amount, e.paymentMethod, e.referenceNumber])
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs font-semibold hover:bg-[#F5F5F7]"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            {hasPermission('expenses', 'create') && (
              <button
                type="button"
                onClick={() => {
                  setIsNewExp(true);
                  setEditingExp({ ...EMPTY_EXPENSE });
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                Log Expense
              </button>
            )}
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <EmptyState
            title="No expenses match your filter"
            description="Log spare part purchases, shop rent, or utility outlays to track workshop net margin."
            icon={<Receipt className="w-5 h-5" />}
          />
        ) : (
          <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7] text-xs font-semibold text-[#424245]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Method / Ref</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5EA]">
                  {paginatedExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#F5F5F7]/60">
                      <td className="py-3 px-4 font-mono whitespace-nowrap">{exp.expenseDate}</td>
                      <td className="py-3 px-4">
                        <StatusBadge label={exp.category} tone="neutral" />
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">{exp.description}</td>
                      <td className="py-3 px-4 text-xs text-[#6E6E73]">
                        {exp.paymentMethod} {exp.referenceNumber ? `· ${exp.referenceNumber}` : ''}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-red-600 tabular-nums">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewExp(false);
                            setEditingExp({ ...exp });
                          }}
                          className="px-3 py-1 rounded border border-[#D2D2D7] text-xs font-semibold"
                        >
                          Edit
                        </button>
                        {hasPermission('expenses', 'delete') && (
                          <button
                            type="button"
                            onClick={() => setDeleteExpTarget(exp)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded align-middle"
                            aria-label="Delete expense"
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
              page={expPage}
              totalPages={expTotalPages}
              totalItems={filteredExpenses.length}
              pageSize={PAGE_SIZE}
              onPageChange={setExpPage}
            />
          </div>
        )}

        {editingExp && (
          <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
            <form onSubmit={handleSaveExp} className="bg-white rounded-2xl border border-[#E5E5EA] max-w-md w-full p-6 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
                <h3 className="text-base font-bold">{isNewExp ? 'Record Expense' : 'Edit Expense'}</h3>
                <button type="button" onClick={() => setEditingExp(null)}><X className="w-5 h-5" /></button>
              </div>
              <select value={editingExp.category} onChange={(e) => setEditingExp({ ...editingExp, category: e.target.value as ExpenseRecord['category'] })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white">
                <option value="Spare Parts">Spare Parts</option>
                <option value="Rent & Utilities">Rent & Utilities</option>
                <option value="Tools & Equipment">Tools & Equipment</option>
                <option value="Salaries">Salaries</option>
                <option value="Marketing">Marketing</option>
                <option value="Courier & Logistics">Courier & Logistics</option>
                <option value="Other">Other</option>
              </select>
              <input type="text" required placeholder="Expense Description *" value={editingExp.description} onChange={(e) => setEditingExp({ ...editingExp, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" min={1} required placeholder="Amount (₹)" value={editingExp.amount} onChange={(e) => setEditingExp({ ...editingExp, amount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
                <input type="date" required value={editingExp.expenseDate} onChange={(e) => setEditingExp({ ...editingExp, expenseDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={editingExp.paymentMethod} onChange={(e) => setEditingExp({ ...editingExp, paymentMethod: e.target.value as ExpenseRecord['paymentMethod'] })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white">
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
                <input type="text" placeholder="Reference / Bill #" value={editingExp.referenceNumber} onChange={(e) => setEditingExp({ ...editingExp, referenceNumber: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
              </div>
              <input type="text" placeholder="Notes / Document Ref" value={editingExp.documentNote} onChange={(e) => setEditingExp({ ...editingExp, documentNote: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingExp(null)} className="px-4 py-2 rounded-lg border border-[#D2D2D7]">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[#0066CC] text-white font-semibold">Save</button>
              </div>
            </form>
          </div>
        )}

        <ConfirmDialog
          open={Boolean(deleteExpTarget)}
          title="Delete Expense Entry?"
          description={`Remove ₹${deleteExpTarget?.amount.toLocaleString('en-IN')} (${deleteExpTarget?.description}) from expense records?`}
          confirmLabel="Delete"
          onCancel={() => setDeleteExpTarget(null)}
          onConfirm={async () => {
            if (!deleteExpTarget) return;
            try {
              await deleteExpense(deleteExpTarget.id);
              setDeleteExpTarget(null);
              onNotify('success', 'Expense entry deleted.');
            } catch (err) {
              onNotify('error', extractReadableError(err, 'Failed to delete expense entry.'));
            }
          }}
        />
      </div>
    );
  }

  // INVOICES LEDGER
  const handleSaveInv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInv || !editingInv.customerName.trim()) {
      onNotify('error', 'Customer name is required.');
      return;
    }
    setSaving(true);
    try {
      const saved = await saveInvoice(editingInv, isNewInv);
      setEditingInv(null);
      onNotify('success', `Invoice ${saved.invoiceNumber} saved.`);
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Failed to save invoice.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
          <p className="text-xs text-[#6E6E73]">Total Invoiced</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#1D1D1F] mt-1">
            ₹{summary.billed.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
          <p className="text-xs text-[#6E6E73]">Collected via Invoices</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            ₹{summary.collected.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
          <p className="text-xs text-[#6E6E73]">Outstanding Receivables</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-red-600 mt-1">
            ₹{summary.outstanding.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <h2 className="text-lg font-bold text-[#1D1D1F] flex items-center gap-2 mr-2">
            <FileText className="w-5 h-5 text-[#0066CC]" />
            Invoices ({filteredInvoices.length})
          </h2>
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={invSearch}
              onChange={(e) => setInvSearch(e.target.value)}
              placeholder="Search #, customer, model..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm"
            />
          </div>
          <select
            value={invStatusFilter}
            onChange={(e) => setInvStatusFilter(e.target.value)}
            aria-label="Filter invoices by status"
            className="px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm"
          >
            <option value="All">All Statuses</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              downloadCsvFile(
                `refix-pro-invoices-${new Date().toISOString().slice(0, 10)}.csv`,
                ['Invoice #', 'Date', 'Customer', 'Mobile', 'Device', 'Total', 'Paid', 'Due', 'Status'],
                filteredInvoices.map((i) => [
                  i.invoiceNumber,
                  i.issuedDate,
                  i.customerName,
                  i.customerMobile,
                  i.deviceSummary,
                  i.totalAmount,
                  i.amountPaid,
                  i.outstandingAmount,
                  i.status,
                ])
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs font-semibold hover:bg-[#F5F5F7]"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          {hasPermission('invoices', 'create') && (
            <button
              type="button"
              onClick={() => {
                setIsNewInv(true);
                setEditingInv({
                  ...EMPTY_INVOICE,
                  taxRate: settings.erpConfig?.defaultTaxRate ?? 18,
                });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              Create Invoice
            </button>
          )}
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <EmptyState
          title="No invoices match your filter"
          description='Generate a GST Tax Invoice from any Repair Job Card or click "Create Invoice".'
          icon={<FileText className="w-5 h-5" />}
        />
      ) : (
        <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7] text-xs font-semibold text-[#424245]">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Device &amp; Repair</th>
                  <th className="py-3 px-4">Total / Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]">
                {paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F5F5F7]/60">
                    <td className="py-3 px-4 font-mono font-bold text-[#0066CC] whitespace-nowrap">
                      {inv.invoiceNumber}
                      <p className="text-[11px] font-normal text-[#6E6E73]">{inv.issuedDate}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#1D1D1F]">{inv.customerName}</p>
                      <p className="text-xs font-mono text-[#6E6E73]">{inv.customerMobile}</p>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-medium text-[#1D1D1F] truncate">{inv.deviceSummary}</p>
                      <p className="text-xs text-[#6E6E73] truncate">{inv.repairSummary}</p>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                      <p className="font-bold text-[#1D1D1F]">₹{inv.totalAmount.toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-[#6E6E73]">Paid: ₹{inv.amountPaid.toLocaleString('en-IN')}</p>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge label={inv.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          generatePDF(
                            {
                              type: 'invoice',
                              invoice: inv,
                              settings,
                              emailDraft: buildInvoiceEmailDraft(inv, settings),
                            },
                            'preview'
                          )
                        }
                        title="Preview Branded Invoice PDF"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] text-[#0066CC] text-xs font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          generatePDF(
                            {
                              type: 'invoice',
                              invoice: inv,
                              settings,
                              emailDraft: buildInvoiceEmailDraft(inv, settings),
                            },
                            'print'
                          )
                        }
                        title="Print Tax Invoice PDF"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0F172A] hover:bg-black text-white text-xs font-semibold"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => openEmailComposer(buildInvoiceEmailDraft(inv, settings))}
                        title="Email Tax Invoice to Customer"
                        aria-label={`Email invoice ${inv.invoiceNumber}`}
                        className="p-1.5 rounded-lg border border-[#D2D2D7] hover:bg-[#F5F5F7] text-[#0066CC] align-middle"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewInv(false);
                          setEditingInv({ ...inv });
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-[#D2D2D7] text-xs font-semibold"
                      >
                        Edit
                      </button>
                      {hasPermission('invoices', 'delete') && (
                        <button
                          type="button"
                          onClick={() => setDeleteInvTarget(inv)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded align-middle"
                          aria-label={`Delete invoice ${inv.invoiceNumber}`}
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
            page={invPage}
            totalPages={invTotalPages}
            totalItems={filteredInvoices.length}
            pageSize={PAGE_SIZE}
            onPageChange={setInvPage}
          />
        </div>
      )}

      {editingInv && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveInv} className="bg-white rounded-2xl border border-[#E5E5EA] max-w-2xl w-full p-6 space-y-4 my-8 text-xs">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <h3 className="text-lg font-bold">{isNewInv ? 'Create Tax Invoice' : editingInv.invoiceNumber}</h3>
              <button type="button" onClick={() => setEditingInv(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Customer Name *</label>
                <input type="text" required value={editingInv.customerName} onChange={(e) => setEditingInv({ ...editingInv, customerName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Mobile *</label>
                <input type="text" required value={editingInv.customerMobile} onChange={(e) => setEditingInv({ ...editingInv, customerMobile: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Customer Email</label>
                <input type="email" value={editingInv.customerEmail || ''} onChange={(e) => setEditingInv({ ...editingInv, customerEmail: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Issued Date</label>
                <input type="date" value={editingInv.issuedDate} onChange={(e) => setEditingInv({ ...editingInv, issuedDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Device Summary *</label>
                <input type="text" required value={editingInv.deviceSummary} onChange={(e) => setEditingInv({ ...editingInv, deviceSummary: e.target.value })} placeholder="MacBook Air M2" className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Job Card / Enquiry Code</label>
                <input type="text" value={editingInv.jobCardCode || editingInv.enquiryCode || ''} onChange={(e) => setEditingInv({ ...editingInv, jobCardCode: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Service &amp; Repair Description</label>
                <input type="text" value={editingInv.repairSummary} onChange={(e) => setEditingInv({ ...editingInv, repairSummary: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Service / Labour Charges (₹)</label>
                <input type="number" min={0} value={editingInv.serviceCharges} onChange={(e) => setEditingInv({ ...editingInv, serviceCharges: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Spare Parts Charges (₹)</label>
                <input type="number" min={0} value={editingInv.partsCharges} onChange={(e) => setEditingInv({ ...editingInv, partsCharges: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">GST / Tax Rate (%)</label>
                <input type="number" min={0} max={50} value={editingInv.taxRate} onChange={(e) => setEditingInv({ ...editingInv, taxRate: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Discount (₹)</label>
                <input type="number" min={0} value={editingInv.discount} onChange={(e) => setEditingInv({ ...editingInv, discount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Amount Paid (₹)</label>
                <input type="number" min={0} value={editingInv.amountPaid} onChange={(e) => setEditingInv({ ...editingInv, amountPaid: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Warranty Note</label>
                <input type="text" value={editingInv.warrantyNote} onChange={(e) => setEditingInv({ ...editingInv, warrantyNote: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
              </div>
            </div>
            {(() => {
              const subtotal = (Number(editingInv.serviceCharges) || 0) + (Number(editingInv.partsCharges) || 0);
              const tax = Math.round((subtotal * (Number(editingInv.taxRate) || 0)) / 100);
              const grand = Math.max(0, subtotal + tax - (Number(editingInv.discount) || 0));
              const due = Math.max(0, grand - (Number(editingInv.amountPaid) || 0));
              return (
                <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                  <span>Subtotal: ₹{subtotal.toLocaleString('en-IN')}</span>
                  <span>Tax ({editingInv.taxRate}%): ₹{tax.toLocaleString('en-IN')}</span>
                  <span className="font-bold text-[#1D1D1F]">Total: ₹{grand.toLocaleString('en-IN')}</span>
                  <span className={due > 0 ? 'font-bold text-red-600' : 'font-bold text-emerald-700'}>
                    Due: ₹{due.toLocaleString('en-IN')}
                  </span>
                </div>
              );
            })()}
            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
              <button type="button" onClick={() => setEditingInv(null)} className="px-4 py-2 rounded-lg border border-[#D2D2D7] font-semibold">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-[#0066CC] text-white font-semibold">{saving ? 'Saving...' : 'Save Invoice'}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteInvTarget)}
        title={`Delete Invoice ${deleteInvTarget?.invoiceNumber}?`}
        description="Permanently deletes this invoice document from Firestore."
        confirmLabel="Delete Invoice"
        onCancel={() => setDeleteInvTarget(null)}
        onConfirm={async () => {
          if (!deleteInvTarget) return;
          try {
            await deleteInvoice(deleteInvTarget.id);
            setDeleteInvTarget(null);
            onNotify('success', 'Invoice deleted.');
          } catch (err) {
            onNotify('error', extractReadableError(err, 'Failed to delete invoice.'));
          }
        }}
      />
    </div>
  );
}
