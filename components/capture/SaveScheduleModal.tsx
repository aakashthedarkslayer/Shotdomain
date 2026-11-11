'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { Segmented } from '@/components/ui/Controls';
import { Alert } from '@/components/ui/Alert';
import type { CaptureSettings } from '@/lib/jobStore';
import type { FrequencyType } from '@/lib/scheduleStore';
import { urlHost } from '@/lib/url';
import { useCurrentUser } from '@/components/auth/UserContext';
import { usePlan } from '@/components/billing/PlanContext';
import { LimitAwareError } from '@/components/billing/Upgrade';
import { PLANS } from '@/lib/plans';
import Link from 'next/link';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

interface SaveScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl: string;
  urls: string[];
  settings: CaptureSettings;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Shown instead of the form when the plan has no schedules. */
function SchedulesLocked({ onClose }: { onClose: () => void }) {
  const studio = PLANS.studio.limits;
  return (
    <div className="space-y-4 p-5 text-sm">
      <div className="flex items-start gap-3 rounded-xl bg-accent-soft px-4 py-3">
        <Icon name="lock" size={16} className="mt-0.5 shrink-0 text-accent" />
        <div>
          <p className="font-medium text-fg">Schedules are included in Studio</p>
          <p className="mt-1 text-muted">
            Monitor up to {studio.schedules} sites automatically, {studio.pagesPerSchedule} key pages each — daily, weekly or monthly — and get an
            email when a page changes.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Not now
        </Button>
        <Link href="/billing?plan=studio" className={buttonClass('primary', 'md')}>
          See plans
        </Link>
      </div>
    </div>
  );
}

function ScheduleForm({ onClose, targetUrl, urls: selected, settings }: Omit<SaveScheduleModalProps, 'isOpen'>) {
  const { limits } = usePlan();
  // Schedules monitor key pages: beyond the plan's per-schedule cap, the first ones are kept.
  const urls = selected.slice(0, limits.pagesPerSchedule);
  const trimmed = selected.length - urls.length;
  const [name, setName] = useState(`${urlHost(targetUrl)} — recurring capture`);
  const deviceList = settings.devices?.length ? settings.devices : [settings.device ?? 'Desktop'];
  const [frequency, setFrequency] = useState<FrequencyType>('weekly');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const user = useCurrentUser();
  const [recipients, setRecipients] = useState(user?.email ?? '');
  const [retentionCount, setRetentionCount] = useState(Math.min(10, limits.runsKept));
  const [notifyOn, setNotifyOn] = useState<'every' | 'changes'>('every');
  const [changeThreshold, setChangeThreshold] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          targetUrl,
          urls,
          settings,
          frequency,
          timeOfDay,
          dayOfWeek,
          dayOfMonth,
          enabled: true,
          recipients: recipients.split(',').map((s) => s.trim()).filter(Boolean),
          retentionCount,
          notifyOn,
          changeThreshold,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save schedule');
      }
      setSaved(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule');
    } finally {
      setSubmitting(false);
    }
  }

  if (saved) {
    return (
      <div className="p-5">
        <Alert tone="success">Schedule saved. It will run automatically — manage it from the Schedules page.</Alert>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 p-5">
        {error && <LimitAwareError message={error} />}

        {trimmed > 0 && (
          <Alert tone="warning">
            A schedule monitors up to {limits.pagesPerSchedule} key pages on your plan, so this one will capture the first{' '}
            {limits.pagesPerSchedule} of the {selected.length} you selected. To pick which, go back and select just your key pages.
          </Alert>
        )}

        <p className="text-[13px] text-muted">
          Captures {urls.length} {urls.length === 1 ? 'page' : 'pages'} on {deviceList.join(', ')}. Each run is added to your capture history.
        </p>

        <Field label="Name" htmlFor="schedule-name">
          <Input id="schedule-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Repeat">
            <Segmented
              label="Frequency"
              value={frequency}
              onChange={setFrequency}
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />
          </Field>
          <Field label="Time" htmlFor="schedule-time">
            <Input id="schedule-time" type="time" required value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} />
          </Field>
        </div>

        {frequency === 'weekly' && (
          <Field label="Day of week" htmlFor="schedule-dow">
            <Select id="schedule-dow" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <option key={d} value={d}>
                  {WEEKDAYS[d]}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {frequency === 'monthly' && (
          <Field label="Day of month" htmlFor="schedule-dom">
            <Select id="schedule-dom" value={dayOfMonth} onChange={(e) => setDayOfMonth(Number(e.target.value))}>
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Email results to" htmlFor="schedule-recipients" hint="Optional. Separate multiple addresses with commas.">
          <Input
            id="schedule-recipients"
            placeholder="you@company.com"
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email me" htmlFor="schedule-notify" hint="Each run is compared with the previous one, page by page.">
            <Select id="schedule-notify" value={notifyOn} onChange={(e) => setNotifyOn(e.target.value as 'every' | 'changes')}>
              <option value="every">After every run</option>
              <option value="changes">Only when pages change</option>
            </Select>
          </Field>
          <Field label="Counts as changed at" htmlFor="schedule-threshold">
            <Select id="schedule-threshold" value={changeThreshold} onChange={(e) => setChangeThreshold(Number(e.target.value))}>
              <option value={0.1}>0.1% of the page (very sensitive)</option>
              <option value={1}>1% of the page</option>
              <option value={5}>5% of the page</option>
              <option value={15}>15% of the page (big changes only)</option>
            </Select>
          </Field>
        </div>

        <Field label="Keep history" htmlFor="schedule-retention">
          <Select id="schedule-retention" value={retentionCount} onChange={(e) => setRetentionCount(Number(e.target.value))}>
            {[5, 10, 20, 30]
              .filter((n) => n <= limits.runsKept)
              .map((n) => (
                <option key={n} value={n}>
                  Last {n} runs
                </option>
              ))}
          </Select>
        </Field>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" isLoading={submitting}>
          Save schedule
        </Button>
      </div>
    </form>
  );
}

export default function SaveScheduleModal({ isOpen, onClose, ...rest }: SaveScheduleModalProps) {
  const { limits } = usePlan();
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Save as schedule"
      description={
        limits.schedules === 0
          ? 'Re-capture these pages automatically, on a schedule.'
          : `Re-capture ${Math.min(rest.urls.length, limits.pagesPerSchedule)} ${rest.urls.length === 1 ? 'page' : 'pages'} automatically.`
      }
    >
      {/* Mounted only while open, so the form resets each time. */}
      {isOpen && (limits.schedules === 0 ? <SchedulesLocked onClose={onClose} /> : <ScheduleForm onClose={onClose} {...rest} />)}
    </Modal>
  );
}
