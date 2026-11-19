import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InvoiceRecord, RepairJobCard, WebsiteSettings } from '../types';
import type { EmailDraftPayload } from './emailHelper';
import {
  buildInvoiceBodyHtml,
  buildJobCardBodyHtml,
  openDocumentPreview,
} from './pdfExport';

export type PdfOutputMode = 'preview' | 'print' | 'download' | 'blob';

export type PdfDocumentPayload =
  | {
      type: 'jobCard';
      job: RepairJobCard;
      settings: WebsiteSettings;
      emailDraft?: EmailDraftPayload;
    }
  | {
      type: 'invoice';
      invoice: InvoiceRecord;
      settings: WebsiteSettings;
      emailDraft?: EmailDraftPayload;
    };

export interface GeneratedPdfResult {
  doc: jsPDF;
  filename: string;
  title: string;
  blob: Blob;
  blobUrl: string;
  download: () => void;
  print: () => void;
  preview: () => void;
}

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY?: number;
  };
};

const NAVY: [number, number, number] = [15, 23, 42];
const APPLE_BLUE: [number, number, number] = [0, 102, 204];
const INK: [number, number, number] = [29, 29, 31];
const MUTED: [number, number, number] = [110, 110, 115];
const BORDER: [number, number, number] = [210, 210, 215];
const LIGHT_BG: [number, number, number] = [245, 245, 247];
const EMERALD: [number, number, number] = [21, 128, 61];

function safeText(value: string | number | undefined | null, fallback = '—'): string {
  const str = String(value ?? '').trim();
  if (!str) return fallback;
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\u20B9/g, 'Rs. ')
    .replace(/\u00B7/g, '|');
}

function formatInr(amount: number | undefined | null): string {
  const numeric = Number(amount || 0);
  return `Rs. ${numeric.toLocaleString('en-IN')}`;
}

