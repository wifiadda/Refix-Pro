import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSeoMeta } from '../utils/seo';
import { SafeImage } from '../components/SafeImage';

const PAGE_SIZE = 6;

export function BlogPage() {
  const { blogPosts, blogCategories, settings } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  const blogCopy = settings.pageContent.blog;

  useSeoMeta({
    title: 'MacBook Repair Blog & Troubleshooting Guides | Refix Pro Gurugram',
    description:
      'Expert articles on MacBook no power, water damage recovery, Retina screen replacement, logic board repair, battery health, and overheating solutions in Gurugram.',
    keywords: settings.seoKeywords,
    canonicalPath: '/blog',
  });

  const featuredPosts = useMemo(
    () => blogPosts.filter((p) => p.isFeatured).slice(0, 2),
    [blogPosts]
  );

  const popularPosts = useMemo(
    () => [...blogPosts].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5),
    [blogPosts]
  );

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return blogPosts.filter((p) => {
      const catMatch = selectedCategory === 'All' || p.category === selectedCategory;
      const textMatch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return catMatch && textMatch;
    });
  }, [blogPosts, selectedCategory, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedPosts = filteredPosts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="bg-[#F5F5F7] border-b border-[#E5E5EA] py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <nav aria-label="Breadcrumb" className="text-xs text-[#6E6E73] flex items-center gap-2">
            <Link to="/" className="hover:text-[#1D1D1F]">Home</Link>
            <span>/</span>
            <span className="text-[#1D1D1F] font-medium">Blog</span>
          </nav>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#1D1D1F]">
            {blogCopy.headline}
          </h1>
          <p className="text-base text-[#424245] max-w-2xl">
            {blogCopy.subheadline}
          </p>
        </div>
      </section>

      {/* Featured Articles */}
      {featuredPosts.length > 0 && !searchQuery && selectedCategory === 'All' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6">
          <h2 className="text-xl font-bold text-[#1D1D1F] mb-6">Featured Articles</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredPosts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group rounded-2xl overflow-hidden border border-[#E5E5EA] bg-[#F5F5F7] hover:border-[#0066CC]/50 transition-colors grid grid-cols-1 sm:grid-cols-12 items-stretch"
              >
                <div className="sm:col-span-5 aspect-[4/3] sm:aspect-auto bg-[#E5E5EA]">
                  <SafeImage
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="sm:col-span-7 p-6 flex flex-col justify-between bg-white">
                  <div>
                    <p className="text-xs text-[#6E6E73]">
                      {post.category} · {post.publishedAt}
                    </p>
                    <h3 className="text-lg font-bold text-[#1D1D1F] mt-2 group-hover:text-[#0066CC] transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-[#424245] mt-2 line-clamp-2">{post.excerpt}</p>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0066CC]">
                    Read Full Guide <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Main Listing + Sidebar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          {/* Category Filter + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E5EA]">
            <div className="flex flex-wrap gap-1.5">
              {['All', ...blogCategories.map((c) => c.name)].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#1D1D1F] text-white'
                      : 'bg-[#F5F5F7] text-[#424245] hover:text-[#1D1D1F]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-60 shrink-0">
              <Search className="w-4 h-4 text-[#6E6E73] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search articles..."
                aria-label="Search blog articles"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D2D2D7] text-sm focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
            </div>
          </div>

          {paginatedPosts.length === 0 ? (
            <div className="py-12 text-center border border-[#E5E5EA] rounded-2xl bg-[#F5F5F7]">
              <p className="text-base font-semibold text-[#1D1D1F]">No matching articles found.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-3 px-4 py-2 rounded-lg bg-[#0066CC] text-white text-xs font-semibold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedPosts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-2xl overflow-hidden border border-[#E5E5EA] bg-white flex flex-col justify-between"
                >
                  <div>
                    <Link to={`/blog/${post.slug}`} className="block aspect-[4/3] bg-[#F5F5F7] overflow-hidden">
                      <SafeImage
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
                      />
                    </Link>
                    <div className="p-5 space-y-2.5">
                      <p className="text-xs text-[#6E6E73]">
                        {post.category} · {post.publishedAt}
                      </p>
                      <h3 className="text-lg font-bold text-[#1D1D1F] leading-snug">
                        <Link to={`/blog/${post.slug}`} className="hover:text-[#0066CC] transition-colors">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-[#424245] line-clamp-3">{post.excerpt}</p>
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-2 flex items-center justify-between text-xs">
                    <span className="text-[#6E6E73]">By {post.authorName}</span>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="font-semibold text-[#0066CC] inline-flex items-center gap-1 hover:underline"
                    >
                      Read <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-lg text-xs font-semibold tabular-nums transition-colors ${
                      safePage === pageNum
                        ? 'bg-[#0066CC] text-white'
                        : 'bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="p-6 rounded-2xl border border-[#E5E5EA] bg-[#F5F5F7]">
            <h2 className="text-base font-bold text-[#1D1D1F] mb-4">Popular Articles</h2>
            <ul className="divide-y divide-[#E5E5EA]">
              {popularPosts.map((p) => (
                <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                  <Link
                    to={`/blog/${p.slug}`}
                    className="text-sm font-semibold text-[#1D1D1F] hover:text-[#0066CC] leading-snug block"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-[#6E6E73] mt-1">
                    {p.category} · {p.publishedAt}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-[#1D1D1F] text-white space-y-4">
            <h2 className="text-lg font-bold">{blogCopy.sidebarCtaTitle}</h2>
            <p className="text-xs sm:text-sm text-[#A1A1A6] leading-relaxed">
              {blogCopy.sidebarCtaText}
            </p>
            <Link
              to="/book"
              className="block text-center px-4 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs font-semibold transition-colors"
            >
              Book a Repair
            </Link>
          </div>
        </aside>
      </section>
    </div>
  );
}
