export type MetricKey =
  | 'workLifeBalance'
  | 'managementEmpathy'
  | 'advancementOpportunity'
  | 'benefits'
  | 'upperManagementEthos';

export interface MetricValue {
  score: number;   // 1.0-10.0
  comment: string; // optional free text, empty string if unset
}

export type MetricValues = Record<MetricKey, MetricValue>;

interface MetricDef {
  key: MetricKey;
  label: string;
  /** benefits and upperManagementEthos are company-only — excluded from manager ratings. */
  companyOnly?: boolean;
}

export const RATING_METRICS: MetricDef[] = [
  { key: 'workLifeBalance', label: 'Work-life balance' },
  { key: 'managementEmpathy', label: 'Management empathy' },
  { key: 'advancementOpportunity', label: 'Opportunities for advancement' },
  { key: 'benefits', label: 'Benefits', companyOnly: true },
  { key: 'upperManagementEthos', label: 'Upper management ethos', companyOnly: true },
];

export function metricsFor(scope: 'company' | 'manager'): MetricDef[] {
  return scope === 'company' ? RATING_METRICS : RATING_METRICS.filter((m) => !m.companyOnly);
}

const DEFAULT_SCORE = 5.5;

export function defaultMetricValues(scope: 'company' | 'manager'): MetricValues {
  const values = {} as MetricValues;
  for (const m of metricsFor(scope)) {
    values[m.key] = { score: DEFAULT_SCORE, comment: '' };
  }
  return values;
}

export const DEFAULT_WOULD_SCORE = DEFAULT_SCORE;
