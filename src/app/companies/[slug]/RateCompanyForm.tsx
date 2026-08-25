'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError, type EmploymentHistoryResponse, type SubmitCompanyRatingRequest } from '@/lib/api';
import { RatingMetricsForm, EMPTY_EXTRA_FIELDS, type RatingExtraFields } from '@/components/ratings/RatingMetricsForm';
import { defaultMetricValues, DEFAULT_WOULD_SCORE, type MetricKey, type MetricValue, type MetricValues } from '@/components/ratings/metrics';
import { SalaryForm } from './SalaryForm';

type State = 'loading' | 'noPosition' | 'ready' | 'submitting' | 'done' | 'error';

export function RateCompanyForm({ companyId, onRated }: { companyId: string; onRated?: () => void }) {
  const [state, setState] = useState<State>('loading');
  const [positions, setPositions] = useState<EmploymentHistoryResponse[]>([]);
  const [employmentHistoryId, setEmploymentHistoryId] = useState('');
  const [values, setValues] = useState<MetricValues>(() => defaultMetricValues('company'));
  const [wouldScore, setWouldScore] = useState(DEFAULT_WOULD_SCORE);
  const [extra, setExtra] = useState<RatingExtraFields>(EMPTY_EXTRA_FIELDS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await api.get<{ employmentHistory: EmploymentHistoryResponse[] }>('profile', '/profiles/me');
        if (cancelled) return;
        const atCompany = profile.employmentHistory.filter((e) => e.companyId === companyId);
        setPositions(atCompany);
        if (atCompany.length > 0) {
          setEmploymentHistoryId(atCompany[0].id);
          setState('ready');
        } else {
          setState('noPosition');
        }
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, [companyId]);

  function updateMetric(key: MetricKey, patch: Partial<MetricValue>) {
    setValues((v) => ({ ...v, [key]: { ...v[key], ...patch } }));
  }

  async function submit() {
    setState('submitting');
    setError(null);
    try {
      const req: SubmitCompanyRatingRequest = {
        companyId,
        employmentHistoryId,
        workLifeBalance: values.workLifeBalance,
        managementEmpathy: values.managementEmpathy,
        advancementOpportunity: values.advancementOpportunity,
        benefits: values.benefits,
        upperManagementEthos: values.upperManagementEthos,
        wouldRecommendScore: wouldScore,
        roleTitle: extra.roleTitle || undefined,
        employmentType: extra.employmentType || undefined,
        stillEmployed: extra.stillEmployed === '' ? undefined : extra.stillEmployed === 'true',
        yearsAtCompany: extra.yearsAtCompany ? Number(extra.yearsAtCompany) : undefined,
        overallReviewText: extra.overallReviewText || undefined,
      };
      await api.post('company', '/ratings/company', req);
      setState('done');
      onRated?.();
    } catch (e) {
      setState('ready');
      setError(e instanceof ApiError ? e.message : 'Could not submit your rating. Please try again.');
    }
  }

  if (state === 'loading') return <p style={muted}>Loading your positions at this company…</p>;

  if (state === 'noPosition') {
    return (
      <div style={notice}>
        You need a position at this company on your profile before you can rate it.{' '}
        <Link href="/dashboard" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          Add one from your dashboard →
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ── COMPANY RATING ── */}
      {state === 'done' ? (
        <p style={{ ...muted, color: 'var(--green)' }}>Thanks — your rating is submitted and pending review.</p>
      ) : (
        <>
          <label style={fieldLabel}>
            Which position is this rating for?
            <select
              value={employmentHistoryId}
              onChange={(e) => setEmploymentHistoryId(e.target.value)}
              style={select}
            >
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.roleTitle}</option>
              ))}
            </select>
          </label>

          <RatingMetricsForm
            scope="company"
            values={values}
            onChange={updateMetric}
            wouldScoreLabel="Would you recommend this company?"
            wouldScore={wouldScore}
            onWouldScoreChange={setWouldScore}
            extra={extra}
            onExtraChange={(patch) => setExtra((e) => ({ ...e, ...patch }))}
          />

          {error && <p style={{ ...muted, color: 'var(--red)' }}>{error}</p>}

          <button
            onClick={submit}
            disabled={state === 'submitting'}
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            {state === 'submitting' ? 'Submitting…' : 'Submit rating'}
          </button>
        </>
      )}

      {/* ── SALARY DATA — a separate, independently-submittable section ── */}
      <div style={salarySection}>
        <h3 style={sectionHeading}>Salary details</h3>
        <SalaryForm companyId={companyId} employmentHistoryId={employmentHistoryId} />
      </div>
    </div>
  );
}

const muted: React.CSSProperties = { fontSize: '.85rem', color: 'var(--muted)' };

const notice: React.CSSProperties = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '1rem',
  fontSize: '.85rem',
  color: 'var(--body)',
  lineHeight: 1.6,
};

const fieldLabel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '.3rem',
  fontSize: '.82rem',
  fontWeight: 600,
  color: 'var(--body)',
  marginBottom: '1rem',
};

const select: React.CSSProperties = {
  padding: '.5rem .6rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '.85rem',
  fontFamily: 'inherit',
  color: 'var(--ink)',
};

const salarySection: React.CSSProperties = {
  marginTop: '1.75rem',
  paddingTop: '1.25rem',
  borderTop: '1px solid var(--border)',
};

const sectionHeading: React.CSSProperties = {
  fontSize: '.95rem',
  fontWeight: 700,
  color: 'var(--ink)',
  marginBottom: '.75rem',
};
