import { useMemo, useState } from 'react';
import { CheckCircle2, Code2, Download, Globe, Link2, Plus, Save, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useErp } from '../../context/ErpContext';
import { extractReadableError } from '../../lib/firebase';
import type { PageSeoEntry, RedirectRuleItem, WebsiteSettings } from '../../types';

const KNOWN_ROUTES = [
  '/',
  '/services',
  '/models',
  '/book',
  '/track',
  '/pay',
  '/reviews',
  '/faq',
  '/about',
  '/blog',
  '/contact',
  '/privacy-policy',
  '/terms-and-conditions',
  '/warranty-and-refund-policy',
];

export function AdminSeoTab({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const { settings, saveWebsiteSettings, adminBlogPosts, blogPosts } = useApp();
  const { logActivity } = useErp();

  const [form, setForm] = useState<WebsiteSettings>(() => ({
    ...settings,
    erpConfig: {
      ...(settings.erpConfig || {}),
      pageSeoOverrides: settings.erpConfig?.pageSeoOverrides || [],
      redirectRules: settings.erpConfig?.redirectRules || [],
    },
  }));
  const [saving, setSaving] = useState(false);

  const origin = (form.websiteUrl || 'https://refixpro.in').replace(/\/+$/, '');
  const allBlogs = adminBlogPosts.length > 0 ? adminBlogPosts : blogPosts;

  const sitemapXml = useMemo(() => {
    const urls = [
      ...KNOWN_ROUTES.map((p) => `${origin}${p}`),
      ...allBlogs.filter((b) => b.status === 'published').map((b) => `${origin}/blog/${b.slug}`),
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url>\n    <loc>${u}</loc>\n    <changefreq>weekly</changefreq>\n  </url>`)
      .join('\n')}\n</urlset>`;
  }, [origin, allBlogs]);

  const robotsTxt =
    form.erpConfig?.robotsTxtCustom?.trim() ||
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\n\nSitemap: ${origin}/sitemap.xml`;

  // Internal Link & SEO Health Audit
  const linkAudit = useMemo(() => {
    const knownSet = new Set(KNOWN_ROUTES);
    const brokenNav = (form.navLinks || []).filter(
      (n) => n.to.startsWith('/') && !knownSet.has(n.to) && !n.to.startsWith('/blog/')
    );
    const brokenFooter = [...(form.footerQuickLinks || []), ...(form.footerServiceLinks || [])].filter(
      (l) => l.to.startsWith('/') && !knownSet.has(l.to.split('?')[0]) && !l.to.startsWith('/blog/')
    );
    const draftBlogs = allBlogs.filter((b) => !b.seoDescription || b.seoTitle.length < 15);
    return { brokenNav, brokenFooter, draftBlogs };
  }, [form, allBlogs]);

  const updateOverride = (idx: number, patch: Partial<PageSeoEntry>) => {
    const list = [...(form.erpConfig?.pageSeoOverrides || [])];
    list[idx] = { ...list[idx], ...patch };
    setForm({
      ...form,
      erpConfig: { ...(form.erpConfig || {}), pageSeoOverrides: list },
    });
  };

  const updateRedirect = (idx: number, patch: Partial<RedirectRuleItem>) => {
    const list = [...(form.erpConfig?.redirectRules || [])];
    list[idx] = { ...list[idx], ...patch };
    setForm({
      ...form,
      erpConfig: { ...(form.erpConfig || {}), redirectRules: list },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveWebsiteSettings(form);
      await logActivity({
        action: 'SEO_SETTINGS_SAVED',
        targetCollection: 'websiteSettings',
        targetId: 'main',
        summary: 'Updated global SEO metadata, page overrides, and redirect rules',
      });
      onNotify('success', 'SEO Control Panel changes saved live.');
    } catch (err) {
      console.error(err);
      onNotify('error', extractReadableError(err, 'Failed to save SEO configuration.'));
    } finally {
      setSaving(false);
    }
  };

  const downloadText = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="p-5 rounded-xl border border-[#E5E5EA] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1D1D1F] flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#0066CC]" />
            Advanced SEO Control Panel
          </h2>
          <p className="text-xs text-[#6E6E73]">
            Manage global &amp; per-page meta titles, canonical URLs, JSON-LD schema health, sitemap/robots, and redirect rules.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving SEO...' : 'Save All SEO Settings'}
        </button>
      </div>

      {/* Global SEO Defaults */}
      <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-4 text-xs">
        <h3 className="text-base font-bold text-[#1D1D1F]">Global Search &amp; OpenGraph Metadata</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-1">Canonical Domain Origin</label>
            <input
              type="url"
              value={form.websiteUrl}
              onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Default Meta Title</label>
            <input
              type="text"
              value={form.seoTitle}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
            />
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1">Default Meta Description</label>
          <textarea
            rows={2}
            value={form.seoDescription}
            onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7]"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Gurugram Local Keywords</label>
          <textarea
            rows={2}
            value={form.seoKeywords}
            onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] font-mono"
          />
        </div>
      </div>

      {/* Per-Page SEO Overrides */}
      <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1D1D1F]">Per-Page Meta Titles &amp; Canonical Overrides</h3>
            <p className="text-[#6E6E73]">Override title, description, canonical URL, and OG image alt per route path.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                erpConfig: {
                  ...(form.erpConfig || {}),
                  pageSeoOverrides: [
                    ...(form.erpConfig?.pageSeoOverrides || []),
                    { path: '/services', title: '', description: '', canonicalUrl: '', ogImageAlt: '' },
                  ],
                },
              })
            }
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0F172A] text-white font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Page Override
          </button>
        </div>

        {(form.erpConfig?.pageSeoOverrides || []).map((entry, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={entry.path}
                onChange={(e) => updateOverride(idx, { path: e.target.value })}
                className="px-3 py-1.5 rounded-lg border border-[#D2D2D7] bg-white font-mono"
              >
                {KNOWN_ROUTES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Custom Meta Title"
                value={entry.title}
                onChange={(e) => updateOverride(idx, { title: e.target.value })}
                className="sm:col-span-2 px-3 py-1.5 rounded-lg border border-[#D2D2D7] bg-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Custom Meta Description"
                value={entry.description}
                onChange={(e) => updateOverride(idx, { description: e.target.value })}
                className="sm:col-span-2 px-3 py-1.5 rounded-lg border border-[#D2D2D7] bg-white"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="OG Image Alt Text"
                  value={entry.ogImageAlt || ''}
                  onChange={(e) => updateOverride(idx, { ogImageAlt: e.target.value })}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#D2D2D7] bg-white"
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      erpConfig: {
                        ...(form.erpConfig || {}),
                        pageSeoOverrides: (form.erpConfig?.pageSeoOverrides || []).filter((_, i) => i !== idx),
                      },
                    })
                  }
                  className="p-1.5 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Redirect Rules Manager */}
      <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#1D1D1F] flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-[#0066CC]" />
              Client Route Redirect Rules ({(form.erpConfig?.redirectRules || []).length})
            </h3>
            <p className="text-[#6E6E73]">Redirect legacy URLs to active SEO routes automatically.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                erpConfig: {
                  ...(form.erpConfig || {}),
                  redirectRules: [
                    ...(form.erpConfig?.redirectRules || []),
                    { fromPath: '/old-page', toPath: '/services', statusCode: '301' },
                  ],
                },
              })
            }
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D2D2D7] font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Redirect
          </button>
        </div>

        {(form.erpConfig?.redirectRules || []).map((rule, idx) => (
          <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <input
              type="text"
              value={rule.fromPath}
              onChange={(e) => updateRedirect(idx, { fromPath: e.target.value })}
              placeholder="/legacy-path"
              className="sm:col-span-5 px-3 py-1.5 rounded-lg border border-[#D2D2D7] font-mono"
            />
            <input
              type="text"
              value={rule.toPath}
              onChange={(e) => updateRedirect(idx, { toPath: e.target.value })}
              placeholder="/target-path"
              className="sm:col-span-5 px-3 py-1.5 rounded-lg border border-[#D2D2D7] font-mono"
            />
            <div className="sm:col-span-2 flex items-center gap-1 justify-end">
              <select
                value={rule.statusCode}
                onChange={(e) => updateRedirect(idx, { statusCode: e.target.value as '301' | '302' })}
                className="px-2 py-1.5 rounded-lg border border-[#D2D2D7] bg-white font-mono"
              >
                <option value="301">301</option>
                <option value="302">302</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    erpConfig: {
                      ...(form.erpConfig || {}),
                      redirectRules: (form.erpConfig?.redirectRules || []).filter((_, i) => i !== idx),
                    },
                  })
                }
                className="p-1.5 text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sitemap XML, Robots.txt & Internal Link Health Checker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1D1D1F] flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-[#0066CC]" />
              Sitemap.xml Generator
            </h3>
            <button
              type="button"
              onClick={() => downloadText('sitemap.xml', sitemapXml, 'application/xml')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D2D2D7] font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              Download sitemap.xml
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-[#0F172A] text-[#E2E8F0] font-mono text-[11px] max-h-48 overflow-auto">
            {sitemapXml}
          </pre>
        </div>

        <div className="p-6 rounded-xl border border-[#E5E5EA] bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1D1D1F]">Robots.txt Editor</h3>
            <button
              type="button"
              onClick={() => downloadText('robots.txt', robotsTxt, 'text/plain')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D2D2D7] font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              Download robots.txt
            </button>
          </div>
          <textarea
            rows={5}
            value={robotsTxt}
            onChange={(e) =>
              setForm({
                ...form,
                erpConfig: { ...(form.erpConfig || {}), robotsTxtCustom: e.target.value },
              })
            }
            className="w-full p-3 rounded-lg border border-[#D2D2D7] font-mono text-[11px]"
          />

          <div className="p-3 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA] space-y-1">
            <p className="font-bold text-[#1D1D1F] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Internal Link &amp; SEO Audit
            </p>
            <p className="text-[#424245]">
              Header broken links: <strong>{linkAudit.brokenNav.length}</strong> · Footer broken links:{' '}
              <strong>{linkAudit.brokenFooter.length}</strong> · Blog posts needing meta review:{' '}
              <strong>{linkAudit.draftBlogs.length}</strong>
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
