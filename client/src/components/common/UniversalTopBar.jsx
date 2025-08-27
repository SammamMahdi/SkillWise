import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { hasTeacherPermissions, hasAdminPermissions, isChildAccount, isSuperUser } from '../../utils/permissions'
import ThemeToggle from './ThemeToggle'
import NotificationCenter from '../notifications/NotificationCenter'

const UniversalTopBar = ({
  className = '',
  showThemeToggle = true,
  showNotifications = true,
  variant = 'default' // 'default', 'minimal', 'transparent'
}) => {
  const { user, logout } = useAuth()
  const { theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()

  // State for dropdowns
  const [openUser, setOpenUser] = useState(false)
  const [openActions, setOpenActions] = useState(false)
  const userMenuRef = useRef(null)
  const actionsMenuRef = useRef(null)

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setOpenUser(false)
      }
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
        setOpenActions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Don't show on auth pages or if user is not authenticated
  if (!user || location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup') {
    return null
  }

  // Don't show on dashboard since it has its own TopBar
  if (location.pathname === '/dashboard') {
    return null
  }

  // Helper functions
  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getProfilePicture = () => {
    if (user?.avatarUrl) return user.avatarUrl
    if (user?.googleId && user?.profilePhoto && !user?.avatarUrl) return user.profilePhoto
    return null
  }

  const displayHandle = user?.username ? `@${user.username}` : user?.handle ? `@${user.handle}` : user?.email || 'User'

  const getVariantStyles = () => {
    switch (variant) {
      case 'minimal':
        return 'bg-background/80 backdrop-blur-sm border-b border-border/50'
      case 'transparent':
        return 'bg-transparent'
      default:
        return theme === 'dark' 
          ? 'bg-black/20 backdrop-blur-xl border-b border-white/10' 
          : 'bg-white/80 backdrop-blur-sm border-b border-gray-200/50'
    }
  }

  const getTextStyles = () => {
    if (variant === 'transparent') {
      return theme === 'dark' ? 'text-white' : 'text-gray-900'
    }
    return theme === 'dark' ? 'text-white' : 'text-gray-900'
  }

  const getLogoStyles = () => {
    return theme === 'dark' 
      ? 'bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent'
      : 'bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent'
  }

  return (
    <div className={`sticky top-0 z-50 ${getVariantStyles()} shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Logo - Links to Dashboard */}
        <Link 
          to="/dashboard" 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className={`text-xl sm:text-2xl font-bold ${getLogoStyles()}`}>
            SkillWise
          </div>
          <div className="hidden sm:block w-px h-5 bg-current opacity-20"></div>
          <div className={`hidden sm:block text-sm font-medium opacity-60 ${getTextStyles()}`}>
            Learning Platform
          </div>
        </Link>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          {showThemeToggle && <ThemeToggle size="sm" />}

          {/* Notifications */}
          {showNotifications && (
            <div className="relative">
              <NotificationCenter />
            </div>
          )}

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              to="/courses"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'text-primary/90 hover:text-primary hover:bg-white/10'
                  : 'text-primary hover:text-primary/80 hover:bg-gray-100'
              }`}
            >
              Courses
            </Link>
            <Link
              to="/community"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Community
            </Link>
            <Link
              to="/skills"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Skills
            </Link>
            <Link
              to="/learning"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 ${
                theme === 'dark'
                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Learning
            </Link>
          </div>

          {/* Actions Dropdown */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => { setOpenActions(a => !a); setOpenUser(false) }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 ${
                theme === 'dark'
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
              }`}
            >
              More
              <svg className={`w-4 h-4 transition-transform duration-300 ${openActions ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
              </svg>
            </button>

            {/* Actions Dropdown Menu */}
            {openActions && (
              <div className={`absolute right-0 top-[110%] w-[600px] max-w-[90vw] rounded-2xl border shadow-2xl overflow-hidden z-50 ${
                theme === 'dark'
                  ? 'border-white/20 bg-black/80 backdrop-blur-xl'
                  : 'border-gray-200 bg-white/90 backdrop-blur-xl'
              }`}>
                <div className="p-4">
                  {/* Mobile Navigation Links - Only show on mobile */}
                  <div className="md:hidden mb-4">
                    <div className={`text-xs font-semibold mb-3 uppercase tracking-wide ${
                      theme === 'dark' ? 'text-primary/80' : 'text-primary'
                    }`}>Navigation</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link to="/courses" className={`block px-3 py-2 transition-colors duration-200 rounded-lg text-center border ${
                        theme === 'dark'
                          ? 'bg-primary/20 hover:bg-primary/30 border-primary/30 text-primary'
                          : 'bg-primary/10 hover:bg-primary/20 border-primary/20 text-primary'
                      }`} onClick={() => setOpenActions(false)}>
                        <div className="font-medium text-sm">Courses</div>
                      </Link>
                      <Link to="/community" className={`block px-3 py-2 transition-colors duration-200 rounded-lg text-center ${
                        theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'
                      }`} onClick={() => setOpenActions(false)}>
                        <div className="font-medium text-sm">Community</div>
                      </Link>
                      <Link to="/skills" className={`block px-3 py-2 transition-colors duration-200 rounded-lg text-center ${
                        theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'
                      }`} onClick={() => setOpenActions(false)}>
                        <div className="font-medium text-sm">Skills</div>
                      </Link>
                      <Link to="/learning" className={`block px-3 py-2 transition-colors duration-200 rounded-lg text-center ${
                        theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'
                      }`} onClick={() => setOpenActions(false)}>
                        <div className="font-medium text-sm">Learning</div>
                      </Link>
                      <Link to="/notes" className={`block px-3 py-2 transition-colors duration-200 rounded-lg text-center ${
                        theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'
                      }`} onClick={() => setOpenActions(false)}>
                        <div className="font-medium text-sm">Notes</div>
                      </Link>
                      <Link to="/friends" className={`block px-3 py-2 transition-colors duration-200 rounded-lg text-center ${
                        theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-100 text-gray-700'
                      }`} onClick={() => setOpenActions(false)}>
                        <div className="font-medium text-sm">Friends</div>
                      </Link>
                    </div>
                  </div>

                  {/* Three Column Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Column 1: Learning & Courses */}
                    <div className="space-y-2">
                      <div className={`text-xs font-semibold mb-3 uppercase tracking-wide ${
                        theme === 'dark' ? 'text-primary/80' : 'text-primary'
                      }`}>Learning</div>
                      <Link to="/learning" className={`block px-3 py-2 transition-colors duration-200 rounded-lg ${
                        theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                      }`} onClick={() => setOpenActions(false)}>
                        <div className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Learning Dashboard</div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Track your progress</div>
                      </Link>
                      <Link to="/courses" className={`block px-3 py-2 transition-colors duration-200 rounded-lg ${
                        theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                      }`} onClick={() => setOpenActions(false)}>
                        <div className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Browse Courses</div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Explore all courses</div>
                      </Link>
                      <Link to="/skills" className={`block px-3 py-2 transition-colors duration-200 rounded-lg ${
                        theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                      }`} onClick={() => setOpenActions(false)}>
                        <div className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Skills Assessment</div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Test your knowledge</div>
                      </Link>
                    </div>

                    {/* Column 2: Social & Community */}
                    <div className="space-y-2">
                      <div className={`text-xs font-semibold mb-3 uppercase tracking-wide ${
                        theme === 'dark' ? 'text-primary/80' : 'text-primary'
                      }`}>Social</div>
                      <Link to="/community" className={`block px-3 py-2 transition-colors duration-200 rounded-lg ${
                        theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                      }`} onClick={() => setOpenActions(false)}>
                        <div className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Community</div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Connect with learners</div>
                      </Link>
                      <Link to="/friends" className={`block px-3 py-2 transition-colors duration-200 rounded-lg ${
                        theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                      }`} onClick={() => setOpenActions(false)}>
                        <div className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Friends</div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Chat and connect</div>
                      </Link>
                      <Link to="/notes" className={`block px-3 py-2 transition-colors duration-200 rounded-lg ${
                        theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                      }`} onClick={() => setOpenActions(false)}>
                        <div className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notes</div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Your study notes</div>
                      </Link>
                    </div>

                    {/* Column 3: Tools & Settings */}
                    <div className="space-y-2">
                      <div className={`text-xs font-semibold mb-3 uppercase tracking-wide ${
                        theme === 'dark' ? 'text-primary/80' : 'text-primary'
                      }`}>Tools</div>
                      {hasTeacherPermissions(user) && (
                        <Link to="/teacher" className={`block px-3 py-2 transition-colors duration-200 rounded-lg ${
                          theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                        }`} onClick={() => setOpenActions(false)}>
                          <div className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Teacher Dashboard</div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Manage courses</div>
                        </Link>
                      )}
                      {hasAdminPermissions(user) && (
                        <Link to="/admin" className={`block px-3 py-2 transition-colors duration-200 rounded-lg ${
                          theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                        }`} onClick={() => setOpenActions(false)}>
                          <div className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Admin Panel</div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>System management</div>
                        </Link>
                      )}
                      <Link to="/profile/settings" className={`block px-3 py-2 transition-colors duration-200 rounded-lg ${
                        theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                      }`} onClick={() => setOpenActions(false)}>
                        <div className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Settings</div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Account preferences</div>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setOpenUser(u => !u); setOpenActions(false) }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center gap-2 ${
                theme === 'dark'
                  ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
              }`}
            >
              {getProfilePicture() && (
                <div className="w-6 h-6 rounded-full overflow-hidden ring-2 ring-primary/20">
                  <img
                    src={getProfilePicture()}
                    className="w-full h-full object-cover"
                    alt="Profile"
                  />
                </div>
              )}
              <span className="truncate max-w-[80px]">{user?.name || 'User'}</span>
              <svg className={`w-4 h-4 transition-transform duration-300 ${openUser ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
              </svg>
            </button>

            {/* User Dropdown Menu */}
            {openUser && (
              <div className={`absolute right-0 top-[110%] w-72 rounded-2xl border shadow-2xl overflow-hidden z-50 ${
                theme === 'dark'
                  ? 'border-white/20 bg-black/80 backdrop-blur-xl'
                  : 'border-gray-200 bg-white/90 backdrop-blur-xl'
              }`}>
                {/* User info header */}
                <div className={`p-4 border-b ${
                  theme === 'dark'
                    ? 'border-white/20 bg-gradient-to-r from-primary/20 to-primary/10'
                    : 'border-gray-200 bg-gradient-to-r from-primary/10 to-primary/5'
                }`}>
                  <div className="flex items-center gap-3">
                    {getProfilePicture() ? (
                      <img
                        src={getProfilePicture()}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                        alt="Profile"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary">
                          {user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.name || 'User'}</div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>{displayHandle}</div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-2">
                  <Link
                    to="/profile/settings"
                    className={`block px-4 py-3 transition-colors duration-200 rounded-lg ${
                      theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setOpenUser(false)}
                  >
                    <div className={`font-medium text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Profile Settings</div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Manage your account</div>
                  </Link>

                  <div className={`border-t mt-2 pt-2 ${theme === 'dark' ? 'border-white/20' : 'border-gray-200'}`}>
                    <button
                      onClick={handleLogout}
                      className={`w-full px-4 py-3 transition-colors duration-200 rounded-lg text-left ${
                        theme === 'dark'
                          ? 'hover:bg-red-500/20 hover:text-red-300 text-white'
                          : 'hover:bg-red-50 hover:text-red-600 text-gray-700'
                      }`}
                    >
                      <div className="font-medium text-sm">Logout</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Sign out of your account</div>
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

export default UniversalTopBar
