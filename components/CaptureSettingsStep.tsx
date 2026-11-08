'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ViewfinderFrame } from '@/components/ui/ViewfinderFrame';

interface CaptureSettingsStepProps {
  settings: {
    device: string;
    devices?: string[];
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
  };
  onSettingsChange: (settings: Partial<CaptureSettingsStepProps['settings']>) => void;
  onStartCapture: () => void;
  onBack: () => void;
  selectedCount: number;
  onSaveSchedule?: () => void;
}

const DEVICE_PRESETS: Record<string, { width: number; height: number; desc: string }> = {
  Desktop: { width: 1920, height: 1080, desc: '1920×1080' },
  Tablet: { width: 834, height: 1194, desc: 'iPad Pro 11' },
  'Mobile (iOS)': { width: 393, height: 852, desc: 'iPhone 14 Pro' },
  'Mobile (Android)': { width: 412, height: 915, desc: 'Pixel 7' },
};

const DEVICES = Object.keys(DEVICE_PRESETS);

const ASPECT_RATIOS: Record<string, number | null> = {
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '1:1': 1,
  Custom: null,
};

function getRatioValue(ratioKey: string): number | null {
  return ASPECT_RATIOS[ratioKey] ?? null;
}

export default function CaptureSettingsStep({
  settings,
  onSettingsChange,
  onStartCapture,
  onBack,
  selectedCount,
  onSaveSchedule,
}: CaptureSettingsStepProps) {
  const [advancedOpen, setAdvancedOpen] = useState(true);

  const selectedDevices = settings.devices && settings.devices.length > 0
    ? settings.devices
    : [settings.device || 'Desktop'];
  const totalCaptures = selectedCount * selectedDevices.length;

  const handleDeviceToggle = useCallback(
    (device: string) => {
      const currentDevices = settings.devices && settings.devices.length > 0
        ? settings.devices
        : [settings.device || 'Desktop'];

      let newDevices: string[];
      if (currentDevices.includes(device)) {
        if (currentDevices.length > 1) {
          newDevices = currentDevices.filter((d) => d !== device);
        } else {
          return;
        }
      } else {
        newDevices = [...currentDevices, device];
      }

      const primaryDevice = newDevices[0] || 'Desktop';
      const preset = DEVICE_PRESETS[primaryDevice];
      onSettingsChange({
        devices: newDevices,
        device: primaryDevice,
        ...(newDevices.length === 1 && preset ? { width: preset.width, height: preset.height } : {}),
      });
    },
    [settings.devices, settings.device, onSettingsChange],
  );

  const handleWidthChange = useCallback(
    (newWidth: number) => {
      if (settings.linked) {
        const ratio = getRatioValue(settings.aspectRatio);
        if (ratio !== null && ratio > 0) {
          const newHeight = Math.round(newWidth / ratio);
          onSettingsChange({ width: newWidth, height: newHeight });
          return;
        }
      }
      onSettingsChange({ width: newWidth });
    },
    [settings.linked, settings.aspectRatio, onSettingsChange],
  );

  const handleHeightChange = useCallback(
    (newHeight: number) => {
      if (settings.linked) {
        const ratio = getRatioValue(settings.aspectRatio);
        if (ratio !== null && ratio > 0) {
          const newWidth = Math.round(newHeight * ratio);
          onSettingsChange({ width: newWidth, height: newHeight });
          return;
        }
      }
      onSettingsChange({ height: newHeight });
    },
    [settings.linked, settings.aspectRatio, onSettingsChange],
  );

  const handleAspectRatioChange = useCallback(
    (aspectRatio: string) => {
      if (aspectRatio === 'Custom') {
        onSettingsChange({ aspectRatio, linked: false });
      } else {
        const ratio = getRatioValue(aspectRatio);
        if (ratio !== null) {
          const newHeight = Math.round(settings.width / ratio);
          onSettingsChange({ aspectRatio, linked: true, height: newHeight });
        }
      }
    },
    [settings.width, onSettingsChange],
  );

  const handleLinkedToggle = useCallback(() => {
    if (settings.aspectRatio === 'Custom') return;
    onSettingsChange({ linked: !settings.linked });
  }, [settings.linked, settings.aspectRatio, onSettingsChange]);

  return (
    <div className="mx-auto max-w-2xl">
      <ViewfinderFrame
        frameLabel="FRAME 03 // DEVICE PROFILES & EXPOSURE"
        badge={`${totalCaptures} SHOTS PLANNED`}
        className="rounded-2xl border border-stone-200/90 bg-white dark:border-stone-800 dark:bg-stone-900/90 shadow-xs overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="mb-7">
            <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-stone-900 dark:text-white">
              Capture Settings
            </h2>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Configure viewport dimensions, rendering mode, and image format for {selectedCount} selected {selectedCount === 1 ? 'page' : 'pages'}.
            </p>
          </div>

          <div className="space-y-6">
            {/* Device Multi-Select Control */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Devices (Multi-select)
                </label>
                <span className="text-xs font-mono text-[#E54D2E] dark:text-[#FF5733] font-medium">
                  {totalCaptures} {totalCaptures === 1 ? 'screenshot' : 'screenshots'} ({selectedCount} {selectedCount === 1 ? 'page' : 'pages'} × {selectedDevices.length} {selectedDevices.length === 1 ? 'device' : 'devices'})
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-stone-100 p-1.5 dark:bg-stone-800">
                {DEVICES.map((device) => {
                  const isSelected = selectedDevices.includes(device);
                  return (
                    <button
                      key={device}
                      type="button"
                      title={DEVICE_PRESETS[device]?.desc}
                      onClick={() => handleDeviceToggle(device)}
                      className={`flex flex-col items-center justify-center rounded-lg py-2.5 px-3 text-xs font-mono transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-white text-stone-900 shadow-xs ring-2 ring-[#E54D2E] dark:bg-stone-900 dark:text-white dark:ring-[#FF5733] font-bold'
                          : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <svg className="h-3 w-3 text-[#E54D2E] dark:text-[#FF5733] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        <span>{device}</span>
                      </div>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 font-normal">
                        {DEVICE_PRESETS[device]?.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Viewport Width & Height with Aspect Ratio */}
            <div className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-4 sm:p-5 dark:border-stone-800 dark:bg-stone-900/40">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Viewport Dimensions
                </span>
                <div className="flex items-center gap-1.5 text-xs font-mono text-stone-500">
                  <span>Aspect Ratio:</span>
                  <select
                    id="aspect-ratio"
                    value={settings.aspectRatio}
                    onChange={(e) => handleAspectRatioChange(e.target.value)}
                    className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-mono text-stone-800 font-medium focus:border-[#E54D2E] focus:outline-none focus:ring-2 focus:ring-orange-500/10 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 cursor-pointer"
                  >
                    {Object.keys(ASPECT_RATIOS).map((ratio) => (
                      <option key={ratio} value={ratio}>
                        {ratio}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label htmlFor="viewport-width" className="block text-[11px] font-mono text-stone-500 mb-1">
                    Width (px)
                  </label>
                  <input
                    id="viewport-width"
                    type="number"
                    min={1}
                    value={settings.width}
                    onChange={(e) => handleWidthChange(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-mono text-stone-900 focus:border-[#E54D2E] focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-100"
                  />
                </div>

                <div className="pt-5">
                  <button
                    type="button"
                    onClick={handleLinkedToggle}
                    title={settings.linked ? 'Dimensions linked' : 'Dimensions unlinked'}
                    disabled={settings.aspectRatio === 'Custom'}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                      settings.linked
                        ? 'border-orange-200 bg-orange-50 text-[#E54D2E] dark:bg-orange-950/40 dark:border-orange-900/40 dark:text-[#FF5733] shadow-xs'
                        : 'border-stone-200 bg-white text-stone-400 hover:text-stone-600 hover:border-stone-300 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-500'
                    } ${settings.aspectRatio === 'Custom' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {settings.linked ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      )}
                    </svg>
                  </button>
                </div>

                <div className="flex-1">
                  <label htmlFor="viewport-height" className="block text-[11px] font-mono text-stone-500 mb-1">
                    Height (px)
                  </label>
                  <input
                    id="viewport-height"
                    type="number"
                    min={1}
                    value={settings.height}
                    onChange={(e) => handleHeightChange(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-mono text-stone-900 focus:border-[#E54D2E] focus:outline-none focus:ring-4 focus:ring-orange-500/10 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-100"
                  />
                </div>
              </div>
            </div>

            {/* Capture entire page & Image Format in a 2-col row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Capture Entire Page Card */}
              <label className="flex items-start gap-3 rounded-xl border border-stone-200/80 bg-white p-4 transition-all hover:border-stone-300 dark:border-stone-800 dark:bg-stone-900 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.fullPage}
                  onChange={(e) => onSettingsChange({ fullPage: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded-md border-stone-300 text-[#E54D2E] focus:ring-[#E54D2E] cursor-pointer dark:border-stone-600 dark:bg-stone-800"
                />
                <div>
                  <span className="block text-xs font-semibold text-stone-900 dark:text-white">
                    Capture entire page
                  </span>
                  <span className="block text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 font-mono">
                    {settings.fullPage
                      ? 'Full scrollable height'
                      : 'Visible viewport only'}
                  </span>
                </div>
              </label>

              {/* Image Format */}
              <div className="rounded-xl border border-stone-200/80 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-semibold text-stone-900 dark:text-white">
                    Image Format
                  </span>
                  <span className="block text-[11px] font-mono text-stone-500 dark:text-stone-400 mt-0.5">
                    {settings.format.toUpperCase()}
                  </span>
                </div>
                <div className="inline-flex rounded-lg bg-stone-100 p-1 dark:bg-stone-800">
                  {(['png', 'jpeg'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => onSettingsChange({ format: fmt })}
                      className={`px-3 py-1 text-xs font-mono font-medium rounded-md transition-all cursor-pointer ${
                        settings.format === fmt
                          ? 'bg-white text-[#E54D2E] shadow-xs dark:bg-stone-900 dark:text-[#FF5733] font-bold'
                          : 'text-stone-600 hover:text-stone-900 dark:text-stone-400'
                      }`}
                    >
                      {fmt === 'jpeg' ? 'JPG' : 'PNG'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Section Collapsible */}
            <div className="rounded-xl border border-stone-200/80 bg-white dark:border-stone-800 dark:bg-stone-900 overflow-hidden">
              <button
                type="button"
                onClick={() => setAdvancedOpen((prev) => !prev)}
                className="flex w-full items-center justify-between p-4 text-xs font-mono font-semibold uppercase tracking-wider text-stone-700 hover:bg-stone-50/50 dark:text-stone-300 dark:hover:bg-stone-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span>Advanced Settings</span>
                </div>
                <svg
                  className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${
                    advancedOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {advancedOpen && (
                <div className="p-4 pt-1 border-t border-stone-100 dark:border-stone-800 space-y-3.5">
                  {/* Block Ads */}
                  <label className="flex items-center justify-between rounded-lg p-2.5 hover:bg-stone-50 dark:hover:bg-stone-800/40 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={settings.blockAds}
                        onChange={(e) => onSettingsChange({ blockAds: e.target.checked })}
                        className="h-4 w-4 rounded-md border-stone-300 text-[#E54D2E] focus:ring-[#E54D2E] cursor-pointer dark:border-stone-600 dark:bg-stone-800"
                      />
                      <div>
                        <span className="block text-xs font-medium text-stone-900 dark:text-white">
                          Block ads and banners
                        </span>
                        <span className="block text-[11px] font-mono text-stone-400 dark:text-stone-500">
                          Intercepts common ad/tracker network requests
                        </span>
                      </div>
                    </div>
                    <span
                      title="Blocks common ad and tracker domains via request interception"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-stone-100 text-[10px] text-stone-500 dark:bg-stone-800 dark:text-stone-400"
                    >
                      ?
                    </span>
                  </label>

                  {/* Use Cache */}
                  <label className="flex items-center justify-between rounded-lg p-2.5 hover:bg-stone-50 dark:hover:bg-stone-800/40 cursor-pointer">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={settings.useCache}
                        onChange={(e) => onSettingsChange({ useCache: e.target.checked })}
                        className="h-4 w-4 rounded-md border-stone-300 text-[#E54D2E] focus:ring-[#E54D2E] cursor-pointer dark:border-stone-600 dark:bg-stone-800"
                      />
                      <div>
                        <span className="block text-xs font-medium text-stone-900 dark:text-white">
                          Use browser cache
                        </span>
                        <span className="block text-[11px] font-mono text-stone-400 dark:text-stone-500">
                          Reuses browser context per domain for faster captures
                        </span>
                      </div>
                    </div>
                    <span
                      title="Reuses browser context per domain for faster captures"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-stone-100 text-[10px] text-stone-500 dark:bg-stone-800 dark:text-stone-400"
                    >
                      ?
                    </span>
                  </label>

                  {/* Add Background Color */}
                  <div className="rounded-lg p-2.5 hover:bg-stone-50 dark:hover:bg-stone-800/40">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.showBackgroundColor}
                          onChange={(e) => onSettingsChange({ showBackgroundColor: e.target.checked })}
                          className="h-4 w-4 rounded-md border-stone-300 text-[#E54D2E] focus:ring-[#E54D2E] cursor-pointer dark:border-stone-600 dark:bg-stone-800"
                        />
                        <div>
                          <span className="block text-xs font-medium text-stone-900 dark:text-white">
                            Add background color
                          </span>
                          <span className="block text-[11px] font-mono text-stone-400 dark:text-stone-500">
                            Injects background before capture (useful for transparent pages)
                          </span>
                        </div>
                      </label>

                      {settings.showBackgroundColor && (
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={settings.backgroundColor}
                            onChange={(e) => onSettingsChange({ backgroundColor: e.target.value })}
                            className="h-7 w-7 cursor-pointer rounded-lg border border-stone-200 bg-transparent p-0.5 dark:border-stone-700"
                          />
                          <span className="text-[11px] font-mono text-stone-500">
                            {settings.backgroundColor}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              leftIcon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              }
            >
              Back
            </Button>

            <div className="flex items-center gap-3">
              {onSaveSchedule && (
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={onSaveSchedule}
                  leftIcon={
                    <svg className="h-4 w-4 text-[#E54D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  Save as Schedule
                </Button>
              )}

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={onStartCapture}
                rightIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                }
              >
                Start Capture ({totalCaptures} {totalCaptures === 1 ? 'screenshot' : 'screenshots'})
              </Button>
            </div>
          </div>
        </div>
      </ViewfinderFrame>
    </div>
  );
}
