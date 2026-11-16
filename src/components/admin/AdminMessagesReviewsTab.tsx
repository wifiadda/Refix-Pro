import { useState } from 'react';
import { Check, Edit3, ExternalLink, MailOpen, MessageCircle, Plus, RefreshCw, Send, Star, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ReviewItem } from '../../types';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

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
    googleLiveProfile,
    triggerGoogleProfileSync,
  } = useApp();

  const reviewList = adminReviews.length > 0 ? adminReviews : reviews;
  const [editingReview, setEditingReview] = useState<Omit<ReviewItem, 'createdAt'> | null>(null);
  const [saving, setSaving] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);

  if (mode === 'messages') {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#1D1D1F]">
          Customer Contact Messages ({contactMessages.length})
        </h2>

        <div className="space-y-3">
          {contactMessages.length === 0 ? (
            <div className="p-10 rounded-xl border border-[#E5E5EA] bg-white text-center text-sm text-[#6E6E73]">
              No contact form messages yet.
            </div>
          ) : (
            contactMessages.map((msg) => {
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
                        onClick={async () => {
                          await deleteContactMessage(msg.id);
                          onNotify('success', 'Message deleted.');
                        }}
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
                            console.error(err);
                            onNotify('error', 'Failed to save reply.');
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
      console.error(err);
      onNotify('error', 'Failed to save review.');
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
          <h2 className="text-lg font-bold text-[#1D1D1F]">Customer & Google Reviews ({reviewList.length})</h2>
          <p className="text-xs text-[#6E6E73]">Moderate live public website reviews and manage verified Google Business Profile sync.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviewList.map((rev) => (
          <div key={rev.id} className="p-5 rounded-xl border border-[#E5E5EA] bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: rev.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs text-[#6E6E73]">{rev.isVisible ? 'Visible' : 'Hidden'}</span>
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
                  onClick={async () => {
                    await deleteReview(rev.id);
                    onNotify('success', 'Review deleted.');
                  }}
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
    </div>
  );
}
