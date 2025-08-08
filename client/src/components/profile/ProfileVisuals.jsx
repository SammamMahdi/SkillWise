import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function FilePick({ label, onSelect, accept }) {
  return (
    <label className="inline-block">
      <span className="px-3 py-2 bg-background border border-border rounded-lg cursor-pointer hover:bg-card">
        {label}
      </span>
      <input
        type="file"
        accept={accept}
        onChange={e => e.target.files?.[0] && onSelect(e.target.files[0])}
        className="hidden"
      />
    </label>
  );
}

export default function ProfileVisuals() {
  const { user, setUser } = useAuth(); // ensure setUser exists in your context
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (endpoint, file) => {
    const fd = new FormData();
    fd.append('image', file);

    const token = localStorage.getItem('token');
    const r = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    });

    if (!r.ok) {
      let msg = `Upload failed (${r.status})`;
      try { const errJson = await r.json(); msg = errJson.message || msg; } catch {}
      throw new Error(msg);
    }
    const j = await r.json();
    if (!j.success) throw new Error(j.message || 'Upload failed');
    return j.url;
  };

  const selectAvatar = async (file) => {
    setError('');
    if (file.size > 4 * 1024 * 1024) return setError('Avatar too large (max 4MB).');
    setAvatarPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      const url = await upload('/api/users/me/avatar', file);
      setUser?.(u => ({ ...u, avatarUrl: url }));
    } catch (e) {
      setError(e.message);
      setAvatarPreview(null);
    } finally { setBusy(false); }
  };

  const selectCover = async (file) => {
    setError('');
    if (file.size > 4 * 1024 * 1024) return setError('Cover too large (max 4MB).');
    setCoverPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      const url = await upload('/api/users/me/cover', file);
      setUser?.(u => ({ ...u, coverUrl: url }));
    } catch (e) {
      setError(e.message);
      setCoverPreview(null);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1000px] mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-6">Update Profile Visuals</h1>
        {error && <div className="mb-4 text-sm text-red-400">{error}</div>}

        {/* Cover */}
        <div className="rounded-xl overflow-hidden border border-border bg-card mb-8">
          <div
            className="h-48 sm:h-60 w-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${coverPreview || user?.coverUrl || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop'})`
            }}
          />
          <div className="p-4 flex items-center justify-between">
            <div className="text-sm opacity-80">Cover Photo</div>
            <FilePick
              label={busy ? 'Uploading…' : 'Change Cover'}
              accept="image/png,image/jpeg,image/webp"
              onSelect={selectCover}
            />
          </div>
        </div>

        {/* Avatar */}
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-6">
          <img
            src={avatarPreview || user?.avatarUrl || 'https://placekitten.com/200/200'}
            className="w-24 h-24 rounded-full object-cover border border-border"
            alt=""
          />
          <div className="flex-1">
            <div className="text-sm opacity-80 mb-2">Profile Picture</div>
            <FilePick
              label={busy ? 'Uploading…' : 'Change Avatar'}
              accept="image/png,image/jpeg,image/webp"
              onSelect={selectAvatar}
            />
            <p className="text-xs opacity-60 mt-2">Max 4MB. PNG/JPG/WebP.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
