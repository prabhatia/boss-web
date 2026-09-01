'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BossLogo } from '@/components/BossLogo';
import { createClient } from '@/lib/supabase/client';
import { validatePassword } from '@/lib/passwordPolicy';
import styles from '../../login/login.module.css';

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
 * Landed on after clicking the verification link EmailAuthForm sent
 * (see /auth/callback?next=/signup/complete). The user is already
 * authenticated at this point — email verified — they just need to
 * choose a password to finish setting up email/password sign-in.
 */
export default function SignupCompletePage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    router.push('/dashboard');
  }

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <Link href="/" className={styles.logo} aria-label="boss home">
          <BossLogo height={48} wordSize="2.2rem" idSuffix="signup-complete" />
        </Link>

        <h1 className={styles.title}>Choose a password</h1>
        <p className={styles.sub}>
          Your email is verified. Set a password to finish creating your account.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '.7rem', textAlign: 'left' }}>
          <div>
            <label style={labelStyle} htmlFor="new-password">Password</label>
            <input
              id="new-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle} htmlFor="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={inputStyle}
            />
          </div>
          <p style={{ fontSize: '.72rem', color: 'var(--muted)', margin: 0 }}>
            At least 12 characters, with an uppercase letter and a special character.
          </p>

          <button
            type="submit"
            disabled={pending}
            style={{
              width: '100%', padding: '.75rem', borderRadius: 10, border: 'none',
              background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '.9rem',
              fontFamily: 'inherit', cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.6 : 1,
            }}
          >
            {pending ? 'Saving…' : 'Finish sign up'}
          </button>
        </form>

        {error && (
          <p role="alert" style={{ marginTop: '.6rem', fontSize: '.82rem', color: 'var(--red)', textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
