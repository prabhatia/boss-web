'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BossLogo } from '@/components/BossLogo';
import {
  api, ApiError,
  type ModerationQueueSummary, type PendingReviewItem, type AuditHistory,
} from '@/lib/api';
import { AdminUserRoleManager } from './AdminUserRoleManager';
import { AdminAllRatingsClient } from './AdminAllRatingsClient';
import styles from './admin.module.css';

type Tab = 'company' | 'manager' | 'group' | 'manager-identity' | 'salary';

const TAB_CONFIG: Record<Tab, { label: string; entityType: string; description: string }> = {
  'company':          {
    label: 'Company Ratings', entityType: 'COMPANY_RATING',
    description: 'Ratings a candidate submitted about a company — the company name is shown so you can see what’s being reviewed.',
  },
  'manager':          {
    label: 'Manager Ratings', entityType: 'MANAGER_RATING',
    description: 'Approving here publishes this rating’s scores and review text publicly — it does NOT reveal the manager’s real name. Until their name claim is separately approved under "Manager Name Claims," this rating still displays under the generic "Manager (pending verification)" alias, not a real name.',
  },
  'group':            {
    label: 'Group Ratings', entityType: 'GROUP_RATING',
    description: 'Ratings a candidate submitted about a team/group within a company (collaboration, autonomy, inclusion, work-life balance) — a separate rating type from company and manager ratings.',
  },
  'manager-identity': {
    label: 'Manager Name Claims', entityType: 'MANAGER_IDENTITY',
    description: 'Managers are anonymous by default, shown everywhere only as "Manager (pending verification)." A rater has claimed this manager’s real name + LinkedIn URL. Approving here "unhides" that name — it immediately replaces the generic alias on the company’s own manager directory (where ratings and the "Rate a manager" search live) and in the cross-company /people search. Rejecting keeps them anonymous. This is separate from approving any rating about this manager.',
  },
  'salary':           {
    label: 'Salary Submissions', entityType: 'SALARY_SUBMISSION',
    description: 'Self-reported compensation data submitted for a company.',
  },
};
// 'group' intentionally excluded — no UI anywhere lets a candidate submit a
// group rating yet, so this queue could never have real content. The backend
// endpoints (GroupRatingRepository.findByModerationStatus,
// ModerationService.getPendingGroupRatings, GET .../pending/group) and the
// 'group' entry in TAB_CONFIG above are left in place — add 'group' back
// here (and restore its SummaryCard below) once a submission flow exists.
const TAB_ORDER: Tab[] = ['company', 'manager', 'manager-identity', 'salary'];

interface Page<T> { content: T[]; totalElements: number; }

