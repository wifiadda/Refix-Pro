import { useEffect, useState } from 'react';
import { Plus, Shield, Trash2, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { compressImageToDataUrl } from '../../utils/whatsapp';
import { WebsiteSettings } from '../../types';

export function AdminSettingsAndUsersTab({
  mode,
  onNotify,
}: {
  mode: 'settings' | 'users';
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const {
    settings,
    saveWebsiteSettings,
    galleryImages,
    saveGalleryImage,
    deleteGalleryImage,
    adminUsers,
    saveAdminUser,
    removeAdminUser,
    user,
  } = useApp();

  const [form, setForm] = useState<WebsiteSettings>({ ...settings });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const [newGalleryTitle, setNewGalleryTitle] = useState('');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  const [newGalleryCategory, setNewGalleryCategory] = useState('Logic Board Lab');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'super_admin'>('admin');

  if (mode === 'users') {
    const handleAddAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newAdminUid.trim() || !newAdminEmail.trim() || !newAdminName.trim()) {
        onNotify('error', 'UID, Email, and Display Name are required.');
        return;
      }
      try {
        await saveAdminUser({
          uid: newAdminUid.trim(),
          email: newAdminEmail.trim(),
          displayName: newAdminName.trim(),
          role: newAdminRole,
        });
        setNewAdminUid('');
        setNewAdminEmail('');
        setNewAdminName('');
        onNotify('success', 'Authorized admin added.');
      } catch (err) {
        console.error(err);
        onNotify('error', 'Unable to add admin user.');
      }
    };

    return (
      <div className="space-y-8">
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1D1D1F]">Account Security & Access</h2>
              <p className="text-xs text-[#6E6E73] mt-1">
                Signed in as <span className="font-mono font-semibold text-[#1D1D1F]">{user?.email}</span> (UID: <span className="font-mono">{user?.uid}</span>)
              </p>
            </div>
            <a
              href="https://myaccount.google.com/security"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#D2D2D7] hover:bg-[#F5F5F7] text-xs font-semibold text-[#1D1D1F]"
            >
              <Shield className="w-4 h-4 text-[#0066CC]" />
              Manage Password / 2FA on Google
            </a>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-5">
          <h3 className="text-base font-bold text-[#1D1D1F]">Authorized Admin Users ({adminUsers.length})</h3>
          <div className="divide-y divide-[#E5E5EA] border-y border-[#E5E5EA]">
            {adminUsers.map((adm) => (
              <div key={adm.id} className="py-3 flex items-center justify-between gap-4 text-xs sm:text-sm">
                <div>
                  <p className="font-semibold text-[#1D1D1F]">
                    {adm.displayName} · <span className="text-[#0066CC]">{adm.role}</span>
                  </p>
                  <p className="text-xs text-[#6E6E73] font-mono">
                    {adm.email} · {adm.uid}
                  </p>
                </div>
                {adm.uid !== user?.uid && (
                  <button
                    type="button"
                    onClick={async () => {
                      await removeAdminUser(adm.uid);
                      onNotify('success', 'Admin access revoked.');
                    }}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                    aria-label={`Remove ${adm.email}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 items-end">
            <div>
              <label className="block text-xs font-semibold mb-1">Firebase UID *</label>
              <input
                type="text"
                required
                value={newAdminUid}
                onChange={(e) => setNewAdminUid(e.target.value)}
                placeholder="User UID"
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Google Email *</label>
              <input
                type="email"
                required
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="staff@refixpro.in"
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Display Name *</label>
              <input
                type="text"
                required
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="Technician Name"
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Role</label>
              <select
                value={newAdminRole}
                onChange={(e) => setNewAdminRole(e.target.value as 'admin' | 'super_admin')}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs bg-white"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
            >
              Add Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveWebsiteSettings(form);
      onNotify('success', 'Website settings updated across all pages.');
    } catch (err) {
      console.error(err);
      onNotify('error', 'Failed to save website settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryTitle.trim() || !newGalleryUrl.trim()) {
      onNotify('error', 'Title and image are required for gallery items.');
      return;
    }
    try {
      await saveGalleryImage({
        id: `gal-${Date.now().toString(36)}`,
        title: newGalleryTitle.trim(),
        caption: newGalleryCaption.trim(),
        imageUrl: newGalleryUrl.trim(),
        category: newGalleryCategory,
        sortOrder: galleryImages.length + 1,
      });
      setNewGalleryTitle('');
      setNewGalleryCaption('');
      setNewGalleryUrl('');
      onNotify('success', 'Gallery image added.');
    } catch (err) {
      console.error(err);
      onNotify('error', 'Failed to add gallery image.');
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSaveSettings} className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-5">
        <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
          <h2 className="text-lg font-bold text-[#1D1D1F]">Business & Website Settings</h2>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Business Name</label>
            <input
              type="text"
              required
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Phone Number</label>
            <input
              type="text"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">WhatsApp Number</label>
            <input
              type="text"
              required
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Business Hours</label>
            <input
              type="text"
              required
              value={form.businessHours}
              onChange={(e) => setForm({ ...form, businessHours: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Google Rating (0–5)</label>
            <input
              type="number"
              step="0.1"
              min={0}
              max={5}
              value={form.googleRating}
              onChange={(e) => setForm({ ...form, googleRating: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Google Review Count</label>
            <input
              type="number"
              min={0}
              value={form.googleReviewCount}
              onChange={(e) => setForm({ ...form, googleReviewCount: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Business Address</label>
          <input
            type="text"
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Logo Upload (PNG/SVG/JPG)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="Optional custom logo URL or upload"
                className="flex-1 px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
              />
              <label className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-[#D2D2D7] bg-[#F5F5F7] text-xs font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await compressImageToDataUrl(file, 400, 0.8);
                    setForm({ ...form, logoUrl: url });
                  }}
                />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Google Reviews Profile URL</label>
            <input
              type="text"
              value={form.googleReviewsUrl}
              onChange={(e) => setForm({ ...form, googleReviewsUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F5F5F7]">
          <div>
            <label className="block text-xs font-semibold mb-1">Homepage Hero Headline</label>
            <input
              type="text"
              required
              value={form.heroHeadline}
              onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Homepage Hero Image</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.heroImageUrl}
                onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
              />
              <label className="px-3 py-2 rounded-lg border border-[#D2D2D7] bg-[#F5F5F7] text-xs font-semibold cursor-pointer">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await compressImageToDataUrl(file, 1000, 0.75);
                    setForm({ ...form, heroImageUrl: url });
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Homepage Hero Subheadline</label>
          <textarea
            rows={2}
            required
            value={form.heroSubheadline}
            onChange={(e) => setForm({ ...form, heroSubheadline: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Default SEO Title</label>
            <input
              type="text"
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Default SEO Meta Description</label>
            <input
              type="text"
              value={form.seoDescription}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Business & Google Profile Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Gurugram SEO Keywords</label>
            <input
              type="text"
              value={form.seoKeywords}
              onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Footer Business Description</label>
          <textarea
            rows={2}
            value={form.footerDescription}
            onChange={(e) => setForm({ ...form, footerDescription: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
          />
        </div>
      </form>

      {/* Gallery Management */}
      <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-5">
        <h3 className="text-base font-bold text-[#1D1D1F]">Workstation Gallery Management ({galleryImages.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryImages.map((g) => (
            <div key={g.id} className="rounded-xl border border-[#E5E5EA] overflow-hidden">
              <img src={g.imageUrl} alt={g.title} className="w-full h-36 object-cover" />
              <div className="p-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[#1D1D1F]">{g.title}</p>
                  <p className="text-[11px] text-[#6E6E73]">{g.category}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteGalleryImage(g.id);
                    onNotify('success', 'Gallery image deleted.');
                  }}
                  className="text-red-600 p-1"
                  aria-label={`Delete ${g.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddGallery} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-[#E5E5EA] items-end">
          <div>
            <label className="block text-xs font-semibold mb-1">Photo Title *</label>
            <input
              type="text"
              required
              value={newGalleryTitle}
              onChange={(e) => setNewGalleryTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Category</label>
            <input
              type="text"
              value={newGalleryCategory}
              onChange={(e) => setNewGalleryCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Caption</label>
            <input
              type="text"
              value={newGalleryCaption}
              onChange={(e) => setNewGalleryCaption(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs"
            />
          </div>
          <div className="flex gap-2">
            <label className="px-3 py-2 rounded-lg border border-[#D2D2D7] bg-[#F5F5F7] text-xs font-semibold cursor-pointer whitespace-nowrap">
              {newGalleryUrl ? 'Image Ready' : 'Upload Photo'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = await compressImageToDataUrl(file, 900, 0.72);
                  setNewGalleryUrl(url);
                }}
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-semibold whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
