'use client';

import { useEffect, useState } from 'react';
import { api, ApiError, type ManagerRatingsPanel, type ManagerReviewResponse } from '@/lib/api';

const CATEGORY_LABELS: { key: 'avgWorkLifeBalanceScore' | 'avgManagementEmpathyScore' | 'avgAdvancementOpportunityScore' | 'avgWouldWorkAgainScore'; label: string }[] = [
  { key: 'avgWorkLifeBalanceScore', label: 'Work-life balance' },
  { key: 'avgManagementEmpathyScore', label: 'Management empathy' },
  { key: 'avgAdvancementOpportunityScore', label: 'Advancement opportunity' },
  { key: 'avgWouldWorkAgainScore', label: 'Would work again' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

export function ManagerRatingsDrawer({
  managerId,
  managerName,
  myEmploymentHistoryId,
  onClose,
  onRateAgain,
}: {
  managerId: string;
  managerName: string;
  /** This viewer's own employment period under this manager, if any — lets us show their rating regardless of public status. */
  myEmploymentHistoryId?: string;
  onClose: () => void;
  /** When provided, shows a "Rate this manager again" action next to the viewer's own rating. */
  onRateAgain?: () => void;
}) {
  const [panel, setPanel] = useState<ManagerRatingsPanel | null>(null);
  const [myReview, setMyReview] = useState<ManagerReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const [res, mine] = await Promise.all([
          api.get<ManagerRatingsPanel>('company', `/ratings/manager/${managerId}/panel`),
          myEmploymentHistoryId
            ? api.get<ManagerReviewResponse>('company', `/ratings/manager/mine?employmentHistoryId=${myEmploymentHistoryId}`)
                .catch((e) => { if (e instanceof ApiError && e.status === 404) return null; throw e; })
            : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setPanel(res);
        setMyReview(mine);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [managerId, myEmploymentHistoryId]);

  const isPublic = panel != null && panel.avgOverallScore != null;
  const othersReviews = panel ? panel.ratings.filter((r) => r.id !== myReview?.id) : [];

  return (
    <>
      <div style={backdrop} onClick={onClose} />
      <aside style={drawer} role="dialog" aria-label={`${managerName} ratings`}>
        <div style={header}>
          <h2 style={title}>{managerName}</h2>
          <button onClick={onClose} style={closeBtn} aria-label="Close">✕</button>
        </div>

        <div style={scrollBody}>
          {loading ? (
            <p style={muted}>Loading ratings…</p>
          ) : error ? (
            <p style={{ fontSize: '.85rem', color: 'var(--red)' }}>Could not load ratings. Please try again.</p>
          ) : (
            <>
              <span style={isPublic ? statusBadgePublic : statusBadgePending}>
                {isPublic ? 'Public' : 'Not yet public(not enough reviews)'}
              </span>

              {isPublic && panel && (
                <>
                  <div style={overallRow}>
                    <span style={overallScore}>{panel.avgOverallScore!.toFixed(1)}</span>
                    <div>
                      <div style={overallOutOf}>/ 10 overall</div>
                      <div style={muted}>{panel.reviewCount} reviews</div>
                    </div>
                  </div>

                  <div style={statGrid}>
                    {CATEGORY_LABELS.map(({ key, label }) => {
                      const value = panel[key];
                      return (
                        <div key={key} style={statCell}>
                          <div style={statLabel}>{label}</div>
                          <div style={statValue}>{value != null ? value.toFixed(1) : '—'}</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {!isPublic && !myReview && panel && (
                <p style={muted}>
                  Ratings appear here once this manager has 3 or more approved reviews
                  {` · ${panel.reviewCount} so far`}.
                </p>
              )}

              {myReview && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.6rem' }}>
                    <p style={{ ...sectionLabel, marginBottom: 0 }}>Your rating for this person</p>
                    {onRateAgain && (
                      <button onClick={onRateAgain} style={rateAgainLink}>Rate this manager again</button>
                    )}
                  </div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <ReviewCard review={myReview} />
                  </div>
                </>
              )}

              {isPublic && panel && (
                <>
                  <p style={sectionLabel}>{myReview ? 'Other reviews' : 'Latest reviews'}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                    {othersReviews.map((r) => <ReviewCard key={r.id} review={r} />)}

                    {Array.from({ length: Math.min(panel.lockedCount, 2) }).map((_, i) => (
                      <LockedReviewCard key={i} />
                    ))}
                  </div>

                  {panel.lockedCount > 0 && (
                    <p style={{ ...muted, marginTop: '.75rem', textAlign: 'center' }}>
                      {panel.lockedCount} more review{panel.lockedCount === 1 ? '' : 's'} — unlock for 20 tokens or by card (coming soon)
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}

const REVIEW_METRICS: { key: 'workLifeBalance' | 'managementEmpathy' | 'advancementOpportunity'; label: string }[] = [
  { key: 'workLifeBalance', label: 'Work-life balance' },
  { key: 'managementEmpathy', label: 'Management empathy' },
  { key: 'advancementOpportunity', label: 'Advancement opportunity' },
];

function ReviewCard({ review }: { review: ManagerReviewResponse }) {
  return (
    <div style={reviewCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', marginBottom: '.6rem' }}>
        <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--ink)' }}>
          {review.roleTitle ?? 'Anonymous report'}
        </span>
        <span style={{ fontSize: '.72rem', color: 'var(--muted)' }}>{formatDate(review.createdAt)}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '.6rem' }}>
        {REVIEW_METRICS.map(({ key, label }) => {
          const metric = review[key];
          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem' }}>
                <span style={{ color: 'var(--muted)' }}>{label}</span>
                <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{metric.score.toFixed(1)}/10</span>
              </div>
              {metric.comment && (
                <p style={{ fontSize: '.78rem', color: 'var(--body)', lineHeight: 1.4, marginTop: '.15rem' }}>
                  {metric.comment}
                </p>
              )}
            </div>
          );
        })}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem', paddingTop: '.4rem', borderTop: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--muted)' }}>Would work again</span>
          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{review.wouldWorkAgainScore.toFixed(1)}/10</span>
        </div>
      </div>

      {review.overallReviewText && (
        <p style={{ fontSize: '.82rem', color: 'var(--body)', lineHeight: 1.5 }}>
          {review.overallReviewText}
        </p>
      )}
    </div>
  );
}

function LockedReviewCard() {
  return (
    <div style={{ ...reviewCard, position: 'relative', overflow: 'hidden' }}>
      <div style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }} aria-hidden="true">
        <div style={{ height: 12, width: '40%', background: 'var(--border)', borderRadius: 4, marginBottom: '.5rem' }} />
        <div style={{ height: 10, width: '90%', background: 'var(--border)', borderRadius: 4, marginBottom: '.35rem' }} />
        <div style={{ height: 10, width: '70%', background: 'var(--border)', borderRadius: 4 }} />
      </div>
      <div style={lockOverlay}>🔒</div>
    </div>
  );
}

const backdrop: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, .4)', zIndex: 60,
};

const drawer: React.CSSProperties = {
  position: 'fixed', top: 0, right: 0, height: '100vh', width: '70vw', minWidth: 320, maxWidth: '100vw',
  background: 'white', zIndex: 61, display: 'flex', flexDirection: 'column',
  boxShadow: '-8px 0 24px rgba(15, 23, 42, .18)',
};

const header: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0,
};

const title: React.CSSProperties = { fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)' };

const closeBtn: React.CSSProperties = {
  border: 'none', background: 'none', fontSize: '1rem', cursor: 'pointer',
  color: 'var(--muted)', padding: '.25rem .5rem',
};

const scrollBody: React.CSSProperties = {
  flex: 1, overflowY: 'auto', padding: '1.25rem',
};

const muted: React.CSSProperties = { fontSize: '.85rem', color: 'var(--muted)' };

const statusBadge: React.CSSProperties = {
  display: 'inline-block', fontSize: '.7rem', fontWeight: 700,
  padding: '.2rem .6rem', borderRadius: 999, marginBottom: '1rem',
};

const statusBadgePublic: React.CSSProperties = {
  ...statusBadge, background: '#ECFDF5', color: 'var(--green)',
};

const statusBadgePending: React.CSSProperties = {
  ...statusBadge, background: 'var(--bg)', color: 'var(--muted)',
};

const overallRow: React.CSSProperties = {
  display: 'flex', alignItems: 'baseline', gap: '.6rem', marginBottom: '1rem',
};

const overallScore: React.CSSProperties = { fontSize: '2.4rem', fontWeight: 900, color: 'var(--ink)', lineHeight: 1 };
const overallOutOf: React.CSSProperties = { fontSize: '.8rem', color: 'var(--muted)' };

const statGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem',
  marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)',
};

const statCell: React.CSSProperties = {
  background: 'var(--bg)', borderRadius: 8, padding: '.6rem .7rem',
};

const statLabel: React.CSSProperties = { fontSize: '.68rem', color: 'var(--muted)', marginBottom: '.15rem' };
const statValue: React.CSSProperties = { fontSize: '1.05rem', fontWeight: 800, color: 'var(--ink)' };

const sectionLabel: React.CSSProperties = {
  fontSize: '.78rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '.6rem',
};

const rateAgainLink: React.CSSProperties = {
  border: 'none', background: 'none', padding: 0, fontFamily: 'inherit',
  fontSize: '.75rem', fontWeight: 700, color: 'var(--primary)',
  textDecoration: 'underline', cursor: 'pointer',
};

const reviewCard: React.CSSProperties = {
  border: '1px solid var(--border)', borderRadius: 10, padding: '.75rem .85rem',
};

const lockOverlay: React.CSSProperties = {
  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1.1rem',
};
