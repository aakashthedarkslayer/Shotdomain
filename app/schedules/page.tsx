'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button, buttonClass } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Icon, Spinner } from '@/components/ui/Icon';
import type { Schedule, ScheduledRun } from '@/lib/scheduleStore';
import { ShareDialog } from '@/components/share/ShareDialog';
import { SharePagesList } from '@/components/share/SharePagesList';
import type { ShareTarget } from '@/components/share/ShareDialog';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(time24?: string): string {
  if (!time24 || !time24.includes(':')) return time24 || '';
  const [h, m = '00'] = time24.split(':');
  const hour = parseInt(h, 10);
  return `${hour % 12 === 0 ? 12 : hour % 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function describeCadence(s: Schedule): string {
  const time = formatTime(s.timeOfDay);
  if (s.frequency === 'weekly') return `Every ${WEEKDAYS[s.dayOfWeek ?? 1]} at ${time}`;
  if (s.frequency === 'monthly') return `Monthly on day ${s.dayOfMonth ?? 1} at ${time}`;
  return `Daily at ${time}`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const RUN_TONE = { success: 'success', partial: 'warning', failed: 'danger', running: 'accent' } as const;

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [runs, setRuns] = useState<ScheduledRun[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shareTarget, setShareTarget] = useState<ShareTarget | null>(null);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch('/api/schedules');
      if (!res.ok) throw new Error('Failed to load schedules');
      setSchedules(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedules');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void fetchSchedules(), 0);
    return () => clearTimeout(timer);
  }, [fetchSchedules]);

  const fetchRuns = useCallback(async (id: string) => {
    setIsLoadingRuns(true);
    try {
      const res = await fetch(`/api/schedules/${id}`);
      if (!res.ok) throw new Error('Failed to load run history');
      const data = await res.json();
      setRuns(data.runs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load run history');
    } finally {
      setIsLoadingRuns(false);
    }
  }, []);

  async function toggleEnabled(s: Schedule) {
    setError(null);
    try {
      const res = await fetch(`/api/schedules/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !s.enabled }),
      });
      if (!res.ok) throw new Error('Failed to update schedule');
      await fetchSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
    }
  }

  async function remove(s: Schedule) {
    if (!confirm(`Delete "${s.name}" and all of its past runs?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/schedules/${s.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete schedule');
      if (openId === s.id) {
        setOpenId(null);
        setRuns([]);
      }
      await fetchSchedules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule');
    }
  }

  async function runNow(s: Schedule) {
    setError(null);
    setNotice(null);
    setRunningId(s.id);
    try {
      const res = await fetch(`/api/schedules/${s.id}/run`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Run failed');
      }
      await fetchSchedules();
      if (openId === s.id) await fetchRuns(s.id);
      setNotice(`"${s.name}" finished running.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Run failed');
    } finally {
      setRunningId(null);
    }
  }

  function toggleHistory(id: string) {
    if (openId === id) {
      setOpenId(null);
    } else {
      setOpenId(id);
      setRuns([]);
      void fetchRuns(id);
    }
  }

  const activeCount = schedules.filter((s) => s.enabled).length;

  return (
    <div className="min-h-screen pb-24">
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-fg">Schedules</h1>
            <p className="mt-1 text-sm text-muted">
              Your recurring captures. Each run is also saved to your history.
              {schedules.length > 0 && ` ${activeCount} of ${schedules.length} active.`}
            </p>
          </div>
          <Link href="/app" className={buttonClass('primary', 'md')}>
            <Icon name="plus" />
            New capture
          </Link>
        </div>

        {error && (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        )}
        {notice && (
          <Alert tone="success" className="mb-4">
            {notice}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted">
            <Spinner /> Loading schedules…
          </div>
        ) : schedules.length === 0 ? (
          <Card className="px-6 py-16 text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-muted">
              <Icon name="calendar" size={20} />
            </span>
            <h2 className="mt-4 text-base font-semibold text-fg">No schedules yet</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              Set up a capture, then choose <span className="font-medium text-fg">Save as schedule</span> to re-run it daily, weekly or monthly.
            </p>
            <Link href="/app" className={buttonClass('secondary', 'md', 'mt-6')}>
              Start a capture
            </Link>
          </Card>
        ) : (
          <Card className="divide-y divide-line">
            {schedules.map((s) => {
              const open = openId === s.id;
              return (
                <div key={s.id}>
                  <div className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center sm:px-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-semibold text-fg">{s.name}</h2>
                        <Badge tone={s.enabled ? 'success' : 'neutral'} dot>
                          {s.enabled ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
                        <span className="font-mono text-fg">{s.targetUrl}</span>
                        <span>{describeCadence(s)}</span>
                        <span>
                          {s.urls.length} {s.urls.length === 1 ? 'page' : 'pages'}
                          {' · '}
                          {(s.settings?.devices?.length ? s.settings.devices : [s.settings?.device ?? 'Desktop']).join(', ')}
                        </span>
                        {s.enabled && s.nextRunAt && <span>Next: {formatDate(s.nextRunAt)}</span>}
                        <span>
                          {s.notifyOn === 'changes' ? `Emails on changes ≥ ${s.changeThreshold ?? 1}%` : s.recipients.length ? 'Emails every run' : 'No emails'}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <Button size="sm" variant="secondary" icon="play" isLoading={runningId === s.id} onClick={() => runNow(s)}>
                        {runningId === s.id ? 'Running…' : 'Run now'}
                      </Button>
                      {s.lastRunAt && (
                        <a
                          href={`/api/schedules/${s.id}/download`}
                          download={`schedule-${s.id.slice(0, 8)}-latest.zip`}
                          className={buttonClass('secondary', 'sm')}
                          title="Download the latest run as a ZIP"
                        >
                          <Icon name="download" size={14} />
                          Latest
                        </a>
                      )}
                      {s.ownerKey && (
                        <Button size="sm" variant="ghost" icon="link" onClick={() => setShareTarget({ kind: 'schedule', scheduleId: s.id })}>
                          Share
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => toggleHistory(s.id)} aria-expanded={open}>
                        History
                        <Icon name="chevronDown" size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                      </Button>
                      <Button size="sm" variant="ghost" icon={s.enabled ? 'pause' : 'play'} onClick={() => toggleEnabled(s)}>
                        {s.enabled ? 'Pause' : 'Resume'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => remove(s)}
                        title="Delete schedule"
                        aria-label={`Delete ${s.name}`}
                        className="cursor-pointer rounded-md p-1.5 text-faint transition hover:bg-danger-soft hover:text-danger"
                      >
                        <Icon name="trash" />
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="border-t border-line bg-subtle/50 px-5 py-4 sm:px-6">
                      {s.ownerKey && (
                        <SharePagesList
                          scheduleId={s.id}
                          urls={s.urls}
                          devices={s.settings?.devices?.length ? s.settings.devices : [s.settings?.device ?? 'Desktop']}
                        />
                      )}
                      <h3 className="mb-3 text-xs font-medium text-muted">Last {s.retentionCount || 10} runs are kept</h3>
                      {isLoadingRuns ? (
                        <div className="flex items-center gap-2 py-3 text-sm text-muted">
                          <Spinner size={14} /> Loading runs…
                        </div>
                      ) : runs.length === 0 ? (
                        <p className="py-3 text-sm text-muted">No runs yet. Use “Run now” to trigger one.</p>
                      ) : (
                        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-field">
                          {runs.map((run) => (
                            <li key={run.id} className="px-4 py-2.5">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3 text-sm">
                                  <Badge tone={RUN_TONE[run.status]}>{run.status}</Badge>
                                  <span className="text-fg">{formatDate(run.timestamp)}</span>
                                  <span className="text-muted">
                                    {run.completedUrls}/{run.totalUrls} screenshots
                                  </span>
                                  {run.comparedToRunId === undefined ? (
                                    <Badge>First run</Badge>
                                  ) : run.changedPages ? (
                                    <Badge tone="warning" dot>
                                      {run.changedPages} {run.changedPages === 1 ? 'page' : 'pages'} changed
                                    </Badge>
                                  ) : (
                                    <Badge tone="success">No changes</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {run.emailPreviewUrl && (
                                    <a href={run.emailPreviewUrl} target="_blank" rel="noopener noreferrer" className={buttonClass('ghost', 'sm')}>
                                      <Icon name="mail" size={14} />
                                      Email
                                    </a>
                                  )}
                                  <a
                                    href={`/api/schedules/${s.id}/runs/${run.id}/download`}
                                    download={`scheduled-run-${run.id.slice(0, 8)}.zip`}
                                    className={buttonClass('secondary', 'sm')}
                                  >
                                    <Icon name="download" size={14} />
                                    ZIP
                                  </a>
                                </div>
                              </div>
                              {!!run.changedPages && (
                                <ul className="mt-2 space-y-0.5 border-l-2 border-warning/40 pl-3 text-xs text-muted">
                                  {run.results
                                    .filter((r) => typeof r.changePct === 'number' && r.changePct >= (s.changeThreshold ?? 1))
                                    .sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0))
                                    .slice(0, 10)
                                    .map((r, i) => (
                                      <li key={i} className="flex justify-between gap-4">
                                        <span className="truncate font-mono">
                                          {r.url}
                                          {r.device ? ` · ${r.device}` : ''}
                                        </span>
                                        <span className="shrink-0 font-medium text-warning">{r.changePct}%</span>
                                      </li>
                                    ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        )}
      </main>
      <ShareDialog target={shareTarget} onClose={() => setShareTarget(null)} />
    </div>
  );
}
