'use client';

/**
 * The capture tool lives in the homepage hero. Buttons elsewhere on the page
 * ("Start capturing", "Try it on your app", "Start free") open it through
 * this event instead of navigating away.
 */
export const CAPTURE_EVENT = 'shotdomain:capture';

export interface OpenCaptureDetail {
  /** Open with "This site needs a login" switched on. */
  login?: boolean;
}

export function openCapture(detail: OpenCaptureDetail = {}) {
  window.dispatchEvent(new CustomEvent<OpenCaptureDetail>(CAPTURE_EVENT, { detail }));
  document.getElementById('capture')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
