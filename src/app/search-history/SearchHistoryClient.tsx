'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, type SearchHistoryEntry } from '@/lib/api';

interface Page<T> { content: T[]; totalElements: number; }

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function SearchHistoryClient() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [entries, setEntries] = useState<SearchHistoryEntry[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [unauthenticated, setUnauthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const res = await api.get<Page<SearchHistoryEntry>>(
          'company',
          `/search-history?page=${page}&size=${PAGE_SIZE}`
        );
        if (cancelled) return;
        setEntries(res.content);
        setTotalElements(res.totalElements);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError && e.status === 401) {
          setUnauthenticated(true);
        } else {
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page]);

  function reRun(entry: SearchHistoryEntry) {
    const dest = entry.searchType === 'PERSON' ? '/people' : '/companies';
    router.push(`${dest}?q=${encodeURIComponent(entry.queryText)}`);
  }

  const hasNext = (page + 1) * PAGE_SIZE < totalElements;

  return (
    <main style={{ minHeight: '60vh' }}>
      <div className="container" style={{ padding: '2.5rem 2rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '.4rem' }}>
          Search history
        </h1>
        <p style={{ fontSize: '.88rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          Your past searches on People and Companies. Click one to run it again.
        </p>

        {unauthenticated ? (
          <p style={{ fontSize: '.88rem', color: 'var(--muted)' }}>Sign in to see your search history.</p>
        ) : loading ? (
          <p style={{ fontSize: '.88rem', color: 'var(--muted)' }}>Loading…</p>
        ) : error ? (
          <p style={{ fontSize: '.88rem', color: 'var(--red)' }}>Could not load your search history. Please try again.</p>
        ) : entries.length === 0 ? (
          <p style={{ fontSize: '.88rem', color: 'var(--muted)' }}>
            No searches yet — anything you search for on People or Companies will show up here.
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {entries.map((entry) => (
                <button key={entry.id} onClick={() => reRun(entry)} style={row}>
                  <span style={typeBadge}>{entry.searchType === 'PERSON' ? 'Person' : 'Company'}</span>
                  <span style={{ flex: 1, fontWeight: 600, color: 'var(--ink)' }}>{entry.queryText}</span>
                  <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{formatDate(entry.createdAt)}</span>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '.75rem', marginTop: '1.5rem' }}>
              <button
                className="btn btn-outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ opacity: page === 0 ? .5 : 1 }}
              >
                Previous
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext}
                style={{ opacity: hasNext ? 1 : .5 }}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '.75rem',
  padding: '.75rem 1rem',
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'white',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '.88rem',
  textAlign: 'left',
  width: '100%',
};

const typeBadge: React.CSSProperties = {
  flexShrink: 0,
  width: '4.75rem',
  textAlign: 'center',
  fontSize: '.68rem',
  fontWeight: 700,
  color: 'var(--muted)',
  background: 'var(--bg)',
  borderRadius: 999,
  padding: '.2rem .55rem',
};
