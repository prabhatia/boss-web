'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Provider = 'google' | 'apple' | 'linkedin_oidc';

const PROVIDERS: {
  id: Provider;
  label: string;
  bg: string;
  color: string;
  border: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'google',
    label: 'Continue with Google',
    bg: '#FFFFFF',
    color: '#1F2937',
    border: '1px solid #E2E8F4',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
      </svg>
    ),
  },
  {
    id: 'apple',
    label: 'Continue with Apple',
    bg: '#000000',
    color: '#FFFFFF',
    border: '1px solid #000000',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.05 12.54c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.83-.81-3-.79-1.55.02-2.97.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.35 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.78.74 3 .72 1.24-.02 2.02-1.12 2.78-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.41-3.69zM14.8 5.44c.63-.77 1.06-1.83.94-2.9-.91.04-2.01.61-2.67 1.37-.59.68-1.1 1.76-.96 2.8 1.01.08 2.05-.51 2.69-1.27z"/>
      </svg>
    ),
  },
  {
    id: 'linkedin_oidc',
    label: 'Continue with LinkedIn',
    bg: '#0A66C2',
    color: '#FFFFFF',
    border: '1px solid #0A66C2',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"/>
      </svg>
    ),
  },
];

export function OAuthButtons({
  next = '/dashboard',
  layout = 'stack',
}: {
  next?: string;
  layout?: 'stack' | 'row';
}) {
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(provider: Provider) {
    setPending(provider);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    // LinkedIn needs the OIDC scopes spelled out; Google and Apple
    // use the defaults Supabase configures for each provider.
    const scopes =
      provider === 'linkedin_oidc' ? 'openid profile email' : undefined;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo, scopes },
    });

    if (error) {
      setError(error.message);
      setPending(null);
    }
    // On success the browser navigates away to the provider.
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexDirection: layout === 'stack' ? 'column' : 'row',
          gap: '.65rem',
        }}
      >
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            onClick={() => signIn(p.id)}
            disabled={pending !== null}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '.6rem',
              width: '100%',
              padding: '.75rem 1.25rem',
              borderRadius: 10,
              background: p.bg,
              color: p.color,
              border: p.border,
              fontSize: '.9rem',
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: pending ? 'not-allowed' : 'pointer',
              opacity: pending && pending !== p.id ? 0.5 : 1,
              transition: 'opacity .15s, transform .15s',
            }}
          >
            {pending === p.id ? (
              <span>Redirecting…</span>
            ) : (
              <>
                {p.icon}
                <span>{p.label}</span>
              </>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          style={{
            marginTop: '.75rem',
            fontSize: '.82rem',
            color: 'var(--red)',
            textAlign: 'center',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
