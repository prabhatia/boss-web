import Link from 'next/link';
import { BossLogo } from './BossLogo';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <BossLogo height={36} wordSize="1.6rem" idSuffix="footer" />
          <p>
            The truth about work — for everyone. Anonymous workplace ratings,
            verified salary data, and AI job matching built on what you
            actually value.
          </p>
        </div>

        <div className="footer-col">
          <h5>Product</h5>
          <Link href="/#features">Features</Link>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/companies">Companies</Link>
          <Link href="/people">People</Link>
          <Link href="/jobs">Jobs</Link>
        </div>

        <div className="footer-col">
          <h5>Company</h5>
          <Link href="/faq">FAQ</Link>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/logo">Brand assets</Link>
        </div>

        <div className="footer-col">
          <h5>Legal</h5>
          <Link href="/faq#privacy">Privacy</Link>
          <Link href="/faq#terms">Terms</Link>
          <Link href="/faq#gdpr">GDPR</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} boss. All rights reserved.</span>
        <span>Built for professionals who value honesty over hype.</span>
      </div>
    </footer>
  );
}
