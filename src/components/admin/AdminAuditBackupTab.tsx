import { useMemo, useState } from 'react';
import { Activity, Database, Download, Save, ShieldCheck, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useErp } from '../../context/ErpContext';
import { extractReadableError } from '../../lib/firebase';
import { downloadCsvFile, downloadJsonFile } from '../../utils/pdfExport';
import { ConfirmDialog } from '../ConfirmDialog';
import { DEFAULT_JOB_WORKFLOW_STATUSES, type WebsiteSettings } from '../../types';

export function AdminAuditBackupTab({
  mode,
  onNotify,
}: {
  mode: 'logs' | 'system';
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const {
    settings,
    saveWebsiteSettings,
    isSuperAdmin,
    enquiries,
    adminServices,
    adminModels,
    adminBlogPosts,
    adminReviews,
    contactMessages,
    paymentSubmissions,
    saveService,
    saveMacBookModel,
    saveBlogPost,
    saveReview,
  } = useApp();

  const {
    activityLogs,
    repairJobs,
    customers,
    technicians,
    appointments,
    inventory,
    invoices,
    expenses,
    logActivity,
  } = useErp();

  const [logSearch, setLogSearch] = useState('');
  const [erpForm, setErpForm] = useState(() => ({
    currency: settings.erpConfig?.currency || 'INR (₹)',
    timezone: settings.erpConfig?.timezone || 'Asia/Kolkata',
    dateFormat: settings.erpConfig?.dateFormat || 'DD/MM/YYYY',
    invoicePrefix: settings.erpConfig?.invoicePrefix || 'INV-RP',
    jobCardPrefix: settings.erpConfig?.jobCardPrefix || 'JC-RP',
    gstNumber: settings.erpConfig?.gstNumber || '',
    defaultTaxRate: settings.erpConfig?.defaultTaxRate ?? 18,
    workflowText: (settings.erpConfig?.workflowStatuses || DEFAULT_JOB_WORKFLOW_STATUSES).join('\n'),
    whatsappAlertsEnabled: settings.erpConfig?.whatsappAlertsEnabled !== false,
    emailAlertsEnabled: settings.erpConfig?.emailAlertsEnabled !== false,
  }));
  const [savingConfig, setSavingConfig] = useState(false);

  const [restoreCandidate, setRestoreCandidate] = useState<Record<string, unknown> | null>(null);
  const [restoring, setRestoring] = useState(false);

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    return activityLogs.filter(
      (l) =>
        !q ||
        l.action.toLowerCase().includes(q) ||
        l.actorEmail.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        l.targetCollection.toLowerCase().includes(q)
    );
  }, [activityLogs, logSearch]);

  if (mode === 'logs') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1D1D1F] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#0066CC]" />
              Immutable Security &amp; Activity Audit Logs ({filteredLogs.length})
            </h2>
            <p className="text-xs text-[#6E6E73]">
              Append-only operational trail recording role updates, stock movements, job card changes, and exports.
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="search"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Filter actor, action, target..."
              className="px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs"
            />
            <button
              type="button"
              onClick={() =>
                downloadCsvFile(
                  `refix-pro-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
                  ['Actor Email', 'Role', 'Action', 'Collection', 'Target ID', 'Summary'],
                  filteredLogs.map((l) => [
                    l.actorEmail,
                    l.actorRole,
                    l.action,
                    l.targetCollection,
                    l.targetId,
                    l.summary,
                  ])
                )
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E5EA] bg-white overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7] font-semibold text-[#424245]">
                <th className="py-3 px-4">Actor &amp; Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Collection / Target</th>
                <th className="py-3 px-4">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-[#6E6E73]">
                    No audit entries match your filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F5F5F7]/60">
                    <td className="py-3 px-4">
                      <p className="font-mono font-semibold text-[#1D1D1F]">{log.actorEmail}</p>
                      <p className="text-[11px] text-[#0066CC]">{log.actorRole}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#1D1D1F] whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#6E6E73] whitespace-nowrap">
                      {log.targetCollection} / {log.targetId.slice(0, 14)}
                    </td>
                    <td className="py-3 px-4 text-[#424245]">{log.summary}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ERP SYSTEM CONFIG + BACKUP / RESTORE
  const handleSaveErpConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const nextStatuses = erpForm.workflowText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const nextSettings: WebsiteSettings = {
        ...settings,
        erpConfig: {
          ...(settings.erpConfig || {}),
          currency: erpForm.currency,
          timezone: erpForm.timezone,
          dateFormat: erpForm.dateFormat,
          invoicePrefix: erpForm.invoicePrefix,
          jobCardPrefix: erpForm.jobCardPrefix,
          gstNumber: erpForm.gstNumber,
          defaultTaxRate: Number(erpForm.defaultTaxRate) || 0,
          workflowStatuses: nextStatuses.length > 0 ? nextStatuses : DEFAULT_JOB_WORKFLOW_STATUSES,
          whatsappAlertsEnabled: erpForm.whatsappAlertsEnabled,
          emailAlertsEnabled: erpForm.emailAlertsEnabled,
        },
      };
      await saveWebsiteSettings(nextSettings);
      await logActivity({
        action: 'ERP_CONFIG_UPDATED',
        targetCollection: 'websiteSettings',
        targetId: 'main',
        summary: 'Updated ERP prefixes, tax rate, timezone, and workflow statuses',
      });
      onNotify('success', 'System ERP configuration saved.');
    } catch (err) {
      console.error(err);
      onNotify('error', extractReadableError(err, 'Failed to save ERP settings.'));
    } finally {
      setSavingConfig(false);
    }
  };

  const handleDownloadBackup = async () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      version: 'refixpro-erp-v2',
      websiteSettings: settings,
      services: adminServices,
      macbookModels: adminModels,
      blogPosts: adminBlogPosts,
      reviews: adminReviews,
      repairEnquiries: enquiries,
      repairJobs,
      customers,
      technicians,
      appointments,
      inventory,
      invoices,
      expenses,
      paymentSubmissions,
      contactMessages,
    };
    downloadJsonFile(`refix-pro-full-backup-${new Date().toISOString().slice(0, 10)}.json`, backup);
    await saveWebsiteSettings({
      ...settings,
      erpConfig: { ...(settings.erpConfig || {}), lastBackupAt: new Date().toISOString() },
    });
    await logActivity({
      action: 'DATABASE_BACKUP_EXPORTED',
      targetCollection: 'system',
      targetId: 'backup',
      summary: 'Exported full JSON snapshot of website CMS and Repair ERP collections',
    });
    onNotify('success', 'Full ERP JSON backup downloaded.');
  };

  const handleConfirmRestore = async () => {
    if (!restoreCandidate || !isSuperAdmin) return;
    setRestoring(true);
    try {
      if (restoreCandidate.websiteSettings && typeof restoreCandidate.websiteSettings === 'object') {
        await saveWebsiteSettings(restoreCandidate.websiteSettings as WebsiteSettings);
      }
      if (Array.isArray(restoreCandidate.services)) {
        for (const s of restoreCandidate.services.slice(0, 100)) {
          if (s && typeof s === 'object' && 'id' in s) {
            await saveService(s);
          }
        }
      }
      if (Array.isArray(restoreCandidate.macbookModels)) {
        for (const m of restoreCandidate.macbookModels.slice(0, 100)) {
          if (m && typeof m === 'object' && 'id' in m) {
            await saveMacBookModel(m);
          }
        }
      }
      if (Array.isArray(restoreCandidate.blogPosts)) {
        for (const b of restoreCandidate.blogPosts.slice(0, 50)) {
          if (b && typeof b === 'object' && 'id' in b) {
            await saveBlogPost(b, false);
          }
        }
      }
      if (Array.isArray(restoreCandidate.reviews)) {
        for (const r of restoreCandidate.reviews.slice(0, 100)) {
          if (r && typeof r === 'object' && 'id' in r) {
            await saveReview(r);
          }
        }
      }
      await logActivity({
        action: 'BACKUP_RESTORED',
        targetCollection: 'system',
        targetId: 'restore',
        summary: 'Super Admin restored CMS settings & catalog records from JSON backup',
      });
      setRestoreCandidate(null);
      onNotify('success', 'Website settings and catalog backup restored.');
    } catch (err) {
      console.error(err);
      onNotify('error', 'Backup restore encountered an error.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Health Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#E5E5EA]">
          <p className="text-xs text-[#6E6E73]">Firestore Sync Status</p>
          <p className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Healthy &amp; Active
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E5EA]">
          <p className="text-xs text-[#6E6E73]">Stored ERP Records</p>
          <p className="text-lg font-bold font-mono tabular-nums mt-1">
            {repairJobs.length + customers.length + invoices.length + inventory.length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E5EA]">
          <p className="text-xs text-[#6E6E73]">Audit Trail Events</p>
          <p className="text-lg font-bold font-mono tabular-nums mt-1">{activityLogs.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-[#E5E5EA]">
          <p className="text-xs text-[#6E6E73]">Last Full Backup</p>
          <p className="text-xs font-mono text-[#1D1D1F] mt-1 truncate">
            {settings.erpConfig?.lastBackupAt
              ? new Date(settings.erpConfig.lastBackupAt).toLocaleString('en-IN')
              : 'Not exported yet'}
          </p>
        </div>
      </div>

      {/* ERP Prefixes, GST, Workflow & Notifications */}
      <form onSubmit={handleSaveErpConfig} className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-5 text-xs">
        <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#1D1D1F]">ERP Numbering, Tax, Currency &amp; Workflow</h3>
            <p className="text-[#6E6E73]">Customize GST/tax defaults, Job Card &amp; Invoice prefixes, and workflow stages.</p>
          </div>
          <button
            type="submit"
            disabled={savingConfig}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] text-white font-semibold"
          >
            <Save className="w-4 h-4" />
            {savingConfig ? 'Saving...' : 'Save ERP Config'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block font-semibold mb-1">Currency Display</label>
            <input type="text" value={erpForm.currency} onChange={(e) => setErpForm({ ...erpForm, currency: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Timezone</label>
            <input type="text" value={erpForm.timezone} onChange={(e) => setErpForm({ ...erpForm, timezone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Invoice Prefix</label>
            <input type="text" value={erpForm.invoicePrefix} onChange={(e) => setErpForm({ ...erpForm, invoicePrefix: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Job Card Prefix</label>
            <input type="text" value={erpForm.jobCardPrefix} onChange={(e) => setErpForm({ ...erpForm, jobCardPrefix: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Business GST Number (Optional)</label>
            <input type="text" value={erpForm.gstNumber} onChange={(e) => setErpForm({ ...erpForm, gstNumber: e.target.value })} placeholder="07XXXXX0000X1ZX" className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Default Invoice Tax (%)</label>
            <input type="number" min={0} max={50} value={erpForm.defaultTaxRate} onChange={(e) => setErpForm({ ...erpForm, defaultTaxRate: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-6 pt-4">
            <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
              <input type="checkbox" checked={erpForm.whatsappAlertsEnabled} onChange={(e) => setErpForm({ ...erpForm, whatsappAlertsEnabled: e.target.checked })} />
              WhatsApp Notifications Active
            </label>
            <label className="inline-flex items-center gap-2 font-semibold cursor-pointer">
              <input type="checkbox" checked={erpForm.emailAlertsEnabled} onChange={(e) => setErpForm({ ...erpForm, emailAlertsEnabled: e.target.checked })} />
              In-App &amp; Email Alerts Active
            </label>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Configurable Repair Job Workflow Stages (one per line)</label>
          <textarea
            rows={4}
            value={erpForm.workflowText}
            onChange={(e) => setErpForm({ ...erpForm, workflowText: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono text-xs"
          />
        </div>
      </form>

      {/* Authorized JSON Backup & Restore */}
      <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-4 text-xs">
        <h3 className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
          <Database className="w-5 h-5 text-[#0066CC]" />
          Database Backup &amp; Super Admin Restore
        </h3>
        <p className="text-[#424245]">
          Download a complete JSON snapshot of all Firestore collections (Website Settings, Catalog, Enquiries, Job Cards, Customers, Invoices, Inventory &amp; Expenses). Super Admins can also restore Website Settings and Catalog items from a verified backup JSON.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleDownloadBackup()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-black text-white font-semibold"
          >
            <Download className="w-4 h-4" />
            Download Full JSON Backup
          </button>

          {isSuperAdmin && (
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D2D2D7] bg-white hover:bg-[#F5F5F7] font-semibold cursor-pointer">
              <Upload className="w-4 h-4 text-[#0066CC]" />
              Restore Settings &amp; Catalog from JSON
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const parsed = JSON.parse(text) as Record<string, unknown>;
                    setRestoreCandidate(parsed);
                  } catch {
                    onNotify('error', 'Invalid JSON backup file.');
                  } finally {
                    e.target.value = '';
                  }
                }}
              />
            </label>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(restoreCandidate)}
        destructive={false}
        busy={restoring}
        title="Restore Website Settings & Catalog from Backup?"
        description="This updates Website Settings, Services, MacBook Models, Blogs, and Reviews using the uploaded JSON snapshot."
        confirmLabel="Restore Snapshot"
        onCancel={() => setRestoreCandidate(null)}
        onConfirm={handleConfirmRestore}
      />
    </div>
  );
}
