'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { validatePassword } from '@/lib/passwordPolicy';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '.6rem .8rem',
  borderRadius: 8,
  border: '1px solid #E2E8F4',
  fontSize: '.85rem',
  fontFamily: 'inherit',
  color: '#1F2937',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '.75rem',
  fontWeight: 600,
  color: 'var(--muted)',
  marginBottom: '.25rem',
};

/**
 * Shown when the signed-in user has no 'email' identity yet (Google/LinkedIn
 * only) — lets them add a password so they can also sign in with email
 * later. If they change the pre-filled email, Supabase sends a confirmation
 * link to the new address and only applies the change once it's clicked;
 * leaving it unchanged is a no-op on the email side.
 */
export function AddPasswordPanel({ email, onDone }: { email: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [emailValue, setEmailValue] = useState(email);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailChanged, setEmailChanged] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: 'none', border: 'none', color: 'var(--primary)', fontSize: '.8rem',
          fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0,
        }}
      >
        + Add a password
      </button>
    );
  }

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
    const changed = emailValue.trim().toLowerCase() !== email.trim().toLowerCase();

    const { error } = await supabase.auth.updateUser(
      changed ? { email: emailValue.trim(), password } : { password }
    );

    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }

    if (changed) {
      setEmailChanged(true);
      setPending(false);
      return;
    }

    setPending(false);
    onDone();
  }

  if (emailChanged) {
    return (
      <p style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
        Password saved. Check <strong>{emailValue}</strong> to confirm your new email address.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '.55rem', maxWidth: 320 }}>
      <div>
        <label style={labelStyle} htmlFor="add-pw-email">Email</label>
        <input
          id="add-pw-email"
          type="email"
          required
          value={emailValue}
          onChange={(e) => setEmailValue(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle} htmlFor="add-pw-password">Password</label>
        <input
          id="add-pw-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle} htmlFor="add-pw-confirm">Confirm password</label>
        <input
          id="add-pw-confirm"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={inputStyle}
        />
      </div>
      <p style={{ fontSize: '.7rem', color: 'var(--muted)', margin: 0 }}>
        At least 12 characters, with an uppercase letter and a special character.
      </p>
      <div style={{ display: 'flex', gap: '.5rem' }}>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: '.55rem 1rem', borderRadius: 8, border: 'none', background: 'var(--primary)',
            color: 'white', fontWeight: 600, fontSize: '.82rem', fontFamily: 'inherit',
            cursor: pending ? 'not-allowed' : 'pointer', opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? 'Saving…' : 'Save password'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            padding: '.55rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'white',
            color: 'var(--muted)', fontWeight: 600, fontSize: '.82rem', fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
      {error && (
        <p role="alert" style={{ fontSize: '.78rem', color: 'var(--red)', margin: 0 }}>{error}</p>
      )}
    </form>
  );
}
