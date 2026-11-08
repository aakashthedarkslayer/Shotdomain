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

interface SaveScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl: string;
  urls: string[];
  settings: CaptureSettings;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function ScheduleForm({ onClose, targetUrl, urls, settings }: Omit<SaveScheduleModalProps, 'isOpen'>) {
  const [name, setName] = useState(`${urlHost(targetUrl)} — recurring capture`);
  const [frequency, setFrequency] = useState<FrequencyType>('weekly');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [recipients, setRecipients] = useState('');
  const [retentionCount, setRetentionCount] = useState(10);
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
        {error && <Alert tone="danger">{error}</Alert>}

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

        <Field label="Keep history" htmlFor="schedule-retention">
          <Select id="schedule-retention" value={retentionCount} onChange={(e) => setRetentionCount(Number(e.target.value))}>
            <option value={5}>Last 5 runs</option>
            <option value={10}>Last 10 runs</option>
            <option value={20}>Last 20 runs</option>
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
  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Save as schedule"
      description={`Re-capture ${rest.urls.length} ${rest.urls.length === 1 ? 'page' : 'pages'} automatically.`}
    >
      {/* Mounted only while open, so the form resets each time. */}
      {isOpen && <ScheduleForm onClose={onClose} {...rest} />}
    </Modal>
  );
}
