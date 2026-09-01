'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Mode = 'signin' | 'signup';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '.7rem .9rem',
  borderRadius: 8,
  border: '1px solid #E2E8F4',
  fontSize: '.88rem',
  fontFamily: 'inherit',
  color: '#1F2937',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '.78rem',
  fontWeight: 600,
  color: 'var(--muted)',
  marginBottom: '.3rem',
};

/**
 * Email/password sign-in, and a two-step sign-up (verify email via a
 * clicked link, then choose a password on /signup/complete) — see
 * EmailAuthForm's sibling, src/app/signup/complete/page.tsx.
 */
export function EmailAuthForm({ next = '/dashboard' }: { next?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    router.push(next);
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/signup/complete')}`,
      },
    });

    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    setSent(true);
    setPending(false);
  }

  if (sent) {
    return (
      <p style={{ fontSize: '.85rem', color: 'var(--muted)', textAlign: 'center', marginTop: '.75rem' }}>
        Check <strong>{email}</strong> for a verification link. Click it to finish setting up your account.
      </p>
    );
  }

  return (
    <div style={{ marginTop: '.75rem' }}>
      <div style={{ display: 'flex', gap: '.4rem', marginBottom: '.9rem', fontSize: '.82rem' }}>
        <button
          type="button"
          onClick={() => { setMode('signin'); setError(null); }}
          style={{
            flex: 1, padding: '.4rem', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontFamily: 'inherit',
            background: mode === 'signin' ? 'var(--bg)' : 'transparent',
            color: mode === 'signin' ? 'var(--primary)' : 'var(--muted)',
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setError(null); }}
          style={{
            flex: 1, padding: '.4rem', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontFamily: 'inherit',
            background: mode === 'signup' ? 'var(--bg)' : 'transparent',
            color: mode === 'signup' ? 'var(--primary)' : 'var(--muted)',
          }}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} style={{ display: 'grid', gap: '.7rem' }}>
        <div>
          <label style={labelStyle} htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="you@example.com"
          />
        </div>

        {mode === 'signin' && (
          <div>
            <label style={labelStyle} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          style={{
            width: '100%', padding: '.75rem', borderRadius: 10, border: 'none',
            background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '.9rem',
            fontFamily: 'inherit', cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.6 : 1,
          }}
        >
          {pending
            ? 'Please wait…'
            : mode === 'signin' ? 'Sign in' : 'Send verification link'}
        </button>
      </form>

      {error && (
        <p role="alert" style={{ marginTop: '.6rem', fontSize: '.82rem', color: 'var(--red)', textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  );
}
