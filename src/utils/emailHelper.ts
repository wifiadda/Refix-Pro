import type { ContactMessage, InvoiceRecord, RepairEnquiry, RepairJobCard, WebsiteSettings } from '../types';

export interface EmailDraftPayload {
  toEmail: string;
  customerName: string;
  subject: string;
  body: string;
  relatedCode?: string;
  recipientUid?: string;
  category?: 'repair' | 'estimate' | 'invoice' | 'payment' | 'general';
}

export function buildMailtoHref(toEmail: string, subject: string, body: string): string {
  const params = new URLSearchParams({
    subject,
    body,
  });
  return `mailto:${encodeURIComponent(toEmail.trim())}?${params.toString().replace(/\+/g, '%20')}`;
}

export function buildGmailComposeHref(toEmail: string, subject: string, body: string): string {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: toEmail.trim(),
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function buildJobCardEmailDraft(
  job: RepairJobCard,
  settings: WebsiteSettings
): EmailDraftPayload {
  const finalAmount = job.finalCost || job.estimatedCost || 0;
  const partsSummary =
    job.partsUsed && job.partsUsed.length > 0
      ? `\nSpare Parts Allocated:\n${job.partsUsed
          .map((p) => `• ${p.partName} (${p.sku}) × ${p.quantity} = ₹${(p.unitPrice * p.quantity).toLocaleString('en-IN')}`)
          .join('\n')}\n`
      : '';

  const subject = `[${settings.businessName || 'Refix Pro'}] Job Card ${job.jobCardCode} – ${job.macbookModel} (${job.status})`;
  const body = `Dear ${job.customerName},

Thank you for trusting ${settings.businessName || 'Refix Pro'} with your ${job.deviceType} (${job.macbookModel}).

Here is the latest summary for your Repair Job Card:
• Job Card ID: ${job.jobCardCode}
• Current Status: ${job.status}
• Reported Issue: ${job.reportedProblem || 'Diagnostic Check'}
• Inspection & Diagnosis: ${job.diagnosis || job.inspectionDetails || 'Bench evaluation in progress'}
• Estimated / Approved Cost: ${finalAmount > 0 ? `₹${finalAmount.toLocaleString('en-IN')}` : 'Pending Confirmation'}
• Estimate Approval: ${job.approvalStatus}
• Assigned Technician: ${job.technicianName || 'Refix Pro Bench Team'}
• Warranty: ${job.warrantyPeriod || '90 Days Service Warranty'}
${partsSummary}
${job.customerUpdates ? `Desk Update:\n${job.customerUpdates}\n\n` : ''}You can view your live repair timeline, approve estimates, download your PDF Job Card, and pay online in your Customer Portal:
${settings.websiteUrl ? `${settings.websiteUrl.replace(/\/$/, '')}/dashboard` : 'https://refixpro.in/dashboard'}

Warm regards,
${settings.businessName || 'Refix Pro'}
${settings.address}
Phone / WhatsApp: ${settings.phone}
Email: ${settings.email || 'refixpro.in@gmail.com'}`;

  return {
    toEmail: job.customerEmail || '',
    customerName: job.customerName,
    subject,
    body,
    relatedCode: job.jobCardCode,
    recipientUid: job.customerUid || undefined,
    category: job.approvalStatus === 'Pending' ? 'estimate' : 'repair',
  };
}

export function buildInvoiceEmailDraft(
  inv: InvoiceRecord,
  settings: WebsiteSettings
): EmailDraftPayload {
  const subject = `[${settings.businessName || 'Refix Pro'}] Tax Invoice ${inv.invoiceNumber} (${inv.status})`;
  const body = `Dear ${inv.customerName},

Please find the billing details for your Apple repair service at ${settings.businessName || 'Refix Pro'}:

• Invoice Number: ${inv.invoiceNumber}
• Issued Date: ${inv.issuedDate}
• Device: ${inv.deviceSummary}
• Service Summary: ${inv.repairSummary || inv.deviceSummary}
${inv.jobCardCode ? `• Job Card Reference: ${inv.jobCardCode}\n` : ''}• Service Charges: ₹${Number(inv.serviceCharges || 0).toLocaleString('en-IN')}
• Spare Parts Charges: ₹${Number(inv.partsCharges || 0).toLocaleString('en-IN')}
• GST / Tax (${Number(inv.taxRate || 0)}%): ₹${Number(inv.taxAmount || 0).toLocaleString('en-IN')}
• Discount: ₹${Number(inv.discount || 0).toLocaleString('en-IN')}
• Total Invoice Amount: ₹${Number(inv.totalAmount || 0).toLocaleString('en-IN')}
• Amount Paid: ₹${Number(inv.amountPaid || 0).toLocaleString('en-IN')}
• Outstanding Balance: ₹${Number(inv.outstandingAmount || 0).toLocaleString('en-IN')}
• Payment Status: ${inv.status}
• Warranty Note: ${inv.warrantyNote || '90 Days Service Warranty on replaced parts'}

You can preview and download your official PDF Tax Invoice anytime from your Customer Portal:
${settings.websiteUrl ? `${settings.websiteUrl.replace(/\/$/, '')}/dashboard` : 'https://refixpro.in/dashboard'}

Warm regards,
${settings.businessName || 'Refix Pro'}
${settings.address}
Phone / WhatsApp: ${settings.phone}`;

  return {
    toEmail: inv.customerEmail || '',
    customerName: inv.customerName,
    subject,
    body,
    relatedCode: inv.invoiceNumber,
    recipientUid: inv.customerUid || undefined,
    category: 'invoice',
  };
}

export function buildEnquiryEmailDraft(
  enq: RepairEnquiry,
  settings: WebsiteSettings
): EmailDraftPayload {
  const subject = `[${settings.businessName || 'Refix Pro'}] Repair Booking ${enq.enquiryCode} – ${enq.status}`;
  const body = `Dear ${enq.customerName},

Here is an update on your repair enquiry (${enq.enquiryCode}) for ${enq.macbookModel} (${enq.serviceName}):

• Current Status: ${enq.status}
• Repair Estimate: ${enq.repairEstimate || 'Pending inspection'}
${enq.payableAmount && enq.payableAmount > 0 ? `• Payable Bill: ₹${enq.payableAmount.toLocaleString('en-IN')} (${enq.paymentStatus || 'Unpaid'})\n` : ''}${enq.followUpDate ? `• Scheduled Date: ${enq.followUpDate}\n` : ''}${enq.technicianNotes ? `\nTechnician Notes:\n${enq.technicianNotes}\n` : ''}
Track your repair live at:
${settings.websiteUrl ? `${settings.websiteUrl.replace(/\/$/, '')}/track` : 'https://refixpro.in/track'}

Warm regards,
${settings.businessName || 'Refix Pro'}
${settings.address}
Phone / WhatsApp: ${settings.phone}`;

  return {
    toEmail: enq.email || '',
    customerName: enq.customerName,
    subject,
    body,
    relatedCode: enq.enquiryCode,
    recipientUid: enq.userId || undefined,
    category: 'repair',
  };
}

export function buildMessageReplyEmailDraft(
  msg: ContactMessage,
  replyText: string,
  settings: WebsiteSettings
): EmailDraftPayload {
  const subject = `Re: ${msg.subject} [${settings.businessName || 'Refix Pro'}]`;
  const body = `Dear ${msg.name},

Thank you for contacting ${settings.businessName || 'Refix Pro'}.

${replyText.trim() || 'Our team has reviewed your enquiry and is ready to assist you.'}

Original Subject: ${msg.subject}

Warm regards,
${settings.businessName || 'Refix Pro'}
${settings.address}
Phone / WhatsApp: ${settings.phone}`;

  return {
    toEmail: msg.email || '',
    customerName: msg.name,
    subject,
    body,
    recipientUid: msg.userId || undefined,
    category: 'general',
  };
}
