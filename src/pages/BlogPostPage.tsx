import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useSeoMeta } from '../utils/seo';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { SafeImage } from '../components/SafeImage';

interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

function parseContentBlocks(content: string) {
  const lines = content.split('\n');
  const headings: TocHeading[] = [];
  const elements: { type: 'h2' | 'h3' | 'ul' | 'p'; text?: string; items?: string[]; id?: string }[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push({ type: 'ul', items: [...listBuffer] });
      listBuffer = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      const text = line.replace(/^##\s+/, '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      headings.push({ id, text, level: 2 });
      elements.push({ type: 'h2', text, id });
    } else if (line.startsWith('### ')) {
      flushList();
      const text = line.replace(/^###\s+/, '');
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      headings.push({ id, text, level: 3 });
      elements.push({ type: 'h3', text, id });
    } else if (line.startsWith('- ')) {
      listBuffer.push(line.replace(/^-\s+/, '').replace(/\*\*/g, ''));
    } else {
      flushList();
      elements.push({ type: 'p', text: line.replace(/\*\*/g, '') });
    }
  }
  flushList();
  return { headings, elements };
}

export function BlogPostPage() {
  const { slug } = useParams();
  const { blogPosts, settings } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const post = useMemo(
    () => blogPosts.find((p) => p.slug === slug),
    [blogPosts, slug]
  );

  const parsed = useMemo(
    () => (post ? parseContentBlocks(post.content) : { headings: [], elements: [] }),
    [post]
  );

  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return blogPosts
      .filter((p) => p.id !== post.id)
      .sort((a, b) => (a.category === post.category ? -1 : 1) - (b.category === post.category ? -1 : 1))
      .slice(0, 3);
  }, [blogPosts, post]);

  useSeoMeta({
    title: post ? post.seoTitle || post.title : 'Article Not Found | Refix Pro',
    description: post ? post.seoDescription || post.excerpt : 'MacBook repair insights from Refix Pro Gurugram.',
    canonicalPath: post ? `/blog/${post.slug}` : '/blog',
    schema: post
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.seoDescription || post.excerpt,
            datePublished: post.publishedAt,
            author: { '@type': 'Organization', name: post.authorName },
            publisher: { '@type': 'Organization', name: settings.businessName },
          },
          ...(post.faqs.length > 0
            ? [
                {
                  '@context': 'https://schema.org',
                  '@type': 'FAQPage',
                  mainEntity: post.faqs.map((f) => ({
                    '@type': 'Question',
                    name: f.question,
                    acceptedAnswer: { '@type': 'Answer', text: f.answer },
                  })),
                },
              ]
            : []),
        ]
      : undefined,
  });

  if (!post) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-24 text-center space-y-4">
        <h1 className="text-3xl font-bold text-[#1D1D1F]">Article Not Found</h1>
        <p className="text-sm text-[#424245]">The requested guide may have been moved or unpublished.</p>
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0066CC]">
          <ArrowLeft className="w-4 h-4" />
          Back to All Guides
        </Link>
      </div>
    );
  }

  return (
    <article className="bg-white min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#F5F5F7] to-white border-b border-[#E5E5EA] py-12 lg:py-16">
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 space-y-5">
          <nav aria-label="Breadcrumb" className="text-xs text-[#6E6E73] flex flex-wrap items-center gap-2">
            <Link to="/" className="hover:text-[#1D1D1F]">Home</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-[#1D1D1F]">Blog</Link>
            <span>/</span>
            <span className="text-[#1D1D1F] font-medium truncate max-w-[260px]">{post.title}</span>
          </nav>

          <p className="text-xs text-[#6E6E73]">
            {post.category} · Published {post.publishedAt} · By {post.authorName}
          </p>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1D1D1F] leading-tight">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-[#424245] leading-relaxed">
            {post.excerpt}
          </p>
        </div>
      </header>

      {/* Featured Image */}
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 -mt-4 pt-8">
        <div className="aspect-[16/9] max-h-[540px] rounded-2xl overflow-hidden border border-[#E5E5EA] bg-[#F5F5F7]">
          <SafeImage src={post.featuredImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Article Body + Table of Contents */}
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-12 space-y-10">
        {parsed.headings.length > 0 && (
          <nav aria-label="Table of Contents" className="p-5 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]">
            <p className="text-xs font-bold text-[#1D1D1F] mb-3">Table of Contents</p>
            <ul className="space-y-1.5 text-sm">
              {parsed.headings.map((h) => (
                <li key={h.id} className={h.level === 3 ? 'pl-4 text-xs' : ''}>
                  <a href={`#${h.id}`} className="text-[#0066CC] hover:underline">
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="space-y-5 text-base text-[#1D1D1F] leading-relaxed">
          {parsed.elements.map((el, idx) => {
            if (el.type === 'h2') {
              return (
                <h2 key={idx} id={el.id} className="text-2xl font-bold tracking-tight text-[#1D1D1F] pt-4 scroll-mt-24">
                  {el.text}
                </h2>
              );
            }
            if (el.type === 'h3') {
              return (
                <h3 key={idx} id={el.id} className="text-lg font-bold text-[#1D1D1F] pt-2 scroll-mt-24">
                  {el.text}
                </h3>
              );
            }
            if (el.type === 'ul') {
              return (
                <ul key={idx} className="list-disc pl-6 space-y-2 text-[#424245]">
                  {el.items?.map((li, i) => (
                    <li key={i}>{li}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={idx} className="text-[#424245]">
                {el.text}
              </p>
            );
          })}
        </div>

        {/* Repair Tips Box */}
        <div className="p-6 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-2">
          <h3 className="text-base font-bold text-[#1D1D1F]">Specialist Tip from Refix Pro</h3>
          <p className="text-sm text-[#424245] leading-relaxed">
            Avoid opening sealed MacBook batteries or probing live logic boards without ESD protection. Bring your MacBook to SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007 for a structured bench check first.
          </p>
        </div>

        {/* Tags (Unboxed per anti-pill rule) */}
        {post.tags.length > 0 && (
          <p className="text-xs text-[#6E6E73]">
            Topics: {post.tags.join(' · ')}
          </p>
        )}

        {/* FAQs */}
        {post.faqs.length > 0 && (
          <section className="pt-6 border-t border-[#E5E5EA]">
            <h2 className="text-2xl font-bold text-[#1D1D1F] mb-4">Frequently Asked Questions</h2>
            <div className="divide-y divide-[#E5E5EA] border-y border-[#E5E5EA]">
              {post.faqs.map((faq, idx) => {
                const open = openFaq === idx;
                return (
                  <div key={faq.question}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : idx)}
                      className="w-full py-4 flex items-center justify-between gap-4 text-left"
                    >
                      <span className="text-sm sm:text-base font-semibold text-[#1D1D1F]">{faq.question}</span>
                      <ChevronDown className={`w-4 h-4 text-[#6E6E73] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                    {open && (
                      <p className="pb-4 text-sm text-[#424245] leading-relaxed">{faq.answer}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Conversion CTA */}
        <div className="p-8 rounded-2xl bg-[#0A0A0C] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold">Need Hands-On MacBook Diagnostics?</h2>
            <p className="text-sm text-[#A1A1A6]">
              Book a repair slot or visit SCF-92,SECTOR-14 MAIN MARKET, Gurugram, Haryana 122007.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to="/book"
              className="px-5 py-2.5 rounded-xl bg-[#0066CC] hover:bg-[#0052A3] text-white text-xs sm:text-sm font-semibold whitespace-nowrap"
            >
              Book a Repair
            </Link>
            <a
              href={buildWhatsAppUrl(
                settings.whatsapp,
                `Hello Refix Pro, I read "${post.title}" and need help with my MacBook in Gurugram.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white text-xs sm:text-sm font-semibold whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="bg-[#F5F5F7] border-t border-[#E5E5EA] py-14">
          <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
            <h2 className="text-2xl font-bold text-[#1D1D1F] mb-8">Related MacBook Repair Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/blog/${rel.slug}`}
                  className="rounded-2xl overflow-hidden bg-white border border-[#E5E5EA] hover:border-[#0066CC]/50 transition-colors flex flex-col"
                >
                  <div className="aspect-[4/3] bg-[#E5E5EA]">
                    <SafeImage src={rel.featuredImage} alt={rel.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-5 space-y-2">
                    <p className="text-xs text-[#6E6E73]">{rel.category} · {rel.publishedAt}</p>
                    <h3 className="text-base font-bold text-[#1D1D1F] leading-snug">{rel.title}</h3>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0066CC] pt-1">
                      Read Article <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
