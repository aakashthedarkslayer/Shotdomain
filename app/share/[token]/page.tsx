import { notFound } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { Card, CardHeader } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ScreenshotGrid } from '@/components/capture/ScreenshotGrid';
import { getShare, getSharedCapture } from '@/lib/shareStore';
import { baseName, formatDate, formatDateTime, hostOf } from '@/lib/format';
import { planInfoFor } from '@/lib/billing';
import { getProfile } from '@/lib/userData';
import { BrandLogo } from '@/components/share/BrandLogo';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Shared screenshots | ShotDomain', robots: { index: false, follow: false } };

/** The share owner's own name and logo, when their plan includes branding. */
interface Brand {
  name?: string;
  logoUrl?: string;
}

async function brandFor(ownerKey: string): Promise<Brand | null> {
  if (!(await planInfoFor(ownerKey)).limits.branding) return null;
  const profile = await getProfile(ownerKey);
  if (!profile.brandName && !profile.brandLogoUrl) return null;
  return { name: profile.brandName, logoUrl: profile.brandLogoUrl };
}

/** Public, read-only view of a share link. No sign-in. */
export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await getShare(token);
  const capture = share ? await getSharedCapture(share) : null;
  if (!share || !capture) notFound();
  const brand = await brandFor(share.ownerKey);

  const done = capture.results.filter((r) => r.status === 'done' && r.fileName);
  const img = (file: string) => `/share/${token}/image?file=${encodeURIComponent(file)}`;

  return (
    <div className="min-h-screen pb-24">
      <header className="card-elevated border-x-0 border-t-0 !shadow-none">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          {brand ? (
            <span className="flex min-w-0 items-center gap-2.5">
              {brand.logoUrl && <BrandLogo src={brand.logoUrl} />}
              {brand.name && <span className="truncate text-[15px] font-semibold tracking-tight text-fg">{brand.name}</span>}
            </span>
          ) : (
            <Logo href="/" />
          )}
          <span className="text-xs text-muted">Shared read-only link</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 pt-8 sm:px-6">
        <h1 className="sr-only">Screenshots of {hostOf(capture.rootUrl)}</h1>
        <Card>
          <CardHeader
            title={hostOf(capture.rootUrl)}
            description={
              <span className="flex flex-wrap gap-x-4">
                <span>
                  {capture.done} {capture.done === 1 ? 'screenshot' : 'screenshots'}
                </span>
                <span>{capture.devices.join(', ')}</span>
                <span>Captured {formatDateTime(capture.createdAt)}</span>
              </span>
            }
            actions={
              done.length > 1 ? (
                <a href={`/share/${token}/download`} className={buttonClass('primary', 'md')}>
                  <Icon name="download" />
                  Download ZIP
                </a>
              ) : done.length === 1 ? (
                <a href={img(done[0].fileName!)} download={baseName(done[0].fileName)} className={buttonClass('primary', 'md')}>
                  <Icon name="download" />
                  Download
                </a>
              ) : null
            }
          />
          <ScreenshotGrid
            emptyText="No screenshots in this link."
            items={done.map((r, i) => ({
              key: `${r.device ?? ''}-${r.fileName}-${i}`,
              url: r.url,
              device: r.device,
              src: `${img(r.fileName!)}&thumb=1`,
              fullSrc: img(r.fileName!),
              fileName: baseName(r.fileName),
            }))}
          />
        </Card>

        <p className="pt-4 text-center text-xs text-faint">
          {brand?.name ? `Shared by ${brand.name}. ` : 'Captured with ShotDomain. '}
          This link and its screenshots are deleted on {formatDate(share.expiresAt)}.
        </p>
      </main>
    </div>
  );
}
