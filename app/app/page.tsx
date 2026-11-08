'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import UrlInputStep from '@/components/UrlInputStep';
import PageSelectionStep from '@/components/PageSelectionStep';
import CaptureSettingsStep from '@/components/CaptureSettingsStep';
import CaptureProgressStep from '@/components/CaptureProgressStep';
import ResultsStep from '@/components/ResultsStep';
import SaveScheduleModal from '@/components/SaveScheduleModal';
import { StepIndicator } from '@/components/ui/StepIndicator';

interface CaptureResult {
  url: string;
  device?: string;
  status: 'queued' | 'capturing' | 'done' | 'failed';
  fileName?: string;
  error?: string;
}

interface CaptureSettingsState {
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
}

export default function AppPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1 state
  const [rootUrl, setRootUrl] = useState('');

  // Step 2 state
  const [discoveredUrls, setDiscoveredUrls] = useState<string[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [discoveryMethod, setDiscoveryMethod] = useState<'sitemap' | 'crawl'>('sitemap');
  const [truncated, setTruncated] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryStatus, setDiscoveryStatus] = useState('Checking sitemap.xml…');
  const [discoveryError, setDiscoveryError] = useState<string | undefined>(undefined);

  // Step 3 state
  const [settings, setSettings] = useState<CaptureSettingsState>({
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
  });

  // Step 4 state
  const [captureJobId, setCaptureJobId] = useState('');
  const [captureTotal, setCaptureTotal] = useState(0);
  const [captureCompleted, setCaptureCompleted] = useState(0);
  const [captureFailed, setCaptureFailed] = useState(0);
  const [captureResults, setCaptureResults] = useState<CaptureResult[]>([]);
  const [isCaptureComplete, setIsCaptureComplete] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Step 1: Discover pages
  const handleDiscover = useCallback(async (url: string) => {
    setIsLoading(true);
    setRootUrl(url);
    setIsDiscovering(true);
    setDiscoveryError(undefined);
    setDiscoveryStatus('Checking sitemap.xml…');
    setCurrentStep(2);

    const crawlTimer = setTimeout(() => {
      setDiscoveryStatus('Crawling site…');
    }, 2500);

    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      clearTimeout(crawlTimer);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Discovery failed');
      }

      const data = await response.json();
      setDiscoveryStatus(`Found ${data.urls.length} pages`);
      setDiscoveredUrls(data.urls);
      setSelectedUrls([...data.urls]);
      setDiscoveryMethod(data.method);
      setTruncated(data.truncated);
      setIsDiscovering(false);
    } catch (error) {
      clearTimeout(crawlTimer);
      setDiscoveryError(error instanceof Error ? error.message : 'Discovery failed');
      setIsDiscovering(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Step 2: Continue to settings
  const handleContinueToSettings = useCallback(() => {
    setCurrentStep(3);
  }, []);

  // Step 3: Start capture
  const startPolling = useCallback((jobId: string, total: number) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

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
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      } catch {
        // Polling error, will retry next interval
      }
    }, 1000);
  }, []);

  // Step 3: Start capture
  const handleStartCapture = useCallback(async () => {
    try {
      const selectedDevices = settings.devices && settings.devices.length > 0
        ? settings.devices
        : [settings.device || 'Desktop'];
      const totalCount = selectedUrls.length * selectedDevices.length;

      const captureSettings = {
        device: selectedDevices[0] || 'Desktop',
        devices: selectedDevices,
        width: settings.width,
        height: settings.height,
        fullPage: settings.fullPage,
        format: settings.format,
        blockAds: settings.blockAds,
        useCache: settings.useCache,
        backgroundColor: settings.showBackgroundColor ? settings.backgroundColor : undefined,
      };

      const response = await fetch('/api/capture/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls: selectedUrls,
          settings: captureSettings,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start capture');
      }

      const data = await response.json();
      setCaptureJobId(data.jobId);
      setCaptureTotal(totalCount);
      setCaptureCompleted(0);
      setCaptureFailed(0);

      const initialResults: CaptureResult[] = [];
      for (const dev of selectedDevices) {
        for (const url of selectedUrls) {
          initialResults.push({ url, device: dev, status: 'queued' as const });
        }
      }
      setCaptureResults(initialResults);
      setIsCaptureComplete(false);
      setCurrentStep(4);

      // Start polling for status
      startPolling(data.jobId, totalCount);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to start capture');
    }
  }, [selectedUrls, settings, startPolling]);

  // Step 4: Retry a failed capture
  const handleRetry = useCallback(async (url: string, device?: string) => {
    try {
      const response = await fetch('/api/capture/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: captureJobId, url, device }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Retry failed');
      }

      setIsCaptureComplete(false);
      startPolling(captureJobId, captureTotal);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Retry failed');
    }
  }, [captureJobId, captureTotal, startPolling]);

  // Step 4: Cancel capture
  const handleCancel = useCallback(async () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (captureJobId) {
      try {
        await fetch('/api/capture/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId: captureJobId }),
        });
      } catch {
        // ignore
      }
    }
    setIsCaptureComplete(true);
  }, [captureJobId]);

  // Step 4: View results
  const handleViewResults = useCallback(() => {
    setCurrentStep(5);
  }, []);

  // Step 5: Start new capture
  const handleStartNew = useCallback(() => {
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
    setSettings({
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
    });
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Settings change handler
  const handleSettingsChange = useCallback((partial: Partial<CaptureSettingsState>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  const steps = [
    { num: 1, label: 'URL Input' },
    { num: 2, label: 'Select Pages' },
    { num: 3, label: 'Settings' },
    { num: 4, label: 'Capture' },
    { num: 5, label: 'Results' },
  ];

  return (
    <div className="min-h-screen pb-20 bg-[#FBFBFA] text-[#121315] dark:bg-[#121315] dark:text-[#FBFBFA] font-sans antialiased selection:bg-[#E54D2E]/20">
      {/* Top Header / Nav */}
      <header className="border-b border-stone-200/80 bg-[#FBFBFA]/90 backdrop-blur-md sticky top-0 z-20 dark:border-stone-800/80 dark:bg-[#121315]/90">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-90">
              <div className="h-9 w-9 rounded-xl bg-[#121315] text-[#FBFBFA] dark:bg-stone-100 dark:text-[#121315] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif italic font-bold text-lg text-stone-900 tracking-tight dark:text-white">
                  Shotdomain
                </span>
                <span className="text-[10px] font-mono tracking-widest uppercase text-stone-500 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded border border-stone-200 dark:border-stone-700">
                  PROOF ENGINE
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {rootUrl && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-stone-600 bg-stone-100/80 px-3 py-1.5 rounded-lg border border-stone-200 font-mono dark:bg-stone-800/60 dark:border-stone-700 dark:text-stone-300">
                <span className="h-2 w-2 rounded-full bg-[#E54D2E] animate-pulse shrink-0" />
                <span className="truncate max-w-xs">{rootUrl}</span>
              </div>
            )}
            <Link
              href="/schedules"
              className="text-xs font-mono uppercase tracking-wider text-stone-600 hover:text-[#E54D2E] dark:text-stone-300 dark:hover:text-[#FF5733] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1.5"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Schedules
            </Link>
            <Link
              href="/"
              className="text-xs font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              ← Landing
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
        {/* Step Indicator */}
        <div className="mb-10 max-w-3xl mx-auto">
          <StepIndicator currentStep={currentStep} steps={steps} />
        </div>

        {/* Step content */}
        <div className="transition-all duration-200">
          {currentStep === 1 && (
            <UrlInputStep
              onDiscover={handleDiscover}
              isLoading={isLoading}
            />
          )}

          {currentStep === 2 && (
            <PageSelectionStep
              urls={discoveredUrls}
              selectedUrls={selectedUrls}
              onSelectionChange={setSelectedUrls}
              onContinue={handleContinueToSettings}
              onBack={() => setCurrentStep(1)}
              discoveryMethod={discoveryMethod}
              truncated={truncated}
              isDiscovering={isDiscovering}
              discoveryStatus={discoveryStatus}
              discoveryError={discoveryError}
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
              onViewResults={handleViewResults}
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
        </div>
      </main>

      {/* Schedule Modal */}
      <SaveScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        targetUrl={rootUrl || (selectedUrls[0] ? new URL(selectedUrls[0]).origin : 'https://example.com')}
        urls={selectedUrls.length > 0 ? selectedUrls : [rootUrl].filter(Boolean)}
        settings={{
          device: (settings.device as 'Desktop' | 'Tablet' | 'Mobile (iOS)' | 'Mobile (Android)') || 'Desktop',
          width: settings.width,
          height: settings.height,
          fullPage: settings.fullPage,
          format: settings.format,
          blockAds: settings.blockAds,
          useCache: settings.useCache,
          backgroundColor: settings.showBackgroundColor ? settings.backgroundColor : undefined,
        }}
      />
    </div>
  );
}
