'use client';

import { useState } from 'react';
import { api, ApiError, type SubmitSalaryRequest } from '@/lib/api';
import { SegmentedControl } from './SegmentedControl';
import { InfoTooltip } from '@/components/InfoTooltip';

type Period = 'HOURLY' | 'DAILY' | 'MONTHLY' | 'YEARLY';
type Vesting = 'YEARLY' | 'FOUR_YEAR' | 'FIVE_YEAR' | 'TEN_YEAR';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'HOURLY', label: 'Hour' },
  { value: 'DAILY', label: 'Day' },
  { value: 'MONTHLY', label: 'Month' },
  { value: 'YEARLY', label: 'Year' },
];

const PERIOD_PLACEHOLDER: Record<Period, string> = {
  HOURLY: '11',
  DAILY: '100',
  MONTHLY: '10000',
  YEARLY: '100K',
};

const VESTING_OPTIONS: { value: Vesting; label: string }[] = [
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'FOUR_YEAR', label: '4-Year' },
  { value: 'FIVE_YEAR', label: '5-Year' },
  { value: 'TEN_YEAR', label: '10-Year' },
];

type State = 'idle' | 'submitting' | 'done';

export function SalaryForm({ companyId, employmentHistoryId }: { companyId: string; employmentHistoryId: string }) {
  const [period, setPeriod] = useState<Period>('YEARLY');
  const [amount, setAmount] = useState('');
  const [rsuAmount, setRsuAmount] = useState('');
  const [vesting, setVesting] = useState<Vesting>('YEARLY');
  const [bonus, setBonus] = useState('');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const baseSalaryAmount = parseFloat(amount);
    if (!amount.trim() || Number.isNaN(baseSalaryAmount) || baseSalaryAmount <= 0) {
      setError('Enter a valid salary amount.');
      return;
    }
    const parsedRsuAmount = rsuAmount.trim() ? parseFloat(rsuAmount) : undefined;
    if (rsuAmount.trim() && (Number.isNaN(parsedRsuAmount) || (parsedRsuAmount as number) <= 0)) {
      setError('Enter a valid RSU amount, or leave it blank.');
      return;
    }
    const parsedBonus = bonus.trim() ? parseFloat(bonus) : undefined;
    if (bonus.trim() && (Number.isNaN(parsedBonus) || (parsedBonus as number) <= 0)) {
      setError('Enter a valid annual bonus amount, or leave it blank.');
      return;
    }
    setState('submitting');
    setError(null);
    try {
      const req: SubmitSalaryRequest = {
        companyId,
        employmentHistoryId,
        baseSalaryAmount,
        baseSalaryPeriod: period,
        rsuAmount: parsedRsuAmount,
        rsuVestingSchedule: rsuAmount.trim() ? vesting : undefined,
        annualBonusAmount: parsedBonus,
      };
      await api.post('company', '/salary', req);
      setState('done');
    } catch (e) {
      setState('idle');
      setError(e instanceof ApiError ? e.message : 'Could not submit salary data. Please try again.');
    }
  }

  if (state === 'done') {
    return <p style={{ fontSize: '.82rem', color: 'var(--green)', marginTop: '1rem' }}>Thanks — your salary data is submitted and pending review.</p>;
  }

  return (
    <div style={wrap}>
      <span style={labelRow}>
        Salary
        <InfoTooltip text="Enter salary - select by hour, day, month or year" />
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={PERIOD_PLACEHOLDER[period]}
        style={input}
      />
      <div style={{ marginTop: '.5rem' }}>
        <SegmentedControl options={PERIOD_OPTIONS} value={period} onChange={setPeriod} aria-label="Salary period" />
      </div>

      <span style={{ ...labelRow, marginTop: '1.1rem' }}>
        RSUs
        <InfoTooltip text="Restricted stock units offered" />
      </span>
      <label style={subLabel}>
        Amount
        <input
          type="text"
          inputMode="decimal"
          value={rsuAmount}
          onChange={(e) => setRsuAmount(e.target.value)}
          style={input}
        />
      </label>
      <p style={subLabel}>Vesting Schedule</p>
      <SegmentedControl options={VESTING_OPTIONS} value={vesting} onChange={setVesting} aria-label="Vesting schedule" />

      <span style={{ ...labelRow, marginTop: '1.1rem' }}>
        Annual Bonus
        <InfoTooltip text="Bonus awarded annually" />
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={bonus}
        onChange={(e) => setBonus(e.target.value)}
        style={input}
      />

      {error && <p style={{ fontSize: '.78rem', color: 'var(--red)', marginTop: '.5rem' }}>{error}</p>}

      <button onClick={submit} disabled={state === 'submitting'} className="btn btn-outline" style={{ marginTop: '.9rem' }}>
        {state === 'submitting' ? 'Submitting…' : 'Submit salary data'}
      </button>
    </div>
  );
}

const wrap: React.CSSProperties = {};

const labelRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '.85rem',
  fontWeight: 700,
  color: 'var(--ink)',
  marginBottom: '.4rem',
};

const subLabel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '.3rem',
  fontSize: '.78rem',
  fontWeight: 600,
  color: 'var(--body)',
  marginTop: '.6rem',
  marginBottom: '.4rem',
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '.5rem .6rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '.85rem',
  fontFamily: 'inherit',
  color: 'var(--ink)',
};
