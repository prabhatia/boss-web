'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BossLogo } from '@/components/BossLogo';
import { LinkedInImport } from '@/components/LinkedInImport';
import { createClient } from '@/lib/supabase/client';
import {
  api,
  ApiError,
  type ProfileResponse,
  type SuggestedConnection,
  type RecommendedJob,
} from '@/lib/api';
import styles from './dashboard.module.css';

interface InitialUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  providers: string[];
}

export function DashboardClient({ initialUser }: { initialUser: InitialUser }) {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [connections, setConnections] = useState<SuggestedConnection[]>([]);
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setApiDown(false);
    try {
      const [p, c, j] = await Promise.allSettled([
        api.get<ProfileResponse>('profile', '/profiles/me'),
        api.get<SuggestedConnection[]>('profile', '/connections/suggestions?limit=4'),
        api.get<RecommendedJob[]>('jobs', '/jobs/recommendations'),
      ]);

      if (p.status === 'fulfilled') setProfile(p.value);
      else if (p.reason instanceof ApiError && p.reason.status >= 500) setApiDown(true);
      else if (!(p.reason instanceof ApiError)) setApiDown(true);

      if (c.status === 'fulfilled') setConnections(c.value);
      if (j.status === 'fulfilled') setJobs(j.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const name = profile?.displayName ?? initialUser.displayName ?? 'there';
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'B';

  const completion = computeCompletion(profile);

  return (
    <div className={styles.shell}>
      {/* ── SIDEBAR ── */}
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.sidebarLogo} aria-label="boss home">
          <BossLogo height={34} showWord={false} idSuffix="side" />
        </Link>
        <nav className={styles.sidebarNav}>
          <SideLink href="/dashboard" icon="◉" label="Dashboard" active />
          <SideLink href="/companies" icon="🏢" label="Companies" />
          <SideLink href="/jobs" icon="💼" label="Jobs" />
          <SideLink href="/faq" icon="?" label="Help" />
        </nav>
        <button onClick={signOut} className={styles.signOut} title="Sign out">⏻</button>
      </aside>

      {/* ── MAIN ── */}
      <main className={styles.main}>
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.h1}>Welcome back, {name.split(' ')[0]}</h1>
            <p className={styles.sub}>
              Here is what changed since you were last here.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.notifBtn} aria-label="Notifications">
              🔔<span className={styles.notifDot} />
            </button>
          </div>
        </header>

        {apiDown && (
          <div className={styles.apiBar}>
            <strong>Backend not reachable.</strong> Start the Spring Boot services
            on ports 8080–8083, then reload. Showing your Supabase account details
            in the meantime.
          </div>
        )}

        {completion < 100 && (
          <div className={styles.completionBanner}>
            <div className={styles.completionText}>
              <strong>Your profile is {completion}% complete.</strong> Complete
              profiles appear in search results and get better job matches.
            </div>
            <div className={styles.progressWrap}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>
        )}

        <div className={styles.grid}>
          {/* ── PROFILE CARD ── */}
          <section className={styles.profileCard}>
            <div className={styles.profileBanner} />
            <div className={styles.profileAvWrap}>
              {initialUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={initialUser.avatarUrl} alt="" className={styles.profileAv} />
              ) : (
                <div className={styles.profileAvFallback}>{initials}</div>
              )}
            </div>

            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{name}</div>
              <div className={styles.profileRole}>
                {profile?.currentRole ?? 'Add your current role'}
              </div>
              <div className={styles.profileHeadline}>
                {profile?.location ?? initialUser.email}
              </div>

              <div className={styles.statRow}>
                <div>
                  <div className={styles.psVal}>{profile?.connectionCount ?? 0}</div>
                  <div className={styles.psLbl}>Connections</div>
                </div>
                <div>
                  <div className={styles.psVal}>{profile?.yearsExperience ?? '—'}</div>
                  <div className={styles.psLbl}>Years exp.</div>
                </div>
                <div>
                  <div className={styles.psVal}>
                    {profile?.subscriptionTier === 'FREE' ? 'Free' : 'Premium'}
                  </div>
                  <div className={styles.psLbl}>Plan</div>
                </div>
              </div>

              <div className={styles.providerRow}>
                {initialUser.providers.map((p) => (
                  <span key={p} className={styles.providerPill}>
                    {p === 'linkedin_oidc' ? 'LinkedIn' : p === 'google' ? 'Google' : p === 'apple' ? 'Apple' : p}
                  </span>
                ))}
              </div>

              <LinkedInImport onImported={load} />
            </div>
          </section>

          {/* ── SUGGESTED CONNECTIONS ── */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>People who share your values</h2>
              <span className={styles.cardHint}>
                Matched on how you rate workplaces
              </span>
            </div>

            {loading ? (
              <SkeletonRows n={3} />
            ) : connections.length === 0 ? (
              <EmptyState
                icon="🔗"
                title="No suggestions yet"
                body="Rate 3 or more employers and we will start matching you with professionals who value the same things."
              />
            ) : (
              <div className={styles.connCards}>
                {connections.map((c) => (
                  <article key={c.userId} className={styles.connCard}>
                    <div className={styles.connAv}>
                      {c.displayName.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                    </div>
                    <div className={styles.connInfo}>
                      <div className={styles.connName}>{c.displayName}</div>
                      <div className={styles.connRole}>
                        {c.currentRole ?? c.industry ?? '—'}
                      </div>
                      <div className={styles.connReason}>{c.suggestionReason}</div>
                    </div>
                    <button className="btn btn-outline" style={{ fontSize: '.78rem', padding: '.35rem .9rem' }}>
                      Connect
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* ── RECOMMENDED JOBS ── */}
          <section className={styles.card} style={{ gridColumn: '1 / -1' }}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Jobs matched to your values</h2>
              <Link href="/jobs" className={styles.cardLink}>View all jobs →</Link>
            </div>

            {loading ? (
              <SkeletonRows n={3} />
            ) : jobs.length === 0 ? (
              <EmptyState
                icon="💼"
                title="No matches yet"
                body="Your AI job recommendations activate after you rate 3 employers. That is how we learn what culture and management style you actually thrive in."
              />
            ) : (
              <div className={styles.jobCards}>
                {jobs.map((j) => (
                  <article key={j.jobId} className={styles.jobCard}>
                    <div className={styles.jobCoLogo}>{j.title[0]}</div>
                    <div className={styles.jobInfo}>
                      <div className={styles.jobTitle}>{j.title}</div>
                      <div className={styles.jobCo}>
                        {j.location ?? 'Location flexible'}
                        {j.isRemote && ' · Remote'}
                        {j.roleLevel && ` · ${j.roleLevel}`}
                      </div>
                      <div className={styles.jobTags}>
                        {j.salaryMin && j.salaryMax ? (
                          <span className={styles.tag}>
                            ${(j.salaryMin / 1000).toFixed(0)}k–${(j.salaryMax / 1000).toFixed(0)}k
                          </span>
                        ) : (
                          <span className={styles.tagMuted}>Salary on Premium</span>
                        )}
                        {j.isFeatured && <span className={styles.tagFeatured}>Featured</span>}
                      </div>
                    </div>
                    <div className={styles.matchScore}>
                      <div className={styles.matchPct}>{Math.round(j.matchScore * 100)}%</div>
                      <div className={styles.matchLabel}>{j.matchReason}</div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────────── */

function computeCompletion(p: ProfileResponse | null): number {
  if (!p) return 20;
  const fields = [p.displayName, p.currentRole, p.industry, p.location, p.yearsExperience];
  const filled = fields.filter(Boolean).length;
  return Math.round(((filled + 1) / (fields.length + 1)) * 100);
}

function SideLink({
  href, icon, label, active = false,
}: { href: string; icon: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`${styles.sideLink}${active ? ` ${styles.sideLinkActive}` : ''}`}
      title={label}
      aria-label={label}
    >
      {icon}
    </Link>
  );
}

function SkeletonRows({ n }: { n: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={styles.skeletonRow} />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div className={styles.emptyTitle}>{title}</div>
      <p className={styles.emptyBody}>{body}</p>
    </div>
  );
}
