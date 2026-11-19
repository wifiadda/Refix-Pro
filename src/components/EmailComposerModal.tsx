import { useEffect, useState } from 'react';
import { Bell, Check, Copy, ExternalLink, Mail, Send, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useErp } from '../context/ErpContext';
import {
  buildGmailComposeHref,
  buildMailtoHref,
  type EmailDraftPayload,
} from '../utils/emailHelper';
import { EMAIL_COMPOSER_EVENT } from '../utils/pdfExport';

export function EmailComposerModal({
  draft,
  onClose,
  onNotify,
}: {
  draft: EmailDraftPayload | null;
  onClose: () => void;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}) {
  const { isStaff } = useApp();
  const { pushNotification, logActivity } = useErp();

  const [toEmail, setToEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [alsoNotifyDashboard, setAlsoNotifyDashboard] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sendingNotif, setSendingNotif] = useState(false);

  useEffect(() => {
    if (!draft) return;
    setToEmail(draft.toEmail || '');
    setSubject(draft.subject || '');
    setBody(draft.body || '');
    setAlsoNotifyDashboard(Boolean(isStaff && (draft.recipientUid || draft.toEmail)));
    setCopied(false);
  }, [draft, isStaff]);

  if (!draft) return null;

  const mailtoUrl = buildMailtoHref(toEmail, subject, body);
  const gmailUrl = buildGmailComposeHref(toEmail, subject, body);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      onNotify?.('success', 'Email content copied to clipboard.');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      onNotify?.('error', 'Unable to copy automatically. Select and copy manually.');
    }
  };

  const handleRecordAndNotify = async (channelLabel: string) => {
    if (!isStaff) return;
    setSendingNotif(true);
    try {
      if (alsoNotifyDashboard && (draft.recipientUid || toEmail.trim())) {
        const mappedCategory: 'booking' | 'repair' | 'estimate' | 'payment' | 'appointment' | 'system' =
          draft.category === 'invoice'
            ? 'payment'
            : draft.category === 'general' || !draft.category
              ? 'system'
              : draft.category;
        await pushNotification({
          recipientUid: draft.recipientUid,
          recipientEmail: toEmail.trim() || undefined,
          audience: 'customer',
          title: subject.slice(0, 140),
          message: body.slice(0, 500),
          category: mappedCategory,
          relatedCode: draft.relatedCode,
        });
      }
      await logActivity({
        action: 'CUSTOMER_EMAIL_DISPATCHED',
        targetCollection: 'notifications',
        targetId: draft.relatedCode || toEmail || 'email',
        summary: `Prepared ${channelLabel} email to ${toEmail || draft.customerName} (${subject.slice(0, 80)})`,
      });
      onNotify?.(
        'success',
        alsoNotifyDashboard && (draft.recipientUid || toEmail.trim())
          ? `Email compose opened via ${channelLabel} & synced to Customer Portal alert.`
          : `Email compose opened via ${channelLabel}.`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSendingNotif(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#E5E5EA] max-w-2xl w-full p-6 space-y-4 my-8 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#E5E5EA] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0066CC]/10 flex items-center justify-center text-[#0066CC]">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F]">Send Customer Email</h3>
              <p className="text-xs text-[#6E6E73]">
                Review or customize the message for {draft.customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close email composer"
            className="p-1.5 rounded-lg hover:bg-[#F5F5F7]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Recipient Email</label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] mb-1">Email Message</label>
            <textarea
              rows={9}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs sm:text-sm font-sans leading-relaxed"
            />
          </div>

          {isStaff && (draft.recipientUid || toEmail.trim()) && (
            <label className="flex items-center gap-2 text-xs text-[#424245] bg-[#F5F5F7] px-3 py-2.5 rounded-xl border border-[#E5E5EA] cursor-pointer">
              <input
                type="checkbox"
                checked={alsoNotifyDashboard}
                onChange={(e) => setAlsoNotifyDashboard(e.target.checked)}
                className="rounded border-[#D2D2D7]"
              />
              <Bell className="w-3.5 h-3.5 text-[#0066CC] shrink-0" />
              <span>
                Also push this update as an instant notification inside the customer&rsquo;s Refix Pro Portal
              </span>
            </label>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E5E5EA]">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D2D2D7] hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy Text'}
            </button>
            {isStaff && alsoNotifyDashboard && (draft.recipientUid || toEmail.trim()) && (
              <button
                type="button"
                disabled={sendingNotif}
                onClick={async () => {
                  await handleRecordAndNotify('Portal Alert');
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#0066CC] text-[#0066CC] hover:bg-blue-50 text-xs font-semibold disabled:opacity-60"
              >
                <Bell className="w-3.5 h-3.5" />
                {sendingNotif ? 'Sending...' : 'Send Portal Alert Only'}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={mailtoUrl}
              onClick={() => void handleRecordAndNotify('Default Mail App')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-black text-white text-xs font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
              Open Mail App
            </a>
            <a
              href={gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => void handleRecordAndNotify('Gmail')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Compose in Gmail
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmailComposerHost({
  onNotify,
}: {
  onNotify?: (type: 'success' | 'error', message: string) => void;
}) {
  const [draft, setDraft] = useState<EmailDraftPayload | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<EmailDraftPayload>;
      if (custom.detail) {
        setDraft(custom.detail);
      }
    };
    window.addEventListener(EMAIL_COMPOSER_EVENT, handler);
    return () => window.removeEventListener(EMAIL_COMPOSER_EVENT, handler);
  }, []);

  return <EmailComposerModal draft={draft} onClose={() => setDraft(null)} onNotify={onNotify} />;
}
