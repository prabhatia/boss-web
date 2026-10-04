'use client';

import { useEffect, useState } from 'react';
import { api, ApiError, type ManagerReviewResponse, type SubmitManagerRatingRequest } from '@/lib/api';
import { RatingMetricsForm, EMPTY_EXTRA_FIELDS, type RatingExtraFields } from '@/components/ratings/RatingMetricsForm';
import { defaultMetricValues, DEFAULT_WOULD_SCORE, type MetricKey, type MetricValue, type MetricValues } from '@/components/ratings/metrics';

type State = 'ready' | 'submitting' | 'done';

function valuesFromExisting(rating: ManagerReviewResponse): MetricValues {
  return {
    workLifeBalance: { score: rating.workLifeBalance.score, comment: rating.workLifeBalance.comment ?? '' },
    managementEmpathy: { score: rating.managementEmpathy.score, comment: rating.managementEmpathy.comment ?? '' },
    advancementOpportunity: { score: rating.advancementOpportunity.score, comment: rating.advancementOpportunity.comment ?? '' },
  } as MetricValues;
}

export function RateManagerForm({
  companyId,
  managerId,
  employmentHistoryId,
  initialRoleTitle,
  onRated,
}: {
  companyId: string;
  managerId: string;
  employmentHistoryId: string;
  /** Pre-fills the Role Name field from the position picked earlier in the flow. */
  initialRoleTitle?: string;
  onRated?: () => void;
}) {
  const [state, setState] = useState<State>('ready');
  const [values, setValues] = useState<MetricValues>(() => defaultMetricValues('manager'));
  const [wouldScore, setWouldScore] = useState(DEFAULT_WOULD_SCORE);
  const [extra, setExtra] = useState<RatingExtraFields>(() => ({
    ...EMPTY_EXTRA_FIELDS,
    roleTitle: initialRoleTitle ?? '',
  }));
  const [error, setError] = useState<string | null>(null);

  // Pre-fills the form with the caller's own previous rating of this manager
  // for this position, if one exists — covers "rate this manager again".
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing = await api.get<ManagerReviewResponse>(
          'company', `/ratings/manager/mine?employmentHistoryId=${employmentHistoryId}`
        );
        if (cancelled) return;
        setValues(valuesFromExisting(existing));
        setWouldScore(existing.wouldWorkAgainScore);
        setExtra({
          roleTitle: existing.roleTitle ?? initialRoleTitle ?? '',
          employmentType: existing.employmentType ?? '',
          stillEmployed: existing.stillEmployed == null ? '' : existing.stillEmployed ? 'true' : 'false',
          yearsAtCompany: existing.yearsAtCompany != null ? String(existing.yearsAtCompany) : '',
          overallReviewText: existing.overallReviewText ?? '',
        });
      } catch {
        // No prior rating for this position (404) — keep the blank defaults.
      }
    })();
    return () => { cancelled = true; };
  }, [employmentHistoryId, initialRoleTitle]);

  function updateMetric(key: MetricKey, patch: Partial<MetricValue>) {
    setValues((v) => ({ ...v, [key]: { ...v[key], ...patch } }));
  }

  async function submit() {
    setState('submitting');
    setError(null);
    try {
      const req: SubmitManagerRatingRequest = {
        companyId,
        managerId,
        employmentHistoryId,
        workLifeBalance: values.workLifeBalance,
        managementEmpathy: values.managementEmpathy,
        advancementOpportunity: values.advancementOpportunity,
        wouldWorkAgainScore: wouldScore,
        roleTitle: extra.roleTitle || undefined,
        employmentType: extra.employmentType || undefined,
        stillEmployed: extra.stillEmployed === '' ? undefined : extra.stillEmployed === 'true',
        yearsAtCompany: extra.yearsAtCompany ? Number(extra.yearsAtCompany) : undefined,
        overallReviewText: extra.overallReviewText || undefined,
      };
      await api.post('company', '/ratings/manager', req);
      setState('done');
      onRated?.();
    } catch (e) {
      setState('ready');
      setError(e instanceof ApiError ? e.message : 'Could not submit your rating. Please try again.');
    }
  }

  if (state === 'done') {
    return <p style={{ fontSize: '.85rem', color: 'var(--green)' }}>Thanks — your rating is submitted and pending review.</p>;
  }

  return (
    <div>
      <RatingMetricsForm
        scope="manager"
        values={values}
        onChange={updateMetric}
        showNumericInput
        wouldScoreLabel="Would you work with this manager again?"
        wouldScore={wouldScore}
        onWouldScoreChange={setWouldScore}
        extra={extra}
        onExtraChange={(patch) => setExtra((e) => ({ ...e, ...patch }))}
      />

      {error && <p style={{ fontSize: '.85rem', color: 'var(--red)' }}>{error}</p>}

      <button
        onClick={submit}
        disabled={state === 'submitting'}
        className="btn btn-primary"
        style={{ marginTop: '1rem' }}
      >
        {state === 'submitting' ? 'Submitting…' : 'Submit rating'}
      </button>
    </div>
  );
}
