import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { OAuthButtons } from '@/components/OAuthButtons';
import { createClient } from '@/lib/supabase/server';
import styles from './landing.module.css';

export default async function LandingPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  const signedIn = !!data.user;

  return (
    <>
      <Nav signedIn={signedIn} />

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>✦ Now in beta — join 12,000+ professionals</div>
        <h1 className={styles.heroTitle}>
          The <span className={styles.gradientText}>truth about work</span>
          <br />— for everyone.
        </h1>
        <p className={styles.heroSub}>
          Rate your managers anonymously. Discover companies that match your values.
          Find jobs powered by your real workplace preferences.
        </p>

        {signedIn ? (
          <div className={styles.heroActions}>
            <Link href="/dashboard" className="btn btn-primary btn-xl">
              Go to your dashboard
            </Link>
            <Link href="/companies" className="btn btn-outline btn-xl">
              Browse company ratings
            </Link>
          </div>
        ) : (
          <div className={styles.heroAuth}>
            <OAuthButtons next="/dashboard" />
            <p className={styles.heroAuthNote}>
              Free forever. No credit card. Your ratings stay anonymous.
            </p>
          </div>
        )}

        <div className={styles.heroSocial}>
          <div className={styles.avatars}>
            <div className={styles.av} />
            <div className={styles.av} style={{ background: 'linear-gradient(135deg,#6EE7B7,#3B82F6)' }} />
            <div className={styles.av} style={{ background: 'linear-gradient(135deg,#FCA5A5,#F87171)' }} />
            <div className={styles.av} style={{ background: 'linear-gradient(135deg,#93C5FD,#3B82F6)' }} />
          </div>
          <span>
            Join <strong>12,000+</strong> professionals already using{' '}
            <span className="brand-word">boss</span>
          </span>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className={styles.trustBar}>
        <div className={styles.trustItem}><span>🔒</span> 100% Anonymous ratings</div>
        <div className={styles.trustItem}><span>🛡️</span> GDPR &amp; CCPA compliant</div>
        <div className={styles.trustItem}><span>✅</span> Human-moderated reviews</div>
        <div className={styles.trustItem}><span>✨</span> AI-powered job matching</div>
        <div className={styles.trustItem}><span>💳</span> No credit card required</div>
      </div>

      {/* ── THREE PILLARS ── */}
      <section className={`section ${styles.pillars}`}>
        <div className="container text-center">
          <div className="section-label">The platform</div>
          <h2 className="section-title">Three platforms. One trusted ecosystem.</h2>
          <p className="section-sub">
            <span className="brand-word">boss</span> combines professional networking,
            workplace transparency, and career intelligence in one place.
          </p>

          <div className={styles.pillarsGrid}>
            <article className={`${styles.pillarCard} ${styles.p1}`}>
              <div className={styles.pillarIcon}>🤝</div>
              <h3>Professional Network</h3>
              <p>
                Build your career profile, connect with professionals who share your
                workplace values, and message directly — all in real time.
              </p>
              <span className={`${styles.pillarTag} ${styles.tagBlue}`}>Like LinkedIn</span>
            </article>

            <article className={`${styles.pillarCard} ${styles.p2}`}>
              <div className={styles.pillarIcon}>⭐</div>
              <h3>Workplace Transparency</h3>
              <p>
                Rate your managers, teams, and companies anonymously. Your identity is
                never stored — only a one-way encrypted token.
              </p>
              <span className={`${styles.pillarTag} ${styles.tagGreen}`}>Like Glassdoor</span>
            </article>

            <article className={`${styles.pillarCard} ${styles.p3}`}>
              <div className={styles.pillarIcon}>💰</div>
              <h3>Career Intelligence</h3>
              <p>
                See verified salary data by role, location, and seniority. Get AI job
                recommendations aligned with your workplace values.
              </p>
              <span className={`${styles.pillarTag} ${styles.tagPurple}`}>Like Levels.fyi</span>
            </article>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="section">
        <div className="container text-center">
          <div className="section-label">How it works</div>
          <h2 className="section-title">Your data works for you</h2>
          <p className="section-sub">Four steps from honest feedback to smarter career decisions.</p>

          <div className={styles.steps}>
            {[
              ['Build your profile', 'Sign in with LinkedIn, Google, or Apple. Add your employment history, skills, and workplace preferences.'],
              ['Rate anonymously', "Submit ratings for managers, teams, and companies you've worked with. Your identity is mathematically protected."],
              ['AI learns your values', 'Our engine builds your preference profile from your ratings — what kind of culture, management, and growth you thrive in.'],
              ['Get matched', 'Receive job recommendations and connection suggestions from people and companies that genuinely match your values.'],
            ].map(([title, body], i) => (
              <div key={title} className={styles.step}>
                <div className={styles.stepNum}>{i + 1}</div>
                <h4>{title}</h4>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className={`section ${styles.featuresBg}`}>
        <div className="container text-center">
          <div className="section-label">Features</div>
          <h2 className="section-title">Everything your career needs</h2>
          <p className="section-sub">Built for professionals who value honesty over hype.</p>

          <div className={styles.featuresGrid}>
            {[
              ['🎭', 'Anonymous Manager Ratings', 'Rate on support, clarity, growth, and fairness. Your identity is replaced with a one-way HMAC token — irrecoverable by anyone, including our admins.'],
              ['✨', 'AI Job Recommendations', '60% preference matching + 40% semantic similarity. Jobs at companies whose culture matches what you have historically valued.'],
              ['💬', 'Real-Time Messaging', 'Direct messages with connected professionals via WebSocket. Typing indicators, read receipts, message history.'],
              ['💵', 'Salary Transparency', 'Anonymous compensation data by role, company, and location. p25 / p50 / p75 / p90 percentile breakdowns.'],
              ['🏢', 'Company Intelligence', 'Culture, management, compensation, growth, and diversity scores. Minimum 5 reviews before scores display.'],
              ['🔗', 'Value-Matched Connections', 'Suggested connections based on shared company ratings and workplace values — not just who you already know.'],
            ].map(([icon, title, body]) => (
              <article key={title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{icon}</div>
                <div>
                  <h4>{title}</h4>
                  <p>{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIVACY ── */}
      <section className={`section ${styles.privacySection}`}>
        <div className="container">
          <div className={styles.privacyGrid}>
            <div>
              <div className="section-label" style={{ color: '#93C5FD' }}>Privacy by design</div>
              <h2 className="section-title" style={{ color: 'white' }}>
                Your identity is mathematically protected
              </h2>
              <p className="section-sub" style={{ color: 'rgba(255,255,255,.75)' }}>
                We do not store who submitted which rating. We store a one-way hash that
                even we cannot reverse.
              </p>

              <div className={styles.privacyPoints}>
                {[
                  ['No user ID on any rating row.', 'Rating tables have no foreign key back to your account.'],
                  ['One-way HMAC token.', 'Generated from your ID and employment record, then discarded.'],
                  ['Minimum review threshold.', 'Scores stay hidden until 5+ reviews exist, preventing identity inference.'],
                  ['Full GDPR erasure.', 'Delete your account and the link is severed permanently.'],
                ].map(([strong, rest]) => (
                  <div key={strong} className={styles.privacyPoint}>
                    <span className={styles.check}>✓</span>
                    <p><strong>{strong}</strong> {rest}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.privacyShield}>
              <div className={styles.shieldIcon}>🛡️</div>
              <h3>How anonymisation works</h3>
              <p>Every rating you submit is stored against this token, never your account.</p>
              <pre className={styles.privacyCode}>
{`rater_token = HMAC_SHA256(
  userId + ":" + employmentId,
  SERVER_SECRET
)

// stored:  a3f8e1c4...  (64 chars)
// user_id: never written`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="section">
        <div className="container text-center">
          <div className="section-label">Pricing</div>
          <h2 className="section-title">Start free. Upgrade when it pays for itself.</h2>
          <p className="section-sub">No credit card required to begin.</p>

          <div className={styles.pricingGrid}>
            <article className={styles.pricingCard}>
              <div className={styles.planName}>Free</div>
              <div className={styles.planPrice}>$0<span>/mo</span></div>
              <p className={styles.planDesc}>Everything you need to get started.</p>
              <ul className={styles.planFeatures}>
                <li>Full professional profile</li>
                <li>Unlimited anonymous ratings</li>
                <li>Company score browsing</li>
                <li>Connection requests and messaging</li>
                <li>Basic job search</li>
              </ul>
              <Link href="/login" className="btn btn-outline btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                Get started free
              </Link>
            </article>

            <article className={`${styles.pricingCard} ${styles.popular}`}>
              <span className={styles.popularBadge}>Most popular</span>
              <div className={styles.planName}>Candidate Premium</div>
              <div className={styles.planPrice}>$12<span>/mo</span></div>
              <p className={styles.planDesc}>For professionals actively managing their career.</p>
              <ul className={styles.planFeatures}>
                <li>Everything in Free</li>
                <li>Full salary data with percentiles</li>
                <li>AI job recommendations</li>
                <li>Advanced company analytics</li>
                <li>Who viewed your profile</li>
              </ul>
              <Link href="/login" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                Start free trial
              </Link>
            </article>

            <article className={styles.pricingCard}>
              <div className={styles.planName}>Employer Pro</div>
              <div className={styles.planPrice}>$99<span>/mo</span></div>
              <p className={styles.planDesc}>For teams hiring with transparency.</p>
              <ul className={styles.planFeatures}>
                <li>Unlimited job postings</li>
                <li>Candidate search and lead capture</li>
                <li>Company profile management</li>
                <li>Sentiment dashboard</li>
                <li>Featured listing credits</li>
              </ul>
              <Link href="/login" className="btn btn-outline btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                Talk to sales
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <h2>Ready to see the truth about work?</h2>
        <p>Join 12,000+ professionals building careers on honest data.</p>
        <div className={styles.heroActions}>
          <Link href="/login" className="btn btn-white btn-xl">Create your free profile</Link>
          <Link href="/companies" className="btn btn-outline-white btn-xl">Browse companies</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
