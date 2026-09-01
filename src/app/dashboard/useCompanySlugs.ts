import { useEffect, useState } from 'react';
import { api, type CompanySearchResult, type EmploymentHistoryResponse } from '@/lib/api';

interface Page<T> { content: T[]; totalElements: number; }

/**
 * Resolves the slug for each unique company in the caller's employment
 * history, so "rate this company" links can point straight to
 * /companies/{slug} instead of the search page. Looked up by name against
 * the existing public company-search endpoint — profile-service only
 * stores a companyId, never the slug.
 */
export function useCompanySlugs(employmentHistory: EmploymentHistoryResponse[] | undefined) {
  const [slugs, setSlugs] = useState<Record<string, string>>({});

  const companies = (employmentHistory ?? [])
    .filter((e) => e.companyName)
    .reduce<{ id: string; name: string }[]>((acc, e) => {
      if (!acc.some((c) => c.id === e.companyId)) acc.push({ id: e.companyId, name: e.companyName! });
      return acc;
    }, []);

  const key = companies.map((c) => c.id).join(',');

  useEffect(() => {
    if (companies.length === 0) return;
    let cancelled = false;

    (async () => {
      const results = await Promise.all(
        companies.map(async (c) => {
          try {
            const res = await api.get<Page<CompanySearchResult>>(
              'company', `/companies?name=${encodeURIComponent(c.name)}`
            );
            const match = res.content.find((r) => r.id === c.id) ?? res.content[0];
            return match ? ([c.id, match.slug] as const) : null;
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;
      setSlugs(Object.fromEntries(results.filter((r): r is readonly [string, string] => r !== null)));
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return slugs;
}
