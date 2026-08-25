'use client';

import { MetricSlider } from './MetricSlider';
import { metricsFor, type MetricKey, type MetricValue, type MetricValues } from './metrics';

export interface RatingExtraFields {
  roleTitle: string;
  employmentType: string;
  stillEmployed: '' | 'true' | 'false';
  yearsAtCompany: string;
  overallReviewText: string;
}

export const EMPTY_EXTRA_FIELDS: RatingExtraFields = {
  roleTitle: '',
  employmentType: '',
  stillEmployed: '',
  yearsAtCompany: '',
  overallReviewText: '',
};

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP'];

interface RatingMetricsFormProps {
  scope: 'company' | 'manager';
  values: MetricValues;
  onChange: (key: MetricKey, patch: Partial<MetricValue>) => void;
  showNumericInput?: boolean;
  wouldScoreLabel: string;
  wouldScore: number;
  onWouldScoreChange: (score: number) => void;
  extra: RatingExtraFields;
  onExtraChange: (patch: Partial<RatingExtraFields>) => void;
}

/** Shared 1-10 metric-slider block, reused unchanged for the company-rating and manager-rating steps. */
export function RatingMetricsForm({
  scope,
  values,
  onChange,
  showNumericInput = false,
  wouldScoreLabel,
  wouldScore,
  onWouldScoreChange,
  extra,
  onExtraChange,
}: RatingMetricsFormProps) {
  return (
    <div>
      {metricsFor(scope).map((m) => (
        <MetricSlider
          key={m.key}
          label={m.label}
          score={values[m.key].score}
          onScoreChange={(score) => onChange(m.key, { score })}
          showNumericInput={showNumericInput}
          comment={values[m.key].comment}
          onCommentChange={(comment) => onChange(m.key, { comment })}
        />
      ))}

      <MetricSlider
        label={wouldScoreLabel}
        score={wouldScore}
        onScoreChange={onWouldScoreChange}
        showNumericInput={showNumericInput}
      />

      <div style={extraGrid}>
        <label style={fieldLabel}>
          Role title
          <input
            type="text"
            value={extra.roleTitle}
            onChange={(e) => onExtraChange({ roleTitle: e.target.value })}
            placeholder="e.g. Senior Engineer"
            style={textInput}
          />
        </label>
        <label style={fieldLabel}>
          Employment type
          <select
            value={extra.employmentType}
            onChange={(e) => onExtraChange({ employmentType: e.target.value })}
            style={textInput}
          >
            <option value="">—</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </label>
        <label style={fieldLabel}>
          Still employed there?
          <select
            value={extra.stillEmployed}
            onChange={(e) => onExtraChange({ stillEmployed: e.target.value as RatingExtraFields['stillEmployed'] })}
            style={textInput}
          >
            <option value="">—</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
        <label style={fieldLabel}>
          Years at company
          <input
            type="number"
            min={0}
            value={extra.yearsAtCompany}
            onChange={(e) => onExtraChange({ yearsAtCompany: e.target.value })}
            style={textInput}
          />
        </label>
      </div>

      <label style={{ ...fieldLabel, marginTop: '.85rem' }}>
        Overall Review
        <textarea
          value={extra.overallReviewText}
          onChange={(e) => onExtraChange({ overallReviewText: e.target.value })}
          placeholder="Anything else worth sharing? (optional)"
          rows={3}
          style={{ ...textInput, resize: 'vertical' }}
        />
      </label>
    </div>
  );
}

const extraGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '.7rem',
  marginTop: '.9rem',
};

const fieldLabel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '.3rem',
  fontSize: '.78rem',
  fontWeight: 600,
  color: 'var(--body)',
};

const textInput: React.CSSProperties = {
  padding: '.45rem .6rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '.82rem',
  fontFamily: 'inherit',
  color: 'var(--ink)',
};
