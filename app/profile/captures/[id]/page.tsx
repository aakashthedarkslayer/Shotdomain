import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { currentUserKey } from '@/auth';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { FailedList, ScreenshotGrid } from '@/components/capture/ScreenshotGrid';
import { DeleteCaptureButton } from '@/components/profile/DeleteCaptureButton';
import { getCapture } from '@/lib/userData';
import { baseName, formatDateTime, hostOf } from '@/lib/format';

export const metadata = { title: 'Capture — ShotDomain' };

export default async function CaptureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const key = await currentUserKey();
  if (!key) redirect(`/login?callbackUrl=/profile/captures/${id}`);
  const capture = await getCapture(key, id);
  if (!capture) notFound();

  const done = capture.results.filter((r) => r.status === 'done' && r.fileName);
  const failed = capture.results.filter((r) => r.status === 'failed');

  return (
    <div className="min-h-screen pb-24">
      <AppHeader />
      <main className="mx-auto max-w-5xl space-y-4 px-4 pt-8 sm:px-6">
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
          <Icon name="arrowLeft" size={14} />
          Capture history
        </Link>
        <Card>
          <CardHeader
            title={hostOf(capture.rootUrl)}
            description={`${capture.scheduleName ? `Scheduled run of “${capture.scheduleName}” · ` : ''}${formatDateTime(capture.createdAt)} · ${capture.done} ${capture.done === 1 ? 'screenshot' : 'screenshots'} · ${capture.devices.join(', ')}${capture.fullPage ? ' · Full page' : ''} · ${capture.format.toUpperCase()}`}
            actions={
              <>
                <DeleteCaptureButton id={capture.id} />
                <a href={`/api/history/${capture.id}/download`} download className={buttonClass('primary', 'md')}>
                  <Icon name="download" />
                  Download ZIP
                </a>
              </>
            }
          />
          <ScreenshotGrid
            items={done.map((r, idx) => ({
              key: `${r.device ?? ''}-${r.fileName}-${idx}`,
              url: r.url,
              device: r.device,
              src: `/api/history/${capture.id}/file?name=${encodeURIComponent(r.fileName!)}`,
              fileName: baseName(r.fileName),
            }))}
          />
        </Card>
        <FailedList items={failed} />
      </main>
    </div>
  );
}
