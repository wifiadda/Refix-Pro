import type { WebsiteSettings } from '../types';

interface SocialLinksBarProps {
  settings: Pick<
    WebsiteSettings,
    'socialInstagram' | 'socialFacebook' | 'socialYoutube' | 'socialTwitter' | 'socialLinkedin'
  >;
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md';
  className?: string;
}

function normalizeUrl(raw?: string): string | null {
  const val = (raw || '').trim();
  if (!val) return null;
  if (/^https?:\/\//i.test(val)) return val;
  return `https://${val}`;
}

export function SocialLinksBar({
  settings,
  variant = 'light',
  size = 'md',
  className = '',
}: SocialLinksBarProps) {
  const items = [
    {
      key: 'instagram',
      label: 'Instagram',
      href: normalizeUrl(settings.socialInstagram),
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    },
    {
      key: 'facebook',
      label: 'Facebook',
      href: normalizeUrl(settings.socialFacebook),
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      ),
    },
    {
      key: 'youtube',
      label: 'YouTube',
      href: normalizeUrl(settings.socialYoutube),
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      key: 'twitter',
      label: 'X / Twitter',
      href: normalizeUrl(settings.socialTwitter),
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      href: normalizeUrl(settings.socialLinkedin),
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
    },
  ].filter((item): item is typeof item & { href: string } => Boolean(item.href));

  if (items.length === 0) return null;

  const btnBase =
    size === 'sm'
      ? 'w-9 h-9 rounded-lg flex items-center justify-center border transition-colors'
      : 'w-10 h-10 rounded-xl flex items-center justify-center border transition-colors';

  const btnTheme =
    variant === 'dark'
      ? 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:border-[#0071E3] hover:bg-[#0071E3]/15'
      : 'bg-[#F5F5F7] border-neutral-200 text-[#1D1D1F] hover:text-[#0071E3] hover:border-[#0071E3]/40 hover:bg-[#0071E3]/5';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          title={item.label}
          className={`${btnBase} ${btnTheme}`}
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}
