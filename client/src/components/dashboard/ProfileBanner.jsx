import React from 'react'

const ProfileBanner = ({ user, profile, displayHandle, fmtDate }) => {
  return (
    <div className="relative">
      <div
        className="h-64 sm:h-72 md:h-80 lg:h-96 w-full bg-cover bg-center"
        style={{
          backgroundImage: `url(${
            user?.coverUrl ||
            'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop'
          })`,
        }}
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex items-end">
        <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-10 pb-4 flex items-end gap-4 sm:gap-6">
          <img
            src={user?.avatarUrl || user?.photoUrl || 'https://placekitten.com/200/200'}
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full ring-4 ring-white object-cover"
            alt=""
          />
          <div className="text-white">
            <h1 className="text-2xl sm:text-3xl font-semibold">{user?.name || 'Student'}</h1>
            {/* NEW: show display handle below the name */}
            <div className="opacity-90 text-sm sm:text-base">@{displayHandle || 'handle'}</div>
            <p className="opacity-90 text-sm sm:text-base mt-1">
              Skill of the Month {profile.spotlightSkill.month} : {profile.spotlightSkill.title}
            </p>
          </div>
          <div className="ml-auto text-right text-white">
            <div className="text-xl sm:text-2xl font-semibold">{user?.role || 'Student'}</div>
            <div className="opacity-90 text-sm sm:text-base">Top {profile.rankPercentile}% of Learners</div>
            <div className="opacity-90 text-sm sm:text-base">Joined {fmtDate(user?.createdAt)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileBanner
