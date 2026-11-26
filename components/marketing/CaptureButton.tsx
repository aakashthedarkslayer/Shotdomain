'use client';

import type { ReactNode } from 'react';
import { openCapture } from './captureEvents';

/** A button that opens the capture tool in the homepage hero (see captureEvents.ts). */
export function CaptureButton({ login, className, children }: { login?: boolean; className?: string; children: ReactNode }) {
  return (
    <button type="button" onClick={() => openCapture({ login })} className={`cursor-pointer ${className ?? ''}`}>
      {children}
    </button>
  );
}
