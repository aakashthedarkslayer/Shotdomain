import { DEFAULT_CLEANUP } from '@/lib/captureOptions';
import type { CleanupOptions } from '@/lib/captureOptions';

export type DeviceName = 'Desktop' | 'Tablet' | 'Mobile (iOS)' | 'Mobile (Android)';

export interface CaptureResult {
  url: string;
  device?: string;
  status: 'queued' | 'capturing' | 'done' | 'failed';
  fileName?: string;
  error?: string;
  warning?: string;
}

/** UI-side settings state (superset of what the API receives). */
export interface SettingsState {
  device: string;
  devices: string[];
  width: number;
  height: number;
  fullPage: boolean;
  format: 'png' | 'jpeg';
  blockAds: boolean;
  useCache: boolean;
  backgroundColor: string;
  showBackgroundColor: boolean;
  aspectRatio: string;
  linked: boolean;
  cleanup: CleanupOptions;
}

export const DEFAULT_SETTINGS: SettingsState = {
  device: 'Desktop',
  devices: ['Desktop'],
  width: 1920,
  height: 1080,
  fullPage: false,
  format: 'png',
  blockAds: false,
  useCache: false,
  backgroundColor: '#ffffff',
  showBackgroundColor: false,
  aspectRatio: '16:9',
  linked: false,
  cleanup: DEFAULT_CLEANUP,
};

export function thumbnailUrl(jobId: string, fileName: string) {
  return `/api/thumbnail?jobId=${encodeURIComponent(jobId)}&file=${encodeURIComponent(fileName)}`;
}
