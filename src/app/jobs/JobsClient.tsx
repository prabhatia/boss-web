'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import styles from './jobs.module.css';

interface JobSummary {
  id: string;
  companyId: string;
  title: string;
  slug: string;
  roleLevel: string | null;
  roleCategory: string | null;
  location: string | null;
  isRemote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  isFeatured: boolean;
  applicationCount: number;
  createdAt: string;
}

interface Page<T> { content: T[]; totalElements: number; }

const CATEGORIES = ['All', 'Engineering', 'Product', 'Design', 'Sales', 'Marketing'];

export function JobsClient({ signedIn }: { signedIn: boolean }) {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [category, setCategory] = useState('All');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setUnavailable(false);
      try {
        const params = new URLSearchParams({ size: '20' });
        if (category !== 'All') params.set('roleCategory', category);
        if (remoteOnly) params.set('isRemote', 'true');

        const res = await api.get<Page<JobSummary>>('jobs', `/jobs?${params}`);
        if (!cancelled) setJobs(res.content ?? []);
      } catch {
        if (!cancelled) setUnavailable(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [category, remoteOnly]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>Jobs that match your values</h1>
          <p className={styles.sub}>
            Every listing is scored against the culture and management style you
            rate highly. Sign in to see your personal match percentages.
          </p>

          <div className={styles.controls}>
            <div className={styles.chips}>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`${styles.chip}${category === c ? ` ${styles.chipActive}` : ''}`}
                >
                  {c}
                </button>
              ))}
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
              />
              Remote only
            </label>
          </div>
        </div>
      </header>

      <div className="container" style={{ padding: '2.5rem 2rem 4rem' }}>
        {!signedIn && (
          <div className={styles.upsell}>
            <div>
              <strong>Salary ranges and match scores are hidden.</strong>
              <p>Sign in free to see how each role scores against your workplace values.</p>
            </div>
            <Link href="/login?next=/jobs" className="btn btn-primary">Sign in free</Link>
          </div>
        )}

        {loading ? (
          <div className={styles.list}>
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : unavailable ? (
          <div className={styles.notice}>
            <strong>Jobs service not reachable.</strong> Start jobs-service on
            port 8083 and reload this page.
          </div>
        ) : jobs.length === 0 ? (
          <div className={styles.notice}>
            No open roles match those filters right now.
          </div>
        ) : (
          <div className={styles.list}>
            {jobs.map((j) => (
              <article key={j.id} className={`${styles.jobCard}${j.isFeatured ? ` ${styles.featured}` : ''}`}>
                <div className={styles.jobLogo}>{j.title[0]}</div>

                <div className={styles.jobBody}>
                  <div className={styles.jobTitleRow}>
                    <h2 className={styles.jobTitle}>{j.title}</h2>
                    {j.isFeatured && <span className={styles.featuredTag}>Featured</span>}
                  </div>
                  <div className={styles.jobMeta}>
                    {j.roleLevel && <span>{j.roleLevel}</span>}
                    {j.roleCategory && <span>· {j.roleCategory}</span>}
                    {j.location && <span>· {j.location}</span>}
                    {j.isRemote && <span className={styles.remote}>· Remote</span>}
                  </div>
                  <div className={styles.jobTags}>
                    {j.salaryMin && j.salaryMax ? (
                      <span className={styles.salaryTag}>
                        {j.salaryCurrency === 'USD' ? '$' : ''}
                        {(j.salaryMin / 1000).toFixed(0)}k–
                        {(j.salaryMax / 1000).toFixed(0)}k
                      </span>
                    ) : (
                      <span className={styles.mutedTag}>Salary on Premium</span>
                    )}
                    <span className={styles.mutedTag}>{j.applicationCount} applied</span>
                  </div>
                </div>

                <button className="btn btn-outline" style={{ flexShrink: 0 }}>
                  View role
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
