import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowDownUp, Download, Package, Plus, Search, ShoppingBag, Trash2, Truck, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useErp } from '../../context/ErpContext';
import { extractReadableError } from '../../lib/firebase';
import { downloadCsvFile } from '../../utils/pdfExport';
import { ConfirmDialog } from '../ConfirmDialog';
import { EmptyState, PaginationBar, StatusBadge } from '../ui/DesignSystem';
import type { InventoryItem, PurchaseOrderRecord, StockMovement, SupplierRecord } from '../../types';

const PAGE_SIZE = 12;

const EMPTY_PART: Omit<InventoryItem, 'updatedAt'> = {
  id: '',
  partCode: '',
  name: '',
  compatibleModels: '',
  sku: '',
  supplierName: '',
  purchasePrice: 0,
  sellingPrice: 0,
  quantity: 1,
  minStock: 2,
  location: 'Main Shelf',
  purchaseDate: new Date().toISOString().slice(0, 10),
};

const EMPTY_SUPPLIER: Omit<SupplierRecord, 'createdAt'> = {
  id: '',
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  gstNumber: '',
  notes: '',
};

const EMPTY_PO: Omit<PurchaseOrderRecord, 'createdAt' | 'updatedAt'> = {
  id: '',
  poNumber: '',
  supplierName: '',
  itemsSummary: '',
  totalAmount: 0,
  status: 'Draft',
  expectedDate: '',
  notes: '',
};

