import Link from 'next/link';

export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <rect width="24" height="24" rx="6" className="fill-primary" />
      <path
        d="M7 9V7h2M17 9V7h-2M7 15v2h2M17 15v2h-2"
        fill="none"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-fg"
      />
      <circle cx="12" cy="12" r="1.75" className="fill-primary-fg" />
    </svg>
  );
}

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-fg">
      <LogoMark />
      ShotDomain
    </Link>
  );
}

export default Logo;
