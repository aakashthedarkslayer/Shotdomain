'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { CaptureSettings } from '@/lib/jobStore';
import type { FrequencyType } from '@/lib/scheduleStore';

interface SaveScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl: string;
  urls: string[];
  settings: CaptureSettings;
}

export default function SaveScheduleModal({
  isOpen,
  onClose,
  targetUrl,
  urls,
  settings,
}: SaveScheduleModalProps) {
  const [name, setName] = useState(
    `Daily capture for ${(() => {
      try {
        return new URL(targetUrl).hostname;
      } catch {
        return targetUrl;
      }
    })()}`,
  );
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [hour12, setHour12] = useState('09');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [recipients, setRecipients] = useState('');
  const [retentionCount, setRetentionCount] = useState(10);

  function get24HourTime(h: string, m: string, p: 'AM' | 'PM'): string {
    let hour = parseInt(h, 10);
    if (p === 'AM') {
      if (hour === 12) hour = 0;
    } else {
      if (hour !== 12) hour += 12;
    }
    return `${hour.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;
  }
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const emailList = recipients
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const timeOfDay = get24HourTime(hour12, minute, period);

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
          recipients: emailList,
          retentionCount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save schedule');
      }

      setSuccessMessage('Schedule created successfully! Runs will execute automatically.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121315]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-full max-w-lg p-6 sm:p-8 shadow-2xl border-stone-200 dark:border-stone-800 dark:bg-stone-900 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer p-1"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-[#121315] text-[#E54D2E] dark:bg-stone-100 dark:text-[#E54D2E] flex items-center justify-center shadow-xs">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-serif text-xl font-normal text-stone-900 dark:text-white">
              Save as Recurring Schedule
            </h3>
            <p className="text-xs font-mono text-stone-500 dark:text-stone-400">
              Automatically capture {urls.length} pages on a recurring schedule.
            </p>
          </div>
        </div>

        {successMessage ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-sm font-medium flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-mono">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Schedule Name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Daily Homepage & Pricing Audit"
              />
            </div>

            {/* Frequency selection */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Frequency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['daily', 'weekly', 'monthly'] as FrequencyType[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={`py-2 text-xs font-mono font-semibold rounded-lg capitalize border cursor-pointer transition-all ${
                      frequency === f
                        ? 'border-[#E54D2E] bg-orange-50 text-[#E54D2E] dark:bg-orange-950/40 dark:border-[#FF5733] dark:text-[#FF5733]'
                        : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Execution Time (12-hour with AM / PM) */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Execution Time
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 flex-1">
                  <select
                    value={hour12}
                    onChange={(e) => setHour12(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold border border-stone-200 dark:border-stone-700 rounded-lg dark:bg-stone-800 text-stone-900 dark:text-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const h = (i + 1).toString().padStart(2, '0');
                      return (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      );
                    })}
                  </select>
                  <span className="text-stone-400 font-bold">:</span>
                  <select
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono font-semibold border border-stone-200 dark:border-stone-700 rounded-lg dark:bg-stone-800 text-stone-900 dark:text-white"
                  >
                    {Array.from({ length: 60 }, (_, i) => {
                      const m = i.toString().padStart(2, '0');
                      return (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex rounded-lg border border-stone-200 dark:border-stone-700 p-0.5 bg-stone-100 dark:bg-stone-850 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPeriod('AM')}
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                      period === 'AM'
                        ? 'bg-[#E54D2E] text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriod('PM')}
                    className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-all cursor-pointer ${
                      period === 'PM'
                        ? 'bg-[#E54D2E] text-white shadow-xs'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {frequency === 'weekly' && (
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Day of Week
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-200 dark:border-stone-700 rounded-lg dark:bg-stone-800 text-stone-900 dark:text-white"
                >
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={0}>Sunday</option>
                </select>
              </div>
            )}

            {frequency === 'monthly' && (
              <div>
                <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                  Day of Month
                </label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-200 dark:border-stone-700 rounded-lg dark:bg-stone-800 text-stone-900 dark:text-white"
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Email Recipients */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Email Report Recipients (comma-separated)
              </label>
              <Input
                type="text"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="client@company.com, team@agency.com"
                helperText="Reports and results will be emailed upon each completion."
              />
            </div>

            {/* Retention Count */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                Storage Retention (keep last N runs)
              </label>
              <select
                value={retentionCount}
                onChange={(e) => setRetentionCount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-stone-200 dark:border-stone-700 rounded-lg dark:bg-stone-800 text-stone-900 dark:text-white"
              >
                <option value={5}>5 runs (~250–500 MB)</option>
                <option value={10}>10 runs (~500 MB–1 GB, Recommended)</option>
                <option value={20}>20 runs (~1–2 GB)</option>
              </select>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-stone-800">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                loadingText="Saving Schedule…"
              >
                Save Schedule
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
