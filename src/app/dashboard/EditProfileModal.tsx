'use client';

import { useRef, useState } from 'react';
import { api, ApiError, type ProfileResponse } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { validatePassword } from '@/lib/passwordPolicy';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '.6rem .8rem',
  borderRadius: 8,
  border: '1px solid #E2E8F4',
  fontSize: '.85rem',
  fontFamily: 'inherit',
  color: '#1F2937',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '.75rem',
  fontWeight: 600,
  color: 'var(--muted)',
  marginBottom: '.3rem',
};

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  DECLINE_TO_IDENTIFY: 'Decline to identify',
};

export function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: ProfileResponse | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [gender, setGender] = useState(profile?.gender ?? '');
  const [prefix, setPrefix] = useState(profile?.prefix ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const updated = await api.upload<ProfileResponse>('profile', '/profiles/me/avatar', formData);
      setAvatarUrl(updated.avatarUrl);
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.message : 'Upload failed. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password || confirm) {
      const validationError = validatePassword(password);
      if (validationError) {
        setError(validationError);
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match.');
        return;
      }
    }

    setSaving(true);
    try {
      if (password) {
        const supabase = createClient();
        const { error: pwError } = await supabase.auth.updateUser({ password });
        if (pwError) {
          setError(pwError.message);
          setSaving(false);
          return;
        }
        api.post('profile', '/profiles/me/password-set').catch(() => {});
      }

      await api.patch('profile', '/profiles/me', {
        gender: gender || null,
        prefix: prefix || null,
      });

      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save changes. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: '1.5rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 420,
          maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 40px rgba(15,23,42,.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Edit Profile</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--muted)', cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem' }}>
          {/* ── Profile picture ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem' }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: 'var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
              }}>
                🙂
              </div>
            )}
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                style={{
                  padding: '.45rem .85rem', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'white', color: 'var(--primary)', fontWeight: 600, fontSize: '.78rem',
                  fontFamily: 'inherit', cursor: avatarUploading ? 'not-allowed' : 'pointer',
                }}
              >
                {avatarUploading ? 'Uploading…' : 'Change picture'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              {avatarError && <p style={{ fontSize: '.72rem', color: 'var(--red)', margin: '.3rem 0 0' }}>{avatarError}</p>}
            </div>
          </div>

          {/* ── Prefix ── */}
          <div>
            <label style={labelStyle} htmlFor="edit-prefix">Prefix</label>
            <input
              id="edit-prefix"
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="Dr., Prof., …"
              style={inputStyle}
            />
          </div>

          {/* ── Gender ── */}
          <div>
            <label style={labelStyle} htmlFor="edit-gender">Gender</label>
            <select
              id="edit-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={inputStyle}
            >
              <option value="">Prefer not to say / unset</option>
              {Object.entries(GENDER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* ── Password ── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '.9rem' }}>
            <label style={labelStyle} htmlFor="edit-password">New password (optional)</label>
            <input
              id="edit-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...inputStyle, marginBottom: '.5rem' }}
              placeholder="Leave blank to keep your current password"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={inputStyle}
              placeholder="Confirm new password"
            />
            <p style={{ fontSize: '.68rem', color: 'var(--muted)', margin: '.35rem 0 0' }}>
              At least 12 characters, with an uppercase letter and a special character.
            </p>
          </div>

          {error && (
            <p role="alert" style={{ fontSize: '.8rem', color: 'var(--red)', margin: 0 }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: '.6rem', marginTop: '.2rem' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1, padding: '.7rem', borderRadius: 10, border: 'none', background: 'var(--primary)',
                color: 'white', fontWeight: 600, fontSize: '.85rem', fontFamily: 'inherit',
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '.7rem 1.1rem', borderRadius: 10, border: '1px solid var(--border)', background: 'white',
                color: 'var(--muted)', fontWeight: 600, fontSize: '.85rem', fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
