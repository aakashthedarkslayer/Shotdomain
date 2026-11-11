import Link from 'next/link';

export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0 drop-shadow-[0_4px_10px_rgba(91,91,240,0.35)]">
      <defs>
        <linearGradient id="sd-logo-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="0.6" stopColor="#a855f7" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#sd-logo-g)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="white" strokeOpacity="0.35" />
      <path d="M9 12.5V9h3.5M23 12.5V9h-3.5M9 19.5V23h3.5M23 19.5V23h-3.5" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="2.6" fill="white" />
    </svg>
  );
}

export function Logo({ href = '/', compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-fg">
      <LogoMark />
      <span className={compact ? 'hidden sm:inline' : ''}>ShotDomain</span>
    </Link>
  );
}

export default Logo;
