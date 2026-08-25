'use client';

import { useState } from 'react';
import { api, ApiError, type CreateManagerRequest, type ManagerRef } from '@/lib/api';

const LINKEDIN_URL_PATTERN = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i;

export function NewManagerForm({
  companyId,
  onConfirmed,
  initialName,
}: {
  companyId: string;
  onConfirmed: (ref: ManagerRef) => void;
  /** Pre-fills the name field — e.g. from a directory search that found no existing match. */
  initialName?: string;
}) {
  const [name, setName] = useState(initialName ?? '');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkedinTouched = linkedinUrl.trim().length > 0;
  const linkedinValid = LINKEDIN_URL_PATTERN.test(linkedinUrl.trim());

  async function confirm() {
    if (!name.trim()) {
      setError('Enter a name.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const req: CreateManagerRequest = {
        realName: name.trim(),
        linkedinUrl: linkedinTouched && linkedinValid ? linkedinUrl.trim() : undefined,
      };
      const ref = await api.post<ManagerRef>('company', `/companies/${companyId}/managers`, req);
      onConfirmed(ref);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save this manager. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div style={wrap}>
      <label style={fieldLabel}>
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          style={input}
        />
      </label>

      <label style={fieldLabel}>
        LinkedIn profile URL
        <input
          type="text"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder="https://www.linkedin.com/in/..."
          style={input}
        />
      </label>

      {linkedinTouched && !linkedinValid && (
        <p style={notFoundMsg}>No LinkedIn profile found</p>
      )}

      {error && <p style={{ fontSize: '.78rem', color: 'var(--red)', marginTop: '.4rem' }}>{error}</p>}

      <button
        onClick={confirm}
        disabled={submitting}
        className="btn btn-primary"
        style={{ marginTop: '.9rem' }}
      >
        {submitting ? 'Saving…' : 'Confirm profile'}
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

const notFoundMsg: React.CSSProperties = {
  fontSize: '.7rem',
  color: 'var(--red)',
  marginTop: '-.35rem',
  marginBottom: '.5rem',
};
