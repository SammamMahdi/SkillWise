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
  // helper: shared glow styles for topbar links/buttons
  const glow = 'transition-colors duration-150 rounded-lg hover:bg-card/40 hover:shadow-[0_0_12px_rgba(167,139,250,0.65)] hover:ring-2 hover:ring-violet-400'

  return (
    <div className="border-b border-border bg-card/40">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold neon-glow">SkillWise</div>

        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationCenter />

          {/* Keep these visible */}
          <Link
            to="/courses"
            className={`px-3 py-2 ${glow} text-violet-300 hover:text-white`}
          >
            Courses
          </Link>
          <Link
            to="/learning"
            className={`px-3 py-2 ${glow} text-foreground/90 hover:text-white`}
          >
            Learning Dashboard
          </Link>

          {/* Actions dropdown */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => { setOpenActions(a => !a); setOpenUser(false) }}
              className={`px-3 py-2 bg-background border border-border ${glow}`}
              aria-haspopup="menu"
              aria-expanded={openActions}
            >
              More
              <span className={`inline-block ml-2 transition-transform ${openActions ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {openActions && (
              <div
                role="menu"
                className="absolute right-0 top-[110%] w-72 rounded-xl border border-border bg-card shadow-2xl overflow-hidden z-50"
              >
                <Link to="/progress" className="block px-4 py-3 hover:bg-background transition-colors" onClick={() => setOpenActions(false)} role="menuitem">
                  View Progress
                </Link>
                <Link to="/skills" className="block px-4 py-3 hover:bg-background transition-colors" onClick={() => setOpenActions(false)} role="menuitem">
                  Explore Skills
                </Link>
                <Link to="/courses" className="block px-4 py-3 hover:bg-background transition-colors" onClick={() => setOpenActions(false)} role="menuitem">
                  Browse Courses
                </Link>
                {isCourseCreator && (
                  <Link to="/create-course" className="block px-4 py-3 hover:bg-background transition-colors" onClick={() => setOpenActions(false)} role="menuitem">
                    Create Course
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setOpenUser(o => !o); setOpenActions(false) }}
              className={`flex items-center gap-2 sm:gap-3 px-3 py-2 bg-background border border-border ${glow}`}
              aria-haspopup="menu"
              aria-expanded={openUser}
            >
              <img
                src={user?.avatarUrl || user?.photoUrl || 'https://placekitten.com/100/100'}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
                alt=""
              />
              <span className="hidden sm:block">{user?.name || 'User'}</span>
              <svg className={`w-4 h-4 transition-transform ${openUser ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
              </svg>
            </button>

            {openUser && (
              <div
                role="menu"
                className="absolute right-0 top-[110%] w-72 rounded-xl border border-border bg-card shadow-2xl overflow-hidden z-50"
              >
                <Link to="/profile" className="block px-4 py-3 hover:bg-background transition-colors" onClick={() => setOpenUser(false)} role="menuitem">
                  Profile Settings
                </Link>
                <Link to="/profile/visuals" className="block px-4 py-3 hover:bg-background transition-colors" onClick={() => setOpenUser(false)} role="menuitem">
                  Update Profile Visuals
                </Link>

                {/* NEW: Show "Set Username" shortcut if user has no pretty username yet */}
                {!user?.username && (
                  <Link to="/auth/set-username" className="block px-4 py-3 hover:bg-background transition-colors" onClick={() => setOpenUser(false)} role="menuitem">
                    Set Username
                  </Link>
                )}

                {user?.role === 'Admin' && (
                  <Link to="/admin" className="block px-4 py-3 hover:bg-background transition-colors" onClick={() => setOpenUser(false)} role="menuitem">
                    Admin Dashboard
                  </Link>
                )}
                {user?.role === 'Parent' && (
                  <Link to="/parent" className="block px-4 py-3 hover:bg-background transition-colors" onClick={() => setOpenUser(false)} role="menuitem">
                    Parent Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { setTheme(t => (t === 'dark' ? 'light' : 'dark')); setOpenUser(false) }}
                  className="w-full text-left px-4 py-3 hover:bg-background transition-colors"
                  role="menuitem"
                >
                  {theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 hover:bg-background transition-colors border-t border-border"
                  role="menuitem"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TopBar
