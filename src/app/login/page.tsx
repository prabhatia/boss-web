import Link from 'next/link';
import { Suspense } from 'react';
import { BossLogo } from '@/components/BossLogo';
import { OAuthButtons } from '@/components/OAuthButtons';
import styles from './login.module.css';

export const metadata = { title: 'Sign in — boss' };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next ?? '/dashboard';

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <Link href="/" className={styles.logo} aria-label="boss home">
          <BossLogo height={48} wordSize="2.2rem" idSuffix="login" />
        </Link>

        <h1 className={styles.title}>Sign in to boss</h1>
        <p className={styles.sub}>
          One account for your profile, your ratings, and your job matches.
        </p>

        <Suspense fallback={<div className={styles.skeleton} />}>
          <OAuthButtons next={next} />
        </Suspense>

        <p className={styles.legal}>
          By continuing you agree to our{' '}
          <Link href="/faq#terms">Terms</Link> and{' '}
          <Link href="/faq#privacy">Privacy Policy</Link>. Your workplace ratings
          are stored anonymously and are never linked back to this account.
        </p>
      </div>

      <Link href="/" className={styles.back}>← Back to home</Link>
    </main>
  );
}
