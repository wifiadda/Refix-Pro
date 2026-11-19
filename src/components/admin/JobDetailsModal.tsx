import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Download,
  Eye,
  FileText,
  History,
  Laptop,
  Mail,
  MessageCircle,
  Package,
  Phone,
  Printer,
  Send,
  ShieldCheck,
  Upload,
  User,
  Wrench,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useErp } from '../../context/ErpContext';
import { extractReadableError } from '../../lib/firebase';
import { compressImageToDataUrl, buildWhatsAppUrl, buildTelHref } from '../../utils/whatsapp';
import { buildInvoiceEmailDraft, buildJobCardEmailDraft } from '../../utils/emailHelper';
import { generatePDF } from '../../utils/generatePDF';
import { openEmailComposer } from '../../utils/pdfExport';
import {
  Button,
  InputField,
  Modal,
  SelectField,
  StatusBadge,
  Tabs,
  TextareaField,
} from '../ui/DesignSystem';
import {
  DEFAULT_JOB_WORKFLOW_STATUSES,
  PRIMARY_WORKFLOW_TIMELINE,
  type JobWorkflowStatus,
  type PaymentStatus,
  type RepairJobCard,
} from '../../types';

export type JobDetailTabKey =
  | 'overview'
  | 'customer'
  | 'device'
  | 'diagnosis'
  | 'estimate'
  | 'parts'
  | 'payments'
  | 'timeline'
  | 'documents';

const DEFAULT_QC = {
  displayTested: false,
  batteryTested: false,
  portsTested: false,
  thermalTested: false,
  backupVerified: false,
  cleanFinish: false,
};

const QC_ITEMS: { key: keyof typeof DEFAULT_QC; label: string; hint: string }[] = [
  { key: 'displayTested', label: 'Display, TrueTone & Backlight Check', hint: 'Verify uniform brightness, hinge tension & zero dead pixels' },
  { key: 'batteryTested', label: 'Battery Cycle & USB-C Charging Rails', hint: 'Confirm 20V PD negotiation and stable battery draw' },
  { key: 'portsTested', label: 'Ports, Wi-Fi, Bluetooth & Audio I/O', hint: 'Test Thunderbolt, headphone jack, speakers & mic' },
  { key: 'thermalTested', label: '30-Min Thermal Stress & Fan Curve', hint: 'Verify sustained load temps with zero throttling' },
  { key: 'backupVerified', label: 'macOS Boot, FileVault & Customer Data Safe', hint: 'Confirm clean boot and data integrity' },
  { key: 'cleanFinish', label: 'Ultrasonic / Chassis Clean & Screw Torque', hint: 'All bottom case screws secured, zero smudges' },
];

