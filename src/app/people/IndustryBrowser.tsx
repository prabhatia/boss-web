'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type CompanySearchResult, type ManagerDirectoryItem } from '@/lib/api';

interface Page<T> { content: T[]; totalElements: number; }

function firstLetter(name: string): string {
  const c = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : '#';
}

function groupByLetter<T>(items: T[], letterOf: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const letter = letterOf(item);
    const bucket = map.get(letter);
    if (bucket) bucket.push(item);
    else map.set(letter, [item]);
  }
  return new Map(Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

export function IndustryBrowser({ industry }: { industry: string }) {
  const [companies, setCompanies] = useState<CompanySearchResult[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [companiesError, setCompaniesError] = useState(false);
  const [expandedCompanyLetter, setExpandedCompanyLetter] = useState<string | null>(null);

  const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult | null>(null);
  const [managers, setManagers] = useState<ManagerDirectoryItem[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [managersError, setManagersError] = useState(false);
  const [expandedManagerLetter, setExpandedManagerLetter] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingCompanies(true);
    setCompaniesError(false);
    setSelectedCompany(null);
    setExpandedCompanyLetter(null);
    (async () => {
      try {
        const params = new URLSearchParams({ industry, size: '1000', sort: 'name,asc' });
        const res = await api.get<Page<CompanySearchResult>>('company', `/companies?${params}`);
        if (!cancelled) setCompanies((res.content ?? []).filter((c) => c.reviewCount > 0));
      } catch {
        if (!cancelled) setCompaniesError(true);
      } finally {
        if (!cancelled) setLoadingCompanies(false);
      }
    })();
    return () => { cancelled = true; };
  }, [industry]);

  function selectCompany(company: CompanySearchResult) {
    setSelectedCompany(company);
    setExpandedManagerLetter(null);
    setLoadingManagers(true);
    setManagersError(false);
    (async () => {
      try {
        const list = await api.get<ManagerDirectoryItem[]>('company', `/companies/${company.id}/managers`);
        setManagers(list);
      } catch {
        setManagersError(true);
      } finally {
        setLoadingManagers(false);
      }
    })();
  }

  const companiesByLetter = groupByLetter(companies, (c) => firstLetter(c.name));
  const managersByLetter = groupByLetter(managers, (m) => m.letter);

  if (loadingCompanies) {
    return <p style={muted}>Loading companies in {industry}…</p>;
  }

  if (companiesError) {
    return <p style={{ fontSize: '.85rem', color: 'var(--red)' }}>Could not load companies. Please try again.</p>;
  }

  if (companiesByLetter.size === 0) {
    return <p style={muted}>No rated companies in {industry} yet.</p>;
  }

  return (
    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 220 }}>
        <p style={colLabel}>Companies in {industry}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
          {Array.from(companiesByLetter.entries()).map(([letter, group]) => (
            <div key={letter}>
              <button
                onClick={() => setExpandedCompanyLetter(expandedCompanyLetter === letter ? null : letter)}
                style={expandedCompanyLetter === letter ? { ...letterRow, ...letterRowActive } : letterRow}
              >
                {letter}
              </button>
              {expandedCompanyLetter === letter && (
                <div style={nestedList}>
                  {group.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCompany(c)}
                      style={
                        selectedCompany?.id === c.id
                          ? { ...nestedItem, ...nestedItemActive }
                          : nestedItem
                      }
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedCompany && (
        <div style={{ minWidth: 220, flex: 1 }}>
          <p style={colLabel}>
            Managers at {selectedCompany.name}
            {' · '}
            <Link href={`/companies/${selectedCompany.slug}`} style={profileLink}>
              view profile
            </Link>
          </p>

          {loadingManagers ? (
            <p style={muted}>Loading managers…</p>
          ) : managersError ? (
            <p style={{ fontSize: '.85rem', color: 'var(--red)' }}>Could not load managers. Please try again.</p>
          ) : managersByLetter.size === 0 ? (
            <p style={muted}>No rated managers at {selectedCompany.name} yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
              {Array.from(managersByLetter.entries()).map(([letter, group]) => (
                <div key={letter}>
                  <button
                    onClick={() => setExpandedManagerLetter(expandedManagerLetter === letter ? null : letter)}
                    style={expandedManagerLetter === letter ? { ...letterRow, ...letterRowActive } : letterRow}
                  >
                    {letter}
                  </button>
                  {expandedManagerLetter === letter && (
                    <div style={nestedList}>
                      {group.map((m) => (
                        <div key={m.id} style={managerRow}>
                          <span style={{ fontWeight: 600 }}>{m.displayLabel}</span>
                          {m.roleTitle && <span style={{ color: 'var(--muted)', fontSize: '.78rem' }}> — {m.roleTitle}</span>}
                          {m.avgOverallScore != null ? (
                            <span style={{ color: 'var(--primary)', fontSize: '.78rem', marginLeft: '.4rem' }}>
                              {m.avgOverallScore.toFixed(1)}/10 · {m.reviewCount} reviews
                            </span>
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: '.72rem', marginLeft: '.4rem' }}>
                              Scores appear at 3 reviews · {m.reviewCount} so far
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const muted: React.CSSProperties = { fontSize: '.85rem', color: 'var(--muted)' };

const colLabel: React.CSSProperties = {
  fontSize: '.78rem',
  fontWeight: 700,
  color: 'var(--ink)',
  marginBottom: '.6rem',
};

const profileLink: React.CSSProperties = {
  fontWeight: 600,
  color: 'var(--primary)',
  textDecoration: 'underline',
};

const letterRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: 40,
  height: 32,
  justifyContent: 'center',
  border: '1px solid var(--border)',
  borderRadius: 6,
  background: 'white',
  fontSize: '.8rem',
  fontWeight: 700,
  color: 'var(--body)',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const letterRowActive: React.CSSProperties = {
  background: 'var(--primary)',
  color: 'white',
  borderColor: 'var(--primary)',
};

const nestedList: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '.3rem',
  marginTop: '.35rem',
  marginBottom: '.35rem',
  paddingLeft: '.75rem',
  borderLeft: '2px solid var(--border)',
};

const nestedItem: React.CSSProperties = {
  textAlign: 'left',
  padding: '.45rem .65rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'white',
  fontSize: '.82rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  color: 'var(--ink)',
};

const nestedItemActive: React.CSSProperties = {
  borderColor: 'var(--primary)',
  color: 'var(--primary)',
};

const managerRow: React.CSSProperties = {
  padding: '.5rem .65rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'white',
  fontSize: '.85rem',
};
