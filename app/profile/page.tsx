import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authEnabled, currentUser, currentUserKey } from '@/auth';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { MAX_CAPTURES_PER_USER, listCaptures } from '@/lib/userData';
import { formatDateTime, hostOf } from '@/lib/format';
import { listShares } from '@/lib/shareStore';
import { revokeShareAction } from '@/app/actions/profile';

export const metadata = { title: 'Profile — ShotDomain' };
// History is read from disk on every request; never prerender it.
export const dynamic = 'force-dynamic';

function historyImageUrl(id: string, file: string) {
  return `/api/history/${id}/file?name=${encodeURIComponent(file)}`;
}

export default async function ProfilePage() {
  const key = await currentUserKey();
  if (!key) redirect('/login?callbackUrl=/profile');
  const user = await currentUser();
  const captures = await listCaptures(key);
  const shares = await listShares(key);

  return (
    <div className="min-h-screen pb-24">
      <AppHeader />
      <main className="mx-auto max-w-5xl space-y-6 px-4 pt-10 sm:px-6">
        {/* Profile */}
        <Card>
          <div className="flex items-center gap-4 border-b border-line px-5 py-5 sm:px-6">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-subtle text-lg font-semibold text-fg">
              {user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
              ) : (
                (user?.name || user?.email || 'L').charAt(0).toUpperCase()
              )}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-fg">{user ? user.name || user.email : 'Local user'}</h1>
              <p className="truncate text-sm text-muted">
                {user ? [user.email, user.company].filter(Boolean).join(' · ') : 'Sign-in isn’t configured on this server.'}
              </p>
            </div>
          </div>
          <div className="px-5 py-5 sm:px-6">
            {user ? (
              <ProfileForm displayName={user.name !== user.googleName ? (user.name ?? '') : ''} googleName={user.googleName ?? ''} company={user.company ?? ''} email={user.email ?? ''} />
            ) : (
              <Alert tone="info">
                {authEnabled ? 'Sign in to edit your profile.' : 'ShotDomain is running in local mode, so there’s no account to edit. Your capture history is still saved below.'}
              </Alert>
            )}
          </div>
        </Card>

        {/* History */}
        <Card id="history">
          <CardHeader
            title="Capture history"
            description={`Your last ${MAX_CAPTURES_PER_USER} captures are kept. Older ones are removed automatically.`}
            actions={
              <Link href="/app" className={buttonClass('secondary', 'sm')}>
                <Icon name="plus" size={14} />
                New capture
              </Link>
            }
          />
          {captures.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-muted">
                <Icon name="image" size={20} />
              </span>
              <p className="mt-3 text-sm font-medium text-fg">No captures yet</p>
              <p className="mt-1 text-sm text-muted">Screenshots you take will show up here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {captures.map((c) => {
                const cover = c.results.find((r) => r.status === 'done' && r.fileName);
                return (
                  <li key={c.id}>
                    <Link href={`/profile/captures/${c.id}`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-subtle sm:px-6">
                      <span className="h-14 w-20 shrink-0 overflow-hidden rounded-md border border-line bg-subtle">
                        {cover?.fileName && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={historyImageUrl(c.id, cover.fileName)} alt="" loading="lazy" className="h-full w-full object-cover object-top" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-fg">{hostOf(c.rootUrl)}</span>
                          {c.scheduleName && <Badge tone="accent">Scheduled</Badge>}
                          {c.failed > 0 && <Badge tone="warning">{c.failed} failed</Badge>}
                        </div>
                        <p className="mt-0.5 truncate text-[13px] text-muted">
                          {c.scheduleName ? `${c.scheduleName} · ` : ''}
                          {formatDateTime(c.createdAt)} · {c.done} {c.done === 1 ? 'screenshot' : 'screenshots'} · {c.devices.join(', ')}
                          {c.fullPage ? ' · Full page' : ''}
                        </p>
                      </div>
                      <Icon name="arrowRight" className="text-faint" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        {/* Shared links */}
        {shares.length > 0 && (
          <Card>
            <CardHeader title="Shared links" description="Anyone with one of these links can view it without signing in." />
            <ul className="divide-y divide-line">
              {shares.map((sh) => (
                <li key={sh.token} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                  <Badge>{sh.kind === 'schedule' ? 'Schedule' : sh.kind === 'capture' ? 'Capture' : sh.kind === 'page' ? 'Page' : 'Screenshot'}</Badge>
                  <div className="min-w-0 flex-1">
                    <a href={`/share/${sh.token}`} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium text-fg hover:underline">
                      {sh.label}
                    </a>
                    <p className="text-xs text-muted">Shared {formatDateTime(sh.createdAt)}</p>
                  </div>
                  <form action={revokeShareAction}>
                    <input type="hidden" name="token" value={sh.token} />
                    <button type="submit" className={buttonClass('danger', 'sm')}>
                      Stop sharing
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </div>
  );
}
