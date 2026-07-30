import Link from 'next/link';

export const metadata = { title: 'Sign-in problem — boss' };

const HINTS: Record<string, string> = {
  missing_code: 'The provider did not return an authorization code. Try signing in again.',
  access_denied: 'You cancelled the sign-in before it finished.',
  redirect_uri_mismatch:
    'This callback URL is not registered. Add it under Authentication → URL Configuration in Supabase.',
};

export default function AuthCodeError({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const reason = searchParams.reason ?? 'unknown';
  const hint = HINTS[reason];

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1.25rem', textAlign: 'center', gap: '1rem',
    }}>
      <div style={{ fontSize: '2.5rem' }}>⚠️</div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }}>
        We could not finish signing you in
      </h1>
      <p style={{ color: 'var(--muted)', maxWidth: 440, fontSize: '.92rem' }}>
        {hint ?? 'Something went wrong during the handoff back from your provider.'}
      </p>
      {!hint && reason !== 'unknown' && (
        <code style={{
          fontSize: '.75rem', background: 'var(--bg)', color: 'var(--body)',
          padding: '.5rem .8rem', borderRadius: 6, maxWidth: 440,
          wordBreak: 'break-word',
        }}>
          {reason}
        </code>
      )}
      <Link href="/login" className="btn btn-primary btn-lg" style={{ marginTop: '.5rem' }}>
        Try signing in again
      </Link>
    </main>
  );
}
