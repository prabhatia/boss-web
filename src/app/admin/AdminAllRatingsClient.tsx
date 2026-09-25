'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, ApiError, type AdminManagerRatingItem, type AdminUserLookupResponse } from '@/lib/api';

function groupByLetter<T>(items: T[], letterOf: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const letter = letterOf(item);
    const bucket = map.get(letter);
    if (bucket) bucket.push(item);
    else map.set(letter, [item]);
  }
  return new Map(Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

function statusColor(status: string): string {
  switch (status) {
    case 'APPROVED': return 'var(--green)';
    case 'REJECTED': return 'var(--red)';
    case 'FLAGGED': return '#B45309';
    default: return 'var(--muted)';
  }
}

export function AdminAllRatingsClient({ onClose }: { onClose: () => void }) {
  const [ratings, setRatings] = useState<AdminManagerRatingItem[]>([]);
  const [reviewers, setReviewers] = useState<Record<string, AdminUserLookupResponse>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [industries, setIndustries] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  const [expandedLetter, setExpandedLetter] = useState<string | null>(null);
  const [expandedManagerId, setExpandedManagerId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await api.get<AdminManagerRatingItem[]>('company', '/admin/moderation/manager-ratings');
        if (cancelled) return;
        setRatings(list);

        const reviewerIds = Array.from(new Set(list.map((r) => r.moderatedBy).filter((id): id is string => !!id)));
        if (reviewerIds.length > 0) {
          const resolved = await api.post<Record<string, AdminUserLookupResponse>>(
            'profile', '/admin/users/resolve', { userIds: reviewerIds }
          );
          if (!cancelled) setReviewers(resolved);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Could not load ratings.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setIndustries(await api.get<string[]>('company', '/companies/industries'));
      } catch {
        // Industry filter just won't have options.
      }
    })();
  }, []);

  const companyOptions = useMemo(
    () => Array.from(new Set(ratings.map((r) => r.companyName))).sort((a, b) => a.localeCompare(b)),
    [ratings]
  );

  const filtered = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    return ratings.filter((r) =>
      (!term || r.managerDisplayLabel.toLowerCase().includes(term)) &&
      (!companyFilter || r.companyName === companyFilter) &&
      (!industryFilter || r.companyIndustry === industryFilter)
    );
  }, [ratings, searchInput, companyFilter, industryFilter]);

  const byLetter = groupByLetter(filtered, (r) => r.letter);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)' }}>All manager ratings</h2>
        <button onClick={onClose} style={backLink}>← Back to moderation queue</button>
      </div>

      <div style={filtersRow}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by manager name…"
          style={{ ...selectStyle, flex: 1 }}
          aria-label="Search managers"
        />
        <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} style={selectStyle} aria-label="Filter by company">
          <option value="">All companies</option>
          {companyOptions.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} style={selectStyle} aria-label="Filter by industry">
          <option value="">Any industry</option>
          {industries.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={muted}>Loading ratings…</p>
      ) : error ? (
        <p style={{ fontSize: '.85rem', color: 'var(--red)' }}>{error}</p>
      ) : byLetter.size === 0 ? (
        <p style={muted}>No manager ratings match those filters.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
          {Array.from(byLetter.entries()).map(([letter, letterRatings]) => {
            const managers = groupByLetter(letterRatings, (r) => r.managerId);
            return (
              <div key={letter}>
                <button
                  onClick={() => setExpandedLetter(expandedLetter === letter ? null : letter)}
                  style={expandedLetter === letter ? { ...letterRow, ...letterRowActive } : letterRow}
                >
                  {letter} <span style={{ fontWeight: 400, opacity: 0.7 }}>({managers.size})</span>
                </button>

                {expandedLetter === letter && (
                  <div style={nestedList}>
                    {Array.from(managers.entries()).map(([managerId, managerRatings]) => {
                      const first = managerRatings[0];
                      return (
                        <div key={managerId}>
                          <button
                            onClick={() => setExpandedManagerId(expandedManagerId === managerId ? null : managerId)}
                            style={expandedManagerId === managerId ? { ...managerRow, ...managerRowActive } : managerRow}
                          >
                            <strong>{first.managerDisplayLabel}</strong>
                            <span style={{ color: 'var(--muted)', fontSize: '.78rem', marginLeft: '.4rem' }}>
                              {first.companyName} · {managerRatings.length} rating{managerRatings.length === 1 ? '' : 's'}
                            </span>
                          </button>

                          {expandedManagerId === managerId && (
                            <div style={nestedList}>
                              {managerRatings.map((r) => {
                                const reviewer = r.moderatedBy ? reviewers[r.moderatedBy] : null;
                                return (
                                  <div key={r.id} style={ratingCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem', marginBottom: '.4rem' }}>
                                      <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--ink)' }}>
                                        {r.roleTitle ?? 'Role not specified'}
                                      </span>
                                      <span style={{ fontSize: '.72rem', fontWeight: 700, color: statusColor(r.moderationStatus) }}>
                                        {r.moderationStatus}
                                      </span>
                                    </div>

                                    <div style={{ fontSize: '.78rem', color: 'var(--body)', marginBottom: '.4rem' }}>
                                      Work-life {r.workLifeBalanceScore.toFixed(1)} · Empathy {r.managementEmpathyScore.toFixed(1)} ·
                                      {' '}Advancement {r.advancementOpportunityScore.toFixed(1)} · Would work again {r.wouldWorkAgainScore.toFixed(1)}
                                    </div>

                                    {r.overallReviewText && (
                                      <p style={{ fontSize: '.82rem', color: 'var(--body)', lineHeight: 1.5, marginBottom: '.4rem' }}>
                                        {r.overallReviewText}
                                      </p>
                                    )}

                                    <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>
                                      Submitted {new Date(r.createdAt).toLocaleDateString()}
                                      {' · '}
                                      {r.moderatedBy ? (
                                        <>
                                          Reviewed by {reviewer?.displayName ?? reviewer?.email ?? 'unknown admin'}
                                          {' '}(ID: {r.moderatedBy})
                                          {r.moderatedAt && ` on ${new Date(r.moderatedAt).toLocaleDateString()}`}
                                        </>
                                      ) : (
                                        'Pending review'
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const muted: React.CSSProperties = { fontSize: '.85rem', color: 'var(--muted)' };

const backLink: React.CSSProperties = {
  border: 'none', background: 'none', padding: 0,
  fontSize: '.82rem', fontWeight: 600, color: 'var(--primary)',
  textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit',
};

const filtersRow: React.CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '1.25rem',
};

const selectStyle: React.CSSProperties = {
  padding: '.5rem .6rem', border: '1px solid var(--border)', borderRadius: 8,
  fontSize: '.85rem', fontFamily: 'inherit', color: 'var(--ink)', background: 'white',
};

const letterRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', width: 'fit-content', minWidth: 48, height: 34,
  padding: '0 .7rem', justifyContent: 'center', gap: '.3rem',
  border: '1px solid var(--border)', borderRadius: 6, background: 'white',
  fontSize: '.8rem', fontWeight: 700, color: 'var(--body)', cursor: 'pointer', fontFamily: 'inherit',
};

const letterRowActive: React.CSSProperties = { background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' };

const nestedList: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '.3rem',
  marginTop: '.35rem', marginBottom: '.35rem', paddingLeft: '.85rem',
  borderLeft: '2px solid var(--border)',
};

const managerRow: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left',
  padding: '.5rem .7rem', border: '1px solid var(--border)', borderRadius: 8,
  background: 'white', fontSize: '.85rem', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--ink)',
};

const managerRowActive: React.CSSProperties = { borderColor: 'var(--primary)' };

const ratingCard: React.CSSProperties = {
  border: '1px solid var(--border)', borderRadius: 8, padding: '.7rem .8rem', background: 'var(--bg)',
};
