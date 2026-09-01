'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BossLogo } from '@/components/BossLogo';
import {
  api, ApiError,
  type ModerationQueueSummary, type PendingReviewItem, type AuditHistory,
} from '@/lib/api';
import { AdminUserRoleManager } from './AdminUserRoleManager';
import styles from './admin.module.css';

type Tab = 'company' | 'manager' | 'manager-identity' | 'salary';

const TAB_CONFIG: Record<Tab, { label: string; entityType: string }> = {
  'company':          { label: 'Company Ratings',    entityType: 'COMPANY_RATING' },
  'manager':          { label: 'Manager Ratings',    entityType: 'MANAGER_RATING' },
  'manager-identity': { label: 'Manager Identities', entityType: 'MANAGER_IDENTITY' },
  'salary':           { label: 'Salary Submissions', entityType: 'SALARY_SUBMISSION' },
};
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
        <h1 className={styles.title}>Moderation</h1>

        {isSuperAdmin && <AdminUserRoleManager />}

        {summary && (
          <div className={styles.summaryRow}>
            <SummaryCard label="Company ratings" value={summary.pendingCompanyRatings} />
            <SummaryCard label="Manager ratings" value={summary.pendingManagerRatings} />
            <SummaryCard label="Group ratings" value={summary.pendingGroupRatings} />
            <SummaryCard label="Manager identities" value={summary.pendingManagerIdentities} />
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
      </div>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryValue}>{value}</div>
      <div className={styles.summaryLabel}>{label}</div>
    </div>
  );
}
