import React from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import NotificationCenter from '../notifications/NotificationCenter'
import ThemeToggle from '../common/ThemeToggle'
import { hasTeacherPermissions, hasAdminPermissions, isChildAccount, isSuperUser } from '../../utils/permissions'

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
    <div className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl">
      <div className="max-w-[1800px] mx-auto px-2 sm:px-3 md:px-6 lg:px-10 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo with enhanced styling */}
        <div className="flex items-center gap-2">
          <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold neon-glow bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            SkillWise
          </div>
          <div className="hidden sm:block w-px h-6 bg-white/20"></div>
          <div className="hidden sm:block text-xs sm:text-sm text-white/60 font-medium">Learning Platform</div>
        </div>

        {/* Navigation and User Section */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          {/* Theme Toggle - Added to top right */}
          <ThemeToggle size="sm" />

          {/* Notification Center */}
          <div className="relative">
            <NotificationCenter />
          </div>

          {/* Courses Button - Always visible on mobile, full navigation on tablet+ */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile: Only Courses button */}
            <Link
              to="/courses"
              className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 ${glow} text-primary/90 hover:text-primary font-semibold text-xs sm:text-sm md:text-base`}
            >
              Courses
            </Link>
            
            {/* Tablet+: Full navigation */}
            <div className="hidden sm:flex items-center gap-1 sm:gap-2">
              <Link
                to="/community"
                className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 ${glow} text-white/80 hover:text-white font-semibold text-xs sm:text-sm md:text-base`}
              >
                Community
              </Link>
              <Link
                to="/skills"
                className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 ${glow} text-white/80 hover:text-white font-semibold text-xs sm:text-sm md:text-base`}
              >
                Skills
              </Link>
              <Link
                to="/learning"
                className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 ${glow} text-white/80 hover:text-white font-semibold text-xs sm:text-sm md:text-base`}
              >
                Learning
              </Link>
            </div>
          </div>

          {/* Actions dropdown */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => { setOpenActions(a => !a); setOpenUser(false) }}
              className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 bg-white/10 border border-white/20 ${buttonGlow} font-semibold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base text-white`}
              aria-haspopup="menu"
              aria-expanded={openActions}
            >
              More
              <svg className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 ${openActions ? 'rotate-180' : ''} hidden sm:block`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
              </svg>
            </button>

            {openActions && (
              <div
                role="menu"
                className="absolute right-0 top-[110%] w-[600px] max-w-[90vw] rounded-2xl border border-white/20 bg-black/80 backdrop-blur-xl shadow-2xl overflow-hidden z-50 animate-slide-up"
              >
                                 <div className="p-4">
                   {/* Mobile Navigation Links - Only show on mobile */}
                   <div className="sm:hidden mb-4">
                     <div className="text-xs font-semibold text-primary/80 mb-3 uppercase tracking-wide">Navigation</div>
                     <div className="grid grid-cols-2 gap-2">
                       <Link to="/courses" className="block px-3 py-2 bg-primary/20 hover:bg-primary/30 transition-colors duration-200 rounded-lg text-center border border-primary/30" onClick={() => setOpenActions(false)} role="menuitem">
                         <div className="font-medium text-sm text-primary">Courses</div>
                       </Link>
                       <Link to="/community" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg text-center" onClick={() => setOpenActions(false)} role="menuitem">
                         <div className="font-medium text-sm text-white">Community</div>
                       </Link>
                       <Link to="/skills" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg text-center" onClick={() => setOpenActions(false)} role="menuitem">
                         <div className="font-medium text-sm text-white">Skills</div>
                       </Link>
                       <Link to="/learning" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg text-center" onClick={() => setOpenActions(false)} role="menuitem">
                         <div className="font-medium text-sm text-white">Learning</div>
                       </Link>
                       <Link to="/notes" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg text-center" onClick={() => setOpenActions(false)} role="menuitem">
                         <div className="font-medium text-sm text-white">Notes</div>
                       </Link>
                     </div>
                   </div>

                   {/* Three Column Layout */}
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     {/* Column 1: Learning & Courses */}
                     <div className="space-y-2">
                       <div className="text-xs font-semibold text-primary/80 mb-3 uppercase tracking-wide">Learning</div>
                       <Link to="/learning" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                         <div className="font-medium text-sm text-white">Learning Dashboard</div>
                         <div className="text-xs text-white/60">Track your progress</div>
                       </Link>
                       <Link to="/courses" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                         <div className="font-medium text-sm text-white">Browse Courses</div>
                         <div className="text-xs text-white/60">Find your next course</div>
                       </Link>
                       <Link to="/exams" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                         <div className="font-medium text-sm text-white">Exams</div>
                         <div className="text-xs text-white/60">
                           {hasTeacherPermissions(user) ? 'Manage your exams' : 'Take available exams'}
                         </div>
                       </Link>
                       <Link to="/notes" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                         <div className="font-medium text-sm text-white">Notes</div>
                         <div className="text-xs text-white/60">Create and organize your notes</div>
                       </Link>
                       {hasTeacherPermissions(user) && (
                         <Link to="/create-course" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                           <div className="font-medium text-sm text-white">Create Course</div>
                           <div className="text-xs text-white/60">Build a new course</div>
                         </Link>
                       )}
                     </div>

                    {/* Column 2: Social & Communication */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-primary/80 mb-3 uppercase tracking-wide">Social</div>
                      <Link to="/skill-connect" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                        <div className="font-medium text-sm text-white">SkillConnect</div>
                        <div className="text-xs text-white/60">Find skill-based connections</div>
                      </Link>
                      <Link to="/friends" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                        <div className="font-medium text-sm text-white">Friends</div>
                        <div className="text-xs text-white/60">Connect with students</div>
                      </Link>
                      <Link to="/messages" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                        <div className="font-medium text-sm text-white">Messages</div>
                        <div className="text-xs text-white/60">View conversations</div>
                      </Link>
                      <Link to="/skills" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                        <div className="font-medium text-sm text-white">Skills Wall</div>
                        <div className="text-xs text-white/60">Share and discover skills</div>
                      </Link>
                      {user?.role === 'Student' && (
                        <Link to="/ai/recommendations" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                          <div className="font-medium text-sm text-white">AI Recommendations</div>
                          <div className="text-xs text-white/60">Upload CV and get insights</div>
                        </Link>
                      )}
                    </div>

                    {/* Column 3: Account & Tools */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-primary/80 mb-3 uppercase tracking-wide">Account</div>
                      <Link to="/skillpay" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                        <div className="font-medium text-sm text-white">SkillPay Wallet</div>
                        <div className="text-xs text-white/60">Manage credits</div>
                      </Link>
                      {user?.role === 'Student' && (
                        <Link to="/apply-teacher" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                          <div className="font-medium text-sm text-white">Become a Teacher</div>
                          <div className="text-xs text-white/60">Apply to teach</div>
                        </Link>
                      )}
                      {(user?.role === 'Teacher' || isSuperUser(user)) && (
                        <Link to="/teacher" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                          <div className="font-medium text-sm text-white">Teacher Dashboard</div>
                          <div className="text-xs text-white/60">Manage courses</div>
                        </Link>
                      )}
                      {hasAdminPermissions(user) && (
                        <Link to="/admin" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                          <div className="font-medium text-sm text-white">Admin Panel</div>
                          <div className="text-xs text-white/60">System management</div>
                        </Link>
                      )}
                      {hasAdminPermissions(user) && (
                        <Link to="/admin/ai-recommendations" className="block px-3 py-2 hover:bg-white/10 transition-colors duration-200 rounded-lg" onClick={() => setOpenActions(false)} role="menuitem">
                          <div className="font-medium text-sm text-white">AI Course Suggestions</div>
                          <div className="text-xs text-white/60">Review & manage recommendations</div>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User dropdown with enhanced styling */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setOpenUser(u => !u); setOpenActions(false) }}
              className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 bg-white/10 border border-white/20 ${buttonGlow} font-semibold flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base text-white`}
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
              <span className="truncate max-w-[60px] sm:max-w-[80px] md:max-w-none">{user?.name || 'User'}</span>
              <svg className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 ${openUser ? 'rotate-180' : ''} hidden sm:block`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
              </svg>
            </button>

            {openUser && (
              <div
                role="menu"
                className="absolute right-0 top-[110%] w-72 sm:w-80 rounded-2xl border border-white/20 bg-black/80 backdrop-blur-xl shadow-2xl overflow-hidden z-50 animate-slide-up"
              >
                {/* User info header */}
                <div className="p-3 sm:p-4 border-b border-white/20 bg-gradient-to-r from-primary/20 to-primary/10">
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
                      <div className="font-medium text-sm sm:text-base text-white">{user?.name || 'User'}</div>
                      <div className="text-xs sm:text-sm text-white/60">{displayHandle}</div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2">
                  {/* Only show "Go to Profile" if we have a valid username or handle */}
                  {(user?.username || user?.handle) && (
                    <Link 
                      to={`/profile/${user.username || user.handle}`} 
                      className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-white/10 transition-colors duration-200 rounded-lg" 
                      onClick={() => setOpenUser(false)} 
                      role="menuitem"
                    >
                      <div className="font-medium text-sm sm:text-base text-white">Go to Profile</div>
                      <div className="text-xs sm:text-sm text-white/60">View your public profile</div>
                    </Link>
                  )}
                  
                  {/* Always show Profile Settings */}
                  <Link 
                    to="/profile/settings" 
                    className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-white/10 transition-colors duration-200 rounded-lg" 
                    onClick={() => setOpenUser(false)} 
                    role="menuitem"
                  >
                    <div className="font-medium text-sm sm:text-base text-white">Profile Settings</div>
                    <div className="text-xs sm:text-sm text-white/60">Manage your account</div>
                  </Link>
                  
                  <Link 
                    to="/profile/visuals" 
                    className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-white/10 transition-colors duration-200 rounded-lg" 
                    onClick={() => setOpenUser(false)} 
                    role="menuitem"
                  >
                    <div className="font-medium text-sm sm:text-base text-white">Update Profile Visuals</div>
                    <div className="text-xs sm:text-sm text-white/60">Customize your appearance</div>
                  </Link>

                  {!user?.username && (
                    <Link 
                      to="/profile" 
                      className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-white/10 transition-colors duration-200 rounded-lg" 
                      onClick={() => setOpenUser(false)} 
                      role="menuitem"
                    >
                      <div className="font-medium text-sm sm:text-base text-white">Set Username</div>
                      <div className="text-xs sm:text-sm text-white/60">Choose a custom handle</div>
                    </Link>
                  )}

                  {hasAdminPermissions(user) && (
                    <Link 
                      to="/admin" 
                      className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-white/10 transition-colors duration-200 rounded-lg" 
                      onClick={() => setOpenUser(false)} 
                      role="menuitem"
                    >
                      <div className="font-medium text-sm sm:text-base text-white">Admin Dashboard</div>
                      <div className="text-xs sm:text-sm text-white/60">Manage the platform</div>
                    </Link>
                  )}
                  
                  {isChildAccount(user) && (
                    <Link 
                      to="/become-child" 
                      className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-green-500/20 text-green-300 transition-colors duration-200 rounded-lg border border-green-500/30" 
                      onClick={() => setOpenUser(false)} 
                      role="menuitem"
                    >
                      <div className="font-medium text-sm sm:text-base">Child Settings</div>
                      <div className="text-xs sm:text-sm text-green-400/80">Manage child account settings</div>
                    </Link>
                  )}

                  {isSuperUser(user) && (
                    <Link 
                      to="/superuser/roles" 
                      className="block px-3 sm:px-4 py-2 sm:py-3 hover:bg-yellow-500/20 text-yellow-300 transition-colors duration-200 rounded-lg border border-yellow-500/30" 
                      onClick={() => setOpenUser(false)} 
                      role="menuitem"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="font-medium text-sm sm:text-base flex items-center gap-2 justify-center">
                          <span className="text-yellow-400">👑</span>
                              SuperUser Control
                              </div></div>
                      <div className="text-xs sm:text-sm text-yellow-400/80">Manage user roles</div>
                    </Link>
                  )}

                  <div className="border-t border-white/20 mt-2 pt-2">
                    <button 
                      onClick={handleLogout} 
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200 rounded-lg text-left text-white" 
                      role="menuitem"
                    >
                      <div className="font-medium text-sm sm:text-base">Logout</div>
                      <div className="text-xs sm:text-sm text-white/60">Sign out of your account</div>
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
