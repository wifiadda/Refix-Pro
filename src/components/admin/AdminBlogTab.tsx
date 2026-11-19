import { useMemo, useState } from 'react';
import { BookOpen, Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { slugify, useApp } from '../../context/AppContext';
import { extractReadableError } from '../../lib/firebase';
import { BlogFaq, BlogPost } from '../../types';
import { compressImageToDataUrl } from '../../utils/whatsapp';
import { IMG_MICROSCOPE } from '../../data/seedServicesAndModels';
import { ConfirmDialog } from '../ConfirmDialog';
import { EmptyState, StatusBadge } from '../ui/DesignSystem';

export function AdminBlogTab({
  onNotify,
}: {
  onNotify: (type: 'success' | 'error', message: string) => void;
}) {
  const {
    adminBlogPosts,
    blogPosts,
    blogCategories,
    saveBlogPost,
    deleteBlogPost,
    saveBlogCategory,
    deleteBlogCategory,
  } = useApp();

  const postsList = adminBlogPosts.length > 0 ? adminBlogPosts : blogPosts;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');
  const [editingPost, setEditingPost] = useState<Omit<BlogPost, 'createdAt' | 'updatedAt'> | null>(null);
  const [isNewPost, setIsNewPost] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [faqs, setFaqs] = useState<BlogFaq[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletePostTarget, setDeletePostTarget] = useState<BlogPost | null>(null);

  const [newCatName, setNewCatName] = useState('');

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return postsList.filter((p) => {
      const stOk = statusFilter === 'all' || p.status === statusFilter;
      const qOk =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q);
      return stOk && qOk;
    });
  }, [postsList, search, statusFilter]);

  const openNewPost = () => {
    setIsNewPost(true);
    setEditingPost({
      id: `blog-${Date.now().toString(36)}`,
      title: '',
      slug: '',
      category: blogCategories[0]?.name || 'Logic Board & Chip-Level',
      excerpt: '',
      content: '## Overview\n\nWrite your MacBook repair guide here...',
      featuredImage: IMG_MICROSCOPE,
      authorName: 'Refix Pro Technical Desk',
      status: 'draft',
      publishedAt: new Date().toISOString().slice(0, 10),
      seoTitle: '',
      seoDescription: '',
      tags: [],
      faqs: [],
      isFeatured: false,
      views: 0,
    });
    setTagsInput('');
    setFaqs([]);
  };

  const openEditPost = (p: BlogPost) => {
    setIsNewPost(false);
    setEditingPost({ ...p });
    setTagsInput(p.tags.join(', '));
    setFaqs(p.faqs || []);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    setSaving(true);
    try {
      await saveBlogPost(
        {
          ...editingPost,
          slug: slugify(editingPost.slug || editingPost.title),
          tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
          faqs: faqs.filter((f) => f.question.trim() && f.answer.trim()),
        },
        isNewPost
      );
      onNotify('success', `Saved article "${editingPost.title}".`);
      setEditingPost(null);
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Failed to save blog post.'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCatName.trim().length < 2) return;
    try {
      await saveBlogCategory({
        id: `cat-${Date.now().toString(36)}`,
        name: newCatName.trim(),
        slug: slugify(newCatName),
        description: '',
      });
      setNewCatName('');
      onNotify('success', 'Blog category added.');
    } catch (err) {
      onNotify('error', extractReadableError(err, 'Failed to add category.'));
    }
  };

  return (
    <div className="space-y-8">
      {/* Categories bar */}
      <div className="p-5 rounded-xl border border-[#E5E5EA] bg-white space-y-4">
        <h3 className="text-sm font-bold text-[#1D1D1F]">Blog Categories</h3>
        <div className="flex flex-wrap gap-2">
          {blogCategories.map((c) => (
            <div
              key={c.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA] text-xs font-medium"
            >
              <span>{c.name}</span>
              <button
                type="button"
                onClick={async () => {
                  await deleteBlogCategory(c.id);
                  onNotify('success', 'Category removed.');
                }}
                aria-label={`Remove ${c.name}`}
                className="text-[#6E6E73] hover:text-red-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddCategory} className="flex gap-2 max-w-sm">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="New category name..."
            className="flex-1 px-3 py-1.5 rounded-lg border border-[#D2D2D7] text-xs"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-[#1D1D1F] text-white text-xs font-semibold"
          >
            Add
          </button>
        </form>
      </div>

      {/* Blog Posts Table */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <h2 className="text-lg font-bold text-[#1D1D1F] mr-2">
              Blog Articles ({filteredPosts.length})
            </h2>
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, category, slug..."
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'published' | 'draft' | 'scheduled')}
              aria-label="Filter articles by status"
              className="px-3 py-2 rounded-lg border border-[#D2D2D7] bg-white text-xs sm:text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          <button
            type="button"
            onClick={openNewPost}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Create Article
          </button>
        </div>

        {filteredPosts.length === 0 ? (
          <EmptyState
            title="No blog articles match your filter"
            description="Write repair guides to boost local MacBook repair SEO in Gurugram."
            icon={<BookOpen className="w-5 h-5" />}
          />
        ) : (
          <div className="rounded-xl border border-[#E5E5EA] bg-white overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5EA] bg-[#F5F5F7] text-xs font-semibold text-[#424245]">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Publish Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA] text-xs sm:text-sm">
                {filteredPosts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F5F5F7]/60">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#1D1D1F]">{p.title}</p>
                      <p className="text-xs font-mono text-[#6E6E73]">/{p.slug}</p>
                    </td>
                    <td className="py-3 px-4 text-[#424245]">{p.category}</td>
                    <td className="py-3 px-4 capitalize">
                      <StatusBadge
                        label={p.status}
                        tone={p.status === 'published' ? 'success' : p.status === 'scheduled' ? 'info' : 'neutral'}
                      />
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-xs">{p.publishedAt}</td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditPost(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#D2D2D7] text-xs font-semibold hover:bg-[#F5F5F7]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletePostTarget(p)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                        aria-label={`Delete ${p.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Blog Editor Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleSavePost}
            className="bg-white rounded-2xl border border-[#E5E5EA] max-w-3xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
              <h3 className="text-lg font-bold">{isNewPost ? 'Create Blog Article' : 'Edit Blog Article'}</h3>
              <button type="button" onClick={() => setEditingPost(null)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Article Title *</label>
                <input
                  type="text"
                  required
                  value={editingPost.title}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">SEO URL Slug</label>
                <input
                  type="text"
                  value={editingPost.slug}
                  onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                  placeholder="auto-generated-from-title"
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Category *</label>
                <select
                  value={editingPost.category}
                  onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm bg-white"
                >
                  {blogCategories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Publication Status</label>
                <select
                  value={editingPost.status}
                  onChange={(e) =>
                    setEditingPost({
                      ...editingPost,
                      status: e.target.value as 'draft' | 'published' | 'scheduled',
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm bg-white"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Publish Date</label>
                <input
                  type="date"
                  required
                  value={editingPost.publishedAt}
                  onChange={(e) => setEditingPost({ ...editingPost, publishedAt: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Excerpt *</label>
              <textarea
                rows={2}
                required
                value={editingPost.excerpt}
                onChange={(e) => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Article Content (Markdown ## / ### headings supported) *</label>
              <textarea
                rows={8}
                required
                value={editingPost.content}
                onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-xs sm:text-sm font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">SEO Title</label>
                <input
                  type="text"
                  value={editingPost.seoTitle}
                  onChange={(e) => setEditingPost({ ...editingPost, seoTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">SEO Meta Description</label>
              <textarea
                rows={2}
                value={editingPost.seoDescription}
                onChange={(e) => setEditingPost({ ...editingPost, seoDescription: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#D2D2D7] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Featured Image URL or Upload</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingPost.featuredImage}
                  onChange={(e) => setEditingPost({ ...editingPost, featuredImage: e.target.value })}
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
                      const url = await compressImageToDataUrl(file, 900, 0.72);
                      setEditingPost({ ...editingPost, featuredImage: url });
                    }}
                  />
                </label>
              </div>
            </div>

            {/* FAQs Manager */}
            <div className="space-y-2 border-t border-[#E5E5EA] pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Article FAQs</span>
                <button
                  type="button"
                  onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}
                  className="text-xs font-semibold text-[#0066CC]"
                >
                  + Add FAQ
                </button>
              </div>
              {faqs.map((f, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 rounded-lg bg-[#F5F5F7]">
                  <input
                    type="text"
                    placeholder="Question"
                    value={f.question}
                    onChange={(e) => {
                      const next = [...faqs];
                      next[i] = { ...next[i], question: e.target.value };
                      setFaqs(next);
                    }}
                    className="px-2.5 py-1.5 rounded border border-[#D2D2D7] bg-white text-xs"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Answer"
                      value={f.answer}
                      onChange={(e) => {
                        const next = [...faqs];
                        next[i] = { ...next[i], answer: e.target.value };
                        setFaqs(next);
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded border border-[#D2D2D7] bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setFaqs(faqs.filter((_, idx) => idx !== i))}
                      className="text-red-600 px-1.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold">
              <input
                type="checkbox"
                checked={editingPost.isFeatured}
                onChange={(e) => setEditingPost({ ...editingPost, isFeatured: e.target.checked })}
              />
              Mark as Featured Article
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditingPost(null)} className="px-4 py-2 rounded-lg border border-[#D2D2D7] text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-semibold">
                {saving ? 'Saving...' : 'Save Article'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deletePostTarget)}
        title={`Delete Article "${deletePostTarget?.title}"?`}
        description="Permanently removes this blog post from Firestore."
        confirmLabel="Delete Article"
        onCancel={() => setDeletePostTarget(null)}
        onConfirm={async () => {
          if (!deletePostTarget) return;
          try {
            await deleteBlogPost(deletePostTarget.id);
            setDeletePostTarget(null);
            onNotify('success', 'Article deleted.');
          } catch (err) {
            onNotify('error', extractReadableError(err, 'Failed to delete article.'));
          }
        }}
      />
    </div>
  );
}
