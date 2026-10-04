'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, recordSearch, type CompanySearchResult } from '@/lib/api';
import { useMyRatingStatus } from '@/lib/useMyRatingStatus';
import { CompanyRatingsDrawer } from '@/components/ratings/CompanyRatingsDrawer';
import styles from './companies.module.css';

interface Page<T> { content: T[]; totalElements: number; }

const ANY_INDUSTRY = 'All';

export function CompaniesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signedIn, hasRatedCompany, myCompanyRatingEmploymentHistoryId, myCompanyOverallScore } = useMyRatingStatus();
  const [companies, setCompanies] = useState<CompanySearchResult[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [industry, setIndustry] = useState(ANY_INDUSTRY);
  // Initialized from ?q= so a browser Back navigation (or a link from search
  // history) lands on this exact URL and restores the same search results,
  // instead of the blank page with an empty search box.
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [ratingsFor, setRatingsFor] = useState<CompanySearchResult | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setIndustries(await api.get<string[]>('company', '/companies/industries'));
      } catch {
        // Industry filter just won't have options — search and the unfiltered grid still work.
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setUnavailable(false);
      try {
        const params = new URLSearchParams({ size: '20' });
        if (industry !== ANY_INDUSTRY) params.set('industry', industry);
        if (query.trim()) params.set('name', query.trim());

        const res = await api.get<Page<CompanySearchResult>>('company', `/companies?${params}`);
        if (!cancelled) setCompanies(res.content ?? []);
      } catch {
        if (!cancelled) setUnavailable(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [industry, query]);

  // Only an explicit Enter press counts as "a search" — syncs the URL (for
  // the Back-button fix) and logs to search history. Typing itself still
  // live-filters the grid via the effect above, but isn't recorded.
  function submitSearch() {
    const trimmed = query.trim();
    if (trimmed) {
      router.replace(`/companies?q=${encodeURIComponent(trimmed)}`);
      if (signedIn) recordSearch('COMPANY', trimmed);
    } else {
      router.replace('/companies');
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 className={styles.title}>Company ratings</h1>
              <p className={styles.sub}>
                Culture, management, compensation, growth, and diversity — scored by
                people who actually worked there. Scores appear once a company has
                five or more approved reviews.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.5rem', flexShrink: 0 }}>
              <Link href="/companies/new" className="btn btn-outline">
                Add your company
              </Link>
              {signedIn && (
                <Link href="/search-history" style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--primary)', textDecoration: 'underline' }}>
                  Your search history
                </Link>
              )}
            </div>
          </div>

          <div className={styles.controls}>
            <input
              type="search"
              placeholder="Search companies"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitSearch(); }}
              className={styles.search}
              aria-label="Search companies"
            />
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className={styles.industrySelect}
              aria-label="Filter by industry"
            >
              <option value={ANY_INDUSTRY}>All industries</option>
              {industries.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: '2.5rem 2rem 4rem' }}>
        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : unavailable ? (
          <div className={styles.notice}>
            <strong>Company service not reachable.</strong> Start company-service
            on port 8082 and reload this page.
          </div>
        ) : companies.length === 0 ? (
          <div className={styles.notice}>
            No companies match those filters yet. Try a broader search.
          </div>
        ) : (
          <div className={styles.grid}>
            {companies.map((c) => (
              <Link key={c.id} href={`/companies/${c.slug}`} className={styles.coCard}>
                <div className={styles.coHead}>
                  <div className={styles.coLogo}>{c.name[0]}</div>
                  <div>
                    <div className={styles.coName}>
                      {c.name}
                      {c.verified && <span className={styles.verified} title="Verified employer">✓</span>}
                    </div>
                    <div className={styles.coMeta}>
                      {c.industry}{c.headquarters ? ` · ${c.headquarters}` : ''}
                    </div>
                  </div>
                </div>

                <span className={c.avgOverallScore != null ? styles.statusBadgePublic : styles.statusBadgePending}>
                  {c.avgOverallScore != null ? 'Public' : 'Not yet public(not enough reviews)'}
                </span>

                {c.avgOverallScore != null ? (
                  <>
                    <div className={styles.scoreRow}>
                      <span className={styles.scoreBig}>{c.avgOverallScore.toFixed(1)}</span>
                      <span className={styles.scoreOutOf}>/ 10</span>
                    </div>
                    <div className={styles.coFooter}>
                      <span>{c.reviewCount} reviews</span>
                      {c.avgWouldRecommendScore != null && (
                        <span className={styles.recommend}>
                          {c.avgWouldRecommendScore.toFixed(1)}/10 would recommend
                        </span>
                      )}
                    </div>
                  </>
                ) : hasRatedCompany(c.id) && myCompanyOverallScore(c.id) != null ? (
                  <div className={styles.scoreRow}>
                    <span className={styles.scoreBig}>{myCompanyOverallScore(c.id)!.toFixed(1)}</span>
                    <span className={styles.scoreOutOf}>/ 10 · your rating</span>
                  </div>
                ) : (
                  <div className={styles.pending}>
                    Scores appear at 5 reviews · {c.reviewCount} so far
                  </div>
                )}

                {(c.avgOverallScore != null || hasRatedCompany(c.id)) && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setRatingsFor(c); }}
                    className={styles.seeRatings}
                  >
                    See Ratings
                  </button>
                )}

                {signedIn && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`/companies/${c.slug}?rate=1`); }}
                    className={styles.rateLink}
                  >
                    {hasRatedCompany(c.id) ? 'Modify rating' : 'Rate this company'}
                  </button>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {ratingsFor && (
        <CompanyRatingsDrawer
          companyId={ratingsFor.id}
          companyName={ratingsFor.name}
          myEmploymentHistoryId={myCompanyRatingEmploymentHistoryId(ratingsFor.id)}
          onClose={() => setRatingsFor(null)}
        />
      )}
    </main>
  );
}
