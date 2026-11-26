import Link from 'next/link';

export function LogoMark({ size = 24 }: { size?: number }) {
  // ShotDomain's own mark (viewfinder corners + aperture), printed in riso blue: it follows the theme.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <rect width="32" height="32" rx="7" style={{ fill: 'var(--primary)' }} />
      <path
        d="M9 12.5V9h3.5M23 12.5V9h-3.5M9 19.5V23h3.5M23 19.5V23h-3.5"
        fill="none"
        style={{ stroke: 'var(--primary-fg)' }}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="2.6" style={{ fill: 'var(--primary-fg)' }} />
    </svg>
  );
}

export function Logo({ href = '/', compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="type-head flex items-center gap-2 text-[19px] leading-none font-black text-fg">
      <LogoMark />
      <span className={compact ? 'hidden sm:inline' : ''}>ShotDomain</span>
    </Link>
  );
}

export default Logo;
