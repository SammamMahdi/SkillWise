import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { canManageCourses } from '../../utils/permissions'
import BlockedAccount from '../auth/BlockedAccount'
import NotificationCenter from '../notifications/NotificationCenter'
import TopBar from './TopBar'
import ProfileBanner from './ProfileBanner'
import DashboardContent from './DashboardContent'
import { fmtDate } from '../../utils/dateUtils'
import { getLearningDashboard } from '../../services/learningService'
import { skillsService } from '../../services/skillsService'
import bg from '../auth/a.jpg'

const Dashboard = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [openUser, setOpenUser] = useState(false)
  const [openActions, setOpenActions] = useState(false)
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [skillOfMonth, setSkillOfMonth] = useState('General Learning')
  const userMenuRef = useRef(null)
  const actionsMenuRef = useRef(null)

  // Fetch learning dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch dashboard data and skill of month in parallel
        const [dashboardResponse, skillOfMonthResponse] = await Promise.all([
          getLearningDashboard(),
          skillsService.getSkillOfMonth(user._id || user.id)
            .catch(() => ({ 
              success: true, 
              data: { 
                skill: user?.skillPreferences?.length > 0 
                  ? 'SkillConnect' 
                  : 'General Learning' 
              } 
            }))
        ])
        
        console.log('Learning dashboard data:', dashboardResponse) // Debug log
        console.log('Skill of month:', skillOfMonthResponse) // Debug log
        
        setDashboardData(dashboardResponse)
        setSkillOfMonth(skillOfMonthResponse.data.skill)
      } catch (err) {
        setError(err.message)
        console.error('Error fetching learning dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
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
    spotlightSkill: { month: 'Current', title: skillOfMonth },
    rankPercentile: 2,
    concentration: 'Backend engineering',
    topSkills: ['College Level Math', 'Java', 'Microeconomics'],
    goalProgressPct: 5,
    goalEta: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  }

  // Transform API data to match component expectations
  const currentCourses = useMemo(() => {
    console.log('Transforming current courses from:', dashboardData?.enrolledCourses) // Debug log
    if (!dashboardData?.enrolledCourses) return []
    
    return dashboardData.enrolledCourses.map(enrollment => {
      const course = enrollment.course
      if (!course) return null // Skip if course data is missing
      
      const transformed = {
        id: enrollment._id,
        title: course.title || 'Course Title',
        progressPct: enrollment.progress || 0,
        lastLessonTitle: course.lectures?.[enrollment.currentLectureIndex || 0]?.title || '—',
        startedAt: new Date().toISOString(), // Use current date as fallback since enrolledAt doesn't exist
        percentileInCourse: 0.5, // This would need to be calculated based on other students' progress
        courseId: course._id,
        teacher: course.teacher?.name || 'Instructor'
      }
      console.log('Transformed enrollment:', transformed) // Debug log
      return transformed
    }).filter(Boolean) // Remove null entries
  }, [dashboardData])

  const completedCourses = useMemo(() => {
    console.log('Transforming completed courses from:', dashboardData?.certificates) // Debug log
    if (!dashboardData?.certificates) return []
    
    return dashboardData.certificates.map(certificate => {
      const course = certificate.course
      if (!course) return null // Skip if course data is missing
      
      const transformed = {
        id: certificate._id,
        title: course.title || 'Course Title',
        startedAt: certificate.issueDate || new Date().toISOString(),
        finishedAt: certificate.issueDate || new Date().toISOString(),
        courseId: course._id,
        teacher: course.teacher?.name || 'Instructor'
      }
      console.log('Transformed certificate:', transformed) // Debug log
      return transformed
    }).filter(Boolean) // Remove null entries
  }, [dashboardData])

  const firstName = useMemo(() => (user?.name || '').split(' ')[0] || 'You', [user])
  const isCourseCreator = canManageCourses(user)
  const displayHandle = user?.username || user?.handle

  if (loading) {
    return (
      <section
        className={`relative min-h-screen overflow-y-auto transition-all duration-500 ${
          theme === 'dark' ? 'auth-bg-dark' : 'auth-bg-light'
        }`}
        style={theme === 'dark' ? {
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        } : {}}
      >
        {/* Overlay for readability */}
        <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
            : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
        }`} />
        
        <div className="relative z-10 min-h-screen">
          <TopBar 
            user={user}
            openUser={openUser}
            setOpenUser={setOpenUser}
            openActions={openActions}
            setOpenActions={setOpenActions}
            userMenuRef={userMenuRef}
            actionsMenuRef={actionsMenuRef}
            isCourseCreator={isCourseCreator}
            handleLogout={handleLogout}
            displayHandle={displayHandle}
          />
          
          <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-10 py-8 sm:py-10 md:py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-card/20 backdrop-blur-sm rounded-lg mb-4 border border-white/10"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-card/20 backdrop-blur-sm rounded-2xl border border-white/10"></div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-card/20 backdrop-blur-sm rounded-2xl border border-white/10"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section
        className={`relative min-h-screen overflow-y-auto transition-all duration-500 ${
          theme === 'dark' ? 'auth-bg-dark' : 'auth-bg-light'
        }`}
        style={theme === 'dark' ? {
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        } : {}}
      >
        {/* Overlay for readability */}
        <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
            : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
        }`} />
        
        <div className="relative z-10 min-h-screen">
          <TopBar 
            user={user}
            openUser={openUser}
            setOpenUser={setOpenUser}
            openActions={openActions}
            setOpenActions={setOpenActions}
            userMenuRef={userMenuRef}
            actionsMenuRef={actionsMenuRef}
            isCourseCreator={isCourseCreator}
            handleLogout={handleLogout}
            displayHandle={displayHandle}
          />
          
          <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-10 py-8 sm:py-10 md:py-12">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
              <p className="text-foreground/80">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary font-semibold rounded-xl transition-all duration-300"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className={`relative min-h-screen overflow-y-auto transition-all duration-500 ${
        theme === 'dark' ? 'auth-bg-dark' : 'auth-bg-light'
      }`}
      style={theme === 'dark' ? {
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : {}}
    >
      {/* Overlay for readability */}
      <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
          : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
      }`} />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary/30 rounded-full animate-pulse-subtle"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-primary/20 rounded-full animate-float"></div>
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-primary/25 rounded-full animate-bounce-gentle"></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-primary/15 rounded-full animate-pulse-subtle"></div>
      </div>

      <div className="relative z-10 min-h-screen">
        <TopBar 
          user={user}
          openUser={openUser}
          setOpenUser={setOpenUser}
          openActions={openActions}
          setOpenActions={setOpenActions}
          userMenuRef={userMenuRef}
          actionsMenuRef={actionsMenuRef}
          isCourseCreator={isCourseCreator}
          handleLogout={handleLogout}
          displayHandle={displayHandle}
        />
        
        <ProfileBanner 
          user={user}
          profile={profile}
          displayHandle={displayHandle}
          fmtDate={fmtDate}
        />
        
        <DashboardContent 
          firstName={firstName}
          profile={profile}
          currentCourses={currentCourses}
          completedCourses={completedCourses}
          fmtDate={fmtDate}
        />
      </div>
    </section>
  )
}

export default Dashboard
