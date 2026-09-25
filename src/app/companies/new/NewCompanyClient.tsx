'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, type CreateCompanyRequest, type CompanyProfileResponse } from '@/lib/api';
import styles from './newCompany.module.css';

const SIZE_BANDS = [
  { value: 'S_1_10', label: '1-10' },
  { value: 'S_11_50', label: '11-50' },
  { value: 'S_51_200', label: '51-200' },
  { value: 'S_201_500', label: '201-500' },
  { value: 'S_501_1000', label: '501-1000' },
  { value: 'S_1001_5000', label: '1001-5000' },
  { value: 'S_5000_PLUS', label: '5000+' },
];

export function NewCompanyClient() {
  const router = useRouter();
  const [industries, setIndustries] = useState<string[]>([]);
  const [industriesError, setIndustriesError] = useState(false);

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [sizeBand, setSizeBand] = useState('');
  const [headquarters, setHeadquarters] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [foundedYear, setFoundedYear] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setIndustries(await api.get<string[]>('company', '/companies/industries'));
      } catch {
        setIndustriesError(true);
      }
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Enter a company name.');
      return;
    }
    if (!industry) {
      setError('Select an industry.');
      return;
    }

    setSubmitting(true);
    try {
      const req: CreateCompanyRequest = {
        name: name.trim(),
        industry,
        sizeBand: sizeBand || undefined,
        headquarters: headquarters.trim() || undefined,
        website: website.trim() || undefined,
        description: description.trim() || undefined,
        foundedYear: foundedYear ? Number(foundedYear) : undefined,
      };
      const company = await api.post<CompanyProfileResponse>('company', '/companies', req);
      router.push(`/companies/${company.slug}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not create this company. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>Add your company</h1>
          <p className={styles.sub}>
            Create your company&rsquo;s profile so candidates can find and rate it.
          </p>
        </div>
      </header>

      <div style={{ padding: '0 2rem' }}>
        <div className="container" style={{ padding: '2.5rem 0 4rem' }}>
          <form onSubmit={submit} className={styles.card}>
            <label style={fieldLabel}>
              Company name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
                style={input}
              />
            </label>

            <label style={fieldLabel}>
              Industry
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                style={input}
                disabled={industriesError}
              >
                <option value="" disabled>
                  {industriesError ? 'Could not load industries — reload and try again' : 'Select an industry…'}
                </option>
                {industries.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </label>

            <label style={fieldLabel}>
              Company size
              <select value={sizeBand} onChange={(e) => setSizeBand(e.target.value)} style={input}>
                <option value="">Not specified</option>
                {SIZE_BANDS.map((b) => (
                  <option key={b.value} value={b.value}>{b.label} employees</option>
                ))}
              </select>
            </label>

            <label style={fieldLabel}>
              Headquarters
              <input
                type="text"
                value={headquarters}
                onChange={(e) => setHeadquarters(e.target.value)}
                placeholder="San Francisco, CA"
                style={input}
              />
            </label>

            <label style={fieldLabel}>
              Website
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                style={input}
              />
            </label>

            <label style={fieldLabel}>
              Founded year
              <input
                type="number"
                value={foundedYear}
                onChange={(e) => setFoundedYear(e.target.value)}
                placeholder="2015"
                style={input}
              />
            </label>

            <label style={fieldLabel}>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this company do?"
                rows={4}
                style={{ ...input, resize: 'vertical' }}
              />
            </label>

            {error && <p style={{ fontSize: '.78rem', color: 'var(--red)', marginTop: '.2rem', marginBottom: '.75rem' }}>{error}</p>}

            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              {submitting ? 'Creating…' : 'Create company profile'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

const fieldLabel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '.3rem',
  fontSize: '.8rem',
  fontWeight: 600,
  color: 'var(--body)',
  marginBottom: '1rem',
};

const input: React.CSSProperties = {
  padding: '.55rem .65rem',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '.85rem',
  fontFamily: 'inherit',
  color: 'var(--ink)',
  background: 'white',
};
