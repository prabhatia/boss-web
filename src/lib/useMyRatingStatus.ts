'use client';

import { useEffect, useState } from 'react';
import { api, ApiError, type EmploymentHistoryResponse, type RatingStatus } from '@/lib/api';

/**
 * Backs "Rate this company"/"Modify rating" (and the manager equivalent) on
 * the /companies and /people listing pages. Fetches the signed-in user's
 * employment history once, then checks rating status for every position in
 * one batched call — cheap enough to run on page load, and avoids an N+1
 * fetch per card.
 *
 * Anonymous visitors get `signedIn: false` (the /profiles/me 401 is expected,
 * not an error) and every helper below returns false — callers should hide
 * or fall back the rating links entirely in that case.
 */
export function useMyRatingStatus() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [employmentHistory, setEmploymentHistory] = useState<EmploymentHistoryResponse[]>([]);
  const [statusById, setStatusById] = useState<Record<string, RatingStatus>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await api.get<{ employmentHistory: EmploymentHistoryResponse[] }>('profile', '/profiles/me');
        if (cancelled) return;
        setSignedIn(true);
        setEmploymentHistory(profile.employmentHistory);

        if (profile.employmentHistory.length > 0) {
          const status = await api.post<Record<string, RatingStatus>>('company', '/ratings/status', {
            employmentHistoryIds: profile.employmentHistory.map((e) => e.id),
          });
          if (!cancelled) setStatusById(status);
        }
      } catch (e) {
        if (cancelled) return;
        if (!(e instanceof ApiError && e.status === 401)) {
          // Anything other than "not signed in" is silent here too — the
          // rating links just won't appear, same as any other optional widget
          // failing softly. There's no dedicated error UI for this.
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function hasRatedCompany(companyId: string): boolean {
    return employmentHistory.some((e) => e.companyId === companyId && statusById[e.id]?.hasCompanyRating);
  }

  function hasRatedManager(managerId: string): boolean {
    return employmentHistory.some((e) => e.managerId === managerId && statusById[e.id]?.hasManagerRating);
  }

  return { loading, signedIn, hasRatedCompany, hasRatedManager };
}
