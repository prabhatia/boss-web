'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BossLogo } from '@/components/BossLogo';
import { LinkedInImport } from '@/components/LinkedInImport';
import { ResumeImport } from './ResumeImport';
import { InfoTooltip } from '@/components/InfoTooltip';
import { InviteFriend } from './InviteFriend';
import { createClient } from '@/lib/supabase/client';
import {
  api,
  ApiError,
  type ProfileResponse,
  type EmploymentHistoryResponse,
  type SkillResponse,
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
          <SideLink href="/people" icon="🧑‍💼" label="People" />
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
            <button onClick={signOut} className={styles.logoutBtn}>
              Log out
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
          <div className={styles.leftCol}>
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

              <div className={styles.tokensRow}>
                <span className={styles.tokensLabel}>🪙 {profile?.tokens ?? 0} tokens</span>
                <InfoTooltip
                  text={
                    <>
                      Earn <strong style={{ color: 'var(--amber)' }}>10</strong> tokens each time you
                      rate a company, rate a manager, enter salary data, or import your resume. Earn{' '}
                      <strong style={{ color: 'var(--amber)' }}>5</strong> tokens for your first
                      LinkedIn sync, or per valid email when you invite a friend.
                      <br /><br />
                      Use tokens for AI-aided job applications and to initiate connections.
                    </>
                  }
                />
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

              {initialUser.providers.length > 0 && (
                <div className={styles.providerSection}>
                  <span className={styles.providerLabel}>Profiles imported:</span>
                  <div className={styles.providerRow}>
                    {initialUser.providers.map((p) => (
                      <span key={p} className={styles.providerPill}>
                        {p === 'linkedin_oidc' ? 'LinkedIn' : p === 'google' ? 'Google' : p === 'apple' ? 'Apple' : p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <LinkedInImport onImported={load} />
              <ResumeImport onImported={load} />
            </div>
          </section>

          {/* ── INVITE A FRIEND ── */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Invite a friend</h2>
              <span className={styles.cardHint}>Earn 5 tokens per invite</span>
            </div>
            <InviteFriend />
          </section>

          {/* ── SKILLS ── */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Skills</h2>
              <span className={styles.cardHint}>Most recently used first</span>
            </div>

            {loading ? (
              <SkeletonRows n={1} />
            ) : !profile?.skills?.length ? (
              <EmptyState
                icon="🛠️"
                title="No skills added yet"
                body="Import your resume or LinkedIn profile to pull in your skills."
              />
            ) : (
              <div className={styles.skillPills}>
                {rankSkillsByRecency(profile.skills, sortExperience(profile.employmentHistory)).map((s) => (
                  <span
                    key={s.skillId}
                    className={s.isHighlighted ? styles.skillPillHighlighted : styles.skillPill}
                  >
                    {s.skillName}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* ── EXPERIENCE ── */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Experience</h2>
            </div>

            {loading ? (
              <SkeletonRows n={2} />
            ) : !profile?.employmentHistory?.length ? (
              <EmptyState
                icon="💼"
                title="No experience added yet"
                body="Import your resume or LinkedIn profile to build out your work history."
              />
            ) : (
              <div className={styles.expList}>
                {sortExperience(profile.employmentHistory).map((e) => (
                  <article key={e.id} className={styles.expItem}>
                    <div className={styles.expLogo}>
                      {(e.companyName ?? '?')[0]?.toUpperCase()}
                    </div>
                    <div className={styles.expInfo}>
                      <div className={styles.expTitleRow}>
                        <span className={styles.expRole}>{e.roleTitle}</span>
                        {e.isCurrent && <span className={styles.tag}>Current</span>}
                      </div>
                      <div className={styles.expCompany}>{e.companyName}</div>
                      <div className={styles.expMeta}>
                        {formatMonthYear(e.startDate)} – {e.isCurrent ? 'Present' : formatMonthYear(e.endDate)}
                        {e.location && ` · ${e.location}`}
                        {e.isRemote && ' · Remote'}
                      </div>
                      {e.description && <p className={styles.expDesc}>{e.description}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          </div>

          <div className={styles.rightCol}>
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
          <section className={styles.card}>
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
        </div>
      </main>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────────── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Formats a "YYYY-MM-DD" LocalDate string as "Mon YYYY" without going through Date/timezone parsing. */
function formatMonthYear(iso: string | null): string {
  if (!iso) return '—';
  const [year, month] = iso.split('-');
  const label = MONTHS[Number(month) - 1];
  return label ? `${label} ${year}` : year;
}

function sortExperience(list: EmploymentHistoryResponse[]): EmploymentHistoryResponse[] {
  return [...list].sort((a, b) => {
    if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
    return (b.startDate ?? '').localeCompare(a.startDate ?? '');
  });
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * `\b` requires a word/non-word transition, which fails when a skill name
 * ends or starts with a non-word character (e.g. "C++", "C#") followed or
 * preceded by whitespace — two non-word characters never form a boundary.
 * Lookarounds that just check "not alphanumeric" work regardless of what
 * character the skill name itself starts/ends with.
 */
function wholeTermPattern(term: string): RegExp {
  return new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(term)}(?![A-Za-z0-9])`, 'i');
}

/**
 * Unique skills (by name), ordered by how recently they were used: each
 * skill is matched (whole-word, case-insensitive) against the role title and
 * description of every position, positions already sorted most-recent-first.
 * A skill's rank is the index of the most recent position mentioning it;
 * skills never mentioned in any position sink to the end, in their original
 * (server-returned) relative order.
 */
function rankSkillsByRecency(
  skills: SkillResponse[],
  positionsMostRecentFirst: EmploymentHistoryResponse[],
): SkillResponse[] {
  const seen = new Set<string>();
  const unique = skills.filter((s) => {
    const key = s.skillName.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const rank = new Map<string, number>();
  unique.forEach((s, i) => {
    const pattern = wholeTermPattern(s.skillName);
    const idx = positionsMostRecentFirst.findIndex(
      (p) => pattern.test(p.roleTitle) || (!!p.description && pattern.test(p.description)),
    );
    // Not found → rank after every position, preserving original relative order.
    rank.set(s.skillId, idx === -1 ? positionsMostRecentFirst.length + i : idx);
  });

  return [...unique].sort((a, b) => (rank.get(a.skillId) ?? 0) - (rank.get(b.skillId) ?? 0));
}

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
