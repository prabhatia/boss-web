'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import styles from './companies.module.css';

interface CompanySearchResult {
  id: string;
  name: string;
  slug: string;
  industry: string;
  headquarters: string | null;
  logoUrl: string | null;
  verified: boolean;
  avgOverallScore: number | null;
  recommendPct: number | null;
  reviewCount: number;
}

interface Page<T> { content: T[]; totalElements: number; }

const INDUSTRIES = ['All', 'Technology', 'Finance', 'Healthcare', 'Retail', 'Consulting'];

export function CompaniesClient() {
  const [companies, setCompanies] = useState<CompanySearchResult[]>([]);
  const [industry, setIndustry] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setUnavailable(false);
      try {
        const params = new URLSearchParams({ size: '20' });
        if (industry !== 'All') params.set('industry', industry);
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

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>Company ratings</h1>
          <p className={styles.sub}>
            Culture, management, compensation, growth, and diversity — scored by
            people who actually worked there. Scores appear once a company has
            five or more approved reviews.
          </p>

          <div className={styles.controls}>
            <input
              type="search"
              placeholder="Search companies"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.search}
              aria-label="Search companies"
            />
            <div className={styles.chips}>
              {INDUSTRIES.map((i) => (
                <button
                  key={i}
                  onClick={() => setIndustry(i)}
                  className={`${styles.chip}${industry === i ? ` ${styles.chipActive}` : ''}`}
                >
                  {i}
                </button>
              ))}
            </div>
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
              <article key={c.id} className={styles.coCard}>
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

                {c.avgOverallScore != null ? (
                  <>
                    <div className={styles.scoreRow}>
                      <span className={styles.scoreBig}>{c.avgOverallScore.toFixed(1)}</span>
                      <span className={styles.scoreOutOf}>/ 5</span>
                      <span className={styles.stars} aria-hidden="true">
                        {'★'.repeat(Math.round(c.avgOverallScore))}
                        {'☆'.repeat(5 - Math.round(c.avgOverallScore))}
                      </span>
                    </div>
                    <div className={styles.coFooter}>
                      <span>{c.reviewCount} reviews</span>
                      {c.recommendPct != null && (
                        <span className={styles.recommend}>
                          {Math.round(c.recommendPct)}% recommend
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className={styles.pending}>
                    Scores appear at 5 reviews · {c.reviewCount} so far
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
