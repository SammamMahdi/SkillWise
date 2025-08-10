import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function FilePick({ label, onSelect, accept, disabled = false }) {
  return (
    <label className={`inline-block ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <span className={`px-3 py-2 bg-background border border-border rounded-lg transition-all duration-200 ${
        disabled ? 'opacity-50' : 'hover:bg-card hover:border-primary/50'
      }`}>
        {label}
      </span>
      <input
        type="file"
        accept={accept}
        onChange={e => e.target.files?.[0] && onSelect(e.target.files[0])}
        className="hidden"
        disabled={disabled}
      />
    </label>
  );
}

export default function ProfileVisuals() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null); // Store original file
  const [coverFile, setCoverFile] = useState(null); // Store original file
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

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
    setAvatarFile(file); // Store the original file
    setHasChanges(true);
  };

  const selectCover = async (file) => {
    setError('');
    if (file.size > 4 * 1024 * 1024) return setError('Cover too large (max 4MB).');
    setCoverPreview(URL.createObjectURL(file));
    setCoverFile(file); // Store the original file
    setHasChanges(true);
  };

  const saveChanges = async () => {
    if (!hasChanges) return;
    
    setBusy(true);
    setError('');
    
    try {
      // Save avatar if changed
      if (avatarFile) {
        const avatarUrl = await upload('/api/users/me/avatar', avatarFile);
        // Update user state immediately and force re-render
        setUser({ ...user, avatarUrl });
        // Clear preview and file states
        setAvatarPreview(null);
        setAvatarFile(null);
      }
      
      // Save cover if changed
      if (coverFile) {
        const coverUrl = await upload('/api/users/me/cover', coverFile);
        // Update user state immediately and force re-render
        setUser({ ...user, coverUrl });
        // Clear preview and file states
        setCoverPreview(null);
        setCoverFile(null);
      }
      
      setHasChanges(false);
      
      // Show success message
      alert('Profile visuals updated successfully!');
      
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const discardChanges = () => {
    setAvatarPreview(null);
    setCoverPreview(null);
    setAvatarFile(null);
    setCoverFile(null);
    setHasChanges(false);
    setError('');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  // Determine current profile picture source
  const getCurrentProfilePicture = () => {
    if (avatarPreview) return avatarPreview;
    if (user?.avatarUrl) return user.avatarUrl;
    if (user?.googleId && user?.profilePhoto && !user?.avatarUrl) return user.profilePhoto;
    return null;
  };

  const getCurrentCover = () => {
    if (coverPreview) return coverPreview;
    if (user?.coverUrl) return user.coverUrl;
    return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop';
  };

  const currentProfilePicture = getCurrentProfilePicture();
  const currentCover = getCurrentCover();
  const hasGoogleAuth = user?.googleId;
  const hasUploadedPicture = user?.avatarUrl;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1000px] mx-auto px-6 py-8">
        {/* Header with navigation */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Update Profile Visuals</h1>
          <button
            onClick={goToDashboard}
            className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-card/80 hover:border-primary/50 transition-all duration-200"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Cover Photo Section */}
        <div className="rounded-xl overflow-hidden border border-border bg-card mb-8">
          <div
            key={`cover-${user?.coverUrl || 'default'}`}
            className="h-48 sm:h-60 w-full bg-cover bg-center relative"
            style={{
              backgroundImage: `url(${currentCover})`
            }}
          >
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm opacity-80 mb-1">Cover Photo</div>
              <div className="text-xs opacity-60">Upload a new cover photo for your profile</div>
            </div>
            <FilePick
              label={busy ? 'Uploading…' : 'Change Cover'}
              accept="image/png,image/jpeg,image/webp"
              onSelect={selectCover}
              disabled={busy}
            />
          </div>
        </div>

        {/* Profile Picture Section */}
        <div className="rounded-xl border border-border bg-card p-6 mb-8">
          <div className="flex items-start gap-6">
            <div className="relative">
              {currentProfilePicture ? (
                <img
                  key={`avatar-${user?.avatarUrl || 'default'}`}
                  src={currentProfilePicture}
                  className="w-24 h-24 rounded-full object-cover border border-border shadow-lg"
                  alt="Profile picture"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-card border border-border shadow-lg flex items-center justify-center">
                  <div className="text-3xl font-bold text-foreground/40">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </div>
              )}
              {/* Show Google indicator if applicable */}
              {hasGoogleAuth && !hasUploadedPicture && !avatarPreview && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  G
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm opacity-80 mb-2">Profile Picture</div>
              <div className="text-xs opacity-60 mb-4">
                {hasGoogleAuth && !hasUploadedPicture 
                  ? "You're currently using your Google profile picture. Upload a new one to replace it."
                  : "Upload a new profile picture to personalize your account."
                }
              </div>
              <FilePick
                label={busy ? 'Uploading…' : 'Change Profile Picture'}
                accept="image/png,image/jpeg,image/webp"
                onSelect={selectAvatar}
                disabled={busy}
              />
              <p className="text-xs opacity-60 mt-2">Max 4MB. PNG/JPG/WebP.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="text-sm opacity-60">
            {hasChanges ? 'You have unsaved changes' : 'No changes to save'}
          </div>
          <div className="flex gap-3">
            {hasChanges && (
              <button
                onClick={discardChanges}
                className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-card/80 transition-all duration-200"
                disabled={busy}
              >
                Discard Changes
              </button>
            )}
            <button
              onClick={saveChanges}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                hasChanges && !busy
                  ? 'bg-primary text-white hover:bg-primary/80 hover:shadow-lg hover:shadow-primary/25'
                  : 'bg-card border border-border opacity-50 cursor-not-allowed'
              }`}
              disabled={!hasChanges || busy}
            >
              {busy ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 p-4 bg-card/50 border border-border rounded-lg">
          <h3 className="font-semibold mb-2">How it works:</h3>
          <ul className="text-sm opacity-70 space-y-1">
            <li>• Upload a profile picture to replace your current one (including Google profile pictures)</li>
            <li>• Upload a cover photo to customize your profile banner</li>
            <li>• Changes are saved immediately when you click "Save Changes"</li>
            <li>• You can always revert by uploading a new image</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
