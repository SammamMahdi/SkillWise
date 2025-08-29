
import React, { useState } from 'react'
import { updateUserStatus } from '../../services/userService'
import { getProfilePicture, hasGoogleAuthPicture, hasUploadedPicture } from '../../utils/profilePictureUtils'
import { Edit } from 'lucide-react'

// Editable Status Box Component
function StatusBox({ user, refreshUser }) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(user?.variableextra1 || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  console.log('StatusBox render - user:', user);
  console.log('StatusBox render - status:', status);
  console.log('StatusBox render - user.variableextra1:', user?.variableextra1);

  const handleSave = async () => {
    console.log('handleSave called with status:', status);
    setSaving(true);
    setError('');
    try {
      console.log('Attempting to update status to:', status);
      await updateUserStatus(status);
      console.log('Status update API call successful');

      // Try to refresh user data, but don't fail if it doesn't work
      try {
        if (refreshUser) {
          console.log('Refreshing user data...');
          await refreshUser();
          console.log('User data refreshed successfully');
        } else {
          console.log('refreshUser function not available');
        }
      } catch (refreshError) {
        console.warn('Failed to refresh user data, but status was updated:', refreshError);
        // Don't show error to user since the main operation succeeded
      }

      setEditing(false);
      console.log('Status update completed successfully');
    } catch (e) {
      console.error('Status update failed:', e);
      console.error('Error response:', e.response?.data);
      console.error('Error status:', e.response?.status);
      setError(e.response?.data?.error || 'Failed to update status');
    }
    setSaving(false);
  };

  return (
    <div
      className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-4 py-3 sm:py-4 border border-white/20 shadow-sm hover:bg-white/15 hover:border-white/30 transition-all duration-300 group cursor-pointer"
    >
      {editing ? (
        <div className="space-y-3">
          <input
            type="text"
            className="w-full text-xs sm:text-sm md:text-lg font-bold text-primary bg-white/95 backdrop-blur-sm border-2 border-primary/30 rounded-lg px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-primary/50"
            value={status}
            onChange={e => setStatus(e.target.value)}
            maxLength={32}
            disabled={saving}
            placeholder="What's on your mind?"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              className="flex-1 text-xs px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-blue-500 text-white font-medium shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Status'}
            </button>
            <button
              className="text-xs px-4 py-2 rounded-lg bg-white/20 text-primary border-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
          {error && (
            <div className="text-xs text-red-400 bg-red-50/10 backdrop-blur-sm border border-red-200/20 rounded-lg px-3 py-2 animate-pulse">
              {error}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center w-full relative group">
            <div className="text-xs sm:text-sm md:text-lg font-bold text-primary mb-0.5 flex-1 truncate">{status || 'No status set'}</div>
            <button
              className="flex items-center gap-1.5 text-xs text-primary/80 opacity-0 group-hover:opacity-100 transition-all duration-300 ml-2 absolute right-0 top-0 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg border border-white/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50"
              onClick={() => {
                console.log('Edit button clicked');
                setEditing(true);
              }}
              aria-label="Edit status"
              title="Click to edit your status"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="font-medium">Edit</span>
            </button>
          </div>
        </>
      )}
      <div className="text-white/80 text-xs mt-1">Status</div>
    </div>
  );
}

const ProfileBanner = ({ user, profile, displayHandle, fmtDate, refreshUser }) => {
  const profilePicture = getProfilePicture(user)
  const hasGoogleAuth = user?.googleId
  const userHasUploadedPicture = hasUploadedPicture(user)

  return (
    <div className="relative">
      <div
        className="h-48 sm:h-64 md:h-72 lg:h-80 xl:h-96 w-full bg-cover bg-center relative"
        style={{
          backgroundImage: `url(${
            user?.coverUrl ||
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop'
          })`,
        }}
      >
        {/* Gradient overlays for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40" />
      </div>
      
      <div className="absolute inset-0 flex items-center sm:items-end">
        <div className="max-w-[1800px] w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-10 pb-4 sm:pb-6">
          {/* Mobile: Centered layout, Desktop: Side by side */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 lg:gap-8">
            {/* Avatar with names next to it - Horizontal on all screen sizes */}
            <div className="flex flex-row items-center gap-3 sm:gap-4 flex-1">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full ring-4 ring-white/20 object-cover shadow-lg group-hover:ring-primary/20 transition-all duration-300"
                    alt="Profile picture"
                  />
                ) : (
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full ring-4 ring-white/20 bg-white/10 backdrop-blur-sm shadow-lg group-hover:ring-primary/20 transition-all duration-300 flex items-center justify-center">
                    <div className="text-white/60 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  </div>
                )}
                {/* Show indicator if user has Google Auth but no uploaded picture */}
                {hasGoogleAuth && !userHasUploadedPicture && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    G
                  </div>
                )}
              </div>
              {/* Full name and username next to it on all screen sizes */}
              <div className="text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
                  {user?.name || 'Student'}
                </h1>
                {/* Username next to full name on all screen sizes */}
                <span className="text-primary/90 font-bold text-lg sm:text-xl md:text-2xl">@{displayHandle || 'handle'}</span>
              </div>
            </div>
            
            {/* Stats section - Even smaller for mobile */}
            <div className="grid grid-cols-2 sm:flex sm:flex-col gap-1 sm:gap-2 sm:ml-auto sm:text-right">
              <StatusBox user={user} refreshUser={refreshUser} />
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-1 sm:py-2 border border-white/20 shadow-sm">
                <div className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-white mb-0.5">{user?.role || 'Student'}</div>
                <div className="text-white/80 text-xs">Role</div>
              </div>
              
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-1 sm:py-2 border border-white/20 shadow-sm">
                <div className="text-xs sm:text-sm md:text-lg font-semibold text-white/90 mb-0.5">Joined</div>
                <div className="text-white/80 text-xs">{fmtDate(user?.createdAt)}</div>
              </div>
              
              {/* Skill of the Month - moved to stats section */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-1 sm:py-2 border border-white/20 shadow-sm">
                <div className="text-xs sm:text-sm md:text-lg font-semibold text-white/90 mb-0.5">Skill of the Month</div>
                <div className="text-primary font-bold text-xs">{profile.spotlightSkill.month}: {profile.spotlightSkill.title}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileBanner
