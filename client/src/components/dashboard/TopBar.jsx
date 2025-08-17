import React from 'react'
import { Link } from 'react-router-dom'
import NotificationCenter from '../notifications/NotificationCenter'

const TopBar = ({ 
  user, 
  openUser, 
  setOpenUser, 
  openActions, 
  setOpenActions, 
  userMenuRef, 
  actionsMenuRef, 
  isCourseCreator, 
  handleLogout, 
  theme, 
  setTheme, 
  displayHandle 
}) => {
  // Determine which profile picture to show
  const getProfilePicture = () => {
    // First priority: User uploaded profile picture (avatarUrl)
    if (user?.avatarUrl) {
      return user.avatarUrl
    }
    
    // Second priority: Google profile picture (only if user has googleId and no uploaded picture)
    if (user?.googleId && user?.profilePhoto && !user?.avatarUrl) {
      return user.profilePhoto
    }
    
    // No profile picture available
    return null
  }

  const profilePicture = getProfilePicture()

  // Enhanced glow styles for topbar links/buttons
  const glow = 'transition-all duration-300 rounded-xl hover:bg-card/60 hover:shadow-[0_8px_32px_rgba(124,58,237,0.3)] hover:ring-1 hover:ring-primary/50 backdrop-blur-sm hover:scale-105'
  const buttonGlow = 'transition-all duration-300 rounded-xl hover:bg-card/80 hover:shadow-[0_8px_32px_rgba(124,58,237,0.4)] hover:ring-1 hover:ring-primary/50 backdrop-blur-sm hover:scale-105'

  return (
    <div className="sticky top-0 z-50 border-b border-border/50 bg-card/40 backdrop-blur-xl shadow-lg">
      <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-10 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo with enhanced styling */}
        <div className="flex items-center gap-2">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold neon-glow bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            SkillWise
          </div>
          <div className="hidden md:block w-px h-6 bg-border/50"></div>
          <div className="hidden md:block text-sm text-foreground/60 font-medium">Learning Platform</div>
        </div>

        {/* Navigation and User Section */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          {/* Notification Center */}
          <div className="relative">
            <NotificationCenter />
          </div>

          {/* Navigation Links - Hidden on mobile, shown on tablet+ */}
          <div className="hidden sm:flex items-center gap-2">
            <Link
              to="/courses"
              className={`px-3 sm:px-4 py-2 sm:py-2.5 ${glow} text-primary/90 hover:text-primary font-semibold text-sm sm:text-base`}
            >
              Courses
            </Link>
            <Link
              to="/learning"
              className={`px-3 sm:px-4 py-2 sm:py-2.5 ${glow} text-foreground/80 hover:text-foreground font-semibold text-sm sm:text-base`}
            >
              Learning Dashboard
            </Link>
          </div>

          {/* Actions dropdown with improved styling */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => { setOpenActions(a => !a); setOpenUser(false) }}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 bg-card/60 border border-border/50 ${buttonGlow} font-semibold flex items-center gap-1 sm:gap-2 text-sm sm:text-base`}
              aria-haspopup="menu"
              aria-expanded={openActions}
            >
              <span>More</span>
              <svg className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 ${openActions ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
              </svg>
            </button>

            {openActions && (
              <div
                role="menu"
                className="absolute right-0 top-[110%] w-64 sm:w-72 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50 animate-slide-up"
              >
                <div className="p-2">
                  {/* Mobile Navigation Section */}
                  <div className="sm:hidden border-b border-border/50 pb-2 mb-2">
                    <Link to="/learning" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                      <div className="font-medium text-sm sm:text-base">Learning Dashboard</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Track your progress</div>
                    </Link>
                    <Link to="/courses" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                      <div className="font-medium text-sm sm:text-base">Browse Courses</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Find your next course</div>
                    </Link>
                  </div>
                  
                  <Link to="/friends" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                    <div className="font-medium text-sm sm:text-base">Friends</div>
                    <div className="text-xs sm:text-sm text-foreground/60">Connect with other students</div>
                  </Link>
                  <Link to="/exams" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                    <div className="font-medium text-sm sm:text-base">Exams</div>
                    <div className="text-xs sm:text-sm text-foreground/60">
                      {(user?.role === 'Teacher' || user?.role === 'Admin') ? 'Manage your exams' : 'Take available exams'}
                    </div>
                  </Link>
                  <Link to="/skillpay" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                    <div className="font-medium text-sm sm:text-base">SkillPay Wallet</div>
                    <div className="text-xs sm:text-sm text-foreground/60">Manage credits and redeem codes</div>
                  </Link>
                  {user?.role === 'Teacher' && (
                    <Link to="/teacher" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                      <div className="font-medium text-sm sm:text-base">Teacher Dashboard</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Review submissions & manage courses</div>
                    </Link>
                  )}
                  <Link to="/progress" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                    <div className="font-medium text-sm sm:text-base">View Progress</div>
                    <div className="text-xs sm:text-sm text-foreground/60">Track your learning journey</div>
                  </Link>
                  <Link to="/skills" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                    <div className="font-medium text-sm sm:text-base">Explore Skills</div>
                    <div className="text-xs sm:text-sm text-foreground/60">Discover new skills</div>
                  </Link>
                  {isCourseCreator && (
                    <Link to="/create-course" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                      <div className="font-medium text-sm sm:text-base">Create Course</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Share your knowledge</div>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User dropdown with enhanced styling */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setOpenUser(o => !o); setOpenActions(false) }}
              className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 bg-card/60 border border-border/50 ${buttonGlow} font-semibold text-sm sm:text-base`}
              aria-haspopup="menu"
              aria-expanded={openUser}
            >
              {profilePicture ? (
                <img
                  src={profilePicture}
                  className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full object-cover ring-2 ring-primary/20"
                  alt="Profile picture"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-primary/20 ring-2 ring-primary/20 flex items-center justify-center">
                  <div className="text-primary text-xs sm:text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </div>
              )}
              <span className="hidden sm:block">{user?.name || 'User'}</span>
              <svg className={`w-3 h-3 sm:w-4 sm:w-4 transition-transform duration-300 ${openUser ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
              </svg>
            </button>

            {openUser && (
              <div
                role="menu"
                className="absolute right-0 top-[110%] w-72 sm:w-80 rounded-2xl border border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden z-50 animate-slide-up"
              >
                {/* User info header */}
                <div className="p-3 sm:p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-center gap-3">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover ring-2 ring-primary/20"
                        alt="Profile picture"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 ring-2 ring-primary/20 flex items-center justify-center">
                        <div className="text-primary text-sm sm:text-base font-bold">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-foreground text-sm sm:text-base">{user?.name || 'User'}</div>
                      <div className="text-xs sm:text-sm text-foreground/60">@{displayHandle || 'handle'}</div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2">
                  <Link to={`/profile/${user?.username || user?.handle || user?.id}`} className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenUser(false)} role="menuitem">
                    <div className="font-medium text-sm sm:text-base">Go to Profile</div>
                    <div className="text-xs sm:text-sm text-foreground/60">View your public profile</div>
                  </Link>
                  <Link to="/profile" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenUser(false)} role="menuitem">
                    <div className="font-medium text-sm sm:text-base">Profile Settings</div>
                    <div className="text-xs sm:text-sm text-foreground/60">Manage your account</div>
                  </Link>
                  <Link to="/profile/visuals" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenUser(false)} role="menuitem">
                    <div className="font-medium text-sm sm:text-base">Update Profile Visuals</div>
                    <div className="text-xs sm:text-sm text-foreground/60">Customize your appearance</div>
                  </Link>

                  {!user?.username && (
                    <Link to="/auth/set-username" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenUser(false)} role="menuitem">
                      <div className="font-medium text-sm sm:text-base">Set Username</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Choose a custom handle</div>
                    </Link>
                  )}

                  {user?.role === 'Admin' && (
                    <Link to="/admin" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenUser(false)} role="menuitem">
                      <div className="font-medium text-sm sm:text-base">Admin Dashboard</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Manage the platform</div>
                    </Link>
                  )}
                  {user?.role === 'Parent' && (
                    <Link to="/parent" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenUser(false)} role="menuitem">
                      <div className="font-medium text-sm sm:text-base">Parent Dashboard</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Monitor learning progress</div>
                    </Link>
                  )}
                  
                  <div className="border-t border-border/50 mt-2 pt-2">
                    <button
                      onClick={() => { setTheme(t => (t === 'dark' ? 'light' : 'dark')); setOpenUser(false) }}
                      className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg"
                      role="menuitem"
                    >
                      <div className="font-medium text-sm sm:text-base">{theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Change appearance</div>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200 rounded-lg"
                      role="menuitem"
                    >
                      <div className="font-medium text-sm sm:text-base">Logout</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Sign out of your account</div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopBar
