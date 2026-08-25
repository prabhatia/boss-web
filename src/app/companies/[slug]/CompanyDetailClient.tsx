'use client';

import { useEffect, useState } from 'react';
import { api, ApiError, type CompanyProfileResponse } from '@/lib/api';
import { RateCompanyForm } from './RateCompanyForm';
import { ManagerRatingFlow } from './ManagerRatingFlow';
import styles from './companyDetail.module.css';

export function CompanyDetailClient({ slug }: { slug: string }) {
  const [company, setCompany] = useState<CompanyProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [showRateForm, setShowRateForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const c = await api.get<CompanyProfileResponse>('company', `/companies/${slug}`);
        if (!cancelled) setCompany(c);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
        else setUnavailable(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return <main className={styles.page}><div className="container" style={{ padding: '3rem 2rem' }}>Loading…</div></main>;
  }

  if (notFound) {
    return <main className={styles.page}><div className="container" style={{ padding: '3rem 2rem' }}>Company not found.</div></main>;
  }

  if (unavailable || !company) {
    return (
      <main className={styles.page}>
        <div className="container" style={{ padding: '3rem 2rem' }}>
          <div className={styles.notice}>
            <strong>Company service not reachable.</strong> Start company-service on port 8082 and reload this page.
          </div>
        </div>
      </main>
    );
  }

  const showScores = company.avgOverallScore != null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <div className={styles.headRow}>
            <div className={styles.coLogo}>{company.name[0]}</div>
            <div>
              <h1 className={styles.title}>
                {company.name}
                {company.verified && <span className={styles.verified} title="Verified employer">✓</span>}
              </h1>
              <div className={styles.meta}>
                {company.industry}{company.headquarters ? ` · ${company.headquarters}` : ''}
              </div>
            </div>
          </div>

          {showScores ? (
            <div className={styles.scoreRow}>
              <div className={styles.scoreBig}>{company.avgOverallScore!.toFixed(1)}<span className={styles.scoreOutOf}>/10</span></div>
              <div className={styles.scoreMeta}>
                {company.reviewCount} reviews
                {company.avgWouldRecommendScore != null && (
                  <span> · {company.avgWouldRecommendScore.toFixed(1)}/10 would recommend</span>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.pending}>Scores appear at 5 reviews · {company.reviewCount} so far</div>
          )}
        </div>
      </header>

      <div className="container" style={{ padding: '2rem', maxWidth: 720 }}>
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Rate this company</h2>
          </div>
          {!showRateForm ? (
            <button className="btn btn-primary" onClick={() => setShowRateForm(true)}>
              Rate This Company
            </button>
          ) : (
            <RateCompanyForm companyId={company.id} />
          )}
        </section>

        <section className={styles.card} style={{ marginTop: '1.25rem' }}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Rate a manager</h2>
          </div>
          <ManagerRatingFlow companyId={company.id} />
        </section>
      </div>
    </main>
  );
}
