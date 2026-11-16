import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Save, Trash2, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { compressImageToDataUrl } from '../../utils/whatsapp';
import type { WebsiteSettings } from '../../types';

type CmsSection =
  | 'header'
  | 'footer'
  | 'seo'
  | 'home'
  | 'services'
  | 'models'
  | 'book'
  | 'track'
  | 'about'
  | 'blog'
  | 'contact';

const CMS_SECTIONS: { id: CmsSection; label: string }[] = [
  { id: 'header', label: 'Header & Nav' },
  { id: 'footer', label: 'Footer Links & Text' },
  { id: 'seo', label: 'Gurugram SEO' },
  { id: 'home', label: 'Home Page & FAQs' },
  { id: 'services', label: 'Services Page' },
  { id: 'models', label: 'Models Page' },
  { id: 'book', label: 'Book Page' },
  { id: 'track', label: 'Track Page' },
  { id: 'about', label: 'About Page' },
  { id: 'blog', label: 'Blog Page' },
  { id: 'contact', label: 'Contact Page' },
];

export function AdminPageContentTab({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const { settings, saveWebsiteSettings } = useApp();
  const [form, setForm] = useState<WebsiteSettings>(settings);
  const [activeSection, setActiveSection] = useState<CmsSection>('header');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveWebsiteSettings(form);
      onNotify('success', 'Header, footer & page content saved live.');
    } catch (err) {
      console.error(err);
      onNotify('error', 'Failed to save page layout customization.');
    } finally {
      setSaving(false);
    }
  };

  const updatePageField = <K extends keyof WebsiteSettings['pageContent']>(
    page: K,
    field: keyof WebsiteSettings['pageContent'][K],
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      pageContent: {
        ...prev.pageContent,
        [page]: {
          ...prev.pageContent[page],
          [field]: value,
        },
      },
    }));
  };

  const moveNav = (idx: number, dir: -1 | 1) => {
    const next = [...form.navLinks];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setForm({ ...form, navLinks: next });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="p-5 rounded-xl border border-[#E5E5EA] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1D1D1F]">
            Header, Footer & All-Page Content CMS
          </h2>
          <p className="text-xs text-[#6E6E73] mt-0.5">
            Customize navigation items, CTA buttons, footer columns, Gurugram local SEO keywords, FAQs, and copy for every page.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap shrink-0"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving Changes...' : 'Save All Layout Changes'}
        </button>
      </div>

      {/* Section Sub-Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {CMS_SECTIONS.map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setActiveSection(sec.id)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              activeSection === sec.id
                ? 'bg-[#1D1D1F] text-white'
                : 'bg-white border border-[#E5E5EA] text-[#424245] hover:text-[#1D1D1F]'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* HEADER & NAV */}
      {activeSection === 'header' && (
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-6">
          <h3 className="text-base font-bold text-[#1D1D1F]">Header Bar & Navigation Links</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Header CTA Button Text</label>
              <input
                type="text"
                value={form.headerCtaText}
                onChange={(e) => setForm({ ...form, headerCtaText: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Header CTA Button Route</label>
              <input
                type="text"
                value={form.headerCtaUrl}
                onChange={(e) => setForm({ ...form, headerCtaUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm font-mono"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#1D1D1F]">
                Navigation Menu Links ({form.navLinks.length}/10)
              </p>
              {form.navLinks.length < 10 && (
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      navLinks: [...form.navLinks, { label: 'New Link', to: '/services', visible: true }],
                    })
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D2D2D7] text-xs font-semibold hover:bg-[#F5F5F7]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Nav Link
                </button>
              )}
            </div>

            <div className="space-y-2">
              {form.navLinks.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-3 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA]"
                >
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={item.label}
                      placeholder="Label"
                      onChange={(e) => {
                        const next = [...form.navLinks];
                        next[idx] = { ...next[idx], label: e.target.value };
                        setForm({ ...form, navLinks: next });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#D2D2D7] bg-white text-xs font-medium"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={item.to}
                      placeholder="/route"
                      onChange={(e) => {
                        const next = [...form.navLinks];
                        next[idx] = { ...next[idx], to: e.target.value };
                        setForm({ ...form, navLinks: next });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#D2D2D7] bg-white text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2 text-xs">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.visible !== false}
                        onChange={(e) => {
                          const next = [...form.navLinks];
                          next[idx] = { ...next[idx], visible: e.target.checked };
                          setForm({ ...form, navLinks: next });
                        }}
                      />
                      Visible
                    </label>
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => moveNav(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded border border-[#D2D2D7] bg-white disabled:opacity-40"
                      aria-label="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveNav(idx, 1)}
                      disabled={idx === form.navLinks.length - 1}
                      className="p-1.5 rounded border border-[#D2D2D7] bg-white disabled:opacity-40"
                      aria-label="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          navLinks: form.navLinks.filter((_, i) => i !== idx),
                        })
                      }
                      className="p-1.5 rounded text-red-600 hover:bg-red-50"
                      aria-label="Delete link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      {activeSection === 'footer' && (
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-6">
          <h3 className="text-base font-bold text-[#1D1D1F]">Footer Content & Link Columns</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Footer Brand Tagline</label>
              <input
                type="text"
                value={form.footerTagline}
                onChange={(e) => setForm({ ...form, footerTagline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Gurugram Service Areas Note</label>
              <input
                type="text"
                value={form.serviceAreasText}
                onChange={(e) => setForm({ ...form, serviceAreasText: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
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

          <div>
            <label className="block text-xs font-semibold mb-1">Footer Independence / Legal Disclaimer</label>
            <textarea
              rows={2}
              value={form.footerLegalText}
              onChange={(e) => setForm({ ...form, footerLegalText: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-3 border-t border-[#E5E5EA]">
            {/* Quick Links */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Quick Links Column ({form.footerQuickLinks.length}/12)</p>
                {form.footerQuickLinks.length < 12 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        footerQuickLinks: [...form.footerQuickLinks, { label: 'New Link', to: '/' }],
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#D2D2D7] text-xs font-semibold"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                )}
              </div>
              {form.footerQuickLinks.map((lnk, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={lnk.label}
                    onChange={(e) => {
                      const next = [...form.footerQuickLinks];
                      next[idx] = { ...next[idx], label: e.target.value };
                      setForm({ ...form, footerQuickLinks: next });
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#D2D2D7] text-xs"
                  />
                  <input
                    type="text"
                    value={lnk.to}
                    onChange={(e) => {
                      const next = [...form.footerQuickLinks];
                      next[idx] = { ...next[idx], to: e.target.value };
                      setForm({ ...form, footerQuickLinks: next });
                    }}
                    className="w-36 px-2.5 py-1.5 rounded-lg border border-[#D2D2D7] text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        footerQuickLinks: form.footerQuickLinks.filter((_, i) => i !== idx),
                      })
                    }
                    className="p-1.5 text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Popular Services Links */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Popular Services Column ({form.footerServiceLinks.length}/12)</p>
                {form.footerServiceLinks.length < 12 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        footerServiceLinks: [...form.footerServiceLinks, { label: 'New Service', to: '/services' }],
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#D2D2D7] text-xs font-semibold"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                )}
              </div>
              {form.footerServiceLinks.map((lnk, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={lnk.label}
                    onChange={(e) => {
                      const next = [...form.footerServiceLinks];
                      next[idx] = { ...next[idx], label: e.target.value };
                      setForm({ ...form, footerServiceLinks: next });
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#D2D2D7] text-xs"
                  />
                  <input
                    type="text"
                    value={lnk.to}
                    onChange={(e) => {
                      const next = [...form.footerServiceLinks];
                      next[idx] = { ...next[idx], to: e.target.value };
                      setForm({ ...form, footerServiceLinks: next });
                    }}
                    className="w-36 px-2.5 py-1.5 rounded-lg border border-[#D2D2D7] text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        footerServiceLinks: form.footerServiceLinks.filter((_, i) => i !== idx),
                      })
                    }
                    className="p-1.5 text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SEO */}
      {activeSection === 'seo' && (
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-5">
          <h3 className="text-base font-bold text-[#1D1D1F]">Gurugram Local SEO Metadata & Keywords</h3>
          <div>
            <label className="block text-xs font-semibold mb-1">Primary SEO Title</label>
            <input
              type="text"
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">SEO Meta Description</label>
            <textarea
              rows={2}
              value={form.seoDescription}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Target Local Ranking Keywords (Gurugram / Sector 14 / Cyber City / MG Road)
            </label>
            <textarea
              rows={3}
              value={form.seoKeywords}
              onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Gurugram Area Coverage Summary</label>
            <input
              type="text"
              value={form.serviceAreasText}
              onChange={(e) => setForm({ ...form, serviceAreasText: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
        </div>
      )}

      {/* HOME PAGE & FAQs */}
      {activeSection === 'home' && (
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-6">
          <h3 className="text-base font-bold text-[#1D1D1F]">Home Page Sections & FAQs</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Hero Headline</label>
              <input
                type="text"
                value={form.heroHeadline}
                onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Hero Eyebrow Label</label>
              <input
                type="text"
                value={form.pageContent.home.heroEyebrow}
                onChange={(e) => updatePageField('home', 'heroEyebrow', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Hero Subheadline</label>
            <textarea
              rows={2}
              value={form.heroSubheadline}
              onChange={(e) => setForm({ ...form, heroSubheadline: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Services Section Heading</label>
              <input
                type="text"
                value={form.pageContent.home.servicesHeading}
                onChange={(e) => updatePageField('home', 'servicesHeading', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Estimator & Tracking Tools Heading</label>
              <input
                type="text"
                value={form.pageContent.home.toolsHeading}
                onChange={(e) => updatePageField('home', 'toolsHeading', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Why Choose Refix Pro Heading</label>
              <input
                type="text"
                value={form.pageContent.home.whyHeading}
                onChange={(e) => updatePageField('home', 'whyHeading', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Models Showcase Heading</label>
              <input
                type="text"
                value={form.pageContent.home.modelsHeading}
                onChange={(e) => updatePageField('home', 'modelsHeading', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Common Problems Heading</label>
              <input
                type="text"
                value={form.pageContent.home.problemsHeading}
                onChange={(e) => updatePageField('home', 'problemsHeading', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Repair Process Heading</label>
              <input
                type="text"
                value={form.pageContent.home.processHeading}
                onChange={(e) => updatePageField('home', 'processHeading', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Google Reviews Heading</label>
              <input
                type="text"
                value={form.pageContent.home.reviewsHeading}
                onChange={(e) => updatePageField('home', 'reviewsHeading', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Final Bottom CTA Headline</label>
              <input
                type="text"
                value={form.pageContent.home.finalCtaHeadline}
                onChange={(e) => updatePageField('home', 'finalCtaHeadline', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Why Choose Refix Pro Description</label>
            <textarea
              rows={2}
              value={form.pageContent.home.whyDescription}
              onChange={(e) => updatePageField('home', 'whyDescription', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Final Bottom CTA Subheadline</label>
            <textarea
              rows={2}
              value={form.pageContent.home.finalCtaSubheadline}
              onChange={(e) => updatePageField('home', 'finalCtaSubheadline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>

          {/* Home FAQs */}
          <div className="pt-4 border-t border-[#E5E5EA] space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-[#1D1D1F]">
                Home Page FAQs ({form.homeFaqs.length}/15)
              </p>
              {form.homeFaqs.length < 15 && (
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      homeFaqs: [
                        ...form.homeFaqs,
                        { q: 'New FAQ Question?', a: 'Answer from Refix Pro Sector 14, Gurugram.' },
                      ],
                    })
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D2D2D7] text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add FAQ
                </button>
              )}
            </div>
            {form.homeFaqs.map((faq, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA] space-y-2">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={faq.q}
                    placeholder="Question"
                    onChange={(e) => {
                      const next = [...form.homeFaqs];
                      next[idx] = { ...next[idx], q: e.target.value };
                      setForm({ ...form, homeFaqs: next });
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#D2D2D7] bg-white text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        homeFaqs: form.homeFaqs.filter((_, i) => i !== idx),
                      })
                    }
                    className="p-1.5 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={faq.a}
                  placeholder="Answer"
                  onChange={(e) => {
                    const next = [...form.homeFaqs];
                    next[idx] = { ...next[idx], a: e.target.value };
                    setForm({ ...form, homeFaqs: next });
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#D2D2D7] bg-white text-xs"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SERVICES PAGE */}
      {activeSection === 'services' && (
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-4">
          <h3 className="text-base font-bold text-[#1D1D1F]">Services Page Copy</h3>
          <div>
            <label className="block text-xs font-semibold mb-1">Page Headline</label>
            <input
              type="text"
              value={form.pageContent.services.headline}
              onChange={(e) => updatePageField('services', 'headline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Page Subheadline</label>
            <textarea
              rows={2}
              value={form.pageContent.services.subheadline}
              onChange={(e) => updatePageField('services', 'subheadline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Inspection & Parts Notice</label>
            <textarea
              rows={2}
              value={form.pageContent.services.noticeText}
              onChange={(e) => updatePageField('services', 'noticeText', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
        </div>
      )}

      {/* MODELS PAGE */}
      {activeSection === 'models' && (
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-4">
          <h3 className="text-base font-bold text-[#1D1D1F]">Supported Models Page Copy</h3>
          <div>
            <label className="block text-xs font-semibold mb-1">Page Headline</label>
            <input
              type="text"
              value={form.pageContent.models.headline}
              onChange={(e) => updatePageField('models', 'headline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Page Subheadline</label>
            <textarea
              rows={2}
              value={form.pageContent.models.subheadline}
              onChange={(e) => updatePageField('models', 'subheadline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Compatibility Selector Heading</label>
              <input
                type="text"
                value={form.pageContent.models.selectorHeading}
                onChange={(e) => updatePageField('models', 'selectorHeading', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Compatibility Selector Subheading</label>
              <input
                type="text"
                value={form.pageContent.models.selectorSubheading}
                onChange={(e) => updatePageField('models', 'selectorSubheading', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Selector Bottom Notice</label>
            <input
              type="text"
              value={form.pageContent.models.selectorNotice}
              onChange={(e) => updatePageField('models', 'selectorNotice', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
        </div>
      )}

      {/* BOOK PAGE */}
      {activeSection === 'book' && (
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-4">
          <h3 className="text-base font-bold text-[#1D1D1F]">Book a Repair Page Copy</h3>
          <div>
            <label className="block text-xs font-semibold mb-1">Page Headline</label>
            <input
              type="text"
              value={form.pageContent.book.headline}
              onChange={(e) => updatePageField('book', 'headline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Page Subheadline</label>
            <textarea
              rows={2}
              value={form.pageContent.book.subheadline}
              onChange={(e) => updatePageField('book', 'subheadline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Privacy & Passcode Note</label>
            <input
              type="text"
              value={form.pageContent.book.securityNote}
              onChange={(e) => updatePageField('book', 'securityNote', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
        </div>
      )}

      {/* TRACK PAGE */}
      {activeSection === 'track' && (
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-4">
          <h3 className="text-base font-bold text-[#1D1D1F]">Track My Repair Page Copy</h3>
          <div>
            <label className="block text-xs font-semibold mb-1">Page Headline</label>
            <input
              type="text"
              value={form.pageContent.track.headline}
              onChange={(e) => updatePageField('track', 'headline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Page Subheadline</label>
            <textarea
              rows={2}
              value={form.pageContent.track.subheadline}
              onChange={(e) => updatePageField('track', 'subheadline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
        </div>
      )}

      {/* ABOUT PAGE */}
      {activeSection === 'about' && (
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-4">
          <h3 className="text-base font-bold text-[#1D1D1F]">About Page Content & Studio Image</h3>
          <div>
            <label className="block text-xs font-semibold mb-1">About Headline</label>
            <input
              type="text"
              value={form.pageContent.about.headline}
              onChange={(e) => updatePageField('about', 'headline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">About Intro Description</label>
            <textarea
              rows={2}
              value={form.pageContent.about.subheadline}
              onChange={(e) => updatePageField('about', 'subheadline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">About Studio Hero Image</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.pageContent.about.workshopImageUrl}
                onChange={(e) => updatePageField('about', 'workshopImageUrl', e.target.value)}
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
                    const url = await compressImageToDataUrl(file, 1000, 0.75);
                    updatePageField('about', 'workshopImageUrl', url);
                  }}
                />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Approach Section Heading</label>
              <input
                type="text"
                value={form.pageContent.about.approachHeading}
                onChange={(e) => updatePageField('about', 'approachHeading', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Gallery Section Heading</label>
              <input
                type="text"
                value={form.pageContent.about.galleryHeading}
                onChange={(e) => updatePageField('about', 'galleryHeading', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Approach Description</label>
            <textarea
              rows={2}
              value={form.pageContent.about.approachDescription}
              onChange={(e) => updatePageField('about', 'approachDescription', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Gallery Subheading</label>
            <input
              type="text"
              value={form.pageContent.about.gallerySubheading}
              onChange={(e) => updatePageField('about', 'gallerySubheading', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
        </div>
      )}

      {/* BLOG PAGE */}
      {activeSection === 'blog' && (
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-4">
          <h3 className="text-base font-bold text-[#1D1D1F]">Blog Listing Page Copy</h3>
          <div>
            <label className="block text-xs font-semibold mb-1">Blog Headline</label>
            <input
              type="text"
              value={form.pageContent.blog.headline}
              onChange={(e) => updatePageField('blog', 'headline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Blog Subheadline</label>
            <textarea
              rows={2}
              value={form.pageContent.blog.subheadline}
              onChange={(e) => updatePageField('blog', 'subheadline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Sidebar CTA Title</label>
              <input
                type="text"
                value={form.pageContent.blog.sidebarCtaTitle}
                onChange={(e) => updatePageField('blog', 'sidebarCtaTitle', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Sidebar CTA Text</label>
              <input
                type="text"
                value={form.pageContent.blog.sidebarCtaText}
                onChange={(e) => updatePageField('blog', 'sidebarCtaText', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* CONTACT PAGE */}
      {activeSection === 'contact' && (
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-4">
          <h3 className="text-base font-bold text-[#1D1D1F]">Contact Page Copy</h3>
          <div>
            <label className="block text-xs font-semibold mb-1">Contact Headline</label>
            <input
              type="text"
              value={form.pageContent.contact.headline}
              onChange={(e) => updatePageField('contact', 'headline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Contact Subheadline</label>
            <textarea
              rows={2}
              value={form.pageContent.contact.subheadline}
              onChange={(e) => updatePageField('contact', 'subheadline', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Form Section Heading</label>
              <input
                type="text"
                value={form.pageContent.contact.formHeading}
                onChange={(e) => updatePageField('contact', 'formHeading', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Map Section Heading</label>
              <input
                type="text"
                value={form.pageContent.contact.mapHeading}
                onChange={(e) => updatePageField('contact', 'mapHeading', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
