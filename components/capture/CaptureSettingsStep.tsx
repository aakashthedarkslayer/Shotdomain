'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Card, CardFooter, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, Textarea } from '@/components/ui/Input';
import { Segmented, Switch } from '@/components/ui/Controls';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { DEVICE_PRESETS } from '@/lib/devices';
import { usePlan } from '@/components/billing/PlanContext';
import { LimitAwareError, PlanLock } from '@/components/billing/Upgrade';
import type { DeviceName } from '@/lib/plans';
import type { SettingsState } from './types';
import { selectorsToText, textToSelectors } from '@/lib/captureOptions';
import type { AuthMethod, CleanupOptions } from '@/lib/captureOptions';
import { describeAuth } from '@/lib/captureOptions';

interface CaptureSettingsStepProps {
  settings: SettingsState;
  onSettingsChange: (partial: Partial<SettingsState>) => void;
  onStartCapture: () => void;
  onBack: () => void;
  selectedCount: number;
  onSaveSchedule?: () => void;
  isStarting?: boolean;
  error?: string;
  authMethod?: AuthMethod;
}

const DEVICES: { name: string; icon: IconName; model: string }[] = [
  { name: 'Desktop', icon: 'monitor', model: 'Desktop' },
  { name: 'Tablet', icon: 'tablet', model: 'iPad Pro 11' },
  { name: 'Mobile (iOS)', icon: 'phone', model: 'iPhone 14 Pro' },
  { name: 'Mobile (Android)', icon: 'phone', model: 'Pixel 7' },
];

const ASPECT_RATIOS: Record<string, number | null> = { '16:9': 16 / 9, '4:3': 4 / 3, '1:1': 1, Custom: null };

function Row({ title, description, children, stacked }: { title: string; description?: ReactNode; children: ReactNode; stacked?: boolean }) {
  return (
    <div className={`flex gap-4 px-5 py-4 sm:px-6 ${stacked ? 'flex-col' : 'flex-col sm:flex-row sm:items-center sm:justify-between'}`}>
      <div className="min-w-0">
        <div className="text-sm font-medium text-fg">{title}</div>
        {description && <div className="mt-0.5 text-[13px] text-muted">{description}</div>}
      </div>
      <div className={stacked ? '' : 'shrink-0'}>{children}</div>
    </div>
  );
}

function NumberInput({ id, label, value, onChange }: { id: string; label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="relative">
      <label htmlFor={id} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-faint">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 w-28 rounded-xl border border-line bg-field pr-2 pl-7 font-mono text-sm text-fg outline-none hover:border-line-strong focus:border-accent focus:ring-3 focus:ring-accent/15"
      />
    </div>
  );
}

