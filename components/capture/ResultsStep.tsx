'use client';

import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button, buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { previewUrl, thumbnailUrl } from './types';
import type { CaptureResult } from './types';
import { FailedList, ScreenshotGrid } from './ScreenshotGrid';
import { ShareDialog } from '@/components/share/ShareDialog';
import { baseName } from '@/lib/format';
import { SHARE_DAYS } from '@/lib/plans';

interface ResultsStepProps {
  jobId: string;
  results: CaptureResult[];
  onStartNew: () => void;
}

export default function ResultsStep({ jobId, results, onStartNew }: ResultsStepProps) {
  const [sharing, setSharing] = useState(false);
  const done = results.filter((r) => r.status === 'done' && r.fileName);
  const failed = results.filter((r) => r.status === 'failed');
  const notes = done.filter((r) => r.warning).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={`${done.length} ${done.length === 1 ? 'screenshot' : 'screenshots'} ready`}
          description={
            <>
              {failed.length > 0 ? `${failed.length} failed (see below). ` : ''}
              {notes > 0 ? `${notes} ${notes === 1 ? 'page has' : 'pages have'} a note (the ⚠ badge). ` : ''}
              Screenshots stay on the server for about an hour. Download the ZIP, or create a share link to keep them for {SHARE_DAYS} days.
            </>
          }
          actions={
            <>
              <Button variant="ghost" icon="plus" onClick={onStartNew}>
                New capture
              </Button>
              {done.length > 0 && (
                <Button variant="secondary" icon="link" onClick={() => setSharing(true)}>
                  Share link
                </Button>
              )}
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
            src: previewUrl(jobId, r.fileName!),
            fullSrc: thumbnailUrl(jobId, r.fileName!),
            fileName: baseName(r.fileName),
            warning: r.warning,
          }))}
        />
      </Card>
      <FailedList items={failed} />
      <ShareDialog jobId={sharing ? jobId : null} onClose={() => setSharing(false)} />
    </div>
  );
}