export function AdminModerationClient({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [summary, setSummary] = useState<ModerationQueueSummary | null>(null);
  const [tab, setTab] = useState<Tab>('company');
  const [items, setItems] = useState<PendingReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [auditFor, setAuditFor] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditHistory | null>(null);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [showAllRatings, setShowAllRatings] = useState(false);
  const [importingJobs, setImportingJobs] = useState(false);
  const [jobsImportResult, setJobsImportResult] = useState<string | null>(null);

  async function runJobsImport() {
    setImportingJobs(true);
    setJobsImportResult(null);
    try {
      await api.post('jobs', '/admin/jobs/external/import');
      setJobsImportResult('Import complete.');
    } catch (e) {
      setJobsImportResult(e instanceof ApiError ? e.message : 'Import failed. Please try again.');
    } finally {
      setImportingJobs(false);
    }
  }

  async function loadSummary() {
    try {
      setSummary(await api.get<ModerationQueueSummary>('company', '/admin/moderation/summary'));
    } catch {
      // non-fatal — the per-tab list below is the primary source of truth
    }
  }

  async function loadTab(t: Tab) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Page<PendingReviewItem>>('company', `/admin/moderation/pending/${t}`);
      setItems(res.content);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load this queue.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSummary(); }, []);
  useEffect(() => { loadTab(tab); setAuditFor(null); }, [tab]);

  async function decide(item: PendingReviewItem, action: 'APPROVED' | 'REJECTED' | 'FLAGGED') {
    setBusyId(item.id);
    setError(null);
    try {
      await api.post('company', `/admin/moderation/${tab}/${item.id}`, {
        action,
        reason: reasonDrafts[item.id]?.trim() || undefined,
      });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      loadSummary();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save that decision.');
    } finally {
      setBusyId(null);
    }
  }

  async function viewAudit(item: PendingReviewItem) {
    if (auditFor === item.id) { setAuditFor(null); return; }
    setAuditFor(item.id);
    setAudit(null);
    try {
      const history = await api.get<AuditHistory>(
        'company', `/admin/moderation/audit/${TAB_CONFIG[tab].entityType}/${item.id}`
      );
      setAudit(history);
    } catch {
      setAudit({ entityType: TAB_CONFIG[tab].entityType, entityId: item.id, entries: [] });
    }
  }

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.logo} aria-label="boss home">
          <BossLogo height={30} wordSize="1.3rem" idSuffix="admin" />
        </Link>
        <Link href="/dashboard" className={styles.backLink}>← Back to dashboard</Link>
      </header>

      <div className={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
          <h1 className={styles.title}>Moderation</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {jobsImportResult && <span className={styles.muted}>{jobsImportResult}</span>}
            <button
              onClick={runJobsImport}
              disabled={importingJobs}
              className="btn btn-outline"
              style={{ fontSize: '.85rem' }}
            >
              {importingJobs ? 'Importing jobs…' : 'Import external jobs'}
            </button>
            {!showAllRatings && (
              <button
                onClick={() => setShowAllRatings(true)}
                className="btn btn-outline"
                style={{ fontSize: '.85rem' }}
              >
                View All Ratings
              </button>
            )}
          </div>
        </div>

        {showAllRatings ? (
          <AdminAllRatingsClient onClose={() => setShowAllRatings(false)} />
        ) : (
          <>

        {isSuperAdmin && <AdminUserRoleManager />}

        {summary && (
          <div className={styles.summaryRow}>
            <SummaryCard label="Company ratings" value={summary.pendingCompanyRatings} onClick={() => setTab('company')} />
            <SummaryCard label="Manager ratings" value={summary.pendingManagerRatings} onClick={() => setTab('manager')} />
            {/* Group ratings card intentionally omitted — see TAB_ORDER comment above. */}
            <SummaryCard label="Manager name claims" value={summary.pendingManagerIdentities} onClick={() => setTab('manager-identity')} />
          </div>
        )}

        <div className={styles.tabs}>
          {TAB_ORDER.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={tab === t ? styles.tabActive : styles.tab}
            >
              {TAB_CONFIG[t].label}
            </button>
          ))}
        </div>

        <p className={styles.muted} style={{ marginBottom: '1rem' }}>{TAB_CONFIG[tab].description}</p>

        {error && <p className={styles.error}>{error}</p>}

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : items.length === 0 ? (
          <p className={styles.muted}>Nothing pending in this queue.</p>
        ) : (
          <div className={styles.list}>
            {items.map((item) => (
              <article key={item.id} className={styles.item}>
                <div className={styles.itemHead}>
                  <div>
                    <div className={styles.itemTitle}>{item.title}</div>
                    <div className={styles.itemMeta}>
                      {item.overallScore != null && `Score: ${item.overallScore} · `}
                      Submitted {new Date(item.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {item.preview && <p className={styles.itemPreview}>{item.preview}</p>}

                <input
                  type="text"
                  placeholder="Reason (optional, shown in audit log)"
                  value={reasonDrafts[item.id] ?? ''}
                  onChange={(e) => setReasonDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  className={styles.reasonInput}
                />

                <div className={styles.actions}>
                  <button
                    className="btn btn-primary"
                    disabled={busyId === item.id}
                    onClick={() => decide(item, 'APPROVED')}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-outline"
                    disabled={busyId === item.id}
                    onClick={() => decide(item, 'REJECTED')}
                  >
                    Reject
                  </button>
                  <button
                    className="btn btn-ghost"
                    disabled={busyId === item.id}
                    onClick={() => decide(item, 'FLAGGED')}
                  >
                    Flag
                  </button>
                  <button className="btn btn-ghost" onClick={() => viewAudit(item)}>
                    {auditFor === item.id ? 'Hide history' : 'History'}
                  </button>
                </div>

                {auditFor === item.id && (
                  <div className={styles.audit}>
                    {audit === null ? (
                      <p className={styles.muted}>Loading history…</p>
                    ) : audit.entries.length === 0 ? (
                      <p className={styles.muted}>No prior moderation actions.</p>
                    ) : (
                      audit.entries.map((e) => (
                        <div key={e.id} className={styles.auditEntry}>
                          <strong>{e.action}</strong> ({e.previousStatus} → {e.newStatus})
                          {e.reason && ` — "${e.reason}"`}
                          <span className={styles.muted}> · {new Date(e.createdAt).toLocaleString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </main>
  );
}

function SummaryCard({ label, value, onClick }: { label: string; value: number; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={styles.summaryCard} style={{ width: '100%', cursor: onClick ? 'pointer' : 'default', font: 'inherit' }}>
      <div className={styles.summaryValue}>{value}</div>
      <div className={styles.summaryLabel}>{label}</div>
    </button>
  );
}
