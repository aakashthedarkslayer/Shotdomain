'use client';

import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button, buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { thumbnailUrl } from './types';
import type { CaptureResult } from './types';
import { FailedList, ScreenshotGrid } from './ScreenshotGrid';
import { baseName } from '@/lib/format';

interface ResultsStepProps {
  jobId: string;
  results: CaptureResult[];
  onStartNew: () => void;
  onSaveSchedule?: () => void;
}

export default function ResultsStep({ jobId, results, onStartNew, onSaveSchedule }: ResultsStepProps) {
  const done = results.filter((r) => r.status === 'done' && r.fileName);
  const failed = results.filter((r) => r.status === 'failed');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={`${done.length} ${done.length === 1 ? 'screenshot' : 'screenshots'} ready`}
          description={
            <>
              {failed.length > 0 ? `${failed.length} failed — see below. ` : ''}
              Saved to your{' '}
              <Link href="/profile" className="font-medium text-fg underline-offset-2 hover:underline">
                capture history
              </Link>
              .
            </>
          }
          actions={
            <>
              {onSaveSchedule && (
                <Button variant="ghost" icon="clock" onClick={onSaveSchedule}>
                  Save as schedule
                </Button>
              )}
              <Button variant="secondary" icon="plus" onClick={onStartNew}>
                New capture
              </Button>
              <a href={`/api/capture/download?jobId=${encodeURIComponent(jobId)}`} download className={buttonClass('primary', 'md')}>
                <Icon name="download" />
                Download ZIP
              </a>
            </>
          }
        />
        <ScreenshotGrid
          emptyText="No screenshots were captured."
          items={done.map((r, idx) => ({
            key: `${r.device ?? ''}-${r.fileName}-${idx}`,
            url: r.url,
            device: r.device,
            src: thumbnailUrl(jobId, r.fileName!),
            fileName: baseName(r.fileName),
          }))}
        />
      </Card>
      <FailedList items={failed} />
    </div>
  );
}
