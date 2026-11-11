'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ScreenshotGrid } from '@/components/capture/ScreenshotGrid';
import type { GridItem } from '@/components/capture/ScreenshotGrid';
import { ShareDialog } from './ShareDialog';
import type { ShareTarget } from './ShareDialog';

/** "Share" button for a whole saved capture. */
export function ShareCaptureButton({ captureId }: { captureId: string }) {
  const [target, setTarget] = useState<ShareTarget | null>(null);
  return (
    <>
      <Button variant="secondary" icon="link" onClick={() => setTarget({ kind: 'capture', captureId })}>
        Share
      </Button>
      <ShareDialog target={target} onClose={() => setTarget(null)} />
    </>
  );
}

/** Screenshot grid of a saved capture with per-image share links. */
export function ShareableCaptureGrid({ captureId, items }: { captureId: string; items: GridItem[] }) {
  const [target, setTarget] = useState<ShareTarget | null>(null);
  return (
    <>
      <ScreenshotGrid items={items} onShare={(item) => item.file && setTarget({ kind: 'screenshot', captureId, file: item.file })} />
      <ShareDialog target={target} onClose={() => setTarget(null)} />
    </>
  );
}