function formatDateValue(val: unknown): string {
  if (!val) {
    return new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  if (
    typeof val === 'object' &&
    val !== null &&
    'toDate' in val &&
    typeof (val as { toDate: () => Date }).toDate === 'function'
  ) {
    return (val as { toDate: () => Date }).toDate().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  if (typeof val === 'string') return safeText(val);
  return new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function drawBrandHeader(
  doc: JsPdfWithAutoTable,
  settings: WebsiteSettings,
  meta: {
    docTypeLabel: string;
    docNumber: string;
    dateLabel: string;
    statusLabel: string;
    extraLine?: string;
    showGst?: boolean;
  }
): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top blue accent bar
  doc.setFillColor(...APPLE_BLUE);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Dark Navy header banner
  doc.setFillColor(...NAVY);
  doc.rect(0, 4, pageWidth, 34, 'F');

  // Left: Refix Pro Identity
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(safeText(settings.businessName || 'Refix Pro'), 14, 15.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(191, 219, 254);
  doc.text(
    safeText(settings.tagline || 'Apple & MacBook Micro-Soldering Specialists'),
    14,
    21
  );

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(7.8);
  const addressLines = doc.splitTextToSize(
    safeText(settings.address || 'SCF-92, SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007'),
    102
  );
  doc.text(addressLines[0] || '', 14, 26.5);
  const contactLine = `Tel: ${safeText(settings.phone)}  |  Email: ${safeText(settings.email)}`;
  doc.text(contactLine, 14, 31.5);

  if (meta.showGst && settings.erpConfig?.gstNumber) {
    doc.setFont('helvetica', 'bold');
    doc.text(`GSTIN: ${safeText(settings.erpConfig.gstNumber)}`, 14, 35.8);
  }

  // Right: Document Title & Reference Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(147, 197, 253);
  doc.text(meta.docTypeLabel.toUpperCase(), pageWidth - 14, 13.5, { align: 'right' });

  doc.setFontSize(13.5);
  doc.setTextColor(255, 255, 255);
  doc.text(safeText(meta.docNumber), pageWidth - 14, 20.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text(meta.dateLabel, pageWidth - 14, 26, { align: 'right' });
  doc.text(`Status: ${safeText(meta.statusLabel)}`, pageWidth - 14, 30.8, { align: 'right' });

  if (meta.extraLine) {
    doc.text(safeText(meta.extraLine), pageWidth - 14, 35.5, { align: 'right' });
  }

  return 45;
}

function drawPageFooters(doc: JsPdfWithAutoTable, settings: WebsiteSettings, note: string): void {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 17, pageWidth - 14, pageHeight - 17);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(...MUTED);
    const wrappedNote = doc.splitTextToSize(safeText(note), pageWidth - 55);
    doc.text(wrappedNote.slice(0, 2), 14, pageHeight - 12.5);

    doc.setFont('helvetica', 'bold');
    doc.text(
      `${safeText(settings.businessName || 'Refix Pro')}  |  Page ${i} of ${totalPages}`,
      pageWidth - 14,
      pageHeight - 9,
      { align: 'right' }
    );
  }
}

function buildJobCardPdfDoc(job: RepairJobCard, settings: WebsiteSettings): JsPdfWithAutoTable {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as JsPdfWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();

  let cursorY = drawBrandHeader(doc, settings, {
    docTypeLabel: 'Official Repair Job Card',
    docNumber: job.jobCardCode || 'JOB-CARD',
    dateLabel: `Intake Date: ${formatDateValue(job.createdAt)}`,
    statusLabel: job.status,
    extraLine: job.enquiryCode ? `Booking Ref: ${job.enquiryCode}` : undefined,
  });

  // Section 1: Customer & Device Info Table
  autoTable(doc, {
    startY: cursorY,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Customer Information', 'Apple Device Intake Details']],
    body: [
      [
        [
          `Name: ${safeText(job.customerName)}`,
          `Mobile: ${safeText(job.customerMobile)}`,
          `Email: ${safeText(job.customerEmail, 'Not provided')}`,
          `Approval Status: ${safeText(job.approvalStatus)}`,
          `Assigned Tech: ${safeText(job.technicianName, 'Unassigned (Bench Queue)')}`,
        ].join('\n'),
        [
          `Device: ${safeText(job.deviceType)} - ${safeText(job.macbookModel)}`,
          `Model / A-Code: ${safeText(job.modelNumber)}  |  Serial: ${safeText(job.serialNumber)}`,
          `Intake Condition: ${safeText(job.deviceCondition, 'Standard wear checked')}`,
          `Accessories: ${safeText(job.accessoriesReceived, 'None')}`,
          `Delivery Target: ${safeText(job.deliveryDate, 'To be confirmed')}`,
        ].join('\n'),
      ],
    ],
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: {
      textColor: INK,
      fontSize: 8.3,
      cellPadding: 3.5,
      lineColor: BORDER,
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: (pageWidth - 28) / 2 },
      1: { cellWidth: (pageWidth - 28) / 2 },
    },
  });

  cursorY = (doc.lastAutoTable?.finalY ?? cursorY + 35) + 5;

  // Section 2: Inspection & Diagnosis Summary
  autoTable(doc, {
    startY: cursorY,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Bench Evaluation Stage', 'Technical Details']],
    body: [
      ['Customer Reported Problem', safeText(job.reportedProblem, 'Reported issue logged at desk')],
      ['Bench Inspection Findings', safeText(job.inspectionDetails, 'Pending bench evaluation')],
      ['Confirmed Diagnosis', safeText(job.diagnosis, 'Diagnostic review in progress')],
      ['Customer Desk Update', safeText(job.customerUpdates, 'No additional desk note yet')],
      ['Warranty Coverage', safeText(job.warrantyPeriod, '90 Days Service Warranty on replaced parts')],
    ],
    headStyles: {
      fillColor: LIGHT_BG,
      textColor: NAVY,
      fontSize: 8.5,
      fontStyle: 'bold',
      lineColor: BORDER,
      lineWidth: 0.25,
    },
    bodyStyles: {
      textColor: INK,
      fontSize: 8.2,
      cellPadding: 2.8,
      lineColor: BORDER,
    },
    columnStyles: {
      0: { cellWidth: 52, fontStyle: 'bold', fillColor: [250, 250, 252] },
      1: { cellWidth: pageWidth - 28 - 52 },
    },
  });

  cursorY = (doc.lastAutoTable?.finalY ?? cursorY + 40) + 5;

  // Section 3: Spare Parts Consumed
  const partsRows =
    job.partsUsed && job.partsUsed.length > 0
      ? job.partsUsed.map((part) => [
          safeText(part.sku),
          safeText(part.partName),
          String(part.quantity || 1),
          formatInr(part.unitPrice),
          formatInr((Number(part.unitPrice) || 0) * (Number(part.quantity) || 1)),
        ])
      : [['—', 'No spare parts allocated to this job card yet', '0', 'Rs. 0', 'Rs. 0']];

  autoTable(doc, {
    startY: cursorY,
    margin: { left: 14, right: 14 },
    theme: 'striped',
    head: [['SKU', 'Spare Part Used', 'Qty', 'Unit Rate', 'Line Total']],
    body: partsRows,
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontSize: 8.2,
      fontStyle: 'bold',
      cellPadding: 2.8,
    },
    bodyStyles: {
      textColor: INK,
      fontSize: 8.1,
      cellPadding: 2.6,
    },
    alternateRowStyles: {
      fillColor: LIGHT_BG,
    },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'right' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
  });

  cursorY = (doc.lastAutoTable?.finalY ?? cursorY + 25) + 5;

  // Section 4: QC Checklist & Cost Summary Side-by-Side
  const qc = job.qualityChecklist;
  const qcPassedCount = qc
    ? [
        qc.displayTested,
        qc.batteryTested,
        qc.portsTested,
        qc.thermalTested,
        qc.backupVerified,
        qc.cleanFinish,
      ].filter(Boolean).length
    : 0;

  const partsSubtotal = (job.partsUsed || []).reduce(
    (sum, p) => sum + (Number(p.unitPrice) || 0) * (Number(p.quantity) || 1),
    0
  );
  const finalBillable = Number(job.finalCost ?? job.estimatedCost ?? 0);

  autoTable(doc, {
    startY: cursorY,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Quality Assurance & Summary', 'Estimate & Billing Breakdown']],
    body: [
      [
        [
          `QC Checks Passed: ${qcPassedCount} / 6`,
          `Display & Backlight: ${qc?.displayTested ? 'Passed' : 'Pending'}`,
          `Battery & USB-C Power: ${qc?.batteryTested ? 'Passed' : 'Pending'}`,
          `Ports, Wi-Fi & Thermals: ${qc?.portsTested && qc?.thermalTested ? 'Passed' : 'Pending'}`,
          `Data & Chassis Finish: ${qc?.backupVerified && qc?.cleanFinish ? 'Passed' : 'Pending'}`,
        ].join('\n'),
        [
          `Parts Subtotal: ${formatInr(partsSubtotal)}`,
          `Estimated Repair Cost: ${formatInr(job.estimatedCost)}`,
          `Final / Approved Cost: ${formatInr(finalBillable)}`,
          `Payment Status: ${safeText(job.paymentStatus)}`,
          `Warranty Expiry: ${safeText(job.warrantyExpiry, 'Starts upon delivery')}`,
        ].join('\n'),
      ],
    ],
    headStyles: {
      fillColor: LIGHT_BG,
      textColor: NAVY,
      fontSize: 8.3,
      fontStyle: 'bold',
      lineColor: BORDER,
      lineWidth: 0.25,
    },
    bodyStyles: {
      textColor: INK,
      fontSize: 8.1,
      cellPadding: 3.2,
      lineColor: BORDER,
    },
    columnStyles: {
      0: { cellWidth: (pageWidth - 28) / 2 },
      1: { cellWidth: (pageWidth - 28) / 2, fontStyle: 'bold' },
    },
  });

  const afterSummaryY = (doc.lastAutoTable?.finalY ?? cursorY + 30) + 14;
  const pageHeight = doc.internal.pageSize.getHeight();
  let sigY = afterSummaryY;

  if (sigY > pageHeight - 36) {
    doc.addPage();
    sigY = 26;
  }

  // Dual Signature Lines
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.35);
  doc.line(18, sigY, 86, sigY);
  doc.line(pageWidth - 86, sigY, pageWidth - 18, sigY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text('Customer Intake / Pickup Signature', 52, sigY + 4.5, { align: 'center' });
  doc.text('Refix Pro Authorized Technician', pageWidth - 52, sigY + 4.5, { align: 'center' });

  drawPageFooters(
    doc,
    settings,
    `${settings.footerLegalText || 'Refix Pro MacBook Service Center.'} Backup data prior to hardware diagnostics is recommended. Warranty applies strictly to the replaced component or specific circuit repaired.`
  );

  return doc;
}

