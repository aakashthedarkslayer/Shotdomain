'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Icon';
import { LimitAwareError } from '@/components/billing/Upgrade';
import { SHARE_DAYS } from '@/lib/plans';
import { formatDate } from '@/lib/format';
import { STOP_SHARING_CONFIRM } from './StopSharingButton';

interface Share {
  token: string;
  captureId: string;
  expiresAt: number;
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <Input readOnly aria-label="Share link" value={value} onFocus={(e) => e.currentTarget.select()} className="font-mono text-[13px]" />
      <Button
        variant="secondary"
        onClick={async () => {
          await navigator.clipboard?.writeText(value).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

/**
 * Share one finished capture with a link. Opening the dialog shows the
 * existing link if there is one; it never creates a link by itself.
 */
export function ShareDialog({ jobId, onClose }: { jobId: string | null; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState<Share | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    fetch('/api/shares')
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Share[]) => !cancelled && setShare(list.find((s) => s.captureId === jobId) ?? null))
      .catch(() => !cancelled && setError('Could not load your share links.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      setLoading(true);
      setShare(null);
      setError(null);
      setStopped(false);
    };
  }, [jobId]);

  async function create() {
    setBusy(true);
    setError(null);
    setStopped(false);
    try {
      const res = await fetch('/api/shares', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not create the link.');
      setShare(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    if (!share || !window.confirm(STOP_SHARING_CONFIRM)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/shares/${share.token}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Could not stop sharing.');
      setShare(null);
      setStopped(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  const origin = typeof window === 'undefined' ? '' : window.location.origin;

  return (
    <Modal
      open={!!jobId}
      onClose={onClose}
      title="Share these screenshots"
      description="Anyone with the link can view and download them. No account needed."
      footer={
        <>
          {share && (
            <Button variant="danger" onClick={stop} isLoading={busy} className="mr-auto">
              Stop sharing
            </Button>
          )}
          <Button variant={share ? 'primary' : 'ghost'} onClick={onClose}>
            {share ? 'Done' : 'Cancel'}
          </Button>
          {!share && (
            <Button onClick={create} isLoading={busy} disabled={loading} icon="link">
              Create link
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4 p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Spinner /> Loading…
          </div>
        ) : share ? (
          <>
            <CopyField value={`${origin}/share/${share.token}`} />
            <p className="text-[13px] text-muted">
              The link and its screenshots are deleted on {formatDate(share.expiresAt)}. You can stop sharing sooner here or on your profile page.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted">
            {stopped ? 'Sharing stopped: the link no longer works and its screenshots are deleted. ' : ''}
            Creating a link keeps this capture on our server for {SHARE_DAYS} days, then deletes it. Without a link, screenshots are deleted about an hour
            after the capture.
          </p>
        )}
        {error && <LimitAwareError message={error} />}
      </div>
    </Modal>
  );
}
