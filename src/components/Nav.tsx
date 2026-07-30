'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BossLogo } from './BossLogo';

export function Nav({ signedIn = false }: { signedIn?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo" aria-label="boss home">
        <BossLogo height={42} idSuffix="nav" />
      </Link>

      <ul className={`nav-links${open ? ' open' : ''}`}>
        <li><Link href="/#features" onClick={() => setOpen(false)}>Features</Link></li>
        <li><Link href="/#how-it-works" onClick={() => setOpen(false)}>How it works</Link></li>
        <li><Link href="/#pricing" onClick={() => setOpen(false)}>Pricing</Link></li>
        <li><Link href="/faq" onClick={() => setOpen(false)}>FAQ</Link></li>
        <li><Link href="/companies" onClick={() => setOpen(false)}>Companies</Link></li>
        <li><Link href="/jobs" onClick={() => setOpen(false)}>Jobs</Link></li>
      </ul>

      <div className="nav-actions">
        {signedIn ? (
          <Link href="/dashboard" className="btn btn-primary">Go to dashboard</Link>
        ) : (
          <>
            <Link href="/login" className="btn btn-ghost">Sign in</Link>
            <Link href="/login" className="btn btn-primary">Get started free</Link>
          </>
        )}
      </div>

      <button
        className="hamburger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
      >
        &#9776;
      </button>
    </nav>
  );
}
