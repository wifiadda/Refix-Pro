import { useMemo, useState } from 'react';
import { BarChart3, Download, IndianRupee, Package, Printer, TrendingUp, Wallet } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useErp } from '../../context/ErpContext';
import { downloadCsvFile, printHtmlDocument } from '../../utils/pdfExport';
import { Button, EmptyState, KpiCard } from '../ui/DesignSystem';

function toMillis(val: unknown): number {
  if (!val) return 0;
  if (typeof val === 'object' && val !== null && 'toMillis' in val && typeof (val as { toMillis: () => number }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  if (typeof val === 'string') {
    const p = Date.parse(val);
    return Number.isNaN(p) ? 0 : p;
  }
  return 0;
}

export function AdminReportsTab() {
  const { settings, enquiries, paymentSubmissions } = useApp();
  const { repairJobs, customers, technicians, inventory, invoices, expenses } = useErp();

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('monthly');

  const cutoffMs = useMemo(() => {
    const now = Date.now();
    if (period === 'daily') return now - 86400000;
    if (period === 'weekly') return now - 7 * 86400000;
    if (period === 'monthly') return now - 30 * 86400000;
    if (period === 'yearly') return now - 365 * 86400000;
    return 0;
  }, [period]);

  const report = useMemo(() => {
    const inPeriod = (val: unknown) => {
      if (period === 'all') return true;
      const ms = toMillis(val);
      return !ms || ms >= cutoffMs;
    };

    const scopedPayments = paymentSubmissions.filter((p) => inPeriod(p.createdAt));
    const scopedJobs = repairJobs.filter((j) => inPeriod(j.createdAt || j.updatedAt));
    const scopedEnquiries = enquiries.filter((e) => inPeriod(e.createdAt));
    const scopedExpenses = expenses.filter((e) => inPeriod(e.expenseDate));

    const collectedRevenue = scopedPayments
      .filter((p) => p.status === 'Verified Paid')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const totalExpenses = scopedExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const outstandingBalance = invoices
      .filter((i) => i.status === 'Unpaid' || i.status === 'Partial')
      .reduce((s, i) => s + (Number(i.outstandingAmount) || 0), 0);

    const inventoryCost = inventory.reduce((s, i) => s + i.purchasePrice * i.quantity, 0);
    const completedCount =
      scopedJobs.filter((j) => ['Delivered', 'Completed'].includes(j.status)).length +
      scopedEnquiries.filter((e) => e.status === 'Completed').length;

    const techBreakdown = technicians.map((t) => {
      const assigned = scopedJobs.filter((j) => j.technicianName === t.name || j.technicianUid === t.uid);
      const done = assigned.filter((j) => ['Delivered', 'Completed', 'Ready for Delivery'].includes(j.status));
      const estRevenue = done.reduce((s, j) => s + (j.finalCost || j.estimatedCost || 0), 0);
      return {
        name: t.name,
        total: assigned.length,
        completed: done.length,
        revenue: estRevenue,
      };
    });

    const expenseByCategory = Object.entries(
      scopedExpenses.reduce<Record<string, number>>((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + (Number(e.amount) || 0);
        return acc;
      }, {})
    );

    return {
      collectedRevenue,
      totalExpenses,
      netProfit: collectedRevenue - totalExpenses,
      outstandingBalance,
      inventoryCost,
      totalEnquiries: scopedEnquiries.length,
      totalJobs: scopedJobs.length,
      completedCount,
      newCustomers: customers.filter((c) => inPeriod(c.createdAt)).length,
      techBreakdown,
      expenseByCategory,
    };
  }, [period, cutoffMs, paymentSubmissions, repairJobs, enquiries, expenses, invoices, inventory, technicians, customers]);

  const handleExportReportCsv = () => {
    const headers = ['Metric', 'Period', 'Value'];
    const rows: [string, string, string | number][] = [
      ['Collected Revenue (INR)', period, report.collectedRevenue],
      ['Operating Expenses (INR)', period, report.totalExpenses],
      ['Net Operating Margin (INR)', period, report.netProfit],
      ['Outstanding Receivables (INR)', period, report.outstandingBalance],
      ['Inventory Stock Cost Valuation (INR)', period, report.inventoryCost],
      ['Repair Enquiries', period, report.totalEnquiries],
      ['Job Cards Created', period, report.totalJobs],
      ['Repairs Completed', period, report.completedCount],
      ['New CRM Customers', period, report.newCustomers],
    ];
    downloadCsvFile(`refix-pro-business-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const handleExportFinancialCsv = () => {
    const headers = [
      'Invoice Number',
      'Job Card Code',
      'Customer Name',
      'Mobile',
      'Device',
      'Issued Date',
      'Status',
      'Service Charges (INR)',
      'Parts Charges (INR)',
      'Tax Amount (INR)',
      'Discount (INR)',
      'Total Amount (INR)',
      'Amount Paid (INR)',
      'Outstanding Balance (INR)',
    ];
    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      inv.jobCardCode || '',
      inv.customerName,
      inv.customerMobile,
      inv.deviceSummary,
      inv.issuedDate,
      inv.status,
      inv.serviceCharges,
      inv.partsCharges,
      inv.taxAmount,
      inv.discount,
      inv.totalAmount,
      inv.amountPaid,
      inv.outstandingAmount,
    ]);
    downloadCsvFile(`refix-pro-financial-invoices-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const handleExportExpensesCsv = () => {
    const headers = ['Date', 'Category', 'Description', 'Method', 'Reference', 'Amount (INR)'];
    const rows = expenses.map((exp) => [
      exp.expenseDate,
      exp.category,
      exp.description,
      exp.paymentMethod,
      exp.referenceNumber || '',
      exp.amount,
    ]);
    downloadCsvFile(`refix-pro-expenses-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const handleExportInventoryCsv = () => {
    const headers = [
      'Part Code',
      'SKU',
      'Spare Part Name',
      'Compatible Models',
      'Supplier',
      'Shelf Location',
      'Stock Qty',
      'Min Threshold',
      'Reorder Status',
      'Unit Cost (INR)',
      'Selling Price (INR)',
      'Total Cost Valuation (INR)',
    ];
    const rows = inventory.map((item) => [
      item.partCode,
      item.sku,
      item.name,
      item.compatibleModels,
      item.supplierName,
      item.location,
      item.quantity,
      item.minStock,
      item.quantity <= 0 ? 'OUT OF STOCK' : item.quantity <= item.minStock ? 'LOW STOCK' : 'OK',
      item.purchasePrice,
      item.sellingPrice,
      item.purchasePrice * item.quantity,
    ]);
    downloadCsvFile(`refix-pro-inventory-report-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
  };

  const handlePrintPdf = () => {
    printHtmlDocument(
      `Refix Pro Business Report (${period})`,
      `<div class="header">
        <div>
          <div class="brand">${settings.businessName}</div>
          <div class="muted">${settings.address}</div>
        </div>
        <div class="doc-title">
          <h2>Executive Business Report</h2>
          <div>Period: <strong>${period.toUpperCase()}</strong></div>
          <div>Generated: ${new Date().toLocaleDateString('en-IN')}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Business Metric</th><th class="text-right">Value</th></tr></thead>
        <tbody>
          <tr><td>Verified Collected Revenue</td><td class="text-right mono">₹${report.collectedRevenue.toLocaleString('en-IN')}</td></tr>
          <tr><td>Operating Expenses</td><td class="text-right mono">₹${report.totalExpenses.toLocaleString('en-IN')}</td></tr>
          <tr><td>Net Operating Balance</td><td class="text-right mono"><strong>₹${report.netProfit.toLocaleString('en-IN')}</strong></td></tr>
          <tr><td>Outstanding Customer Invoices</td><td class="text-right mono">₹${report.outstandingBalance.toLocaleString('en-IN')}</td></tr>
          <tr><td>Spare Parts Inventory Valuation</td><td class="text-right mono">₹${report.inventoryCost.toLocaleString('en-IN')}</td></tr>
          <tr><td>Total Enquiries / Job Cards</td><td class="text-right mono">${report.totalEnquiries} / ${report.totalJobs}</td></tr>
          <tr><td>Completed Repairs</td><td class="text-right mono">${report.completedCount}</td></tr>
          <tr><td>New CRM Customers</td><td class="text-right mono">${report.newCustomers}</td></tr>
        </tbody>
      </table>`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex flex-wrap rounded-xl border border-[#D2D2D7] bg-white p-1">
          {([
            { id: 'daily', label: 'Daily' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' },
            { id: 'yearly', label: 'Yearly' },
            { id: 'all', label: 'All Time' },
          ] as const).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                period === p.id ? 'bg-[#0F172A] text-white' : 'text-[#424245] hover:text-[#1D1D1F]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportReportCsv}
          >
            Export CSV
          </Button>
          <Button
            type="button"
            variant="dark"
            size="md"
            icon={<Printer className="w-4 h-4" />}
            onClick={handlePrintPdf}
          >
            Preview &amp; Print PDF Report
          </Button>
        </div>
      </div>

      {/* Dedicated Financial & Inventory CSV Export Suite */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E5EA] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[#1D1D1F]">Financial &amp; Inventory CSV Exports</h3>
          <p className="text-xs text-[#6E6E73] mt-0.5">
            Download accounting-ready CSV spreadsheets for GST billing, expenses, and spare-parts stock valuation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5 text-[#0066CC]" />}
            onClick={handleExportFinancialCsv}
          >
            Invoices &amp; Tax CSV ({invoices.length})
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5 text-[#0066CC]" />}
            onClick={handleExportExpensesCsv}
          >
            Expenses CSV ({expenses.length})
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5 text-[#0066CC]" />}
            onClick={handleExportInventoryCsv}
          >
            Inventory Valuation CSV ({inventory.length})
          </Button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Collected Revenue"
          value={`₹${report.collectedRevenue.toLocaleString('en-IN')}`}
          hint={`${report.completedCount} completed repairs · ${report.newCustomers} new customers`}
          icon={<IndianRupee className="w-4 h-4 text-emerald-600" />}
          tone="success"
        />
        <KpiCard
          label="Operating Expenses"
          value={`₹${report.totalExpenses.toLocaleString('en-IN')}`}
          hint={`${report.expenseByCategory.length} expense categories`}
          icon={<Wallet className="w-4 h-4 text-red-600" />}
          tone="danger"
        />
        <KpiCard
          label="Net Operating Margin"
          value={`₹${report.netProfit.toLocaleString('en-IN')}`}
          hint={`Receivables due: ₹${report.outstandingBalance.toLocaleString('en-IN')}`}
          icon={<TrendingUp className="w-4 h-4 text-[#0066CC]" />}
          tone={report.netProfit >= 0 ? 'info' : 'danger'}
        />
        <KpiCard
          label="Inventory Cost Value"
          value={`₹${report.inventoryCost.toLocaleString('en-IN')}`}
          hint={`${inventory.length} SKU items stocked`}
          icon={<Package className="w-4 h-4 text-[#1D1D1F]" />}
          tone="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technician Performance Breakdown */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-4">
          <h3 className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#0066CC]" />
            Technician Output &amp; Completion
          </h3>
          {report.techBreakdown.length === 0 ? (
            <EmptyState
              title="No technicians configured yet"
              description="Add technicians under the Staff & Technicians tab to track assigned job completion and revenue contribution."
            />
          ) : (
            <div className="divide-y divide-[#E5E5EA] text-xs">
              {report.techBreakdown.map((t) => (
                <div key={t.name} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#1D1D1F]">{t.name}</p>
                    <p className="text-[#6E6E73] tabular-nums">
                      Assigned: {t.total} · Completed: {t.completed}
                    </p>
                  </div>
                  <p className="font-mono font-bold text-emerald-700 tabular-nums">
                    ₹{t.revenue.toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense Breakdown */}
        <div className="p-6 rounded-2xl bg-white border border-[#E5E5EA] space-y-4">
          <h3 className="text-base font-bold text-[#1D1D1F]">Expense Category Analysis</h3>
          {report.expenseByCategory.length === 0 ? (
            <EmptyState
              title="No expenses logged in this window"
              description="Expenses recorded in Invoices & Finance will appear here by category."
            />
          ) : (
            <div className="space-y-3.5 text-xs">
              {report.expenseByCategory.map(([cat, amt]) => {
                const pct = report.totalExpenses > 0 ? Math.round((amt / report.totalExpenses) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold text-[#1D1D1F]">{cat}</span>
                      <span className="font-mono tabular-nums text-[#424245]">
                        ₹{amt.toLocaleString('en-IN')} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#F5F5F7] overflow-hidden">
                      <div className="h-full bg-[#0F172A] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