export function AdminInventoryTab({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const { isAdmin, hasPermission } = useApp();
  const {
    inventory,
    stockMovements,
    suppliers,
    purchaseOrders,
    saveInventoryItem,
    adjustInventoryStock,
    deleteInventoryItem,
    saveSupplier,
    deleteSupplier,
    savePurchaseOrder,
    deletePurchaseOrder,
  } = useErp();

  const [subTab, setSubTab] = useState<'parts' | 'movements' | 'suppliers' | 'orders'>('parts');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [editingPart, setEditingPart] = useState<Omit<InventoryItem, 'updatedAt'> | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null);
  const [adjustDelta, setAdjustDelta] = useState(1);
  const [adjustType, setAdjustType] = useState<StockMovement['type']>('IN');
  const [adjustNote, setAdjustNote] = useState('');
  const [deletePart, setDeletePart] = useState<InventoryItem | null>(null);

  const [partsPage, setPartsPage] = useState(1);
  const [movementsPage, setMovementsPage] = useState(1);
  const [editingSup, setEditingSup] = useState<Omit<SupplierRecord, 'createdAt'> | null>(null);
  const [isNewSup, setIsNewSup] = useState(false);
  const [deleteSup, setDeleteSup] = useState<SupplierRecord | null>(null);

  const [editingPo, setEditingPo] = useState<Omit<PurchaseOrderRecord, 'createdAt' | 'updatedAt'> | null>(null);
  const [isNewPo, setIsNewPo] = useState(false);
  const [deletePo, setDeletePo] = useState<PurchaseOrderRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredParts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventory.filter((p) => {
      const stockOk = !lowStockOnly || p.quantity <= p.minStock;
      const qOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.compatibleModels.toLowerCase().includes(q) ||
        p.supplierName.toLowerCase().includes(q);
      return stockOk && qOk;
    });
  }, [inventory, search, lowStockOnly]);

  useEffect(() => {
    setPartsPage(1);
  }, [search, lowStockOnly]);

  const partsTotalPages = Math.max(1, Math.ceil(filteredParts.length / PAGE_SIZE));
  const paginatedParts = useMemo(
    () => filteredParts.slice((partsPage - 1) * PAGE_SIZE, partsPage * PAGE_SIZE),
    [filteredParts, partsPage]
  );

  const movementsTotalPages = Math.max(1, Math.ceil(stockMovements.length / PAGE_SIZE));
  const paginatedMovements = useMemo(
    () => stockMovements.slice((movementsPage - 1) * PAGE_SIZE, movementsPage * PAGE_SIZE),
    [stockMovements, movementsPage]
  );

  const valuation = useMemo(() => {
    const costValue = inventory.reduce((s, p) => s + p.purchasePrice * p.quantity, 0);
    const retailValue = inventory.reduce((s, p) => s + p.sellingPrice * p.quantity, 0);
    const lowCount = inventory.filter((p) => p.quantity <= p.minStock).length;
    const totalUnits = inventory.reduce((s, p) => s + p.quantity, 0);
    return { costValue, retailValue, lowCount, totalUnits };
  }, [inventory]);

  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPart || !editingPart.name.trim() || !editingPart.sku.trim()) {
      onNotify('error', 'Part name and SKU are required.');
      return;
    }
    setSaving(true);
    try {
      await saveInventoryItem(editingPart);
      setEditingPart(null);
      onNotify('success', 'Spare part saved to inventory.');
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Failed to save inventory part.'));
    } finally {
      setSaving(false);
    }
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    const signedDelta =
      adjustType === 'OUT' || adjustType === 'REPAIR_USE'
        ? -Math.abs(adjustDelta)
        : adjustType === 'IN'
          ? Math.abs(adjustDelta)
          : adjustDelta;
    setSaving(true);
    try {
      await adjustInventoryStock(adjustTarget, signedDelta, adjustType, adjustNote || `${adjustType} update`);
      setAdjustTarget(null);
      setAdjustNote('');
      onNotify('success', 'Stock quantity updated and ledger recorded.');
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Could not adjust stock.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Valuation KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
          <p className="text-xs text-[#6E6E73]">Total SKUs / Units</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#1D1D1F] mt-1">
            {inventory.length} <span className="text-sm font-normal text-[#6E6E73]">({valuation.totalUnits} qty)</span>
          </p>
        </div>
        <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
          <p className="text-xs text-[#6E6E73]">Low-Stock Alerts</p>
          <p className={`text-2xl font-bold font-mono tabular-nums mt-1 ${valuation.lowCount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
            {valuation.lowCount}
          </p>
        </div>
        <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
          <p className="text-xs text-[#6E6E73]">Stock Cost Valuation</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#1D1D1F] mt-1">
            ₹{valuation.costValue.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="p-5 rounded-xl bg-white border border-[#E5E5EA]">
          <p className="text-xs text-[#6E6E73]">Estimated Retail Value</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#0066CC] mt-1">
            ₹{valuation.retailValue.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-[#D2D2D7] bg-white p-1">
          {([
            { id: 'parts' as const, label: 'Spare Parts Catalog', icon: Package },
            ...(isAdmin
              ? [
                  { id: 'movements' as const, label: 'Stock Movements', icon: ArrowDownUp },
                  { id: 'suppliers' as const, label: 'Suppliers', icon: Truck },
                  { id: 'orders' as const, label: 'Purchase Orders', icon: ShoppingBag },
                ]
              : []),
          ]).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSubTab(t.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  subTab === t.id ? 'bg-[#0F172A] text-white' : 'text-[#424245] hover:text-[#1D1D1F]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {subTab === 'parts' && (
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && hasPermission('inventory', 'export') && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    downloadCsvFile(
                      `refix-pro-inventory-${new Date().toISOString().slice(0, 10)}.csv`,
                      ['Code', 'SKU', 'Part Name', 'Compatible Models', 'Supplier', 'Shelf', 'Qty', 'Min Stock', 'Cost (INR)', 'Selling (INR)', 'Valuation (INR)'],
                      filteredParts.map((p) => [
                        p.partCode,
                        p.sku,
                        p.name,
                        p.compatibleModels,
                        p.supplierName,
                        p.location,
                        p.quantity,
                        p.minStock,
                        p.purchasePrice,
                        p.sellingPrice,
                        p.purchasePrice * p.quantity,
                      ])
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs font-semibold hover:bg-[#F5F5F7]"
                >
                  <Download className="w-3.5 h-3.5 text-[#0066CC]" />
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const lowParts = inventory.filter((p) => p.quantity <= p.minStock);
                    downloadCsvFile(
                      `refix-pro-low-stock-reorder-${new Date().toISOString().slice(0, 10)}.csv`,
                      ['SKU', 'Part Name', 'Supplier', 'Current Qty', 'Min Threshold', 'Suggested Reorder Qty', 'Est. Unit Cost (INR)', 'Est. Reorder Cost (INR)'],
                      lowParts.map((p) => {
                        const reorderQty = Math.max(1, p.minStock * 2 - p.quantity);
                        return [
                          p.sku,
                          p.name,
                          p.supplierName || 'TBD',
                          p.quantity,
                          p.minStock,
                          reorderQty,
                          p.purchasePrice,
                          reorderQty * p.purchasePrice,
                        ];
                      })
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100"
                >
                  <Download className="w-3.5 h-3.5" />
                  Low-Stock Reorder CSV ({valuation.lowCount})
                </button>
              </>
            )}
            {isAdmin && hasPermission('inventory', 'create') && (
              <button
                type="button"
                onClick={() => setEditingPart({ ...EMPTY_PART })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                Add Spare Part
              </button>
            )}
          </div>
        )}
        {subTab === 'movements' && isAdmin && hasPermission('inventory', 'export') && stockMovements.length > 0 && (
          <button
            type="button"
            onClick={() =>
              downloadCsvFile(
                `refix-pro-stock-movements-${new Date().toISOString().slice(0, 10)}.csv`,
                ['SKU', 'Part Name', 'Movement Type', 'Delta', 'Previous Qty', 'Next Qty', 'Job Card', 'Actor', 'Note'],
                stockMovements.map((m) => [
                  m.sku,
                  m.partName,
                  m.type,
                  m.quantityDelta,
                  m.previousQty,
                  m.nextQty,
                  m.jobCardCode || '',
                  m.actorName,
                  m.note,
                ])
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs font-semibold hover:bg-[#F5F5F7]"
          >
            <Download className="w-3.5 h-3.5 text-[#0066CC]" />
            Export Stock Ledger CSV
          </button>
        )}
      </div>

      {/* SPARE PARTS TAB */}
      {subTab === 'parts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search part, SKU, model..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1D1D1F] cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
              />
              Show Low-Stock Only
            </label>
          </div>

          {filteredParts.length === 0 ? (
            <EmptyState
              title="No spare parts match your filter"
              description="Try clearing your SKU/model search or add a new spare part."
              icon={<Package className="w-5 h-5" />}
            />
          ) : (
            <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7] text-xs font-semibold text-[#424245]">
                      <th className="py-3 px-4">SKU / Code</th>
                      <th className="py-3 px-4">Spare Part &amp; Compatibility</th>
                      <th className="py-3 px-4">Shelf</th>
                      <th className="py-3 px-4">Qty / Min</th>
                      <th className="py-3 px-4">Buy / Sell (₹)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA] text-xs sm:text-sm">
                    {paginatedParts.map((part) => {
                      const isLow = part.quantity <= part.minStock;
                      return (
                        <tr key={part.id} className="hover:bg-[#F5F5F7]/60">
                          <td className="py-3 px-4 font-mono whitespace-nowrap">
                            <p className="font-bold text-[#0066CC]">{part.sku}</p>
                            <p className="text-[11px] text-[#6E6E73]">{part.partCode}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-[#1D1D1F]">{part.name}</p>
                            <p className="text-xs text-[#6E6E73]">{part.compatibleModels || 'Universal'}</p>
                          </td>
                          <td className="py-3 px-4 text-xs text-[#424245]">{part.location}</td>
                          <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                            <span className={`font-bold ${isLow ? 'text-red-600' : 'text-emerald-700'}`}>
                              {part.quantity}
                            </span>{' '}
                            <span className="text-[#6E6E73]">/ min {part.minStock}</span>
                            {isLow && (
                              <p className="text-[11px] text-red-600 font-sans font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Reorder
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono tabular-nums text-xs whitespace-nowrap">
                            <p>Cost: ₹{part.purchasePrice.toLocaleString('en-IN')}</p>
                            <p className="font-bold text-[#1D1D1F]">Sell: ₹{part.sellingPrice.toLocaleString('en-IN')}</p>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                            {isAdmin && hasPermission('inventory', 'edit') && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAdjustTarget(part);
                                    setAdjustDelta(1);
                                    setAdjustType('IN');
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#0F172A] hover:bg-black text-white text-xs font-semibold"
                                >
                                  Stock +/-
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPart({ ...part })}
                                  className="px-2.5 py-1.5 rounded-lg border border-[#D2D2D7] text-xs font-semibold hover:bg-[#F5F5F7]"
                                >
                                  Edit
                                </button>
                              </>
                            )}
                            {isAdmin && hasPermission('inventory', 'delete') && (
                              <button
                                type="button"
                                onClick={() => setDeletePart(part)}
                                className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 align-middle"
                                aria-label={`Delete ${part.name}`}
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
                page={partsPage}
                totalPages={partsTotalPages}
                totalItems={filteredParts.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPartsPage}
              />
            </div>
          )}
        </div>
      )}

      {/* STOCK MOVEMENTS LEDGER */}
      {subTab === 'movements' && isAdmin && (
        stockMovements.length === 0 ? (
          <EmptyState
            title="No stock movements logged yet"
            description="Every stock adjustment and Repair Job Card part deduction creates a permanent ledger record here."
            icon={<ArrowDownUp className="w-5 h-5" />}
          />
        ) : (
          <div className="rounded-2xl border border-[#E5E5EA] bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7] text-xs font-semibold text-[#424245]">
                    <th className="py-3 px-4">Part &amp; SKU</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Delta</th>
                    <th className="py-3 px-4">Before → After</th>
                    <th className="py-3 px-4">Actor &amp; Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5EA] text-xs">
                  {paginatedMovements.map((m) => (
                    <tr key={m.id}>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#1D1D1F]">{m.partName}</p>
                        <p className="font-mono text-[#6E6E73]">{m.sku}</p>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          label={m.type}
                          tone={m.quantityDelta >= 0 ? 'success' : 'warning'}
                        />
                      </td>
                      <td className={`py-3 px-4 font-mono font-bold ${m.quantityDelta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                        {m.quantityDelta >= 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums">
                        {m.previousQty} → {m.nextQty}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#1D1D1F]">{m.actorName}</p>
                        <p className="text-[#6E6E73]">{m.note} {m.jobCardCode ? `(${m.jobCardCode})` : ''}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar
              page={movementsPage}
              totalPages={movementsTotalPages}
              totalItems={stockMovements.length}
              pageSize={PAGE_SIZE}
              onPageChange={setMovementsPage}
            />
          </div>
        )
      )}

      {/* SUPPLIERS */}
      {subTab === 'suppliers' && isAdmin && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setIsNewSup(true);
                setEditingSup({ ...EMPTY_SUPPLIER });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
          </div>
          {suppliers.length === 0 ? (
            <EmptyState
              title="No suppliers added yet"
              description="Save wholesale part vendors and GST numbers to track purchase orders."
              icon={<Truck className="w-5 h-5" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((s) => (
                <div key={s.id} className="p-5 rounded-xl bg-white border border-[#E5E5EA] space-y-2 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#1D1D1F]">{s.name}</h3>
                      <p className="text-[#6E6E73]">{s.contactPerson} · {s.phone}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewSup(false);
                          setEditingSup({ ...s });
                        }}
                        className="px-2 py-1 rounded border border-[#D2D2D7] font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteSup(s)}
                        aria-label={`Delete supplier ${s.name}`}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {s.gstNumber && <p className="font-mono text-[#0066CC]">GST: {s.gstNumber}</p>}
                  {s.address && <p className="text-[#424245]">{s.address}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PURCHASE ORDERS */}
      {subTab === 'orders' && isAdmin && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setIsNewPo(true);
                setEditingPo({ ...EMPTY_PO });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              New Purchase Order
            </button>
          </div>
          {purchaseOrders.length === 0 ? (
            <EmptyState
              title="No purchase orders recorded"
              description="Create purchase orders to track incoming MacBook spare part shipments."
              icon={<ShoppingBag className="w-5 h-5" />}
            />
          ) : (
            <div className="rounded-xl border border-[#E5E5EA] bg-white overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7] font-semibold text-[#424245]">
                    <th className="py-3 px-4">PO #</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4">Items Summary</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5EA]">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id}>
                      <td className="py-3 px-4 font-mono font-bold text-[#0066CC]">{po.poNumber}</td>
                      <td className="py-3 px-4 font-semibold">{po.supplierName}</td>
                      <td className="py-3 px-4 max-w-xs truncate">{po.itemsSummary}</td>
                      <td className="py-3 px-4 font-mono font-bold">₹{po.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <StatusBadge label={po.status} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewPo(false);
                            setEditingPo({ ...po });
                          }}
                          className="px-2.5 py-1 rounded border border-[#D2D2D7] font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletePo(po)}
                          aria-label={`Delete PO ${po.poNumber}`}
                          className="p-1 text-red-600 hover:bg-red-50 rounded align-middle"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Part Modal */}
      {editingPart && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <form onSubmit={handleSavePart} className="bg-white rounded-2xl border border-[#E5E5EA] max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <h3 className="text-lg font-bold">{editingPart.id ? 'Edit Spare Part' : 'Add Spare Part'}</h3>
              <button type="button" onClick={() => setEditingPart(null)}><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Part Name *</label>
                <input type="text" required value={editingPart.name} onChange={(e) => setEditingPart({ ...editingPart, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
              </div>
              <div>
                <label className="block font-semibold mb-1">SKU *</label>
                <input type="text" required value={editingPart.sku} onChange={(e) => setEditingPart({ ...editingPart, sku: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Compatible Models</label>
                <input type="text" value={editingPart.compatibleModels} onChange={(e) => setEditingPart({ ...editingPart, compatibleModels: e.target.value })} placeholder="A2337, A2681 MacBook Air M1/M2" className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Purchase Price (₹)</label>
                <input type="number" min={0} value={editingPart.purchasePrice} onChange={(e) => setEditingPart({ ...editingPart, purchasePrice: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Selling Price (₹)</label>
                <input type="number" min={0} value={editingPart.sellingPrice} onChange={(e) => setEditingPart({ ...editingPart, sellingPrice: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Quantity On Hand</label>
                <input type="number" min={0} value={editingPart.quantity} onChange={(e) => setEditingPart({ ...editingPart, quantity: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Minimum Stock Alert</label>
                <input type="number" min={0} value={editingPart.minStock} onChange={(e) => setEditingPart({ ...editingPart, minStock: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Supplier Name</label>
                <input type="text" value={editingPart.supplierName} onChange={(e) => setEditingPart({ ...editingPart, supplierName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Shelf / Bin Location</label>
                <input type="text" value={editingPart.location} onChange={(e) => setEditingPart({ ...editingPart, location: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5EA]">
              <button type="button" onClick={() => setEditingPart(null)} className="px-4 py-2 rounded-lg border border-[#D2D2D7] text-xs font-semibold">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-semibold">{saving ? 'Saving...' : 'Save Part'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <form onSubmit={handleApplyAdjustment} className="bg-white rounded-2xl border border-[#E5E5EA] max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <h3 className="text-base font-bold">Adjust Stock · {adjustTarget.name}</h3>
              <button type="button" onClick={() => setAdjustTarget(null)}><X className="w-5 h-5" /></button>
            </div>
            <p className="text-[#6E6E73]">Current Stock: <strong className="font-mono text-[#1D1D1F]">{adjustTarget.quantity}</strong></p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Movement Type</label>
                <select value={adjustType} onChange={(e) => setAdjustType(e.target.value as StockMovement['type'])} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white">
                  <option value="IN">Stock IN (+)</option>
                  <option value="OUT">Stock OUT (-)</option>
                  <option value="ADJUSTMENT">Manual Adjustment</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Quantity</label>
                <input type="number" min={1} value={adjustDelta} onChange={(e) => setAdjustDelta(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Audit Note</label>
              <input type="text" required value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} placeholder="Restock invoice # or audit reason" className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAdjustTarget(null)} className="px-4 py-2 rounded-lg border border-[#D2D2D7] font-semibold">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[#0066CC] text-white font-semibold">Apply</button>
            </div>
          </form>
        </div>
      )}

      {/* Supplier Modal */}
      {editingSup && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await saveSupplier(editingSup, isNewSup);
                setEditingSup(null);
                onNotify('success', 'Supplier saved.');
              } catch (err) {
                onNotify('error', extractReadableError(err, 'Failed to save supplier.'));
              }
            }}
            className="bg-white rounded-2xl border border-[#E5E5EA] max-w-md w-full p-6 space-y-3 text-xs"
          >
            <h3 className="text-base font-bold">{isNewSup ? 'Add Supplier' : 'Edit Supplier'}</h3>
            <input type="text" required placeholder="Supplier Name *" value={editingSup.name} onChange={(e) => setEditingSup({ ...editingSup, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
            <input type="text" placeholder="Contact Person" value={editingSup.contactPerson} onChange={(e) => setEditingSup({ ...editingSup, contactPerson: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
            <input type="text" placeholder="Phone" value={editingSup.phone} onChange={(e) => setEditingSup({ ...editingSup, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
            <input type="text" placeholder="GST Number" value={editingSup.gstNumber} onChange={(e) => setEditingSup({ ...editingSup, gstNumber: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
            <input type="text" placeholder="Address" value={editingSup.address} onChange={(e) => setEditingSup({ ...editingSup, address: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingSup(null)} className="px-4 py-2 rounded-lg border border-[#D2D2D7]">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#0066CC] text-white font-semibold">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* PO Modal */}
      {editingPo && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await savePurchaseOrder(editingPo, isNewPo);
                setEditingPo(null);
                onNotify('success', 'Purchase Order saved.');
              } catch (err) {
                onNotify('error', extractReadableError(err, 'Failed to save purchase order.'));
              }
            }}
            className="bg-white rounded-2xl border border-[#E5E5EA] max-w-md w-full p-6 space-y-3 text-xs"
          >
            <h3 className="text-base font-bold">{isNewPo ? 'New Purchase Order' : editingPo.poNumber}</h3>
            <input type="text" required placeholder="Supplier Name *" value={editingPo.supplierName} onChange={(e) => setEditingPo({ ...editingPo, supplierName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
            <textarea rows={2} required placeholder="Ordered Parts & Quantities *" value={editingPo.itemsSummary} onChange={(e) => setEditingPo({ ...editingPo, itemsSummary: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={0} placeholder="Total Amount (₹)" value={editingPo.totalAmount} onChange={(e) => setEditingPo({ ...editingPo, totalAmount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
              <select value={editingPo.status} onChange={(e) => setEditingPo({ ...editingPo, status: e.target.value as PurchaseOrderRecord['status'] })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white">
                <option value="Draft">Draft</option>
                <option value="Ordered">Ordered</option>
                <option value="Received">Received</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <input type="date" value={editingPo.expectedDate} onChange={(e) => setEditingPo({ ...editingPo, expectedDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingPo(null)} className="px-4 py-2 rounded-lg border border-[#D2D2D7]">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#0066CC] text-white font-semibold">Save PO</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletePart)}
        title={`Delete Spare Part ${deletePart?.name}?`}
        description="Removes this spare part SKU from active inventory catalog."
        confirmLabel="Delete Part"
        onCancel={() => setDeletePart(null)}
        onConfirm={async () => {
          if (!deletePart) return;
          try {
            await deleteInventoryItem(deletePart.id);
            setDeletePart(null);
            onNotify('success', 'Spare part deleted.');
          } catch (err) {
            onNotify('error', extractReadableError(err, 'Failed to delete spare part.'));
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteSup)}
        title={`Remove Supplier ${deleteSup?.name}?`}
        description="Removes this supplier contact from your vendor directory."
        confirmLabel="Remove Supplier"
        onCancel={() => setDeleteSup(null)}
        onConfirm={async () => {
          if (!deleteSup) return;
          try {
            await deleteSupplier(deleteSup.id);
            setDeleteSup(null);
            onNotify('success', 'Supplier removed.');
          } catch (err) {
            onNotify('error', extractReadableError(err, 'Failed to delete supplier.'));
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deletePo)}
        title={`Delete Purchase Order ${deletePo?.poNumber}?`}
        description="Permanently deletes this purchase order record."
        confirmLabel="Delete PO"
        onCancel={() => setDeletePo(null)}
        onConfirm={async () => {
          if (!deletePo) return;
          try {
            await deletePurchaseOrder(deletePo.id);
            setDeletePo(null);
            onNotify('success', 'Purchase Order deleted.');
          } catch (err) {
            onNotify('error', extractReadableError(err, 'Failed to delete purchase order.'));
          }
        }}
      />
    </div>
  );
}
