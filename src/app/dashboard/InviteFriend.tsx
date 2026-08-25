'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { InfoTooltip } from '@/components/InfoTooltip';

const EMAIL_PATTERN = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;
const SUBJECT =
  'I invite you to register on boss-platform - a one stop site to apply to jobs tailored by your preferences for company and managers with salary insights';

/**
 * Opens the user's own mail client via a mailto: link — there's no backend
 * email-sending here, "sending" is deferred to the OS/browser's mail app.
 * Token award (5 per valid email) is best-effort on click: a mailto: link
 * can't confirm the mail was actually sent or that the recipient exists,
 * so this is a format-validated count, not a verified referral.
 */
export function InviteFriend() {
  const [to, setTo] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleInvite() {
    const emails = to.split(',').map((e) => e.trim()).filter(Boolean);
    const validEmails = emails.filter((e) => EMAIL_PATTERN.test(e));

    if (validEmails.length === 0) {
      setError('Enter at least one valid email address.');
      return;
    }
    setError(null);

    // Best-effort — never blocks opening the mail client on failure.
    api.patch('profile', '/profiles/me/tokens/earn', { reason: 'REFERRAL', count: validEmails.length }).catch(() => {});

    const body =
      `Hi,\n\nI've been using boss-platform to research companies and managers before applying for jobs, ` +
      `and to see real salary insights. Thought you'd find it useful too.\n\nCheck it out: ${window.location.origin}`;

    const mailto = `mailto:${validEmails.join(',')}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  return (
    <div style={wrap}>
      <span style={labelRow}>
        To
        <InfoTooltip text="Enter comma separated email addresses" />
      </span>
      <input
        type="text"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        placeholder="sample1@abc.com, sample2@abc.com"
        style={input}
      />
      {error && <p style={{ fontSize: '.7rem', color: 'var(--red)', marginTop: '.3rem' }}>{error}</p>}
      <button onClick={handleInvite} style={link}>
        Invite a friend
      </button>
    </div>
  );
}

const wrap: React.CSSProperties = { marginTop: '.6rem' };

const labelRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '.72rem',
  fontWeight: 600,
  color: 'var(--body)',
  marginBottom: '.3rem',
};

const input: React.CSSProperties = {
  width: '100%',
  padding: '.4rem .5rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '.78rem',
  fontFamily: 'inherit',
  color: 'var(--ink)',
};

const link: React.CSSProperties = {
  display: 'block',
  marginTop: '.4rem',
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
