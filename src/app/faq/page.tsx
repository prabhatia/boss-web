import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import styles from './faq.module.css';

export const metadata = {
  title: 'FAQ — boss',
  description: 'How anonymous ratings work, what we store, and how your data is protected.',
};

const SECTIONS = [
  {
    id: 'anonymity',
    heading: 'Anonymity and ratings',
    items: [
      {
        q: 'Can my employer find out that I rated them?',
        a: 'No. Rating rows have no user ID column at all. When you submit a rating we compute a one-way HMAC-SHA256 token from your user ID and the specific employment record, store that token, and discard the inputs. There is no key that reverses it — not for your employer, not for us.',
      },
      {
        q: 'How can I edit my own review if it is anonymous?',
        a: 'The token is deterministic: the same user and the same employment record always produce the same token. So we can find your existing review to update it, without ever storing who you are.',
      },
      {
        q: 'Why are some company scores hidden?',
        a: 'Scores only appear once a company has five or more approved reviews. At small companies a single visible score could be traced back to the one person who left it. The threshold is three for individual managers and teams.',
      },
      {
        q: 'What happens to my reviews if I delete my account?',
        a: 'Your rating tokens are overwritten with a randomly generated deletion token. The reviews stay so aggregate scores remain accurate, but the link back to you is destroyed permanently and cannot be reconstructed.',
      },
    ],
  },
  {
    id: 'matching',
    heading: 'AI matching',
    items: [
      {
        q: 'How does job matching actually work?',
        a: 'Each night we read your approved ratings and build a preference profile — how much you weight culture, management quality, growth, fairness, and work-life balance. Job matches score 60% on how well a company scores in the dimensions you weight highly, and 40% on semantic similarity between your career profile and the role.',
      },
      {
        q: 'Why do I have no recommendations yet?',
        a: 'Matching activates after three approved ratings. Below that there is not enough signal to distinguish your preferences from the average, and a bad recommendation is worse than none.',
      },
      {
        q: 'Does the AI see my individual reviews?',
        a: 'No. The recommendation engine only ever reads your aggregated preference profile. It never queries the rating tables directly. That separation is enforced in the database schema, not just in policy.',
      },
    ],
  },
  {
    id: 'privacy',
    heading: 'Privacy and data',
    items: [
      {
        q: 'What does LinkedIn share when I connect it?',
        a: 'Your name, email address, and profile photo. That is the full extent of what LinkedIn releases through Sign In with LinkedIn. Work history, skills, and connections are not available to third-party applications, so you add those yourself or upload a resume.',
      },
      {
        q: 'Which sign-in methods do you support?',
        a: 'Google, Apple, and LinkedIn, all through OpenID Connect. You can link more than one to the same account — sign in with Google today and connect LinkedIn later without creating a second profile.',
      },
      {
        q: 'Do you sell my data?',
        a: 'No. Aggregate, anonymised company scores are the product. Individual profiles and individual ratings are never sold, licensed, or shared with employers.',
      },
    ],
  },
  {
    id: 'terms',
    heading: 'Accounts and billing',
    items: [
      {
        q: 'Is the free plan actually free?',
        a: 'Yes, with no card required. Free covers your full profile, unlimited anonymous ratings, company browsing, connections, and messaging. Premium adds salary percentiles, AI job matching, and profile view history.',
      },
      {
        q: 'What counts as a verified review?',
        a: 'Reviews are tied to an employment record on your profile. We check that the employment record exists and matches the company before accepting the rating, and every review passes human moderation before it affects a public score.',
      },
    ],
  },
];

export default async function FaqPage() {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();

  return (
    <>
      <Nav signedIn={!!data.user} />

      <main className={styles.page}>
        <header className={styles.header}>
          <div className="container">
            <h1 className={styles.title}>Questions, answered plainly</h1>
            <p className={styles.sub}>
              How anonymity works, what we store, and what we will never do with
              your data.
            </p>
          </div>
        </header>

        <div className="container" style={{ padding: '3rem 2rem 4rem' }}>
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className={styles.section}>
              <h2 className={styles.sectionHeading}>{section.heading}</h2>
              <div className={styles.items}>
                {section.items.map((item) => (
                  <details key={item.q} className={styles.item}>
                    <summary className={styles.q}>{item.q}</summary>
                    <p className={styles.a}>{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <Footer />
    </>
  );
}