function buildInvoicePdfDoc(inv: InvoiceRecord, settings: WebsiteSettings): JsPdfWithAutoTable {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as JsPdfWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();

  let cursorY = drawBrandHeader(doc, settings, {
    docTypeLabel: 'Repair Tax Invoice & Receipt',
    docNumber: inv.invoiceNumber || 'INV-000',
    dateLabel: `Issued Date: ${safeText(inv.issuedDate)}`,
    statusLabel: inv.status,
    extraLine: inv.jobCardCode ? `Job Card: ${inv.jobCardCode}` : undefined,
    showGst: true,
  });

  // Billed To & Repair Reference
  autoTable(doc, {
    startY: cursorY,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    head: [['Billed To', 'Repair & Warranty Reference']],
    body: [
      [
        [
          safeText(inv.customerName),
          `Mobile: ${safeText(inv.customerMobile)}`,
          inv.customerEmail ? `Email: ${safeText(inv.customerEmail)}` : '',
          inv.customerAddress ? `Address: ${safeText(inv.customerAddress)}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        [
          `Device: ${safeText(inv.deviceSummary)}`,
          inv.jobCardCode ? `Job Card ID: ${safeText(inv.jobCardCode)}` : '',
          inv.enquiryCode ? `Enquiry Ref: ${safeText(inv.enquiryCode)}` : '',
          `Warranty: ${safeText(inv.warrantyNote, '90 Days Service Warranty on replaced parts')}`,
        ]
          .filter(Boolean)
          .join('\n'),
      ],
    ],
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: {
      textColor: INK,
      fontSize: 8.3,
      cellPadding: 3.5,
      lineColor: BORDER,
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: (pageWidth - 28) / 2 },
      1: { cellWidth: (pageWidth - 28) / 2 },
    },
  });

  cursorY = (doc.lastAutoTable?.finalY ?? cursorY + 34) + 6;

  // Line Items
  const serviceCharges = Number(inv.serviceCharges || 0);
  const partsCharges = Number(inv.partsCharges || 0);
  const subtotal = serviceCharges + partsCharges;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: 14, right: 14 },
    theme: 'striped',
    head: [['#', 'Service / Hardware Description', 'Amount (INR)']],
    body: [
      [
        '01',
        `Diagnostic & Repair Service Charges\n${safeText(inv.repairSummary || inv.deviceSummary)}`,
        formatInr(serviceCharges),
      ],
      [
        '02',
        'Spare Parts & Apple Hardware Components',
        formatInr(partsCharges),
      ],
    ],
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3,
    },
    bodyStyles: {
      textColor: INK,
      fontSize: 8.5,
      cellPadding: 3.5,
    },
    alternateRowStyles: {
      fillColor: LIGHT_BG,
    },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 42, halign: 'right', fontStyle: 'bold' },
    },
  });

  cursorY = (doc.lastAutoTable?.finalY ?? cursorY + 30) + 6;

  // Totals Summary Table (Right-aligned)
  const summaryStartX = pageWidth - 14 - 88;
  autoTable(doc, {
    startY: cursorY,
    margin: { left: summaryStartX, right: 14 },
    theme: 'grid',
    body: [
      ['Subtotal', formatInr(subtotal)],
      [`Tax (${Number(inv.taxRate || 0)}%)`, formatInr(inv.taxAmount)],
      ['Discount', `- ${formatInr(inv.discount)}`],
      [
        {
          content: 'Total Invoice Amount',
          styles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        },
        {
          content: formatInr(inv.totalAmount),
          styles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9, halign: 'right' },
        },
      ],
      [
        'Amount Paid',
        {
          content: formatInr(inv.amountPaid),
          styles: { textColor: EMERALD, fontStyle: 'bold', halign: 'right' },
        },
      ],
      [
        { content: 'Outstanding Balance', styles: { fontStyle: 'bold' } },
        {
          content: formatInr(inv.outstandingAmount),
          styles: { fontStyle: 'bold', halign: 'right' },
        },
      ],
    ],
    bodyStyles: {
      textColor: INK,
      fontSize: 8.4,
      cellPadding: 2.8,
      lineColor: BORDER,
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 38, halign: 'right' },
    },
  });

  const afterTotalsY = (doc.lastAutoTable?.finalY ?? cursorY + 45) + 16;
  const pageHeight = doc.internal.pageSize.getHeight();
  let sigY = afterTotalsY;
  if (sigY > pageHeight - 34) {
    doc.addPage();
    sigY = 26;
  }

  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.35);
  doc.line(pageWidth - 84, sigY, pageWidth - 14, sigY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(`For ${safeText(settings.businessName || 'Refix Pro')} (Authorized Signatory)`, pageWidth - 49, sigY + 4.5, {
    align: 'center',
  });

  drawPageFooters(
    doc,
    settings,
    `Thank you for choosing ${safeText(settings.businessName || 'Refix Pro')}. ${safeText(settings.footerLegalText || '')}`
  );

  return doc;
}

function triggerPdfIframePrint(doc: jsPDF, fallbackTitle: string, fallbackHtml: string): void {
  try {
    doc.autoPrint();
    const printBlob = doc.output('blob');
    const printUrl = URL.createObjectURL(printBlob);

    const existing = document.getElementById('refix-pdf-print-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'refix-pdf-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.opacity = '0';
    iframe.style.border = '0';
    iframe.src = printUrl;

    iframe.onload = () => {
      window.setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          // If cross-viewer print is blocked in headless/sandboxed environments, autoPrint PDF still remains loaded.
        }
      }, 250);
      window.setTimeout(() => {
        URL.revokeObjectURL(printUrl);
      }, 60_000);
    };

    document.body.appendChild(iframe);
  } catch {
    openDocumentPreview({
      title: fallbackTitle,
      filename: `${fallbackTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`,
      bodyHtml: fallbackHtml,
    });
  }
}

/**
 * Generates a branded Refix Pro PDF using jsPDF and jspdf-autotable for Job Cards or Tax Invoices.
 */
export function generatePDF(
  payload: PdfDocumentPayload,
  mode: PdfOutputMode = 'preview'
): GeneratedPdfResult {
  const isJob = payload.type === 'jobCard';
  const doc = isJob
    ? buildJobCardPdfDoc(payload.job, payload.settings)
    : buildInvoicePdfDoc(payload.invoice, payload.settings);

  const rawCode = isJob ? payload.job.jobCardCode : payload.invoice.invoiceNumber;
  const cleanCode = (rawCode || (isJob ? 'job-card' : 'invoice'))
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-');
  const filename = isJob ? `${cleanCode}-job-card.pdf` : `${cleanCode}-invoice.pdf`;

  const title = isJob
    ? `Job Card ${payload.job.jobCardCode} - ${payload.settings.businessName}`
    : `Invoice ${payload.invoice.invoiceNumber} - ${payload.settings.businessName}`;

  const fallbackHtml = isJob
    ? buildJobCardBodyHtml(payload.job, payload.settings)
    : buildInvoiceBodyHtml(payload.invoice, payload.settings);

  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);

  const download = () => {
    doc.save(filename);
  };

  const print = () => {
    triggerPdfIframePrint(doc, title, fallbackHtml);
  };

  const preview = () => {
    openDocumentPreview({
      title,
      filename,
      bodyHtml: fallbackHtml,
      pdfBlobUrl: blobUrl,
      emailDraft: payload.emailDraft,
      onDownloadPdf: download,
      onPrintPdf: print,
    });
  };

  if (mode === 'download') {
    download();
  } else if (mode === 'print') {
    print();
  } else if (mode === 'preview') {
    preview();
  }

  return {
    doc,
    filename,
    title,
    blob,
    blobUrl,
    download,
    print,
    preview,
  };
}

export function generateJobCardPDF(
  job: RepairJobCard,
  settings: WebsiteSettings,
  mode: PdfOutputMode = 'preview',
  emailDraft?: EmailDraftPayload
): GeneratedPdfResult {
  return generatePDF({ type: 'jobCard', job, settings, emailDraft }, mode);
}

export function generateInvoicePDF(
  invoice: InvoiceRecord,
  settings: WebsiteSettings,
  mode: PdfOutputMode = 'preview',
  emailDraft?: EmailDraftPayload
): GeneratedPdfResult {
  return generatePDF({ type: 'invoice', invoice, settings, emailDraft }, mode);
}
