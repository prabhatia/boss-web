'use client';

import { useState } from 'react';
import { type EmploymentHistoryResponse, type ManagerRef } from '@/lib/api';
import { ManagerDirectory } from './ManagerDirectory';
import { PositionPicker } from './PositionPicker';
import { RateManagerForm } from './RateManagerForm';

type Step = 'directory' | 'position' | 'rating' | 'done';

/**
 * Orchestrates: pick/create a manager (ManagerDirectory + NewManagerForm) →
 * pick/create the position you knew them at, set your relationship
 * (PositionPicker, which itself composes NewPositionForm + RelationshipPicker)
 * → rate them (RateManagerForm, the same 1-10 metric widget as the company
 * rating, minus upperManagementEthos).
 */
export function ManagerRatingFlow({ companyId }: { companyId: string }) {
  const [step, setStep] = useState<Step>('directory');
  const [manager, setManager] = useState<ManagerRef | null>(null);
  const [linkedPosition, setLinkedPosition] = useState<EmploymentHistoryResponse | null>(null);

  function onManagerSelected(ref: ManagerRef) {
    setManager(ref);
    setStep('position');
  }

  function onPositionLinked(position: EmploymentHistoryResponse) {
    setLinkedPosition(position);
    setStep('rating');
  }

  if (step === 'directory') {
    return <ManagerDirectory companyId={companyId} onSelectManager={onManagerSelected} />;
  }

  if (step === 'position' && manager) {
    return (
      <div>
        <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '.6rem' }}>
          Rating <strong style={{ color: 'var(--ink)' }}>{manager.displayLabel}</strong>
        </p>
        <PositionPicker companyId={companyId} managerId={manager.id} onLinked={onPositionLinked} />
      </div>
    );
  }

  if (step === 'rating' && manager && linkedPosition) {
    return (
      <div>
        <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '.6rem' }}>
          Rating <strong style={{ color: 'var(--ink)' }}>{manager.displayLabel}</strong>
        </p>
        <RateManagerForm
          companyId={companyId}
          managerId={manager.id}
          employmentHistoryId={linkedPosition.id}
          onRated={() => setStep('done')}
        />
      </div>
    );
  }

  return <p style={{ fontSize: '.85rem', color: 'var(--green)' }}>Thanks — your manager rating is submitted and pending review.</p>;
}
