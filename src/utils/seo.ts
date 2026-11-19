import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

interface SeoMetaOptions {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  schema?: Record<string, unknown> | Record<string, unknown>[];
}

export function buildBreadcrumbSchema(items: { name: string; path: string }[]): Record<string, unknown> {
  const origin = 'https://refixpro.in';
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: `${origin}${item.path === '/' ? '/' : item.path}`,
    })),
  };
}

export function buildServiceSchema(opts: {
  name: string;
  description: string;
  areaServed?: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    description: opts.description,
    provider: {
      '@type': 'LocalBusiness',
      name: 'Refix Pro',
      telephone: '+91 96139 32932',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'SCF-92,SECTOR-14 MAIN MARKET',
        addressLocality: 'Gurugram',
        addressRegion: 'Haryana',
        postalCode: '122007',
        addressCountry: 'IN',
      },
    },
    areaServed: opts.areaServed || 'Gurugram, Haryana',
  };
}

export function useSeoMeta({ title, description, keywords, canonicalPath, schema }: SeoMetaOptions) {
  const { settings } = useApp();

  const currentPath = canonicalPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const override = (settings.erpConfig?.pageSeoOverrides || []).find(
    (entry) => entry.path === currentPath
  );

  const effectiveTitle = override?.title?.trim() || title;
  const effectiveDescription = override?.description?.trim() || description;
  const effectiveKeywords = keywords || settings.seoKeywords;

  useEffect(() => {
    document.title = effectiveTitle;

    const setMeta = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta('meta[name="description"]', 'name', 'description', effectiveDescription);
    if (effectiveKeywords) {
      setMeta('meta[name="keywords"]', 'name', 'keywords', effectiveKeywords);
    }
    setMeta('meta[property="og:title"]', 'property', 'og:title', effectiveTitle);
    setMeta('meta[property="og:description"]', 'property', 'og:description', effectiveDescription);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', effectiveTitle);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', effectiveDescription);

    const origin = (settings.websiteUrl || 'https://refixpro.in').replace(/\/+$/, '');
    const defaultCanonical = `${origin}${currentPath === '/' ? '/' : currentPath}`;
    const canonicalUrl = override?.canonicalUrl?.trim() || defaultCanonical;
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);

    if (override?.ogImageAlt?.trim()) {
      setMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', override.ogImageAlt.trim());
    }

    let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = canonicalUrl;

    const scriptId = 'refix-dynamic-jsonld';
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      existingScript.remove();
    }

    if (schema) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    }

    return () => {
      const s = document.getElementById(scriptId);
      if (s) s.remove();
    };
  }, [
    effectiveTitle,
    effectiveDescription,
    effectiveKeywords,
    currentPath,
    override?.canonicalUrl,
    override?.ogImageAlt,
    settings.websiteUrl,
    schema,
  ]);
}
