import { useEffect, useMemo, useState } from 'react';
import { Check, Edit3, ExternalLink, Mail, MailOpen, MessageCircle, MessageSquare, Plus, RefreshCw, Search, Send, Star, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { extractReadableError } from '../../lib/firebase';
import { ReviewItem } from '../../types';
import { buildMessageReplyEmailDraft } from '../../utils/emailHelper';
import { openEmailComposer } from '../../utils/pdfExport';
import { buildWhatsAppUrl } from '../../utils/whatsapp';
import { ConfirmDialog } from '../ConfirmDialog';
import { EmptyState, PaginationBar, StatusBadge } from '../ui/DesignSystem';

const PAGE_SIZE = 10;

export function AdminMessagesReviewsTab({
  mode,
  onNotify,
}: {
  mode: 'messages' | 'reviews';
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const {
    settings,
    contactMessages,
    markMessageRead,
    replyToContactMessage,
    deleteContactMessage,
    adminReviews,
    reviews,
    saveReview,
    deleteReview,
    importGoogleReviewsToSite,
    googleLiveProfile,
    triggerGoogleProfileSync,
  } = useApp();

  const reviewList = adminReviews.length > 0 ? adminReviews : reviews;
  const [msgSearch, setMsgSearch] = useState('');
  const [msgFilter, setMsgFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [msgPage, setMsgPage] = useState(1);
  const [deleteMsgId, setDeleteMsgId] = useState<string | null>(null);

  const [revSearch, setRevSearch] = useState('');
  const [deleteReviewTarget, setDeleteReviewTarget] = useState<ReviewItem | null>(null);
  const [editingReview, setEditingReview] = useState<Omit<ReviewItem, 'createdAt'> | null>(null);
  const [saving, setSaving] = useState(false);
  const [importingGoogle, setImportingGoogle] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);

  const filteredMessages = useMemo(() => {
    const q = msgSearch.trim().toLowerCase();
    return contactMessages.filter((m) => {
      const readOk =
        msgFilter === 'all' || (msgFilter === 'unread' ? !m.isRead : m.isRead);
      const qOk =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q);
      return readOk && qOk;
    });
  }, [contactMessages, msgSearch, msgFilter]);

  useEffect(() => {
    setMsgPage(1);
  }, [msgSearch, msgFilter]);

  const msgTotalPages = Math.max(1, Math.ceil(filteredMessages.length / PAGE_SIZE));
  const paginatedMessages = useMemo(
    () => filteredMessages.slice((msgPage - 1) * PAGE_SIZE, msgPage * PAGE_SIZE),
    [filteredMessages, msgPage]
  );

  const filteredReviews = useMemo(() => {
    const q = revSearch.trim().toLowerCase();
    if (!q) return reviewList;
    return reviewList.filter(
      (r) =>
        r.authorLabel.toLowerCase().includes(q) ||
        r.quote.toLowerCase().includes(q) ||
        r.source.toLowerCase().includes(q)
    );
  }, [reviewList, revSearch]);

  if (mode === 'messages') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#1D1D1F]">
            Customer Contact Messages ({filteredMessages.length})
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={msgSearch}
                onChange={(e) => setMsgSearch(e.target.value)}
                placeholder="Search customer, subject..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm"
              />
            </div>
            <select
              value={msgFilter}
              onChange={(e) => setMsgFilter(e.target.value as 'all' | 'unread' | 'read')}
              aria-label="Filter messages by read status"
              className="px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm"
            >
              <option value="all">All Messages</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {filteredMessages.length === 0 ? (
            <EmptyState
              title="No contact messages found"
              description="Customer enquiries sent from the Contact page or Customer Support tab will appear here."
              icon={<MessageSquare className="w-5 h-5" />}
            />
          ) : (
            paginatedMessages.map((msg) => {
              const currentDraft =
                replyDrafts[msg.id] !== undefined ? replyDrafts[msg.id] : msg.adminReply || '';
              return (
                <div
                  key={msg.id}
                  className={`p-5 rounded-xl border bg-white space-y-4 ${
                    msg.isRead ? 'border-[#E5E5EA]' : 'border-[#0066CC]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6E73]">
                        <span className="font-bold text-[#1D1D1F] text-sm">{msg.name}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">{msg.phone}</span>
                        {msg.email && (
                          <>
                            <span>·</span>
                            <span>{msg.email}</span>
                          </>
                        )}
                        <span>·</span>
                        <span className={msg.isRead ? 'text-[#6E6E73]' : 'text-[#0066CC] font-semibold'}>
                          {msg.isRead ? 'Read' : 'Unread'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#1D1D1F]">{msg.subject}</p>
                      <p className="text-sm text-[#424245] leading-relaxed">{msg.message}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => markMessageRead(msg.id, !msg.isRead)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D2D2D7] text-xs font-semibold hover:bg-[#F5F5F7]"
                      >
                        {msg.isRead ? <MailOpen className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        {msg.isRead ? 'Mark Unread' : 'Mark Read'}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          openEmailComposer(buildMessageReplyEmailDraft(msg, currentDraft, settings))
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#0066CC]/30 bg-blue-50 text-[#0066CC] hover:bg-blue-100 text-xs font-semibold"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Email Reply
                      </button>
                      <a
                        href={buildWhatsAppUrl(
                          msg.phone,
                          `Hello ${msg.name}, thank you for contacting Refix Pro (SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007) regarding "${msg.subject}".`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-semibold"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Reply WA
                      </a>
                      <button
                        type="button"
                        onClick={() => setDeleteMsgId(msg.id)}
                        aria-label="Delete message"
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Direct Reply visible in Customer Dashboard */}
                  <div className="pt-3 border-t border-[#F5F5F7] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-semibold text-[#1D1D1F]">
                        Customer Dashboard Reply {msg.repliedAt ? `(Last replied: ${msg.repliedAt})` : ''}
                      </label>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <textarea
                        rows={2}
                        value={currentDraft}
                        onChange={(e) =>
                          setReplyDrafts((prev) => ({ ...prev, [msg.id]: e.target.value }))
                        }
                        placeholder="Write a reply visible directly in the customer's Refix Pro Dashboard..."
                        className="flex-1 px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                      />
                      <button
                        type="button"
                        disabled={savingReplyId === msg.id}
                        onClick={async () => {
                          setSavingReplyId(msg.id);
                          try {
                            await replyToContactMessage(msg.id, currentDraft);
                            onNotify('success', 'Reply saved to customer dashboard.');
                          } catch (err) {
                            onNotify('error', extractReadableError(err, 'Failed to save reply.'));
                          } finally {
                            setSavingReplyId(null);
                          }
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {savingReplyId === msg.id ? 'Saving...' : msg.adminReply ? 'Update Reply' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <PaginationBar
          page={msgPage}
          totalPages={msgTotalPages}
          totalItems={filteredMessages.length}
          pageSize={PAGE_SIZE}
          onPageChange={setMsgPage}
        />

        <ConfirmDialog
          open={Boolean(deleteMsgId)}
          title="Delete Contact Message?"
          description="Permanently deletes this customer support message."
          confirmLabel="Delete Message"
          onCancel={() => setDeleteMsgId(null)}
          onConfirm={async () => {
            if (!deleteMsgId) return;
            try {
              await deleteContactMessage(deleteMsgId);
              setDeleteMsgId(null);
              onNotify('success', 'Message deleted.');
            } catch (err) {
              onNotify('error', extractReadableError(err, 'Failed to delete message.'));
            }
          }}
        />
      </div>
    );
  }

  const openNewReview = () => {
    setEditingReview({
      id: `rev-${Date.now().toString(36)}`,
      authorLabel: 'Verified Google Review · Refix Pro',
      rating: 5,
      quote: '',
      source: 'Google Business Profile',
      dateLabel: 'Verified Review',
      isVisible: true,
    });
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;
    setSaving(true);
    try {
      await saveReview(editingReview);
      onNotify('success', 'Review saved.');
      setEditingReview(null);
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Failed to save review.'));
    } finally {
      setSaving(false);
    }
  };

  const liveRating = googleLiveProfile.rating ?? settings.googleRating;
  const liveCount = googleLiveProfile.userRatingCount ?? settings.googleReviewCount;
  const mapsUrl =
    googleLiveProfile.googleMapsUri ||
    settings.googleReviewsUrl ||
    'https://www.google.com/maps/search/?api=1&query=Refix+Pro+SCF-92+Sector+14+Main+Market+Gurugram';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1D1D1F]">Customer & Google Reviews ({filteredReviews.length})</h2>
          <p className="text-xs text-[#6E6E73]">Moderate live public website reviews and manage verified Google Business Profile sync.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-56">
            <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={revSearch}
              onChange={(e) => setRevSearch(e.target.value)}
              placeholder="Search reviewer or quote..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm"
            />
          </div>
          <button
            type="button"
            onClick={openNewReview}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add Verified Review
          </button>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-white border border-[#E5E5EA] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#0066CC]">
              Live Google Business Profile Connection · {googleLiveProfile.loading ? 'Syncing Places API...' : googleLiveProfile.reviews.length > 0 ? 'Live Places Feed Active' : 'Ready'}
            </p>
            <p className="text-sm font-bold text-[#1D1D1F] tabular-nums">
              {googleLiveProfile.displayName || settings.businessName} · {liveRating}/5 ({liveCount} Google Reviews)
            </p>
            <p className="text-xs text-[#6E6E73]">
              Account: <span className="font-mono">{settings.email || 'refixpro.in@gmail.com'}</span>
              {googleLiveProfile.placeId && (
                <>
                  {' · '}Place ID: <span className="font-mono">{googleLiveProfile.placeId}</span>
                </>
              )}
              {' · '}{googleLiveProfile.reviews.length} live Google reviews loaded
            </p>
            {googleLiveProfile.error && (
              <p className="text-xs text-amber-700 font-medium">{googleLiveProfile.error}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerGoogleProfileSync();
                onNotify('success', 'Syncing live Google Business Profile reviews...');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${googleLiveProfile.loading ? 'animate-spin' : ''}`} />
              Sync Live Google Reviews Now
            </button>
            {googleLiveProfile.reviews.length > 0 && (
              <button
                type="button"
                disabled={importingGoogle}
                onClick={async () => {
                  setImportingGoogle(true);
                  try {
                    const count = await importGoogleReviewsToSite();
                    onNotify(
                      'success',
                      count > 0
                        ? `Saved ${count} new Google Business review(s) to the website database.`
                        : 'All live Google Business reviews are already saved on the website.'
                    );
                  } catch (err) {
                    onNotify('error', extractReadableError(err, 'Failed to import Google reviews.'));
                  } finally {
                    setImportingGoogle(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" />
                {importingGoogle ? 'Saving...' : 'Save Live Google Reviews to Site'}
              </button>
            )}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#D2D2D7] hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F] whitespace-nowrap"
            >
              Open Google Listing
              <ExternalLink className="w-3.5 h-3.5 text-[#0066CC]" />
            </a>
          </div>
        </div>

        {googleLiveProfile.reviews.length > 0 && (
          <div className="pt-4 border-t border-[#E5E5EA] space-y-3">
            <p className="text-xs font-semibold text-[#1D1D1F]">
              Live Original Google Reviews ({googleLiveProfile.reviews.length} pulled directly from Google Places)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {googleLiveProfile.reviews.map((gRev) => (
                <div key={gRev.id} className="p-3.5 rounded-lg border border-[#E5E5EA] bg-[#F5F5F7]/60 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {gRev.authorPhotoUri && (
                        <img
                          src={gRev.authorPhotoUri}
                          alt={gRev.authorName}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover shrink-0 border border-[#E5E5EA]"
                        />
                      )}
                      <span className="text-xs font-semibold text-[#1D1D1F] truncate">{gRev.authorName}</span>
                    </div>
                    <span className="text-[11px] text-[#6E6E73] shrink-0">{gRev.relativeTime}</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {Array.from({ length: Math.max(1, Math.min(5, Math.round(gRev.rating))) }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-[#424245] leading-relaxed line-clamp-3">“{gRev.text}”</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {filteredReviews.length === 0 ? (
        <EmptyState
          title="No reviews match your filter"
          description="Import live Google Business Profile reviews or add a verified testimonial."
          icon={<Star className="w-5 h-5" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => (
            <div key={rev.id} className="p-5 rounded-xl border border-[#E5E5EA] bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <StatusBadge label={rev.isVisible ? 'Visible' : 'Hidden'} tone={rev.isVisible ? 'success' : 'neutral'} />
              </div>
              <p className="text-sm text-[#1D1D1F] font-medium">“{rev.quote}”</p>
              <div className="flex items-center justify-between pt-2 border-t border-[#F5F5F7] text-xs text-[#6E6E73]">
                <span className="truncate">
                  <strong className="text-[#1D1D1F]">{rev.authorLabel}</strong> · {rev.source}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingReview({ ...rev })}
                    className="inline-flex items-center gap-1 text-[#0066CC] font-semibold"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteReviewTarget(rev)}
                    className="text-red-600"
                    aria-label="Delete review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={handleSaveReview} className="bg-white rounded-2xl border border-[#E5E5EA] max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Manage Verified Review</h3>
              <button type="button" onClick={() => setEditingReview(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Reviewer / Attribution Label *</label>
              <input
                type="text"
                required
                value={editingReview.authorLabel}
                onChange={(e) => setEditingReview({ ...editingReview, authorLabel: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Rating (1–5)</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={editingReview.rating}
                  onChange={(e) => setEditingReview({ ...editingReview, rating: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Source *</label>
                <input
                  type="text"
                  required
                  value={editingReview.source}
                  onChange={(e) => setEditingReview({ ...editingReview, source: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Verified Quote *</label>
              <textarea
                rows={3}
                required
                value={editingReview.quote}
                onChange={(e) => setEditingReview({ ...editingReview, quote: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={editingReview.isVisible}
                onChange={(e) => setEditingReview({ ...editingReview, isVisible: e.target.checked })}
              />
              Display on Website
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingReview(null)} className="px-4 py-2 rounded-lg border border-[#D2D2D7] text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-semibold">
                {saving ? 'Saving...' : 'Save Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteReviewTarget)}
        title={`Delete review by ${deleteReviewTarget?.authorLabel}?`}
        description="Removes this review from the website reviews database."
        confirmLabel="Delete Review"
        onCancel={() => setDeleteReviewTarget(null)}
        onConfirm={async () => {
          if (!deleteReviewTarget) return;
          try {
            await deleteReview(deleteReviewTarget.id);
            setDeleteReviewTarget(null);
            onNotify('success', 'Review deleted.');
          } catch (err) {
            onNotify('error', extractReadableError(err, 'Failed to delete review.'));
          }
        }}
      />
    </div>
  );
}
