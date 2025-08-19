import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import NotificationCenter from '../notifications/NotificationCenter'
import ThemeToggle from '../common/ThemeToggle'
import { hasTeacherPermissions, hasAdminPermissions, hasParentPermissions, isSuperUser } from '../../utils/permissions'

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
  displayHandle 
}) => {
  const { theme, toggleTheme } = useTheme()

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
          {/* Theme Toggle - Added to top right */}
          <ThemeToggle size="sm" />

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
              to="/skills"
              className={`px-3 sm:px-4 py-2 sm:py-2.5 ${glow} text-foreground/80 hover:text-foreground font-semibold text-sm sm:text-base`}
            >
              Skills Wall
            </Link>
            <Link
              to="/learning"
              className={`px-3 sm:px-4 py-2 sm:py-2.5 ${glow} text-foreground/80 hover:text-foreground font-semibold text-sm sm:text-base`}
            >
              Learning Dashboard
            </Link>
          </div>

          {/* Actions dropdown */}
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
                    <Link to="/skills" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                      <div className="font-medium text-sm sm:text-base">Skills Wall</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Share and discover skills</div>
                    </Link>
                    <Link to="/messages" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                      <div className="font-medium text-sm sm:text-base">Messages</div>
                      <div className="text-xs sm:text-sm text-foreground/60">View your conversations</div>
                    </Link>
                  </div>
                  
                  <Link to="/friends" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                    <div className="font-medium text-sm sm:text-base">Friends</div>
                    <div className="text-xs sm:text-sm text-foreground/60">Connect with other students</div>
                  </Link>
                  <Link to="/messages" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                    <div className="font-medium text-sm sm:text-base">Messages</div>
                    <div className="text-xs sm:text-sm text-foreground/60">View your skill conversations</div>
                  </Link>
                  <Link to="/exams" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                    <div className="font-medium text-sm sm:text-base">Exams</div>
                    <div className="text-xs sm:text-sm text-foreground/60">
                      {hasTeacherPermissions(user) ? 'Manage your exams' : 'Take available exams'}
                    </div>
                  </Link>
                  <Link to="/skillpay" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                    <div className="font-medium text-sm sm:text-base">SkillPay Wallet</div>
                    <div className="text-xs sm:text-sm text-foreground/60">Manage credits and redeem codes</div>
                  </Link>
                  <Link to="/progress" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                    <div className="font-medium text-sm sm:text-base">View Progress</div>
                    <div className="text-xs sm:text-sm text-foreground/60">Track your learning journey</div>
                  </Link>
                  <Link to="/skills" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                    <div className="font-medium text-sm sm:text-base">Explore Skills</div>
                    <div className="text-xs sm:text-sm text-foreground/60">Discover new skills</div>
                  </Link>
                  {/* Teacher Application for Students */}
                  {user?.role === 'Student' && (
                    <Link to="/apply-teacher" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                      <div className="font-medium text-sm sm:text-base">Become a Teacher</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Apply to teach on SkillWise</div>
                    </Link>
                  )}
                  {(user?.role === 'Teacher' || isSuperUser(user)) && (
                    <Link to="/teacher" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                      <div className="font-medium text-sm sm:text-base">Teacher Dashboard</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Review submissions & manage courses</div>
                    </Link>
                  )}
                  {hasTeacherPermissions(user) && (
                    <Link to="/courses/create" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                      <div className="font-medium text-sm sm:text-base">Create Course</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Build a new course</div>
                    </Link>
                  )}
                  {isCourseCreator && (
                    <>
                      <Link to="/courses/my-courses" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                        <div className="font-medium text-sm sm:text-base">My Courses</div>
                        <div className="text-xs sm:text-sm text-foreground/60">Manage your courses</div>
                      </Link>
                      <Link to="/test" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                        <div className="font-medium text-sm sm:text-base">Test Creator</div>
                        <div className="text-xs sm:text-sm text-foreground/60">Create practice tests</div>
                      </Link>
                      <Link to="/create-course" className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                        <div className="font-medium text-sm sm:text-base">Create Course</div>
                        <div className="text-xs sm:text-sm text-foreground/60">Share your knowledge</div>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User dropdown with enhanced styling */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setOpenUser(u => !u); setOpenActions(false) }}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 bg-card/60 border border-border/50 ${buttonGlow} font-semibold flex items-center gap-1 sm:gap-2 text-sm sm:text-base`}
              aria-haspopup="menu"
              aria-expanded={openUser}
            >
              {profilePicture && (
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden ring-2 ring-primary/20">
                  <img 
                    src={profilePicture} 
                    className="w-full h-full object-cover"
                    alt="Profile picture"
                  />
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
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-sm sm:text-base">{user?.name || 'User'}</div>
                      <div className="text-xs sm:text-sm text-foreground/60">{displayHandle}</div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2">
                  {/* Only show "Go to Profile" if we have a valid username or handle */}
                  {(user?.username || user?.handle) && (
                    <Link 
                      to={`/profile/${user.username || user.handle}`} 
                      className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" 
                      onClick={() => setOpenUser(false)} 
                      role="menuitem"
                    >
                      <div className="font-medium text-sm sm:text-base">Go to Profile</div>
                      <div className="text-xs sm:text-sm text-foreground/60">View your public profile</div>
                    </Link>
                  )}
                  
                  {/* Always show Profile Settings */}
                  <Link 
                    to="/profile/settings" 
                    className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" 
                    onClick={() => setOpenUser(false)} 
                    role="menuitem"
                  >
                    <div className="font-medium text-sm sm:text-base">Profile Settings</div>
                    <div className="text-xs sm:text-sm text-foreground/60">Manage your account</div>
                  </Link>
                  
                  <Link 
                    to="/profile/visuals" 
                    className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" 
                    onClick={() => setOpenUser(false)} 
                    role="menuitem"
                  >
                    <div className="font-medium text-sm sm:text-base">Update Profile Visuals</div>
                    <div className="text-xs sm:text-sm text-foreground/60">Customize your appearance</div>
                  </Link>

                  {!user?.username && (
                    <Link 
                      to="/profile" 
                      className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" 
                      onClick={() => setOpenUser(false)} 
                      role="menuitem"
                    >
                      <div className="font-medium text-sm sm:text-base">Set Username</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Choose a custom handle</div>
                    </Link>
                  )}

                  {hasAdminPermissions(user) && (
                    <Link 
                      to="/admin" 
                      className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" 
                      onClick={() => setOpenUser(false)} 
                      role="menuitem"
                    >
                      <div className="font-medium text-sm sm:text-base">Admin Dashboard</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Manage the platform</div>
                    </Link>
                  )}
                  
                  {hasParentPermissions(user) && (
                    <Link 
                      to="/parent" 
                      className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-primary/10 transition-colors duration-200 rounded-lg" 
                      onClick={() => setOpenUser(false)} 
                      role="menuitem"
                    >
                      <div className="font-medium text-sm sm:text-base">Parent Dashboard</div>
                      <div className="text-xs sm:text-sm text-foreground/60">Monitor learning progress</div>
                    </Link>
                  )}

                  {isSuperUser(user) && (
                    <Link 
                      to="/superuser/roles" 
                      className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-yellow-50 hover:bg-opacity-50 text-yellow-700 transition-colors duration-200 rounded-lg border border-yellow-200/50" 
                      onClick={() => setOpenUser(false)} 
                      role="menuitem"
                    >
                      <div className="font-medium text-sm sm:text-base flex items-center gap-2">
                        <span className="text-yellow-500">👑</span>
                        SuperUser Control
                      </div>
                      <div className="text-xs sm:text-sm text-yellow-600">Manage user roles</div>
                    </Link>
                  )}

                  <div className="border-t border-border/50 mt-2 pt-2">
                    <button 
                      onClick={handleLogout} 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200 rounded-lg text-left" 
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
