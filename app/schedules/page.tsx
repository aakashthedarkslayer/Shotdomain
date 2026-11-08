'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import type { Schedule, ScheduledRun } from '@/lib/scheduleStore';

function formatTime12h(time24?: string): string {
  if (!time24 || !time24.includes(':')) return time24 || '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${period}`;
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [runs, setRuns] = useState<ScheduledRun[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);
  const [runningScheduleId, setRunningScheduleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/schedules');
      if (!res.ok) throw new Error('Failed to load schedules');
      const data = await res.json();
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading schedules');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const fetchRuns = useCallback(async (scheduleId: string) => {
    try {
      setIsLoadingRuns(true);
      const res = await fetch(`/api/schedules/${scheduleId}`);
      if (!res.ok) throw new Error('Failed to load runs');
      const data = await res.json();
      setRuns(data.runs || []);
    } catch (err) {
      console.error('Error fetching runs:', err);
    } finally {
      setIsLoadingRuns(false);
    }
  }, []);

  async function handleToggleEnabled(schedule: Schedule) {
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !schedule.enabled }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchSchedules();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error toggling schedule');
    }
  }

  async function handleDelete(scheduleId: string) {
    if (!confirm('Are you sure you want to delete this schedule and all its historical runs?')) {
      return;
    }
    try {
      const res = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete schedule');
      if (selectedScheduleId === scheduleId) {
        setSelectedScheduleId(null);
        setRuns([]);
      }
      fetchSchedules();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error deleting schedule');
    }
  }

  async function handleRunNow(scheduleId: string) {
    try {
      setRunningScheduleId(scheduleId);
      const res = await fetch(`/api/schedules/${scheduleId}/run`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to execute run');
      }
      await fetchSchedules();
      if (selectedScheduleId === scheduleId) {
        await fetchRuns(scheduleId);
      }
      alert('Scheduled capture completed successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to execute run');
    } finally {
      setRunningScheduleId(null);
    }
  }

  return (
    <div className="min-h-screen pb-20 bg-[#FBFBFA] text-[#121315] dark:bg-[#121315] dark:text-[#FBFBFA] font-sans antialiased selection:bg-[#E54D2E]/20">
      {/* Top Header */}
      <header className="border-b border-stone-200/80 bg-[#FBFBFA]/90 backdrop-blur-md sticky top-0 z-20 dark:border-stone-800/80 dark:bg-[#121315]/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
                  SCHEDULED ARCHIVES
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="text-xs font-mono uppercase tracking-wider text-stone-600 hover:text-[#E54D2E] dark:text-stone-300 dark:hover:text-[#FF5733] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center gap-1.5"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Capture Engine
            </Link>
            <Link
              href="/"
              className="text-xs font-mono uppercase tracking-wider text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              ← Landing
            </Link>
            <Link href="/app">
              <Button size="sm" variant="primary">
                + New Capture
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-[#E54D2E] uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E54D2E] animate-pulse" />
                AUTOMATED DARKROOM
              </span>
            </div>
            <h1 className="text-3xl font-serif font-normal tracking-tight text-stone-900 dark:text-white">
              Scheduled Captures & Recurrence
            </h1>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
              Automated multi-page captures running on your specified interval with email notification and archive retention.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800/80 px-3 py-1 rounded-md border border-stone-200 dark:border-stone-700">
              ACTIVE MONITORS: {schedules.filter((s) => s.enabled).length} / {schedules.length}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Schedules Grid / List */}
        {isLoading ? (
          <div className="p-16 text-center text-xs font-mono text-stone-500 flex flex-col items-center justify-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-[#E54D2E] border-t-transparent animate-spin" />
            <span>Loading recurring schedules…</span>
          </div>
        ) : schedules.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-2 border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 flex items-center justify-center mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-serif font-normal text-stone-900 dark:text-white">
              No Recurring Schedules Configured
            </h3>
            <p className="mt-1.5 text-xs text-stone-500 max-w-sm mx-auto mb-6">
              Create a capture workflow in the engine, and save it as a recurring interval to monitor responsive layouts automatically.
            </p>
            <Link href="/app">
              <Button size="md" variant="primary">
                Launch Capture Engine
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule, idx) => {
              const isSelected = selectedScheduleId === schedule.id;
              const isRunning = runningScheduleId === schedule.id;

              return (
                <Card
                  key={schedule.id}
                  className={`p-6 transition-all duration-200 relative bg-white dark:bg-stone-900 border ${
                    isSelected
                      ? 'border-[#E54D2E] shadow-sm ring-1 ring-[#E54D2E]/20'
                      : 'border-stone-200/90 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-[11px] text-stone-400 dark:text-stone-600 font-semibold">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-base font-serif font-medium text-stone-900 dark:text-white">
                          {schedule.name}
                        </h3>
                        <Badge
                          variant={schedule.enabled ? 'success' : 'default'}
                          size="sm"
                        >
                          {schedule.enabled ? 'Active' : 'Paused'}
                        </Badge>
                        <span className="text-[11px] font-mono uppercase text-[#E54D2E] bg-[#E54D2E]/10 dark:bg-[#E54D2E]/20 px-2 py-0.5 rounded border border-[#E54D2E]/20">
                          {schedule.frequency} ({formatTime12h(schedule.timeOfDay)})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 dark:text-stone-400 font-mono">
                        <span className="text-stone-800 dark:text-stone-200 font-medium">
                          {schedule.targetUrl}
                        </span>
                        <span className="text-stone-300 dark:text-stone-700">•</span>
                        <span>{schedule.urls.length} pages</span>
                        <span className="text-stone-300 dark:text-stone-700">•</span>
                        <span>Keep {schedule.retentionCount || 10} runs</span>
                        {schedule.nextRunAt && (
                          <>
                            <span className="text-stone-300 dark:text-stone-700">•</span>
                            <span className="text-[#E54D2E] dark:text-[#FF5733]">
                              Next: {new Date(schedule.nextRunAt).toLocaleString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleRunNow(schedule.id)}
                        isLoading={isRunning}
                        loadingText="Capturing…"
                      >
                        Run Now
                      </Button>

                      {schedule.lastRunAt && (
                        <a
                          href={`/api/schedules/${schedule.id}/download`}
                          download={`schedule-${schedule.id.slice(0, 8)}-latest.zip`}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-100 hover:bg-stone-200/80 text-stone-800 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700/80 font-mono text-xs transition-colors cursor-pointer"
                          title="Download latest screenshots ZIP"
                        >
                          <svg className="h-3.5 w-3.5 text-[#E54D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          ZIP
                        </a>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedScheduleId(null);
                          } else {
                            setSelectedScheduleId(schedule.id);
                            fetchRuns(schedule.id);
                          }
                        }}
                      >
                        {isSelected ? 'Hide History' : 'History'}
                      </Button>

                      <button
                        type="button"
                        onClick={() => handleToggleEnabled(schedule)}
                        className={`text-xs font-mono px-3 py-1.5 rounded-lg border cursor-pointer font-medium transition-colors ${
                          schedule.enabled
                            ? 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                            : 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400 hover:bg-emerald-100'
                        }`}
                      >
                        {schedule.enabled ? 'Pause' : 'Resume'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(schedule.id)}
                        className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 p-2 cursor-pointer transition-colors"
                        title="Delete Schedule"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expandable Run History Drawer */}
                  {isSelected && (
                    <div className="mt-6 pt-6 border-t border-stone-200/80 dark:border-stone-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                          Historical Proof Artifacts (Last {schedule.retentionCount || 10} Exposures)
                        </h4>
                      </div>

                      {isLoadingRuns ? (
                        <div className="text-xs font-mono text-stone-400 py-4 flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full border-2 border-stone-400 border-t-transparent animate-spin" />
                          Loading past runs…
                        </div>
                      ) : runs.length === 0 ? (
                        <div className="text-xs font-mono text-stone-400 py-5 bg-stone-50 dark:bg-stone-950/50 rounded-lg text-center border border-dashed border-stone-200 dark:border-stone-800">
                          No historical runs recorded yet. Click &quot;Run Now&quot; to trigger a capture.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {runs.map((run) => (
                            <div
                              key={run.id}
                              className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3 font-mono">
                                <Badge
                                  variant={run.status === 'success' ? 'success' : run.status === 'partial' ? 'warning' : 'error'}
                                  size="sm"
                                >
                                  {run.status}
                                </Badge>
                                <span className="font-medium text-stone-900 dark:text-white">
                                  {new Date(run.timestamp).toLocaleString()}
                                </span>
                                <span className="text-stone-400">
                                  ({run.completedUrls} / {run.totalUrls} captured)
                                </span>
                              </div>

                              <div className="flex items-center gap-2 font-mono">
                                {run.emailPreviewUrl && (
                                  <a
                                    href={run.emailPreviewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium transition-colors"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    View Email
                                  </a>
                                )}

                                <a
                                  href={`/api/schedules/${schedule.id}/runs/${run.id}/download`}
                                  download={`scheduled-run-${run.id.slice(0, 8)}.zip`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-white hover:bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700/80 font-medium transition-colors cursor-pointer"
                                >
                                  <svg className="h-3.5 w-3.5 text-[#E54D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Download ZIP
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