export function JobDetailsModal({
  job,
  isNew,
  initialTab = 'overview',
  onClose,
  onSaved,
  onNotify,
  onNavigateTab,
}: {
  job: Omit<RepairJobCard, 'createdAt' | 'updatedAt'>;
  isNew: boolean;
  initialTab?: JobDetailTabKey;
  onClose: () => void;
  onSaved: (saved?: RepairJobCard) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
  onNavigateTab?: (module: 'customers' | 'invoices' | 'payments') => void;
}) {
  const { settings, isAdmin, isFrontDeskStaff, isTechnician, paymentSubmissions, hasPermission } = useApp();
  const {
    inventory,
    technicians,
    invoices,
    activityLogs,
    stockMovements,
    saveRepairJob,
    updateJobAsTechnician,
    consumePartInJob,
    generateInvoiceFromJob,
    pushNotification,
  } = useErp();

  const [editing, setEditing] = useState<Omit<RepairJobCard, 'createdAt' | 'updatedAt'>>({
    ...job,
    qualityChecklist: job.qualityChecklist || { ...DEFAULT_QC },
  });
  const [activeTab, setActiveTab] = useState<JobDetailTabKey>(initialTab);
  const [saving, setSaving] = useState(false);

  const [consumePartId, setConsumePartId] = useState('');
  const [consumeQty, setConsumeQty] = useState(1);
  const [consuming, setConsuming] = useState(false);
  const [sendingEstimate, setSendingEstimate] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  const isTechOnly = isTechnician && !isAdmin && !isFrontDeskStaff;
  const canManageParts = !isNew && Boolean(editing.id);

  const workflowOptions = useMemo(() => {
    const custom = settings.erpConfig?.workflowStatuses;
    return custom && custom.length > 0 ? (custom as JobWorkflowStatus[]) : DEFAULT_JOB_WORKFLOW_STATUSES;
  }, [settings.erpConfig?.workflowStatuses]);

  const relatedInvoices = useMemo(
    () =>
      invoices.filter(
        (inv) =>
          (editing.jobCardCode && inv.jobCardCode === editing.jobCardCode) ||
          (editing.enquiryCode && inv.enquiryCode === editing.enquiryCode)
      ),
    [invoices, editing.jobCardCode, editing.enquiryCode]
  );

  const relatedPayments = useMemo(
    () =>
      paymentSubmissions.filter(
        (p) =>
          (editing.jobCardCode && p.jobCardCode === editing.jobCardCode) ||
          (editing.enquiryCode && p.enquiryCode === editing.enquiryCode)
      ),
    [paymentSubmissions, editing.jobCardCode, editing.enquiryCode]
  );

  const relatedLogs = useMemo(
    () =>
      activityLogs.filter(
        (log) =>
          (editing.id && log.targetId === editing.id) ||
          (editing.jobCardCode && log.summary.includes(editing.jobCardCode))
      ),
    [activityLogs, editing.id, editing.jobCardCode]
  );

  const relatedStockMoves = useMemo(
    () =>
      stockMovements.filter(
        (m) => editing.jobCardCode && m.jobCardCode === editing.jobCardCode
      ),
    [stockMovements, editing.jobCardCode]
  );

  const partsTotal = useMemo(
    () =>
      (editing.partsUsed || []).reduce(
        (sum, p) => sum + (Number(p.unitPrice) || 0) * (Number(p.quantity) || 1),
        0
      ),
    [editing.partsUsed]
  );

  const qcCompletedCount = useMemo(() => {
    const qc = editing.qualityChecklist || DEFAULT_QC;
    return QC_ITEMS.filter((i) => qc[i.key]).length;
  }, [editing.qualityChecklist]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.customerName.trim() || !editing.macbookModel.trim()) {
      onNotify('error', 'Customer name and Apple device model are required.');
      return;
    }
    setSaving(true);
    try {
      if (isTechOnly) {
        await updateJobAsTechnician(editing.id, {
          inspectionDetails: editing.inspectionDetails,
          diagnosis: editing.diagnosis,
          status: editing.status,
          qualityChecklist: editing.qualityChecklist,
          beforeImages: editing.beforeImages,
          afterImages: editing.afterImages,
          internalNotes: editing.internalNotes,
          customerUpdates: editing.customerUpdates,
        });
        onNotify('success', `Bench update saved for ${editing.jobCardCode}.`);
        onSaved();
      } else {
        const saved = await saveRepairJob(editing, isNew);
        onNotify('success', `Job Card ${saved.jobCardCode} saved.`);
        onSaved(saved);
      }
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Could not save job card. Verify permissions and fields.'));
    } finally {
      setSaving(false);
    }
  };

  const handleConsumePart = async () => {
    if (!editing.id || !consumePartId) return;
    const part = inventory.find((p) => p.id === consumePartId);
    if (!part) return;
    setConsuming(true);
    try {
      await consumePartInJob(editing as RepairJobCard, part, consumeQty);
      const nextParts = [
        ...(editing.partsUsed || []),
        {
          partId: part.id,
          sku: part.sku,
          partName: part.name,
          quantity: consumeQty,
          unitPrice: part.sellingPrice,
        },
      ];
      setEditing({ ...editing, partsUsed: nextParts });
      setConsumePartId('');
      setConsumeQty(1);
      onNotify('success', `Allocated ${consumeQty}× ${part.name} and deducted stock.`);
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Stock allocation failed.'));
    } finally {
      setConsuming(false);
    }
  };

  const handleSendEstimateToCustomer = async () => {
    if (!editing.id) return;
    setSendingEstimate(true);
    try {
      const nextJob = {
        ...editing,
        approvalStatus: 'Pending' as const,
        status: 'Awaiting Approval' as JobWorkflowStatus,
      };
      const saved = await saveRepairJob(nextJob, false);
      setEditing(saved);
      await pushNotification({
        recipientUid: saved.customerUid || undefined,
        recipientEmail: saved.customerEmail || undefined,
        audience: 'customer',
        title: `Repair Estimate Ready · ${saved.jobCardCode}`,
        message: `Your repair estimate of ₹${(saved.finalCost || saved.estimatedCost || 0).toLocaleString('en-IN')} is ready for approval in your Customer Portal.`,
        category: 'estimate',
        relatedCode: saved.jobCardCode,
      });
      onNotify('success', `Estimate sent & status updated to "Awaiting Approval".`);
      if (saved.customerEmail) {
        openEmailComposer(buildJobCardEmailDraft(saved, settings));
      }
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Failed to send estimate notification.'));
    } finally {
      setSendingEstimate(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!editing.id) return;
    setGeneratingInvoice(true);
    try {
      const taxRate = settings.erpConfig?.defaultTaxRate ?? 18;
      const inv = await generateInvoiceFromJob(editing as RepairJobCard, taxRate, 0);
      onNotify('success', `Generated invoice ${inv.invoiceNumber}.`);
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Could not generate invoice.'));
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handleUploadImage = async (field: 'beforeImages' | 'afterImages', file: File) => {
    try {
      const url = await compressImageToDataUrl(file, 900, 0.72);
      setEditing({
        ...editing,
        [field]: [...(editing[field] || []), url].slice(0, 6),
      });
    } catch {
      onNotify('error', 'Could not compress image.');
    }
  };

  const tabItems: { id: JobDetailTabKey; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'customer', label: 'Customer', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'device', label: 'Device', icon: <Laptop className="w-3.5 h-3.5" /> },
    { id: 'diagnosis', label: 'Diagnosis', icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
    { id: 'estimate', label: 'Estimate', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'parts', label: `Parts (${editing.partsUsed?.length || 0})`, icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { id: 'timeline', label: 'Timeline', icon: <History className="w-3.5 h-3.5" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  const primaryStageIdx = PRIMARY_WORKFLOW_TIMELINE.indexOf(editing.status);

  return (
    <Modal
      open
      onClose={onClose}
      maxWidth="max-w-5xl"
      title={isNew ? 'Create Repair Job Card' : `${editing.jobCardCode} · ${editing.customerName}`}
      subtitle={
        isNew
          ? 'Log customer, Apple hardware inspection, and assignment details'
          : `${editing.macbookModel} · Status: ${editing.status} · Estimate: ₹${(editing.finalCost || editing.estimatedCost || 0).toLocaleString('en-IN')}`
      }
      footer={
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {!isNew && editing.id && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Eye className="w-3.5 h-3.5 text-[#0066CC]" />}
                  onClick={() =>
                    generatePDF(
                      {
                        type: 'jobCard',
                        job: editing as RepairJobCard,
                        settings,
                        emailDraft: buildJobCardEmailDraft(editing as RepairJobCard, settings),
                      },
                      'preview'
                    )
                  }
                >
                  Preview PDF
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Printer className="w-3.5 h-3.5" />}
                  onClick={() =>
                    generatePDF(
                      {
                        type: 'jobCard',
                        job: editing as RepairJobCard,
                        settings,
                        emailDraft: buildJobCardEmailDraft(editing as RepairJobCard, settings),
                      },
                      'print'
                    )
                  }
                >
                  Print PDF
                </Button>
                {!isTechOnly && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<Mail className="w-3.5 h-3.5 text-[#0066CC]" />}
                    onClick={() => openEmailComposer(buildJobCardEmailDraft(editing as RepairJobCard, settings))}
                  >
                    Email Customer
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              type="submit"
              form="job-details-form"
              variant="primary"
              size="sm"
              loading={saving}
            >
              {isNew ? 'Create Job Card' : 'Save Changes'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="job-details-form" onSubmit={handleSave} className="space-y-5">
        <Tabs items={tabItems} value={activeTab} onChange={setActiveTab} variant="underline" />

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
                <p className="text-[11px] text-[#6E6E73]">Workflow Stage</p>
                <div className="mt-1.5">
                  <StatusBadge label={editing.status} />
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
                <p className="text-[11px] text-[#6E6E73]">Estimate Approval</p>
                <div className="mt-1.5">
                  <StatusBadge label={editing.approvalStatus} />
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
                <p className="text-[11px] text-[#6E6E73]">Final / Est. Total</p>
                <p className="text-base font-bold font-mono tabular-nums text-[#1D1D1F] mt-1">
                  ₹{(editing.finalCost || editing.estimatedCost || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
                <p className="text-[11px] text-[#6E6E73]">QC Checklist</p>
                <p className="text-base font-bold font-mono tabular-nums text-[#0066CC] mt-1">
                  {qcCompletedCount} / {QC_ITEMS.length} Passed
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <SelectField
                label="Workflow Status"
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as JobWorkflowStatus })}
              >
                {workflowOptions.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Assigned Technician"
                disabled={isTechOnly}
                value={editing.technicianName || ''}
                onChange={(e) => {
                  const tech = technicians.find((t) => t.name === e.target.value);
                  setEditing({
                    ...editing,
                    technicianName: tech ? tech.name : e.target.value,
                    technicianUid: tech?.uid || '',
                  });
                }}
              >
                <option value="">Unassigned (Bench Queue)</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name} ({t.availability})
                  </option>
                ))}
              </SelectField>

              <InputField
                label="Target Delivery Date"
                type="date"
                disabled={isTechOnly}
                value={editing.deliveryDate || ''}
                onChange={(e) => setEditing({ ...editing, deliveryDate: e.target.value })}
              />

              <InputField
                label="Warranty Coverage"
                disabled={isTechOnly}
                value={editing.warrantyPeriod || ''}
                onChange={(e) => setEditing({ ...editing, warrantyPeriod: e.target.value })}
                placeholder="90 Days Service Warranty"
              />

              <InputField
                label="Warranty Expiry Date"
                type="date"
                disabled={isTechOnly}
                value={editing.warrantyExpiry || ''}
                onChange={(e) => setEditing({ ...editing, warrantyExpiry: e.target.value })}
              />

              <SelectField
                label="Payment Status"
                disabled={isTechOnly}
                value={editing.paymentStatus}
                onChange={(e) => setEditing({ ...editing, paymentStatus: e.target.value as PaymentStatus })}
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Pending Verification">Pending Verification</option>
                <option value="Partial">Partial</option>
                <option value="Paid">Paid</option>
                <option value="Refunded">Refunded</option>
              </SelectField>
            </div>

            <TextareaField
              label="Customer-Visible Desk Update"
              rows={3}
              value={editing.customerUpdates}
              onChange={(e) => setEditing({ ...editing, customerUpdates: e.target.value })}
              placeholder="Visible directly inside Customer Portal & sent on status notifications..."
            />
          </div>
        )}

        {/* TAB 2: CUSTOMER */}
        {activeTab === 'customer' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="Customer Full Name"
                required
                disabled={isTechOnly}
                value={editing.customerName}
                onChange={(e) => setEditing({ ...editing, customerName: e.target.value })}
              />
              <InputField
                label="Mobile Number"
                required
                disabled={isTechOnly}
                value={editing.customerMobile}
                onChange={(e) => setEditing({ ...editing, customerMobile: e.target.value })}
                className="font-mono"
              />
              <InputField
                label="Customer Email"
                type="email"
                disabled={isTechOnly}
                value={editing.customerEmail || ''}
                onChange={(e) => setEditing({ ...editing, customerEmail: e.target.value })}
              />
              <InputField
                label="Linked Booking / Enquiry Reference"
                disabled={isTechOnly}
                value={editing.enquiryCode || ''}
                onChange={(e) => setEditing({ ...editing, enquiryCode: e.target.value })}
                placeholder="RP-XXXXXX"
                className="font-mono"
              />
            </div>

            {!isTechOnly && editing.customerMobile && (
              <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#424245]">
                  <p className="font-semibold text-[#1D1D1F]">Quick Customer Reachout</p>
                  <p>Contact {editing.customerName} directly regarding {editing.jobCardCode || 'this repair'}.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={buildTelHref(editing.customerMobile)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[#D2D2D7] text-xs font-semibold text-[#1D1D1F] hover:bg-[#F5F5F7]"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#0066CC]" />
                    Call Customer
                  </a>
                  <a
                    href={buildWhatsAppUrl(
                      editing.customerMobile,
                      `Hello ${editing.customerName}, update on your Refix Pro Job Card ${editing.jobCardCode || ''} (${editing.macbookModel}): Current status is "${editing.status}".`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp Update
                  </a>
                  {onNavigateTab && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        onClose();
                        onNavigateTab('customers');
                      }}
                    >
                      Open CRM Record
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DEVICE */}
        {activeTab === 'device' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SelectField
                label="Device Category"
                disabled={isTechOnly}
                value={editing.deviceType}
                onChange={(e) =>
                  setEditing({ ...editing, deviceType: e.target.value as RepairJobCard['deviceType'] })
                }
              >
                <option value="MacBook">MacBook</option>
                <option value="iPad">iPad</option>
                <option value="iPhone">iPhone</option>
                <option value="Other Apple">Other Apple</option>
              </SelectField>
              <InputField
                label="Device Model"
                required
                disabled={isTechOnly}
                value={editing.macbookModel}
                onChange={(e) => setEditing({ ...editing, macbookModel: e.target.value })}
                placeholder="MacBook Pro M2 14-inch"
              />
              <InputField
                label="Model Code (A-Number)"
                disabled={isTechOnly}
                value={editing.modelNumber || ''}
                onChange={(e) => setEditing({ ...editing, modelNumber: e.target.value })}
                placeholder="A2442"
                className="font-mono"
              />
              <InputField
                label="Serial Number"
                disabled={isTechOnly}
                value={editing.serialNumber || ''}
                onChange={(e) => setEditing({ ...editing, serialNumber: e.target.value })}
                placeholder="C02XXXXXXXX"
                className="font-mono"
              />
            </div>

            <InputField
              label="Accessories Received at Counter"
              disabled={isTechOnly}
              value={editing.accessoriesReceived}
              onChange={(e) => setEditing({ ...editing, accessoriesReceived: e.target.value })}
              placeholder="e.g., 67W USB-C Charger + Sleeve"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextareaField
                label="Customer Reported Problem"
                rows={3}
                disabled={isTechOnly}
                value={editing.reportedProblem}
                onChange={(e) => setEditing({ ...editing, reportedProblem: e.target.value })}
              />
              <TextareaField
                label="Physical Intake Condition"
                rows={3}
                disabled={isTechOnly}
                value={editing.deviceCondition}
                onChange={(e) => setEditing({ ...editing, deviceCondition: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* TAB 4: DIAGNOSIS & QC */}
        {activeTab === 'diagnosis' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextareaField
                label="Bench Inspection Findings"
                rows={3}
                value={editing.inspectionDetails}
                onChange={(e) => setEditing({ ...editing, inspectionDetails: e.target.value })}
                placeholder="Power rail voltages, liquid indicators, connector condition..."
              />
              <TextareaField
                label="Confirmed Technical Diagnosis"
                rows={3}
                value={editing.diagnosis}
                onChange={(e) => setEditing({ ...editing, diagnosis: e.target.value })}
                placeholder="Root cause, faulty IC/rail or display assembly..."
              />
            </div>

            <TextareaField
              label="Internal Technician Bench Notes (Staff Only)"
              rows={2}
              value={editing.internalNotes}
              onChange={(e) => setEditing({ ...editing, internalNotes: e.target.value })}
              placeholder="Not shown to customer. Log board schematic refs, donor board notes..."
            />

            {/* 6-Point Quality Check Checklist */}
            <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#1D1D1F]">
                  6-Point Post-Repair Quality Control Checklist
                </p>
                <span className="text-xs font-mono font-semibold text-[#0066CC]">
                  {qcCompletedCount}/{QC_ITEMS.length} verified
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {QC_ITEMS.map((item) => {
                  const checked = Boolean(editing.qualityChecklist?.[item.key]);
                  return (
                    <label
                      key={item.key}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                        checked
                          ? 'bg-emerald-50/80 border-emerald-200'
                          : 'bg-white border-[#E5E5EA] hover:border-[#D2D2D7]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            qualityChecklist: {
                              ...(editing.qualityChecklist || DEFAULT_QC),
                              [item.key]: e.target.checked,
                            },
                          })
                        }
                        className="mt-0.5 rounded border-[#D2D2D7] text-[#0066CC]"
                      />
                      <div className="text-xs">
                        <p className="font-semibold text-[#1D1D1F]">{item.label}</p>
                        <p className="text-[11px] text-[#6E6E73]">{item.hint}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Before & After Photos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {(['beforeImages', 'afterImages'] as const).map((field) => (
                <div key={field} className="p-3.5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1D1D1F]">
                      {field === 'beforeImages' ? 'Before Repair Photos' : 'After Repair Photos'}
                    </span>
                    <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#D2D2D7] cursor-pointer font-semibold hover:bg-[#F5F5F7]">
                      <Upload className="w-3.5 h-3.5 text-[#0066CC]" />
                      Add Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleUploadImage(field, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  {(editing[field] || []).length === 0 ? (
                    <p className="text-[11px] text-[#6E6E73]">No photos uploaded yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(editing[field] || []).map((url, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={url}
                            alt={`${field} ${idx + 1}`}
                            className="w-16 h-16 rounded-lg object-cover border border-[#D2D2D7]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setEditing({
                                ...editing,
                                [field]: editing[field].filter((_, i) => i !== idx),
                              })
                            }
                            aria-label="Remove image"
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: ESTIMATE & CUSTOMER APPROVAL */}
        {activeTab === 'estimate' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField
                label="Estimated Repair Cost (₹)"
                type="number"
                min={0}
                disabled={isTechOnly}
                value={editing.estimatedCost}
                onChange={(e) => setEditing({ ...editing, estimatedCost: Number(e.target.value) })}
                className="font-mono"
              />
              <InputField
                label="Final Billed Cost (₹)"
                type="number"
                min={0}
                disabled={isTechOnly}
                value={editing.finalCost ?? editing.estimatedCost}
                onChange={(e) => setEditing({ ...editing, finalCost: Number(e.target.value) })}
                className="font-mono"
              />
              <SelectField
                label="Customer Approval Decision"
                disabled={isTechOnly}
                value={editing.approvalStatus}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    approvalStatus: e.target.value as RepairJobCard['approvalStatus'],
                  })
                }
              >
                <option value="Not Sent">Not Sent</option>
                <option value="Pending">Pending Customer Approval</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </SelectField>
            </div>

            <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-[#1D1D1F]">
                  Parts Subtotal: ₹{partsTotal.toLocaleString('en-IN')} · Est. Labour:{' '}
                  ₹{Math.max(0, (editing.finalCost || editing.estimatedCost || 0) - partsTotal).toLocaleString('en-IN')}
                </p>
                <p className="text-[#6E6E73] mt-0.5">
                  Sending an estimate updates status to &ldquo;Awaiting Approval&rdquo; and alerts the customer inside their Customer Portal.
                </p>
              </div>
              {!isTechOnly && !isNew && editing.id && (
                <Button
                  type="button"
                  variant="dark"
                  size="sm"
                  loading={sendingEstimate}
                  icon={<Send className="w-3.5 h-3.5" />}
                  onClick={() => void handleSendEstimateToCustomer()}
                >
                  Send Estimate to Customer
                </Button>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: SPARE PARTS */}
        {activeTab === 'parts' && (
          <div className="space-y-4">
            {editing.partsUsed && editing.partsUsed.length > 0 ? (
              <div className="rounded-xl border border-[#E5E5EA] overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5F5F7] border-b border-[#E5E5EA] font-semibold text-[#424245]">
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Spare Part</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5EA]">
                    {editing.partsUsed.map((p, idx) => (
                      <tr key={`${p.partId}-${idx}`}>
                        <td className="py-2.5 px-3 font-mono text-[#0066CC]">{p.sku}</td>
                        <td className="py-2.5 px-3 font-medium text-[#1D1D1F]">{p.partName}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">{p.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          ₹{Number(p.unitPrice).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                          ₹{(Number(p.unitPrice) * Number(p.quantity)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[#6E6E73] p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
                No spare parts have been deducted for this job card yet.
              </p>
            )}

            {canManageParts ? (
              <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-3 text-xs">
                <p className="font-bold text-[#1D1D1F]">Allocate Spare Part &amp; Deduct Stock Atomically</p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={consumePartId}
                    onChange={(e) => setConsumePartId(e.target.value)}
                    className="flex-1 min-w-[220px] min-h-[40px] px-3 py-2 rounded-xl border border-[#D2D2D7] bg-white"
                  >
                    <option value="">Select inventory spare part...</option>
                    {inventory
                      .filter((i) => i.quantity > 0)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.sku}) · Stock: {item.quantity} · ₹{item.sellingPrice}
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={consumeQty}
                    onChange={(e) => setConsumeQty(Number(e.target.value))}
                    className="w-20 min-h-[40px] px-3 py-2 rounded-xl border border-[#D2D2D7] bg-white font-mono"
                  />
                  <Button
                    type="button"
                    variant="dark"
                    size="sm"
                    loading={consuming}
                    disabled={!consumePartId}
                    onClick={() => void handleConsumePart()}
                  >
                    Deduct Stock
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                Save the new Job Card first before allocating spare parts from inventory.
              </p>
            )}
          </div>
        )}

        {/* TAB 7: PAYMENTS & INVOICES */}
        {activeTab === 'payments' && (
          <div className="space-y-5 text-xs">
            <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[#6E6E73]">Job Card Payment Status</p>
                <div className="mt-1 flex items-center gap-3">
                  <StatusBadge label={editing.paymentStatus} />
                  <span className="font-mono font-bold text-sm text-[#1D1D1F]">
                    Billable: ₹{(editing.finalCost || editing.estimatedCost || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              {!isTechOnly && !isNew && editing.id && hasPermission('invoices', 'create') && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={generatingInvoice}
                  icon={<FileText className="w-3.5 h-3.5" />}
                  onClick={() => void handleCreateInvoice()}
                >
                  Generate Tax Invoice
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <p className="font-bold text-[#1D1D1F]">Linked Tax Invoices ({relatedInvoices.length})</p>
              {relatedInvoices.length === 0 ? (
                <p className="text-[#6E6E73] p-3 rounded-xl border border-[#E5E5EA]">
                  No invoice issued for {editing.jobCardCode || 'this job'} yet.
                </p>
              ) : (
                <div className="divide-y divide-[#E5E5EA] border border-[#E5E5EA] rounded-xl">
                  {relatedInvoices.map((inv) => (
                    <div key={inv.id} className="p-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-mono font-bold text-[#0066CC]">{inv.invoiceNumber}</p>
                        <p className="text-[#6E6E73]">
                          Issued: {inv.issuedDate} · Paid: ₹{inv.amountPaid.toLocaleString('en-IN')} · Due: ₹
                          {inv.outstandingAmount.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={inv.status} />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5 text-[#0066CC]" />}
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
                        >
                          Preview
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          icon={<Printer className="w-3.5 h-3.5" />}
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
                        >
                          Print PDF
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isTechOnly && (
              <div className="space-y-2">
                <p className="font-bold text-[#1D1D1F]">Submitted Payments ({relatedPayments.length})</p>
                {relatedPayments.length === 0 ? (
                  <p className="text-[#6E6E73] p-3 rounded-xl border border-[#E5E5EA]">
                    No online or UPI payment receipts logged for this reference yet.
                  </p>
                ) : (
                  <div className="divide-y divide-[#E5E5EA] border border-[#E5E5EA] rounded-xl">
                    {relatedPayments.map((pay) => (
                      <div key={pay.id} className="p-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[#1D1D1F]">
                            {pay.method} · <span className="font-mono">{pay.transactionRef}</span>
                          </p>
                          <p className="text-[#6E6E73]">Paid ₹{Number(pay.amount).toLocaleString('en-IN')}</p>
                        </div>
                        <StatusBadge label={pay.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {PRIMARY_WORKFLOW_TIMELINE.map((step, i) => {
                const done = primaryStageIdx >= i;
                const current = primaryStageIdx === i;
                return (
                  <div
                    key={step}
                    className={`p-2.5 rounded-xl border text-center ${
                      current
                        ? 'bg-[#0066CC] text-white border-[#0066CC]'
                        : done
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-[#F5F5F7] text-[#6E6E73] border-[#E5E5EA]'
                    }`}
                  >
                    <p className="font-mono text-[10px] opacity-80">{String(i + 1).padStart(2, '0')}</p>
                    <p className="font-semibold text-[11px] truncate">{step}</p>
                  </div>
                );
              })}
            </div>

            {relatedStockMoves.length > 0 && (
              <div className="space-y-2">
                <p className="font-bold text-[#1D1D1F]">Stock Consumption History</p>
                <div className="divide-y divide-[#E5E5EA] border border-[#E5E5EA] rounded-xl">
                  {relatedStockMoves.map((m) => (
                    <div key={m.id} className="p-3 flex items-center justify-between gap-2">
                      <span>
                        <span className="font-mono text-[#0066CC] mr-1.5">{m.sku}</span>
                        {m.partName} ({m.quantityDelta}) · by {m.actorName}
                      </span>
                      <span className="text-[#6E6E73]">{m.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="font-bold text-[#1D1D1F]">Job Activity Log</p>
              {relatedLogs.length === 0 ? (
                <p className="text-[#6E6E73] p-3 rounded-xl border border-[#E5E5EA]">
                  Activity events are logged automatically whenever staff or customers update this job card.
                </p>
              ) : (
                <div className="divide-y divide-[#E5E5EA] border border-[#E5E5EA] rounded-xl">
                  {relatedLogs.map((log) => (
                    <div key={log.id} className="p-3 flex items-center justify-between gap-2">
                      <span className="text-[#1D1D1F]">{log.summary}</span>
                      <span className="font-mono text-[11px] text-[#6E6E73] shrink-0">
                        {log.actorEmail}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 9: DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="space-y-4 text-xs">
            {isNew || !editing.id ? (
              <p className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] text-[#6E6E73]">
                Save this Job Card first to preview, print, or email official PDF documents.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#E5E5EA] bg-white space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#1D1D1F]">
                    <Printer className="w-4 h-4 text-[#0066CC]" />
                    Official Repair Job Card PDF
                  </div>
                  <p className="text-[#6E6E73]">
                    Includes customer intake details, MacBook serial number, parts used, technician diagnosis, and dual signature block.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() =>
                        generatePDF(
                          {
                            type: 'jobCard',
                            job: editing as RepairJobCard,
                            settings,
                            emailDraft: buildJobCardEmailDraft(editing as RepairJobCard, settings),
                          },
                          'preview'
                        )
                      }
                    >
                      Preview PDF
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={<Printer className="w-3.5 h-3.5" />}
                      onClick={() =>
                        generatePDF(
                          {
                            type: 'jobCard',
                            job: editing as RepairJobCard,
                            settings,
                            emailDraft: buildJobCardEmailDraft(editing as RepairJobCard, settings),
                          },
                          'print'
                        )
                      }
                    >
                      Print PDF
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={<Download className="w-3.5 h-3.5 text-[#0066CC]" />}
                      onClick={() =>
                        generatePDF(
                          {
                            type: 'jobCard',
                            job: editing as RepairJobCard,
                            settings,
                            emailDraft: buildJobCardEmailDraft(editing as RepairJobCard, settings),
                          },
                          'download'
                        )
                      }
                    >
                      Download
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#E5E5EA] bg-white space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#1D1D1F]">
                    <Mail className="w-4 h-4 text-[#0066CC]" />
                    Customer Update / Estimate Email
                  </div>
                  <p className="text-[#6E6E73]">
                    Opens pre-filled email composer with Job Card summary, current stage, cost breakdown, and Customer Portal link.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isTechOnly}
                    icon={<Mail className="w-3.5 h-3.5 text-[#0066CC]" />}
                    onClick={() => openEmailComposer(buildJobCardEmailDraft(editing as RepairJobCard, settings))}
                  >
                    Compose Customer Email
                  </Button>
                </div>

                <div className="p-4 rounded-xl border border-[#E5E5EA] bg-white space-y-3 sm:col-span-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-[#1D1D1F]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Service Warranty Summary
                    </div>
                    <StatusBadge label={editing.warrantyPeriod || '90 Days Service Warranty'} tone="info" />
                  </div>
                  <p className="text-[#424245]">
                    <strong>Covered Device:</strong> {editing.macbookModel}{' '}
                    {editing.serialNumber ? `(Serial: ${editing.serialNumber})` : ''} ·{' '}
                    <strong>Expiry Date:</strong> {editing.warrantyExpiry || 'Starts upon delivery'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </Modal>
  );
}
