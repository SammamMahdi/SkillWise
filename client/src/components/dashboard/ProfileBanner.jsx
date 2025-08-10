import React from 'react'

const ProfileBanner = ({ user, profile, displayHandle, fmtDate }) => {
  // Determine which profile picture to show
  const getProfilePicture = () => {
    // First priority: User uploaded profile picture
    if (user?.profilePhoto) {
      return user.profilePhoto
    }
    
    // Second priority: Google profile picture (if user has googleId)
    if (user?.googleId && user?.photoUrl) {
      return user.photoUrl
    }
    
    // No profile picture available
    return null
  }

  const profilePicture = getProfilePicture()

  return (
    <div className="relative mt-16 sm:mt-20">
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
              </div>
              {/* Full name and username next to profile picture on all screen sizes */}
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
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-1 sm:py-2 border border-white/20 shadow-sm">
                <div className="text-xs sm:text-sm md:text-lg lg:text-xl font-bold text-white mb-0.5">{user?.role || 'Student'}</div>
                <div className="text-white/80 text-xs">Role</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-1 sm:py-2 border border-white/20 shadow-sm">
                <div className="text-xs sm:text-sm md:text-lg font-bold text-primary mb-0.5">Top {profile.rankPercentile}%</div>
                <div className="text-white/80 text-xs">of Learners</div>
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
