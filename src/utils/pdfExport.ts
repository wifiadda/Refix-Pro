import type { InvoiceRecord, RepairJobCard, WebsiteSettings } from '../types';
import type { EmailDraftPayload } from './emailHelper';

export function escapeHtml(text: string | number | undefined | null): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

import { generatePDF, type PdfOutputMode } from './generatePDF';

export interface DocumentPreviewRequest {
  title: string;
  filename: string;
  bodyHtml: string;
  pdfBlobUrl?: string;
  onDownloadPdf?: () => void;
  onPrintPdf?: () => void;
  emailDraft?: EmailDraftPayload;
}

export const DOCUMENT_PREVIEW_EVENT = 'refix-open-document-preview';
export const EMAIL_COMPOSER_EVENT = 'refix-open-email-composer';

export function openDocumentPreview(request: DocumentPreviewRequest): void {
  window.dispatchEvent(new CustomEvent<DocumentPreviewRequest>(DOCUMENT_PREVIEW_EVENT, { detail: request }));
}

export function openEmailComposer(draft: EmailDraftPayload): void {
  window.dispatchEvent(new CustomEvent<EmailDraftPayload>(EMAIL_COMPOSER_EVENT, { detail: draft }));
}

export function buildFullHtmlDocument(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0F172A;
      margin: 0;
      padding: 28px;
      font-size: 12px;
      line-height: 1.5;
      background: #FFFFFF;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0F172A;
      padding-bottom: 14px;
      margin-bottom: 18px;
    }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .muted { color: #475569; font-size: 11px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .doc-title { text-align: right; }
    .doc-title h2 { margin: 0; font-size: 16px; color: #0066CC; text-transform: uppercase; letter-spacing: 0.04em; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .box { border: 1px solid #CBD5E1; border-radius: 6px; padding: 12px; background: #F8FAFC; }
    .box h3 { margin: 0 0 6px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #334155; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 14px 0; }
    th, td { border: 1px solid #CBD5E1; padding: 8px 10px; text-align: left; font-size: 11.5px; }
    th { background: #F1F5F9; font-weight: 700; color: #0F172A; }
    .text-right { text-align: right; }
    .totals { width: 280px; margin-left: auto; margin-top: 8px; }
    .totals td { border: none; border-bottom: 1px solid #E2E8F0; padding: 5px 6px; }
    .totals tr.grand td { font-weight: 800; font-size: 14px; border-top: 2px solid #0F172A; border-bottom: 2px solid #0F172A; color: #0F172A; }
    .footer { margin-top: 28px; border-top: 1px solid #CBD5E1; padding-top: 12px; font-size: 10.5px; color: #475569; }
    .signatures { display: flex; justify-content: space-between; margin-top: 36px; }
    .sig-line { width: 200px; border-top: 1px solid #64748B; padding-top: 4px; text-align: center; font-size: 11px; color: #334155; }
    @media print {
      body { padding: 14px; }
    }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

export function triggerDirectPrintHtml(title: string, bodyHtml: string): void {
  const existing = document.getElementById('refix-print-frame');
  if (existing) {
    existing.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'refix-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  const html = buildFullHtmlDocument(title, bodyHtml);
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    window.setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 250);
  }
}

export function downloadHtmlDocument(filename: string, title: string, bodyHtml: string): void {
  const html = buildFullHtmlDocument(title, bodyHtml);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Opens the interactive Print / PDF Preview modal before printing.
 */
export function printHtmlDocument(
  title: string,
  bodyHtml: string,
  options?: { filename?: string; emailDraft?: EmailDraftPayload }
): void {
  openDocumentPreview({
    title,
    bodyHtml,
    filename:
      options?.filename ||
      `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}.html`,
    emailDraft: options?.emailDraft,
  });
}

export function buildJobCardBodyHtml(job: RepairJobCard, settings: WebsiteSettings): string {
  const partsRows =
    job.partsUsed && job.partsUsed.length > 0
      ? job.partsUsed
          .map(
            (p) => `
        <tr>
          <td class="mono">${escapeHtml(p.sku)}</td>
          <td>${escapeHtml(p.partName)}</td>
          <td class="text-right mono">${p.quantity}</td>
          <td class="text-right mono">₹${Number(p.unitPrice).toLocaleString('en-IN')}</td>
          <td class="text-right mono">₹${(Number(p.unitPrice) * Number(p.quantity)).toLocaleString('en-IN')}</td>
        </tr>`
          )
          .join('')
      : `<tr><td colspan="5" class="muted">No spare parts consumed yet</td></tr>`;

  return `
    <div class="header">
      <div>
        <div class="brand">${escapeHtml(settings.businessName || 'Refix Pro')}</div>
        <div class="muted">${escapeHtml(settings.address)}</div>
        <div class="muted">Phone: ${escapeHtml(settings.phone)} · Email: ${escapeHtml(settings.email)}</div>
      </div>
      <div class="doc-title">
        <h2>Repair Job Card</h2>
        <div class="mono" style="font-size:14px;font-weight:700;margin-top:4px;">${escapeHtml(job.jobCardCode)}</div>
        <div class="muted">Status: ${escapeHtml(job.status)}</div>
        ${job.enquiryCode ? `<div class="muted">Booking Ref: ${escapeHtml(job.enquiryCode)}</div>` : ''}
      </div>
    </div>

    <div class="grid-2">
      <div class="box">
        <h3>Customer Information</h3>
        <div><strong>Name:</strong> ${escapeHtml(job.customerName)}</div>
        <div><strong>Mobile:</strong> <span class="mono">${escapeHtml(job.customerMobile)}</span></div>
        ${job.customerEmail ? `<div><strong>Email:</strong> ${escapeHtml(job.customerEmail)}</div>` : ''}
        <div><strong>Approval Status:</strong> ${escapeHtml(job.approvalStatus)}</div>
      </div>
      <div class="box">
        <h3>Apple Device Intake Details</h3>
        <div><strong>Device:</strong> ${escapeHtml(job.deviceType)} – ${escapeHtml(job.macbookModel)}</div>
        <div><strong>Model / Serial:</strong> <span class="mono">${escapeHtml(job.modelNumber || '—')} / ${escapeHtml(job.serialNumber || '—')}</span></div>
        <div><strong>Condition:</strong> ${escapeHtml(job.deviceCondition || 'Standard wear checked')}</div>
        <div><strong>Accessories:</strong> ${escapeHtml(job.accessoriesReceived || 'None')}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="box">
        <h3>Reported Issue &amp; Bench Inspection</h3>
        <div><strong>Reported Problem:</strong> ${escapeHtml(job.reportedProblem || '—')}</div>
        <div style="margin-top:6px;"><strong>Inspection Details:</strong> ${escapeHtml(job.inspectionDetails || 'Pending bench evaluation')}</div>
      </div>
      <div class="box">
        <h3>Diagnosis &amp; Assignment</h3>
        <div><strong>Technician Diagnosis:</strong> ${escapeHtml(job.diagnosis || 'Pending')}</div>
        <div style="margin-top:6px;"><strong>Assigned Technician:</strong> ${escapeHtml(job.technicianName || 'Unassigned')}</div>
        <div><strong>Delivery Target:</strong> ${escapeHtml(job.deliveryDate || 'To be confirmed')}</div>
        <div><strong>Warranty Terms:</strong> ${escapeHtml(job.warrantyPeriod || 'Standard service warranty')}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>SKU</th>
          <th>Spare Part Used</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit Rate</th>
          <th class="text-right">Line Total</th>
        </tr>
      </thead>
      <tbody>${partsRows}</tbody>
    </table>

    <table class="totals">
      <tr>
        <td>Estimated Repair Cost</td>
        <td class="text-right mono">₹${Number(job.estimatedCost || 0).toLocaleString('en-IN')}</td>
      </tr>
      <tr class="grand">
        <td>Final / Approved Cost</td>
        <td class="text-right mono">₹${Number(job.finalCost ?? job.estimatedCost ?? 0).toLocaleString('en-IN')}</td>
      </tr>
    </table>

    <div class="signatures">
      <div class="sig-line">Customer Intake / Pickup Signature</div>
      <div class="sig-line">Refix Pro Authorized Technician</div>
    </div>

    <div class="footer">
      <div><strong>Note:</strong> ${escapeHtml(settings.footerLegalText)} Backup data prior to hardware diagnostics is recommended. Warranty applies strictly to the replaced component or specific circuit repaired.</div>
    </div>
  `;
}

export function buildInvoiceBodyHtml(inv: InvoiceRecord, settings: WebsiteSettings): string {
  const gst = settings.erpConfig?.gstNumber;
  return `
    <div class="header">
      <div>
        <div class="brand">${escapeHtml(settings.businessName || 'Refix Pro')}</div>
        <div class="muted">${escapeHtml(settings.address)}</div>
        <div class="muted">Phone: ${escapeHtml(settings.phone)} · Email: ${escapeHtml(settings.email)}</div>
        ${gst ? `<div class="muted mono">GSTIN: ${escapeHtml(gst)}</div>` : ''}
      </div>
      <div class="doc-title">
        <h2>Repair Tax Invoice &amp; Receipt</h2>
        <div class="mono" style="font-size:14px;font-weight:700;margin-top:4px;">${escapeHtml(inv.invoiceNumber)}</div>
        <div class="muted">Issued Date: ${escapeHtml(inv.issuedDate)}</div>
        <div class="muted">Status: <strong>${escapeHtml(inv.status)}</strong></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="box">
        <h3>Billed To</h3>
        <div><strong>${escapeHtml(inv.customerName)}</strong></div>
        <div>Mobile: <span class="mono">${escapeHtml(inv.customerMobile)}</span></div>
        ${inv.customerEmail ? `<div>Email: ${escapeHtml(inv.customerEmail)}</div>` : ''}
        ${inv.customerAddress ? `<div>Address: ${escapeHtml(inv.customerAddress)}</div>` : ''}
      </div>
      <div class="box">
        <h3>Repair Reference</h3>
        <div><strong>Device:</strong> ${escapeHtml(inv.deviceSummary)}</div>
        ${inv.jobCardCode ? `<div><strong>Job Card ID:</strong> <span class="mono">${escapeHtml(inv.jobCardCode)}</span></div>` : ''}
        ${inv.enquiryCode ? `<div><strong>Enquiry Ref:</strong> <span class="mono">${escapeHtml(inv.enquiryCode)}</span></div>` : ''}
        <div><strong>Warranty:</strong> ${escapeHtml(inv.warrantyNote || '90 Days Service Warranty on replaced parts')}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Amount (INR)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Diagnostic &amp; Repair Service Charges</strong><br/><span class="muted">${escapeHtml(inv.repairSummary || inv.deviceSummary)}</span></td>
          <td class="text-right mono">₹${Number(inv.serviceCharges || 0).toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td>Spare Parts &amp; Hardware Components</td>
          <td class="text-right mono">₹${Number(inv.partsCharges || 0).toLocaleString('en-IN')}</td>
        </tr>
      </tbody>
    </table>

    <table class="totals">
      <tr>
        <td>Tax (${Number(inv.taxRate || 0)}%)</td>
        <td class="text-right mono">₹${Number(inv.taxAmount || 0).toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Discount</td>
        <td class="text-right mono">-₹${Number(inv.discount || 0).toLocaleString('en-IN')}</td>
      </tr>
      <tr class="grand">
        <td>Total Invoice Amount</td>
        <td class="text-right mono">₹${Number(inv.totalAmount || 0).toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Amount Paid</td>
        <td class="text-right mono" style="color:#15803D;font-weight:700;">₹${Number(inv.amountPaid || 0).toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td>Outstanding Balance</td>
        <td class="text-right mono" style="font-weight:700;">₹${Number(inv.outstandingAmount || 0).toLocaleString('en-IN')}</td>
      </tr>
    </table>

    <div class="footer">
      <div>Thank you for choosing ${escapeHtml(settings.businessName)}. ${escapeHtml(settings.footerLegalText)}</div>
    </div>
  `;
}

export function printJobCardDocument(
  job: RepairJobCard,
  settings: WebsiteSettings,
  emailDraft?: EmailDraftPayload,
  mode: PdfOutputMode = 'preview'
): void {
  generatePDF({ type: 'jobCard', job, settings, emailDraft }, mode);
}

export function printInvoiceDocument(
  inv: InvoiceRecord,
  settings: WebsiteSettings,
  emailDraft?: EmailDraftPayload,
  mode: PdfOutputMode = 'preview'
): void {
  generatePDF({ type: 'invoice', invoice: inv, settings, emailDraft }, mode);
}

export function downloadCsvFile(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
): void {
  const escape = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJsonFile(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
