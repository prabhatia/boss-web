'use client';

import { useRef, useState } from 'react';
import { api, ApiError, type ResumeImportResult, type ResumeIdentityMismatchWarning } from '@/lib/api';

/**
 * Resume upload → AI-parsed profile import.
 *
 * Complements LinkedInImport: LinkedIn's API does not release work history
 * or skills to third-party apps, so this is the actual path for filling
 * those in. Backend extracts PDF text (Apache PDFBox) and sends it to an
 * LLM to structure it into positions/skills, then merges into the profile —
 * additive and deduplicated, existing manually-entered fields are never
 * overwritten.
 */

type UploadState = 'idle' | 'uploading' | 'done' | 'error' | 'mismatch';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function ResumeImport({ onImported }: { onImported?: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState<ResumeIdentityMismatchWarning | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  function pickFile() {
    inputRef.current?.click();
  }

  async function upload(file: File, confirm: boolean) {
    setState('uploading');
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await api.upload<ResumeImportResult>(
        'profile',
        confirm ? '/profiles/me/resume?confirm=true' : '/profiles/me/resume',
        formData
      );

      setState('done');
      setMessage(result.message);
      setMismatch(null);
      setPendingFile(null);
      onImported?.();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.details) {
        setState('mismatch');
        setMismatch(e.details as ResumeIdentityMismatchWarning);
        setPendingFile(file);
        return;
      }
      setState('error');
      setMessage(e instanceof ApiError ? e.message : 'Upload failed. Please try again.');
      setMismatch(null);
      setPendingFile(null);
    }
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setState('error');
      setMessage('Only PDF resumes are supported right now.');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setState('error');
      setMessage('Resume file exceeds the 5MB limit.');
      return;
    }

    await upload(file, false);
  }

  function importAnyway() {
    if (pendingFile) upload(pendingFile, true);
  }

  function cancelMismatch() {
    setState('idle');
    setMessage(null);
    setMismatch(null);
    setPendingFile(null);
  }

  return (
    <div style={{ marginTop: '.6rem' }}>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={onFileSelected}
        style={{ display: 'none' }}
      />

      <button
        onClick={pickFile}
        disabled={state === 'uploading'}
        style={btnResume}
      >
        <ResumeIcon />
        {state === 'uploading' ? 'Parsing resume…' : 'Import from resume'}
      </button>

      {state === 'mismatch' && mismatch && (
        <div style={mismatchBox} role="alert">
          <p style={{ margin: 0, fontWeight: 700 }}>{mismatch.message}</p>
          <div style={diffRow}>
            <span style={diffLabel}>Profile name:</span>
            <span>{mismatch.profileName ?? '—'}</span>
          </div>
          <div style={diffRow}>
            <span style={diffLabel}>Resume name:</span>
            <span>{mismatch.resumeName ?? '—'}</span>
          </div>
          {(mismatch.profileLinkedinUrl || mismatch.resumeLinkedinUrl) && (
            <>
              <div style={diffRow}>
                <span style={diffLabel}>Profile LinkedIn:</span>
                <span>{mismatch.profileLinkedinUrl ?? '—'}</span>
              </div>
              <div style={diffRow}>
                <span style={diffLabel}>Resume LinkedIn:</span>
                <span>{mismatch.resumeLinkedinUrl ?? '—'}</span>
              </div>
            </>
          )}
          <div style={{ display: 'flex', gap: '.5rem', marginTop: '.6rem' }}>
            <button onClick={importAnyway} className="btn btn-outline" style={{ fontSize: '.75rem', padding: '.35rem .8rem' }}>
              Import anyway
            </button>
            <button onClick={cancelMismatch} style={cancelBtn}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          role="status"
          style={{
            fontSize: '.72rem',
            marginTop: '.5rem',
            lineHeight: 1.5,
            color: state === 'error' ? 'var(--red)' : 'var(--green)',
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}

const btnResume: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '.45rem',
  background: 'white',
  color: 'var(--ink, #111827)',
  border: '1px solid var(--border, #E5E7EB)',
  borderRadius: 8,
  padding: '.5rem 1rem',
  fontSize: '.82rem',
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  width: '100%',
  transition: 'background .15s',
};

const mismatchBox: React.CSSProperties = {
  marginTop: '.6rem',
  padding: '.7rem .8rem',
  background: 'var(--amber-lt)',
  border: '1px solid #FDE68A',
  borderRadius: 8,
  fontSize: '.75rem',
  lineHeight: 1.6,
  color: '#92400E',
  textAlign: 'left',
};

const diffRow: React.CSSProperties = {
  display: 'flex',
  gap: '.4rem',
  marginTop: '.25rem',
};

const diffLabel: React.CSSProperties = {
  fontWeight: 600,
  flexShrink: 0,
};

const cancelBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: '.35rem .5rem',
  fontSize: '.75rem',
  fontWeight: 600,
  color: '#92400E',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

function ResumeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M12 18v-6" />
      <path d="M9 15l3-3 3 3" />
    </svg>
  );
}
