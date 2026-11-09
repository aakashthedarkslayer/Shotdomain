'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Stepper } from '@/components/capture/Stepper';
import UrlInputStep from '@/components/capture/UrlInputStep';
import PageSelectionStep from '@/components/capture/PageSelectionStep';
import CaptureSettingsStep from '@/components/capture/CaptureSettingsStep';
import CaptureProgressStep from '@/components/capture/CaptureProgressStep';
import ResultsStep from '@/components/capture/ResultsStep';
import SaveScheduleModal from '@/components/capture/SaveScheduleModal';
import { Alert } from '@/components/ui/Alert';
import { DEFAULT_SETTINGS } from '@/components/capture/types';
import type { CaptureResult, DeviceName, SettingsState } from '@/components/capture/types';
import { isValidUrl, normalizeUrl, urlHost } from '@/lib/url';

export default function AppPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1
  const [rootUrl, setRootUrl] = useState('');

  // Step 2
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [discoveryMethod, setDiscoveryMethod] = useState<'sitemap' | 'crawl'>('sitemap');
  const [truncated, setTruncated] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryStatus, setDiscoveryStatus] = useState('Checking sitemap.xml…');
  const [discoveryError, setDiscoveryError] = useState<string | undefined>(undefined);

  // Step 3
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | undefined>(undefined);

  // Step 4
  const [captureJobId, setCaptureJobId] = useState('');
  const [captureTotal, setCaptureTotal] = useState(0);
  const [captureCompleted, setCaptureCompleted] = useState(0);
  const [captureFailed, setCaptureFailed] = useState(0);
  const [captureResults, setCaptureResults] = useState<CaptureResult[]>([]);
  const [isCaptureComplete, setIsCaptureComplete] = useState(false);
  const [actionError, setActionError] = useState<string | undefined>(undefined);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  // Step 1 → 2: discover pages
  const handleDiscover = useCallback(async (url: string) => {
    setIsLoading(true);
    setRootUrl(url);
    setIsDiscovering(true);
    setDiscoveryError(undefined);
    setDiscoveryStatus('Checking sitemap.xml…');
    setCurrentStep(2);

    const crawlTimer = setTimeout(() => setDiscoveryStatus('No sitemap yet — crawling links…'), 2500);

    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Discovery failed');

      setDiscoveredUrls(data.urls);
      setSelectedUrls([...data.urls]);
      setDiscoveryMethod(data.method);
      setTruncated(data.truncated);
    } catch (error) {
      setDiscoveryError(error instanceof Error ? error.message : 'Discovery failed');
    } finally {
      clearTimeout(crawlTimer);
      setIsDiscovering(false);
      setIsLoading(false);
    }
  }, []);

  // Landing page hands off with /app?url=example.com — start discovery right away.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('url');
    if (!param) return;
    const normalized = normalizeUrl(param);
    // Deferred so the effect itself doesn't set state; cleanup makes it run once under StrictMode.
    const timer = setTimeout(() => {
      window.history.replaceState(null, '', '/app');
      if (isValidUrl(normalized)) void handleDiscover(normalized);
    }, 0);
    return () => clearTimeout(timer);
  }, [handleDiscover]);

  const startPolling = useCallback(
    (jobId: string, total: number) => {
      stopPolling();
      pollingRef.current = setInterval(async () => {
        try {
          const response = await fetch(`/api/capture/status?jobId=${jobId}`);
          if (!response.ok) return;
          const data = await response.json();
          setCaptureCompleted(data.completed);
          setCaptureFailed(data.failed);
          setCaptureResults(data.results);
          if (data.completed + data.failed >= total || data.cancelled) {
            setIsCaptureComplete(true);
            stopPolling();
          }
        } catch {
          // transient polling error — try again next tick
        }
      }, 1000);
    },
    [stopPolling],
  );

  // Step 3 → 4: start capture
  const handleStartCapture = useCallback(async () => {
    setIsStarting(true);
    setStartError(undefined);
    try {
      const devices = settings.devices.length > 0 ? settings.devices : [settings.device || 'Desktop'];
      const totalCount = selectedUrls.length * devices.length;

      const response = await fetch('/api/capture/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: selectedUrls,
          settings: {
            device: devices[0] || 'Desktop',
            devices,
            width: settings.width,
            height: settings.height,
            fullPage: settings.fullPage,
            format: settings.format,
            blockAds: settings.blockAds,
            useCache: settings.useCache,
            backgroundColor: settings.showBackgroundColor ? settings.backgroundColor : undefined,
            cleanup: settings.cleanup,
          },
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to start capture');

      setCaptureJobId(data.jobId);
      setCaptureTotal(totalCount);
      setCaptureCompleted(0);
      setCaptureFailed(0);
      setCaptureResults(devices.flatMap((device) => selectedUrls.map((url) => ({ url, device, status: 'queued' as const }))));
      setIsCaptureComplete(false);
      setActionError(undefined);
      setCurrentStep(4);
      startPolling(data.jobId, totalCount);
    } catch (error) {
      setStartError(error instanceof Error ? error.message : 'Failed to start capture');
    } finally {
      setIsStarting(false);
    }
  }, [selectedUrls, settings, startPolling]);

  // Step 4: retry one failed capture
  const handleRetry = useCallback(
    async (url: string, device?: string) => {
      setActionError(undefined);
      try {
        const response = await fetch('/api/capture/retry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: captureJobId, url, device }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Retry failed');
        }
        setIsCaptureComplete(false);
        startPolling(captureJobId, captureTotal);
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Retry failed');
      }
    },
    [captureJobId, captureTotal, startPolling],
  );

  // Step 4: cancel everything still queued
  const handleCancel = useCallback(async () => {
    stopPolling();
    if (captureJobId) {
      try {
        await fetch('/api/capture/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: captureJobId }),
        });
      } catch {
        // ignore — the UI treats the job as finished either way
      }
    }
    setIsCaptureComplete(true);
  }, [captureJobId, stopPolling]);

  // Step 5: reset
  const handleStartNew = useCallback(() => {
    stopPolling();
    setCurrentStep(1);
    setRootUrl('');
    setDiscoveredUrls([]);
    setSelectedUrls([]);
    setDiscoveryMethod('sitemap');
    setTruncated(false);
    setIsDiscovering(false);
    setDiscoveryError(undefined);
    setCaptureJobId('');
    setCaptureTotal(0);
    setCaptureCompleted(0);
    setCaptureFailed(0);
    setCaptureResults([]);
    setIsCaptureComplete(false);
    setStartError(undefined);
    setActionError(undefined);
    setSettings(DEFAULT_SETTINGS);
  }, [stopPolling]);

  const handleSettingsChange = useCallback((partial: Partial<SettingsState>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const scheduleTarget = rootUrl || (selectedUrls[0] ? new URL(selectedUrls[0]).origin : 'https://example.com');

  return (
    <div className="min-h-screen pb-24">
      <AppHeader>
        {rootUrl && currentStep > 1 && (
          <span className="hidden max-w-[16rem] items-center gap-2 truncate rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-xs text-muted sm:flex">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
            <span className="truncate">{urlHost(rootUrl)}</span>
          </span>
        )}
      </AppHeader>

      <main className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        <div className="mb-8">
          <Stepper current={currentStep} />
        </div>

        {actionError && (
          <Alert tone="danger" className="mb-4">
            {actionError}
          </Alert>
        )}

        {currentStep === 1 && <UrlInputStep onDiscover={handleDiscover} isLoading={isLoading} initialValue={rootUrl} />}

        {currentStep === 2 && (
          <PageSelectionStep
            urls={discoveredUrls}
            selectedUrls={selectedUrls}
            onSelectionChange={setSelectedUrls}
            onContinue={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
            discoveryMethod={discoveryMethod}
            truncated={truncated}
            isDiscovering={isDiscovering}
            discoveryStatus={discoveryStatus}
            discoveryError={discoveryError}
            rootUrl={rootUrl}
          />
        )}

        {currentStep === 3 && (
          <CaptureSettingsStep
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onStartCapture={handleStartCapture}
            onBack={() => setCurrentStep(2)}
            selectedCount={selectedUrls.length}
            onSaveSchedule={() => setIsScheduleModalOpen(true)}
            isStarting={isStarting}
            error={startError}
          />
        )}

        {currentStep === 4 && (
          <CaptureProgressStep
            jobId={captureJobId}
            total={captureTotal}
            completed={captureCompleted}
            failed={captureFailed}
            results={captureResults}
            onRetry={handleRetry}
            onCancel={handleCancel}
            onViewResults={() => setCurrentStep(5)}
            isComplete={isCaptureComplete}
          />
        )}

        {currentStep === 5 && (
          <ResultsStep
            jobId={captureJobId}
            results={captureResults}
            onStartNew={handleStartNew}
            onSaveSchedule={() => setIsScheduleModalOpen(true)}
          />
        )}
      </main>

      <SaveScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        targetUrl={scheduleTarget}
        urls={selectedUrls.length > 0 ? selectedUrls : [rootUrl].filter(Boolean)}
        settings={{
          device: (settings.device as DeviceName) || 'Desktop',
          devices: settings.devices as DeviceName[],
          width: settings.width,
          height: settings.height,
          fullPage: settings.fullPage,
          format: settings.format,
          blockAds: settings.blockAds,
          useCache: settings.useCache,
          backgroundColor: settings.showBackgroundColor ? settings.backgroundColor : undefined,
          cleanup: settings.cleanup,
        }}
      />
    </div>
  );
}
