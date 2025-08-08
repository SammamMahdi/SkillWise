import React, { useEffect, useMemo, useState, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './components/auth/AuthPage'
import ProfileSettings from './components/profile/ProfileSettings'
import ProfileVisuals from './components/profile/ProfileVisuals'
import AdminDashboard from './components/admin/AdminDashboard'
import ParentDashboard from './components/parent/ParentDashboard'
import BlockedAccount from './components/auth/BlockedAccount'
import NotificationCenter from './components/notifications/NotificationCenter'
import LearningDashboard from './components/dashboard/LearningDashboard'
import CourseGrid from './components/courses/CourseGrid'
import CreateCourseForm from './components/courses/CreateCourseForm'
import CourseDetail from './components/courses/CourseDetail'

const queryClient = new QueryClient()

const fmtDate = d =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

const Dashboard = ({ theme, setTheme }) => {
  const { user, logout } = useAuth()
  const [openUser, setOpenUser] = useState(false)
  const [openActions, setOpenActions] = useState(false)
  const userMenuRef = useRef(null)
  const actionsMenuRef = useRef(null)

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  useEffect(() => {
    const onClick = (e) => {
      if (openUser && userMenuRef.current && !userMenuRef.current.contains(e.target)) setOpenUser(false)
      if (openActions && actionsMenuRef.current && !actionsMenuRef.current.contains(e.target)) setOpenActions(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') { setOpenUser(false); setOpenActions(false) } }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClick); document.removeEventListener('keydown', onKey) }
  }, [openUser, openActions])

  if (user?.isAccountBlocked) return <BlockedAccount user={user} />
  if (user?.requiresParentalApproval && !user?.parentConfirmed) return <BlockedAccount user={user} />

  const profile = {
    spotlightSkill: { month: 'July', title: 'Java Programming' },
    rankPercentile: 2,
    concentration: 'Backend engineering',
    topSkills: ['College Level Math', 'Java', 'Microeconomics'],
    goalProgressPct: 5,
    goalEta: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  }
  const currentCourses = [
    { title: 'Introduction to Java', progressPct: 90, lastLessonTitle: 'Recursion', startedAt: '2025-01-26', percentileInCourse: 0.001 },
    { title: 'Discrete Mathematics', progressPct: 48, lastLessonTitle: 'Number Theory', startedAt: '2025-01-12', percentileInCourse: 0.10 },
    { title: 'Introduction to Game Theory', progressPct: 10, lastLessonTitle: 'Prisoner Problem', startedAt: '2025-01-13', percentileInCourse: 0.80 },
    { title: 'JavaScript Masterclass', progressPct: 10, lastLessonTitle: 'OOP in JS', startedAt: '2025-01-07', percentileInCourse: 0.90 },
  ]
  const completedCourses = [
    { title: 'Introduction to College Algebra', startedAt: '2025-01-02', finishedAt: '2025-03-07' },
    { title: 'Introduction to Microeconomics', startedAt: '2025-01-02', finishedAt: '2025-03-07' },
  ]

  const firstName = useMemo(() => (user?.name || '').split(' ')[0] || 'You', [user])
  const isCourseCreator = user?.role === 'Teacher' || user?.role === 'Admin'

  // helper: shared glow styles for topbar links/buttons
  const glow = 'transition-colors duration-150 rounded-lg hover:bg-card/40 hover:shadow-[0_0_12px_rgba(167,139,250,0.65)] hover:ring-2 hover:ring-violet-400'

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
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

      {/* Banner (taller cover & bigger avatar) */}
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
              <p className="opacity-90 text-sm sm:text-base">
                Skill of the Month {profile.spotlightSkill.month} : {profile.spotlightSkill.title}
              </p>
            </div>
            <div className="ml-auto text-right text-white">
              <div className="text-xl sm:text-2xl font-semibold">Student Profile</div>
              <div className="opacity-90 text-sm sm:text-base">Top {profile.rankPercentile}% of Learners</div>
              <div className="opacity-90 text-sm sm:text-base">Joined {fmtDate(user?.createdAt)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* LEFT */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Skills of {firstName}</h2>
          <div className="rounded-2xl p-6 shadow-sm border border-rose-200/30 bg-rose-50/10">
            <p className="font-medium">Concentration: {profile.concentration}</p>
            <p className="mt-2"><span className="font-medium">Top Skills:</span> {profile.topSkills.join(', ')}</p>
            <p className="mt-2">
              <span className="font-medium">Goal finished toward {profile.concentration}:</span> {profile.goalProgressPct}%
            </p>
            <p className="mt-2 text-sm opacity-80">
              Estimated date of completion: {fmtDate(profile.goalEta)}
            </p>
          </div>

          <h2 className="text-xl font-semibold mt-6 mb-4">Completed Courses</h2>
          <div className="space-y-4">
            {completedCourses.map((c, i) => (
              <div key={i} className="rounded-2xl bg-card shadow-sm border border-border p-6">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-sm opacity-80">Completed: 100%</div>
                </div>
                <div className="mt-2 text-sm grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-80">
                  <div>Course started on {fmtDate(c.startedAt)}</div>
                  <div>Course finished on {fmtDate(c.finishedAt)}</div>
                </div>
              </div>
            ))}
            {!completedCourses.length && <div className="text-sm opacity-70">No completed courses yet.</div>}
          </div>
        </section>

        {/* RIGHT */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Current Courses</h2>
          <div className="space-y-4">
            {currentCourses.map((c, i) => (
              <div key={i} className="rounded-2xl bg-fuchsia-100/10 border border-fuchsia-200/40 p-6">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-sm">Completed: {c.progressPct}%</div>
                </div>
                <div className="mt-2 text-sm opacity-80">
                  Last Lesson Attended: {c.lastLessonTitle || '—'}
                </div>
                <div className="mt-1 text-xs opacity-70">
                  Course started on {fmtDate(c.startedAt)}
                </div>
                {typeof c.percentileInCourse === 'number' && (
                  <div className="mt-1 text-xs opacity-70">
                    Top {(c.percentileInCourse * 100).toFixed(1)}% of the course participants
                  </div>
                )}
              </div>
            ))}
            {!currentCourses.length && <div className="text-sm opacity-70">No active courses.</div>}
          </div>
        </section>
      </main>
    </div>
  )
}

function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<AuthPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/signup" element={<AuthPage />} />
              <Route path="/dashboard" element={<Dashboard theme={theme} setTheme={setTheme} />} />
              <Route path="/learning" element={<LearningDashboard />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/profile/visuals" element={<ProfileVisuals />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/parent" element={<ParentDashboard />} />
              <Route path="/courses" element={<CourseGrid />} />
              <Route path="/create-course" element={<CreateCourseForm />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
