'use client';

import { useEffect, useState } from 'react';
import { api, type EmploymentHistoryResponse } from '@/lib/api';
import { NewPositionForm } from './NewPositionForm';
import { RelationshipPicker } from './RelationshipPicker';

export function PositionPicker({
  companyId,
  managerId,
  onLinked,
}: {
  companyId: string;
  managerId: string;
  onLinked: (position: EmploymentHistoryResponse) => void;
}) {
  const [positions, setPositions] = useState<EmploymentHistoryResponse[] | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<EmploymentHistoryResponse | null>(null);
  const [error, setError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    (async () => {
      try {
        const list = await api.get<EmploymentHistoryResponse[]>(
          'profile', `/profiles/me/employment-history?companyId=${companyId}`
        );
        if (!cancelled) setPositions(list);
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => { cancelled = true; };
  }, [companyId, retryToken]);

  if (selectedPosition) {
    return (
      <RelationshipPicker
        employmentHistoryId={selectedPosition.id}
        managerId={managerId}
        onLinked={onLinked}
      />
    );
  }

  if (error) {
    return (
      <div>
        <p style={{ fontSize: '.85rem', color: 'var(--red)' }}>Could not load your positions. Please try again.</p>
        <button className="btn btn-outline" onClick={() => setRetryToken((n) => n + 1)} style={{ marginTop: '.5rem' }}>
          Retry
        </button>
      </div>
    );
  }

  if (positions === null) {
    return <p style={{ fontSize: '.85rem', color: 'var(--muted)' }}>Loading your positions…</p>;
  }

  if (positions.length === 0) {
    return <NewPositionForm companyId={companyId} onCreated={setSelectedPosition} />;
  }

  return (
    <div>
      <p style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '.6rem' }}>
        You worked with this person at:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        {positions.map((p) => (
          <button key={p.id} onClick={() => setSelectedPosition(p)} style={positionBtn}>
            {p.roleTitle}
            <span style={{ color: 'var(--muted)', fontSize: '.78rem' }}> · {p.startDate.slice(0, 4)}{p.isCurrent ? ' – Present' : p.endDate ? ` – ${p.endDate.slice(0, 4)}` : ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const positionBtn: React.CSSProperties = {
  textAlign: 'left',
  padding: '.6rem .75rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'white',
  fontSize: '.85rem',
  fontWeight: 600,
  color: 'var(--ink)',
  cursor: 'pointer',
  fontFamily: 'inherit',
};
