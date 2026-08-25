'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { api, ApiError } from '@/lib/api';

/**
 * LinkedIn profile import.
 *
 * WHAT LINKEDIN ACTUALLY RETURNS
 * ------------------------------
 * "Sign In with LinkedIn using OpenID Connect" grants three scopes:
 * openid, profile, email. Those return exactly these claims:
 *
 *   sub, name, given_name, family_name, picture, email, email_verified
 *
 * Work history, education, skills, and connections are NOT in that payload.
 * Those live behind the Marketing Developer Platform and Talent Solutions
 * partner programs, which require a signed agreement with LinkedIn and are
 * not granted to most applications.
 *
 * So this component does two things:
 *   1. Imports the name / email / photo that LinkedIn does return.
 *   2. Offers a resume upload so the user can fill in work history — which
 *      is the path that actually works without partner approval.
 */

type ImportState = 'idle' | 'importing' | 'done' | 'error';

interface LinkedInIdentity {
  name?: string;
  email?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export function LinkedInImport({ onImported }: { onImported?: () => void }) {
  const [state, setState] = useState<ImportState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);

  // Detect whether the user already has a LinkedIn identity attached.
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const identities = data.user?.identities ?? [];
      setLinked(identities.some((i) => i.provider === 'linkedin_oidc'));
    })();
  }, []);

  /**
   * If the user signed in with Google or Apple, this links LinkedIn as an
   * additional identity on the same account. If they already signed in with
   * LinkedIn, we read the claims straight from the existing session.
   */
  async function connectLinkedIn() {
    setState('importing');
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.linkIdentity({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        scopes: 'openid profile email',
      },
    });

    if (error) {
      setState('error');
      setMessage(error.message);
    }
    // On success the browser navigates to LinkedIn.
  }

  /** Pulls the LinkedIn claims out of the session and writes them to the profile service. */
  async function importFromSession() {
    setState('importing');
    setMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw new Error('Not signed in');

      const li = data.user.identities?.find((i) => i.provider === 'linkedin_oidc');
      if (!li) {
        setState('error');
        setMessage('Connect LinkedIn first, then import.');
        return;
      }

      const claims = (li.identity_data ?? {}) as LinkedInIdentity;

      const displayName =
        claims.name ??
        [claims.given_name, claims.family_name].filter(Boolean).join(' ') ??
        undefined;

      await api.patch('profile', '/profiles/me', {
        displayName: displayName || undefined,
      });

      setState('done');
      setMessage(
        'Imported your name, email, and photo from LinkedIn. Add your work history below — LinkedIn does not release job history to third-party apps.'
      );
      onImported?.();
    } catch (e) {
      setState('error');
      setMessage(
        e instanceof ApiError ? e.message : 'Import failed. Please try again.'
      );
    }
  }

  return (
    <div style={{ marginTop: '.75rem' }}>
      {!linked ? (
        <button
          onClick={connectLinkedIn}
          disabled={state === 'importing'}
          style={btnLinkedIn}
        >
          <LinkedInIcon />
          {state === 'importing' ? 'Redirecting…' : 'Connect LinkedIn'}
        </button>
      ) : (
        <button
          onClick={importFromSession}
          disabled={state === 'importing'}
          style={btnLinkedInSync}
        >
          <LinkedInIcon />
          {state === 'importing' ? 'Syncing…' : 'Sync from LinkedIn'}
        </button>
      )}

      {message && (
        <p
          role="status"
          style={{
            fontSize: '.72rem',
            marginTop: '.5rem',
            lineHeight: 1.5,
            color: state === 'error' ? 'var(--red)' : 'var(--green)',
          }}
        >
          {message}
        </p>
      )}

      <div
        style={{
          marginTop: '.75rem',
          padding: '.7rem .8rem',
          background: 'var(--amber-lt)',
          border: '1px solid #FDE68A',
          borderRadius: 8,
          fontSize: '.7rem',
          lineHeight: 1.6,
          color: '#92400E',
        }}
      >
        <strong>What LinkedIn shares:</strong> name, email, and profile photo
        only. Work history and skills stay on LinkedIn — their API does not
        release those to third-party apps. Upload a resume to fill in the rest.
      </div>
    </div>
  );
}

const btnLinkedIn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '.45rem',
  background: '#0A66C2',
  color: 'white',
  border: 'none',
  borderRadius: 8,
  padding: '.5rem 1rem',
  fontSize: '.82rem',
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  width: '100%',
  transition: 'background .15s',
};

/** Smaller, non-full-width variant — used once LinkedIn is already connected, so this reads as a lightweight re-sync action rather than the primary connect CTA. */
const btnLinkedInSync: React.CSSProperties = {
  ...btnLinkedIn,
  display: 'inline-flex',
  width: 'auto',
  padding: '.35rem .75rem',
  fontSize: '.72rem',
  borderRadius: 999,
};

function LinkedInIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}
