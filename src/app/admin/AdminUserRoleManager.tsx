'use client';

import { useState } from 'react';
import { api, ApiError, type AdminUserLookupResponse } from '@/lib/api';
import styles from './admin.module.css';

/**
 * SUPERADMIN-only: look up a user by email, then grant or remove ADMIN.
 * Both actions hit the same auth-service endpoint the backend already
 * restricts to SUPERADMIN callers when the target is (or would become)
 * an admin — this UI just surfaces that capability.
 */
export function AdminUserRoleManager() {
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState<AdminUserLookupResponse | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [acting, setActing] = useState<'grant' | 'remove' | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setFound(null);
    setNotFound(false);

    const trimmed = email.trim();
    if (!trimmed) return;

    setSearching(true);
    try {
      const result = await api.get<AdminUserLookupResponse>(
        'profile', `/admin/users/lookup?email=${encodeURIComponent(trimmed)}`
      );
      setFound(result);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setNotFound(true);
      } else {
        setError(e instanceof ApiError ? e.message : 'Lookup failed. Please try again.');
      }
    } finally {
      setSearching(false);
    }
  }

  async function setRole(role: 'ADMIN' | 'CANDIDATE') {
    if (!found) return;
    setActing(role === 'ADMIN' ? 'grant' : 'remove');
    setError(null);
    setMessage(null);
    try {
      await api.post('auth', `/admin/users/${found.userId}/role`, { role });
      setMessage(
        role === 'ADMIN'
          ? `${found.email} is now an ADMIN.`
          : `${found.email} is no longer an ADMIN.`
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not update that role.');
    } finally {
      setActing(null);
    }
  }

  return (
    <section className={styles.item} style={{ marginBottom: '1.5rem' }}>
      <div className={styles.itemTitle} style={{ marginBottom: '.75rem' }}>Manage Admins</div>

      <form onSubmit={handleLookup} style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
        <input
          type="email"
          required
          placeholder="user@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFound(null); setNotFound(false); setMessage(null); }}
          className={styles.reasonInput}
          style={{ marginTop: 0, flex: 1, minWidth: 220 }}
        />
        <button type="submit" className="btn btn-outline" disabled={searching}>
          {searching ? 'Looking up…' : 'Look up'}
        </button>
      </form>

      {notFound && (
        <p className={styles.muted} style={{ marginTop: '.6rem' }}>
          No user found with that email.
        </p>
      )}

      {found && (
        <div style={{ marginTop: '.85rem', display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '.85rem', color: 'var(--ink)' }}>
            {found.displayName ? `${found.displayName} — ` : ''}{found.email}
          </span>
          <button
            className="btn btn-primary"
            disabled={acting !== null}
            onClick={() => setRole('ADMIN')}
          >
            {acting === 'grant' ? 'Granting…' : 'Grant ADMIN'}
          </button>
          <button
            className="btn btn-outline"
            disabled={acting !== null}
            onClick={() => setRole('CANDIDATE')}
          >
            {acting === 'remove' ? 'Removing…' : 'Remove ADMIN'}
          </button>
        </div>
      )}

      {message && <p style={{ fontSize: '.82rem', color: 'var(--green)', marginTop: '.6rem' }}>{message}</p>}
      {error && <p className={styles.error} style={{ marginTop: '.6rem' }}>{error}</p>}
    </section>
  );
}
