'use client';

import { useState } from 'react';
import { api, ApiError, type EmploymentHistoryResponse, type LinkManagerRequest, type RelationshipType } from '@/lib/api';

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string }[] = [
  { value: 'FIRST_LINE_MANAGER', label: '1st Line (Immediate) Manager' },
  { value: 'SECOND_LINE_MANAGER', label: '2nd Line Manager' },
  { value: 'TEAM_LEAD', label: 'Team Lead' },
  { value: 'COLLEAGUE', label: 'Colleague' },
  { value: 'INDIVIDUAL_CONTRIBUTOR', label: 'Individual Contributor' },
  { value: 'VP', label: 'Vice President' },
  { value: 'AVP', label: 'Asst Vice President' },
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'ASST_DIRECTOR', label: 'Asst Director' },
];

export function RelationshipPicker({
  employmentHistoryId,
  managerId,
  onLinked,
}: {
  employmentHistoryId: string;
  managerId: string;
  onLinked: (position: EmploymentHistoryResponse) => void;
}) {
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('FIRST_LINE_MANAGER');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const req: LinkManagerRequest = {
        managerId,
        relationshipType,
        relationshipNote: note.trim() || undefined,
      };
      const position = await api.patch<EmploymentHistoryResponse>(
        'profile', `/profiles/me/employment-history/${employmentHistoryId}/manager-link`, req
      );
      onLinked(position);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save this relationship. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div style={wrap}>
      <label style={fieldLabel}>
        Your relationship to this person
        <select value={relationshipType} onChange={(e) => setRelationshipType(e.target.value as RelationshipType)} style={input}>
          {RELATIONSHIP_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      <label style={fieldLabel}>
        Notes (optional)
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} style={{ ...input, resize: 'vertical' }} />
      </label>

      {error && <p style={{ fontSize: '.78rem', color: 'var(--red)', marginTop: '.4rem' }}>{error}</p>}

      <button onClick={submit} disabled={submitting} className="btn btn-primary" style={{ marginTop: '.7rem' }}>
        {submitting ? 'Saving…' : 'Continue'}
      </button>
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
