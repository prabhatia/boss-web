'use client';

import { useState } from 'react';
import { api, ApiError, type CreatePositionRequest, type EmploymentHistoryResponse, type EmploymentType } from '@/lib/api';

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INTERNSHIP', label: 'Internship' },
];

export function NewPositionForm({
  companyId,
  onCreated,
}: {
  companyId: string;
  onCreated: (position: EmploymentHistoryResponse) => void;
}) {
  const [roleTitle, setRoleTitle] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Skip this step" saves the mandatory Company + Title only, discarding
  // whatever's currently typed in the optional fields — details can be
  // filled in later from the dashboard. Either button requires a title,
  // since the position record (and its employmentHistoryId) has to exist
  // for the rating flow to continue.
  async function submit(skipOptionalFields: boolean) {
    if (!roleTitle.trim()) {
      setError('Title is required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const req: CreatePositionRequest = {
        companyId,
        roleTitle: roleTitle.trim(),
        description: skipOptionalFields ? undefined : description.trim() || undefined,
        startDate: skipOptionalFields ? undefined : startDate || undefined,
        endDate: skipOptionalFields || isCurrent ? undefined : endDate || undefined,
        isCurrent: skipOptionalFields ? true : isCurrent || !endDate,
        employmentType: skipOptionalFields ? undefined : employmentType || undefined,
      };
      const position = await api.post<EmploymentHistoryResponse>('profile', '/profiles/me/employment-history', req);
      onCreated(position);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save this position. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div style={wrap}>
      <p style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '.75rem' }}>
        Enter new position on profile
      </p>

      <label style={fieldLabel}>
        Title *
        <input type="text" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} style={input} />
      </label>

      <label style={fieldLabel}>
        Employment type (optional)
        <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value as EmploymentType | '')} style={input}>
          <option value="">Not specified</option>
          {EMPLOYMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>

      <label style={fieldLabel}>
        Duties performed and skills used (optional)
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ ...input, resize: 'vertical' }} />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.7rem' }}>
        <label style={fieldLabel}>
          From (optional)
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={input} />
        </label>
        <label style={{ ...fieldLabel, opacity: isCurrent ? 0.5 : 1 }}>
          To (optional)
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={isCurrent}
            style={input}
          />
        </label>
      </div>

      <label style={{ ...fieldLabel, flexDirection: 'row', alignItems: 'center', gap: '.5rem' }}>
        <input type="checkbox" checked={isCurrent} onChange={(e) => setIsCurrent(e.target.checked)} />
        I currently work here
      </label>

      {error && <p style={{ fontSize: '.78rem', color: 'var(--red)', marginTop: '.4rem' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '.6rem', marginTop: '.9rem' }}>
        <button onClick={() => submit(false)} disabled={submitting} className="btn btn-primary">
          {submitting ? 'Saving…' : 'Save position'}
        </button>
        <button onClick={() => submit(true)} disabled={submitting} className="btn btn-ghost">
          Skip this step — enter details later
        </button>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '1rem',
  marginTop: '.75rem',
};

const fieldLabel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '.3rem',
  fontSize: '.8rem',
  fontWeight: 600,
  color: 'var(--body)',
  marginBottom: '.7rem',
};

const input: React.CSSProperties = {
  padding: '.5rem .6rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '.85rem',
  fontFamily: 'inherit',
  color: 'var(--ink)',
};
