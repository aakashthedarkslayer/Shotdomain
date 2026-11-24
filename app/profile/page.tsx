import Link from 'next/link';
import { redirect } from 'next/navigation';
import { authEnabled, currentUser, currentUserKey } from '@/auth';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { buttonClass } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { getProfile } from '@/lib/userData';
import { planInfoFor } from '@/lib/billing';
import { formatDate, formatDateTime } from '@/lib/format';
import { SHARE_DAYS } from '@/lib/plans';
import { listShares } from '@/lib/shareStore';
import { revokeShareAction } from '@/app/actions/profile';
import { StopSharingButton } from '@/components/share/StopSharingButton';

export const metadata = { title: 'Profile — ShotDomain' };
// Share links are read from disk on every request; never prerender them.
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const key = await currentUserKey();
  if (!key) redirect('/login?callbackUrl=/profile');
  const user = await currentUser();
  const shares = await listShares(key);
  const planInfo = await planInfoFor(key);
  const shareLimit = planInfo.limits.shareLinks;
  const profile = await getProfile(key);

  return (
    <div className="min-h-screen pb-24">
      <AppHeader />
      <main className="mx-auto max-w-5xl space-y-6 px-4 pt-10 sm:px-6">
        {/* Share links */}
        <Card id="share-links">
          <CardHeader
            title="Share links"
            description={`Anyone with one of these links can view and download its screenshots without signing in. Each link and its screenshots are deleted after ${SHARE_DAYS} days.`}
            actions={
              <span className="font-mono text-xs whitespace-nowrap text-muted">
                {shares.length} of {shareLimit} in use
              </span>
            }
          />
          {shares.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-muted">
                <Icon name="link" size={20} />
              </span>
              <p className="mt-3 text-sm font-medium text-fg">No share links</p>
              <p className="mt-1 text-sm text-muted">After a capture, press Share link on the results to send the screenshots to someone.</p>
              <Link href="/" className={buttonClass('secondary', 'sm', 'mt-4')}>
                <Icon name="plus" size={14} />
                New capture
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {shares.map((sh) => (
                <li key={sh.token} className="flex items-center gap-3 px-5 py-3 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <a href={`/share/${sh.token}`} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium text-fg hover:underline">
                      {sh.label}
                    </a>
                    <p className="text-xs text-muted">
                      Shared {formatDateTime(sh.createdAt)} · deleted on {formatDate(sh.expiresAt)}
                    </p>
                  </div>
                  <form action={revokeShareAction}>
                    <input type="hidden" name="token" value={sh.token} />
                    <StopSharingButton />
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
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
              <h1 className="truncate text-2xl font-semibold tracking-[-0.04em] text-fg">{user ? user.name || user.email : 'Local user'}</h1>
              <p className="truncate text-sm text-muted">
                {user ? [user.email, user.company].filter(Boolean).join(' · ') : 'Sign-in isn’t configured on this server.'}
              </p>
            </div>
          </div>
          <div className="px-5 py-5 sm:px-6">
            {user ? (
              <ProfileForm
                displayName={user.name !== user.googleName ? (user.name ?? '') : ''}
                googleName={user.googleName ?? ''}
                company={user.company ?? ''}
                email={user.email ?? ''}
                brandName={profile.brandName ?? ''}
                brandLogoUrl={profile.brandLogoUrl ?? ''}
                brandingAllowed={planInfo.limits.branding}
              />
            ) : (
              <Alert tone="info">
                {authEnabled ? 'Sign in to edit your profile.' : 'ShotDomain is running in local mode, so there’s no account to edit. Your share links are above.'}
              </Alert>
            )}
          </div>
        </Card>

      </main>
    </div>
  );
}
