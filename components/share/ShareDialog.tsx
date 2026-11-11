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
  | { kind: 'schedule'; scheduleId: string }
  | { kind: 'page'; scheduleId: string; pageUrl: string; device?: string };

interface Share {
  token: string;
  kind: string;
  captureId?: string;
  file?: string;
  scheduleId?: string;
  pageUrl?: string;
  device?: string;
}

function matches(s: Share, t: ShareTarget): boolean {
  if (s.kind !== t.kind) return false;
  switch (t.kind) {
    case 'capture':
      return s.captureId === t.captureId;
    case 'screenshot':
      return s.captureId === t.captureId && s.file === t.file;
    case 'schedule':
      return s.scheduleId === t.scheduleId;
    case 'page':
      return s.scheduleId === t.scheduleId && s.pageUrl === t.pageUrl && (!t.device || s.device === t.device);
  }
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

function Choice({ checked, onSelect, title, body }: { checked: boolean; onSelect: () => void; title: string; body: string }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
        checked ? 'border-accent bg-accent-soft' : 'border-line hover:bg-subtle'
      }`}
    >
      <input type="radio" checked={checked} onChange={onSelect} className="mt-1 accent-[var(--accent)]" />
      <span>
        <span className="block text-sm font-medium text-fg">{title}</span>
        <span className="block text-[13px] text-muted">{body}</span>
      </span>
    </label>
  );
}

/**
 * Sharing settings for one target (Stillio-style): Sharing on / off + Save,
 * then the links. Opening the dialog never creates a link by itself.
 */
export function ShareDialog({ target, onClose }: { target: ShareTarget | null; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState<Share | null>(null);
  const [wantOn, setWantOn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    fetch('/api/shares')
      .then((res) => (res.ok ? res.json() : []))
      .then((list: Share[]) => {
        if (cancelled) return;
        const existing = list.find((s) => matches(s, target)) ?? null;
        setShare(existing);
        setWantOn(!!existing);
      })
      .catch(() => !cancelled && setError('Could not load sharing settings.'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
      setLoading(true);
      setShare(null);
      setWantOn(false);
      setError(null);
      setSaved(false);
    };
  }, [target]);

  async function save() {
    if (!target) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      if (wantOn && !share) {
        const res = await fetch('/api/shares', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(target) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not turn sharing on.');
        setShare(data);
      } else if (!wantOn && share) {
        const res = await fetch(`/api/shares/${share.token}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Could not turn sharing off.');
        setShare(null);
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const base = share ? `${origin}/share/${share.token}` : '';
  const kind = target?.kind;
  const what = kind === 'schedule' ? 'this site' : kind === 'page' ? 'this page' : kind === 'capture' ? 'this capture' : 'this screenshot';

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title="Sharing settings"
      description={`Share ${what} with a link — the recipient doesn’t need an account.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={save} isLoading={saving} disabled={loading || wantOn === !!share}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4 p-5">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Spinner /> Loading…
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Choice checked={wantOn} onSelect={() => setWantOn(true)} title="Sharing on" body="Anyone with the link can view. No sign-in required." />
              <Choice checked={!wantOn} onSelect={() => setWantOn(false)} title="Sharing off" body="Only you can view, signed in." />
            </div>
            {error && <Alert tone="danger">{error}</Alert>}
            {saved && !error && <Alert tone="success">{share ? 'Sharing is on.' : 'Sharing is off — the links no longer work.'}</Alert>}

            {share && (
              <div className="space-y-3 border-t border-line pt-4">
                <div className="text-sm font-semibold text-fg">Links</div>
                {(kind === 'schedule' || kind === 'page') && (
                  <>
                    <CopyField label="All Screenshots" value={base} />
                    <CopyField label="Latest Screenshot" value={`${base}/latest`} />
                    <Alert tone="warning">
                      {kind === 'schedule'
                        ? 'Both links give access to all screenshots of this site, so the recipient can always see every kept capture — not just one. '
                        : 'Both links give access to all screenshots of this page. The Latest Screenshot link is a direct image you can embed. '}
                      Shared times are shown in UTC.
                    </Alert>
                  </>
                )}
                {kind === 'capture' && <CopyField label="Link" value={base} />}
                {kind === 'screenshot' && (
                  <>
                    <CopyField label="Link" value={base} />
                    <CopyField label="Direct image (for embedding)" value={`${base}/image`} />
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
