'use client';

import { useEffect, useState } from 'react';
import { api, type ManagerDirectoryItem, type ManagerRef } from '@/lib/api';
import { NewManagerForm } from './NewManagerForm';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat('#');

export function ManagerDirectory({
  companyId,
  onSelectManager,
}: {
  companyId: string;
  onSelectManager: (ref: ManagerRef) => void;
}) {
  const [managers, setManagers] = useState<ManagerDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const list = await api.get<ManagerDirectoryItem[]>('company', `/companies/${companyId}/managers`);
        if (!cancelled) setManagers(list);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [companyId, retryToken]);

  function selectLetter(letter: string) {
    setSelectedLetter(letter);
    setShowNewForm(false);
    setSearchTerm(null);
  }

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    setSearchTerm(q);
    setSelectedLetter(null);
    setShowNewForm(false);
  }

  function clearSearch() {
    setSearchTerm(null);
    setSearchInput('');
  }

  const managersForLetter = selectedLetter ? managers.filter((m) => m.letter === selectedLetter) : [];
  const searchMatches = searchTerm
    ? managers.filter((m) => m.displayLabel.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  return (
    <div>
      <form onSubmit={runSearch} style={searchRow}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search for a manager by name…"
          style={searchInputStyle}
        />
        <button type="submit" className="btn btn-outline" style={searchBtn}>
          Search
        </button>
      </form>

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

      <div style={panel}>
        {loading ? (
          <p style={muted}>Loading managers…</p>
        ) : error ? (
          <div>
            <p style={{ fontSize: '.85rem', color: 'var(--red)' }}>Could not load managers. Please try again.</p>
            <button className="btn btn-outline" onClick={() => setRetryToken((n) => n + 1)} style={{ marginTop: '.5rem' }}>
              Retry
            </button>
          </div>
        ) : searchTerm ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
              <p style={{ ...muted, margin: 0 }}>
                {searchMatches.length > 0
                  ? `Results for “${searchTerm}”`
                  : `No manager named “${searchTerm}” found yet.`}
              </p>
              <button onClick={clearSearch} style={clearLink}>
                Clear search
              </button>
            </div>

            {searchMatches.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                {searchMatches.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSelectManager({ id: m.id, displayLabel: m.displayLabel })}
                    style={managerBtn}
                  >
                    <span style={{ fontWeight: 600 }}>{m.displayLabel}</span>
                    {m.roleTitle && <span style={{ color: 'var(--muted)', fontSize: '.78rem' }}> — {m.roleTitle}</span>}
                    {m.avgOverallScore != null && (
                      <span style={{ color: 'var(--primary)', fontSize: '.78rem', marginLeft: '.4rem' }}>
                        {m.avgOverallScore.toFixed(1)}/10 · {m.reviewCount} reviews
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              // Not rated yet under this name — go straight to entering a new rating,
              // with the searched name pre-filled.
              <NewManagerForm companyId={companyId} initialName={searchTerm} onConfirmed={onSelectManager} />
            )}
          </>
        ) : !selectedLetter ? (
          <p style={muted}>Pick a letter to browse managers, or search by name above.</p>
        ) : (
          <>
            {managersForLetter.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '.85rem' }}>
                {managersForLetter.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSelectManager({ id: m.id, displayLabel: m.displayLabel })}
                    style={managerBtn}
                  >
                    <span style={{ fontWeight: 600 }}>{m.displayLabel}</span>
                    {m.roleTitle && <span style={{ color: 'var(--muted)', fontSize: '.78rem' }}> — {m.roleTitle}</span>}
                    {m.avgOverallScore != null && (
                      <span style={{ color: 'var(--primary)', fontSize: '.78rem', marginLeft: '.4rem' }}>
                        {m.avgOverallScore.toFixed(1)}/10 · {m.reviewCount} reviews
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ ...muted, marginBottom: '.75rem' }}>No managers under &ldquo;{selectedLetter}&rdquo; yet.</p>
            )}

            {!showNewForm ? (
              <button className="btn btn-outline" onClick={() => setShowNewForm(true)}>
                Enter a new rating
              </button>
            ) : (
              <NewManagerForm companyId={companyId} onConfirmed={onSelectManager} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

const muted: React.CSSProperties = { fontSize: '.85rem', color: 'var(--muted)' };

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
  marginBottom: '1rem',
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

const panel: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '1rem',
  minHeight: '200px',
};

const managerBtn: React.CSSProperties = {
  textAlign: 'left',
  padding: '.6rem .75rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'white',
  fontSize: '.85rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
  color: 'var(--ink)',
};
