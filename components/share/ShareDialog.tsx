'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Icon';

export type ShareTarget =
  | { kind: 'capture'; captureId: string }
  | { kind: 'screenshot'; captureId: string; file: string }
  | { kind: 'schedule'; scheduleId: string };

interface Share {
  token: string;
  label: string;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="text-[13px] font-medium text-fg">{label}</div>
      <div className="flex gap-2">
        <Input readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="font-mono text-[13px]" />
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
    </div>
  );
}

/** Creates (or reuses) a public link for the target and lets the owner copy or revoke it. */
export function ShareDialog({ target, onClose }: { target: ShareTarget | null; onClose: () => void }) {
  const [share, setShare] = useState<Share | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    fetch('/api/shares', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(target) })
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) setError(data.error || 'Could not create a link.');
        else setShare(data);
      })
      .catch(() => !cancelled && setError('Could not create a link.'));
    return () => {
      cancelled = true;
      setShare(null);
      setError(null);
    };
  }, [target]);

  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const pageUrl = share ? `${origin}/share/${share.token}` : '';

  async function revoke() {
    if (!share) return;
    setRevoking(true);
    await fetch(`/api/shares/${share.token}`, { method: 'DELETE' }).catch(() => {});
    setRevoking(false);
    onClose();
  }

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title="Share link"
      description="Anyone with the link can view — no sign-in needed. You can stop sharing at any time."
      footer={
        share && (
          <>
            <Button variant="danger" onClick={revoke} isLoading={revoking}>
              Stop sharing
            </Button>
            <Button onClick={onClose}>Done</Button>
          </>
        )
      }
    >
      <div className="space-y-4 p-5">
        {error && <Alert tone="danger">{error}</Alert>}
        {!share && !error && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Spinner /> Creating link…
          </div>
        )}
        {share && (
          <>
            <CopyField label="Link" value={pageUrl} />
            {target?.kind === 'screenshot' && <CopyField label="Direct image (for embedding)" value={`${pageUrl}/image`} />}
            {target?.kind === 'schedule' && (
              <p className="text-[13px] text-muted">This link always shows the newest run. The shared page also lists per-page image links you can embed.</p>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