export default function CaptureSettingsStep({
  settings,
  onSettingsChange,
  onStartCapture,
  onBack,
  selectedCount,
  onSaveSchedule,
  isStarting,
  error,
  authMethod = 'none',
}: CaptureSettingsStepProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // Keep raw textarea text locally so typing newlines isn't fought by normalisation.
  const [hideText, setHideText] = useState(() => selectorsToText(settings.cleanup.hideSelectors));
  const [clickText, setClickText] = useState(() => selectorsToText(settings.cleanup.clickSelectors));
  const setCleanup = (partial: Partial<CleanupOptions>) => onSettingsChange({ cleanup: { ...settings.cleanup, ...partial } });

  const { limits } = usePlan();
  const selectedDevices = useMemo(
    () => (settings.devices.length > 0 ? settings.devices : [settings.device || 'Desktop']),
    [settings.devices, settings.device],
  );
  const total = selectedCount * selectedDevices.length;

  const toggleDevice = useCallback(
    (device: string) => {
      let next: string[];
      if (selectedDevices.includes(device)) {
        if (selectedDevices.length === 1) return; // keep at least one device
        next = selectedDevices.filter((d) => d !== device);
      } else {
        next = [...selectedDevices, device];
      }
      const primary = next[0] || 'Desktop';
      const preset = DEVICE_PRESETS[primary];
      onSettingsChange({
        devices: next,
        device: primary,
        ...(next.length === 1 && preset ? { width: preset.width, height: preset.height } : {}),
      });
    },
    [selectedDevices, onSettingsChange],
  );

  const ratio = ASPECT_RATIOS[settings.aspectRatio] ?? null;

  const setWidth = (width: number) =>
    onSettingsChange(settings.linked && ratio ? { width, height: Math.round(width / ratio) } : { width });
  const setHeight = (height: number) =>
    onSettingsChange(settings.linked && ratio ? { height, width: Math.round(height * ratio) } : { height });
  const setAspect = (aspectRatio: string) => {
    const r = ASPECT_RATIOS[aspectRatio];
    if (!r) onSettingsChange({ aspectRatio, linked: false });
    else onSettingsChange({ aspectRatio, linked: true, height: Math.round(settings.width / r) });
  };

  return (
    <Card>
      <CardHeader
        title="Capture settings"
        description={`Applied to all ${selectedCount} selected ${selectedCount === 1 ? 'page' : 'pages'}.`}
      />

      <div className="divide-y divide-line">
        <Row title="Devices" description="Each page is captured once per device." stacked>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DEVICES.map((d) => {
              const active = selectedDevices.includes(d.name);
              const preset = DEVICE_PRESETS[d.name];
              const locked = !limits.devices.includes(d.name as DeviceName);
              return (
                <button
                  key={d.name}
                  type="button"
                  aria-pressed={active}
                  disabled={locked && !active}
                  onClick={() => toggleDevice(d.name)}
                  className={`relative flex cursor-pointer flex-col items-start gap-2 rounded-lg border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    active ? 'border-accent bg-accent-soft/60 ring-1 ring-accent' : 'border-line hover:border-line-strong hover:bg-subtle'
                  }`}
                >
                  {locked && !active && (
                    <span className="absolute top-2 right-2">
                      <PlanLock link={false} />
                    </span>
                  )}
                  <Icon name={d.icon} size={18} className={active ? 'text-accent' : 'text-muted'} />
                  <div>
                    <div className="text-sm font-medium text-fg">{d.name}</div>
                    <div className="text-xs text-muted">
                      {d.name === 'Desktop' ? '' : `${d.model} · `}
                      {preset ? `${preset.width}×${preset.height}` : ''}
                    </div>
                  </div>
                  {active && (
                    <span className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white">
                      <Icon name="check" size={11} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {limits.devices.length < DEVICES.length && (
            <p className="mt-2 text-[13px] text-muted">
              Tablet and phone screenshots are included in Studio.{' '}
              <Link href="/billing?plan=studio" className="font-medium text-accent hover:underline">
                See plans
              </Link>
            </p>
          )}
        </Row>

        <Row title="Viewport" description="Browser window size in CSS pixels.">
          <div className="flex flex-wrap items-center gap-2">
            <NumberInput id="viewport-width" label="W" value={settings.width} onChange={setWidth} />
            <button
              type="button"
              onClick={() => settings.aspectRatio !== 'Custom' && onSettingsChange({ linked: !settings.linked })}
              disabled={settings.aspectRatio === 'Custom'}
              aria-pressed={settings.linked}
              title={settings.linked ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
              className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${
                settings.linked ? 'bg-accent-soft text-accent' : 'text-faint hover:bg-subtle hover:text-fg'
              }`}
            >
              <Icon name={settings.linked ? 'link' : 'unlink'} size={16} />
            </button>
            <NumberInput id="viewport-height" label="H" value={settings.height} onChange={setHeight} />
            <Select aria-label="Aspect ratio" value={settings.aspectRatio} onChange={(e) => setAspect(e.target.value)} className="w-28">
              {Object.keys(ASPECT_RATIOS).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
        </Row>

        <Row title="Full page" description={settings.fullPage ? 'Captures the full scrollable height.' : 'Captures the visible viewport only.'}>
          <Switch checked={settings.fullPage} onChange={(fullPage) => onSettingsChange({ fullPage })} label="Capture entire page" />
        </Row>

        {authMethod !== 'none' && (
          <Row title="Login" description="Set on the first step. Every page is captured logged in.">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-success-soft px-2 py-1 text-xs font-medium text-success">
              <Icon name="check" size={12} /> {describeAuth({ method: authMethod })}
            </span>
          </Row>
        )}

        <Row title="Hide cookie banners" description="Accepts or hides common consent pop-ups (OneTrust, Cookiebot, Usercentrics…) before capturing.">
          <Switch
            checked={settings.cleanup.hideCookieBanners}
            onChange={(hideCookieBanners) => setCleanup({ hideCookieBanners })}
            label="Hide cookie banners"
          />
        </Row>

        <Row title="Format">
          <Segmented
            label="Image format"
            value={settings.format}
            onChange={(format) => onSettingsChange({ format })}
            options={[
              { value: 'png', label: 'PNG' },
              { value: 'jpeg', label: 'JPG' },
            ]}
          />
        </Row>

        <div>
          <button
            type="button"
            onClick={() => setAdvancedOpen((o) => !o)}
            aria-expanded={advancedOpen}
            className="flex w-full cursor-pointer items-center justify-between px-5 py-3.5 text-sm font-medium text-muted hover:text-fg sm:px-6"
          >
            Advanced
            <Icon name="chevronDown" size={16} className={`transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
          </button>
          {advancedOpen && (
            <div className="divide-y divide-line border-t border-line bg-subtle/40">
              <Row
                title="Click before capture"
                description="CSS selectors to click first, one per line — e.g. open a menu, switch a tab, dismiss a dialog."
                stacked
              >
                <Textarea
                  aria-label="Selectors to click"
                  placeholder={'#accept-terms\nbutton.close-modal'}
                  value={clickText}
                  onChange={(e) => {
                    setClickText(e.target.value);
                    setCleanup({ clickSelectors: textToSelectors(e.target.value) });
                  }}
                />
              </Row>
              <Row title="Hide elements" description="CSS selectors to hide, one per line — chat widgets, promo bars, sticky headers." stacked>
                <Textarea
                  aria-label="Selectors to hide"
                  placeholder={'#intercom-container\n.promo-bar'}
                  value={hideText}
                  onChange={(e) => {
                    setHideText(e.target.value);
                    setCleanup({ hideSelectors: textToSelectors(e.target.value) });
                  }}
                />
              </Row>
              <Row title="Custom CSS" description="Injected into every page before capturing." stacked>
                <Textarea
                  aria-label="Custom CSS"
                  rows={4}
                  placeholder={'.header { position: static !important; }'}
                  value={settings.cleanup.customCss}
                  onChange={(e) => setCleanup({ customCss: e.target.value })}
                />
              </Row>
              <Row title="Block ads and trackers" description="Aborts requests to common ad and tracking domains.">
                <Switch checked={settings.blockAds} onChange={(blockAds) => onSettingsChange({ blockAds })} label="Block ads" />
              </Row>
              <Row title="Use browser cache" description="Reuse one browser context per domain for faster captures.">
                <Switch checked={settings.useCache} onChange={(useCache) => onSettingsChange({ useCache })} label="Use browser cache" />
              </Row>
              <Row title="Background color" description="Paint behind transparent pages before capturing.">
                <div className="flex items-center gap-3">
                  {settings.showBackgroundColor && (
                    <label className="flex items-center gap-2 font-mono text-xs text-muted">
                      <input
                        type="color"
                        value={settings.backgroundColor}
                        onChange={(e) => onSettingsChange({ backgroundColor: e.target.value })}
                        className="h-7 w-7 cursor-pointer rounded border border-line bg-transparent p-0.5"
                        aria-label="Background color"
                      />
                      {settings.backgroundColor}
                    </label>
                  )}
                  <Switch
                    checked={settings.showBackgroundColor}
                    onChange={(showBackgroundColor) => onSettingsChange({ showBackgroundColor })}
                    label="Add background color"
                  />
                </div>
              </Row>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="px-5 pb-4 sm:px-6">
          <LimitAwareError message={error} />
        </div>
      )}

      <CardFooter>
        <Button variant="ghost" icon="arrowLeft" onClick={onBack}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          {onSaveSchedule && (
            <Button variant="secondary" icon="clock" onClick={onSaveSchedule}>
              Save as schedule
            </Button>
          )}
          <Button icon="camera" onClick={onStartCapture} isLoading={isStarting}>
            Capture {total} {total === 1 ? 'screenshot' : 'screenshots'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
