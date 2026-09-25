'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, type PersonSearchResult } from '@/lib/api';
import { IndustryBrowser } from './IndustryBrowser';
import styles from './people.module.css';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat('#');
const ANY_INDUSTRY = 'Any';

export function PeopleClient() {
  const [people, setPeople] = useState<PersonSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState('');

  const [industries, setIndustries] = useState<string[]>([]);
  const [industry, setIndustry] = useState(ANY_INDUSTRY);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const list = await api.get<PersonSearchResult[]>('company', '/people');
        if (!cancelled) setPeople(list);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [retryToken]);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.get<string[]>('company', '/companies/industries');
        setIndustries(list);
      } catch {
        // Industry filter just won't have options — the rest of the page still works.
      }
    })();
  }, []);

  const companyOptions = useMemo(
    () => Array.from(new Set(people.map((p) => p.companyName))).sort((a, b) => a.localeCompare(b)),
    [people]
  );

  function selectLetter(letter: string) {
    setSelectedLetter(letter);
    setSearchTerm(null);
    setCompanyFilter('');
  }

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    setSearchTerm(q);
    setSelectedLetter(null);
    setCompanyFilter('');
  }

  function clearSearch() {
    setSearchTerm(null);
    setSearchInput('');
  }

  function selectCompany(name: string) {
    setCompanyFilter(name);
    setSelectedLetter(null);
    setSearchTerm(null);
  }

  const peopleForLetter = selectedLetter ? people.filter((p) => p.letter === selectedLetter) : [];
  // Matches on the full display name, so searching either the first or last name
  // (or both together) finds the person regardless of which part is typed.
  const searchMatches = searchTerm
    ? people.filter((p) => p.displayLabel.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];
  const companyMatches = companyFilter ? people.filter((p) => p.companyName === companyFilter) : [];

  const results = searchTerm ? searchMatches : companyFilter ? companyMatches : peopleForLetter;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>People</h1>
          <p className={styles.sub}>
            Search for a manager by first or last name, or browse alphabetically, to
            see their ratings. Scores appear once a person has three or more approved reviews.
          </p>
        </div>
      </header>

      <div style={{ padding: '0 2rem' }}>
        <div className="container" style={{ padding: '2.5rem 0 4rem' }}>
          <div className={styles.card}>
            <div style={filtersRow}>
              <form onSubmit={runSearch} style={{ ...searchRow, flex: 1, marginBottom: 0 }}>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by first or last name…"
                  style={searchInputStyle}
                  aria-label="Search people"
                />
                <button type="submit" className="btn btn-outline" style={searchBtn}>
                  Search
                </button>
              </form>

              <select
                value={companyFilter}
                onChange={(e) => (e.target.value ? selectCompany(e.target.value) : setCompanyFilter(''))}
                style={selectStyle}
                aria-label="Select by company name"
              >
                <option value="">All companies</option>
                {companyOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                style={selectStyle}
                aria-label="Filter by industry"
              >
                <option value={ANY_INDUSTRY}>Any industry</option>
                {industries.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {industry !== ANY_INDUSTRY ? (
              <IndustryBrowser industry={industry} />
            ) : (
              <>
                <p style={letterLabel}>Last name starts with:</p>
                <div style={letterRow}>
                  {LETTERS.map((letter) => (
                    <button
                      key={letter}
                      onClick={() => selectLetter(letter)}
                      style={selectedLetter === letter ? { ...letterBtn, ...letterBtnActive } : letterBtn}
                    >
                      {letter}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <p style={muted}>Loading people…</p>
                ) : error ? (
                  <div>
                    <p style={{ fontSize: '.85rem', color: 'var(--red)' }}>Could not load the people directory. Please try again.</p>
                    <button className="btn btn-outline" onClick={() => setRetryToken((n) => n + 1)} style={{ marginTop: '.5rem' }}>
                      Retry
                    </button>
                  </div>
                ) : searchTerm ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                      <p style={{ ...muted, margin: 0 }}>
                        {results.length > 0 ? `Results for “${searchTerm}”` : `No one named “${searchTerm}” found.`}
                      </p>
                      <button onClick={clearSearch} style={clearLink}>Clear search</button>
                    </div>
                    <PeopleList results={results} />
                  </>
                ) : companyFilter ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                      <p style={{ ...muted, margin: 0 }}>
                        {results.length > 0 ? `People at ${companyFilter}` : `No one rated at ${companyFilter} yet.`}
                      </p>
                      <button onClick={() => setCompanyFilter('')} style={clearLink}>Clear</button>
                    </div>
                    <PeopleList results={results} />
                  </>
                ) : !selectedLetter ? (
                  <p style={muted}>Pick a letter to browse people, search by name, or select a company above.</p>
                ) : results.length > 0 ? (
                  <PeopleList results={results} />
                ) : (
                  <p style={muted}>No one under &ldquo;{selectedLetter}&rdquo; yet.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function PeopleList({ results }: { results: PersonSearchResult[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      {results.map((p) => (
        <Link key={p.id} href={`/companies/${p.companySlug}`} style={personRow}>
          <div>
            <div style={personName}>{p.displayLabel}</div>
            <div style={personMeta}>
              {p.roleTitle ? `${p.roleTitle} · ` : ''}{p.companyName}
            </div>
          </div>
          {p.avgOverallScore != null ? (
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={personScoreVal}>{p.avgOverallScore.toFixed(1)}/10</div>
              <div style={personScoreLbl}>{p.reviewCount} reviews</div>
            </div>
          ) : (
            <div style={personPending}>Scores appear at 3 reviews · {p.reviewCount} so far</div>
          )}
        </Link>
      ))}
    </div>
  );
}

const muted: React.CSSProperties = { fontSize: '.85rem', color: 'var(--muted)' };

const filtersRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '.5rem',
  marginBottom: '1rem',
};

const selectStyle: React.CSSProperties = {
  padding: '.5rem .6rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '.85rem',
  fontFamily: 'inherit',
  color: 'var(--ink)',
  background: 'white',
};

const searchRow: React.CSSProperties = {
  display: 'flex',
  gap: '.5rem',
  marginBottom: '1rem',
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '.5rem .6rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '.85rem',
  fontFamily: 'inherit',
  color: 'var(--ink)',
};

const searchBtn: React.CSSProperties = {
  flexShrink: 0,
  fontSize: '.82rem',
  padding: '.5rem 1rem',
};

const clearLink: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontSize: '.75rem',
  fontWeight: 600,
  color: 'var(--primary)',
  textDecoration: 'underline',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const letterLabel: React.CSSProperties = {
  fontSize: '.78rem',
  fontWeight: 700,
  color: 'var(--ink)',
  marginBottom: '.5rem',
};

const letterRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '.35rem',
  marginBottom: '1.25rem',
};

const letterBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid var(--border)',
  borderRadius: 6,
  background: 'white',
  fontSize: '.8rem',
  fontWeight: 600,
  color: 'var(--body)',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const letterBtnActive: React.CSSProperties = {
  background: 'var(--primary)',
  color: 'white',
};

const personRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '.75rem',
  padding: '.7rem .85rem',
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'white',
  textDecoration: 'none',
  color: 'inherit',
  fontFamily: 'inherit',
};

const personName: React.CSSProperties = {
  fontSize: '.9rem',
  fontWeight: 700,
  color: 'var(--ink)',
};

const personMeta: React.CSSProperties = {
  fontSize: '.78rem',
  color: 'var(--muted)',
  marginTop: '.1rem',
};

const personScoreVal: React.CSSProperties = {
  fontSize: '.95rem',
  fontWeight: 800,
  color: 'var(--primary)',
};

const personScoreLbl: React.CSSProperties = {
  fontSize: '.68rem',
  color: 'var(--muted)',
};

const personPending: React.CSSProperties = {
  flexShrink: 0,
  fontSize: '.72rem',
  color: 'var(--muted)',
  textAlign: 'right',
  maxWidth: 130,
};
