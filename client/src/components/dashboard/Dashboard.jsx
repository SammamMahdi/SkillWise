import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import BlockedAccount from '../auth/BlockedAccount'
import NotificationCenter from '../notifications/NotificationCenter'
import TopBar from './TopBar'
import ProfileBanner from './ProfileBanner'
import DashboardContent from './DashboardContent'
import { fmtDate } from '../../utils/dateUtils'

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
  const displayHandle = user?.username || user?.handle

  return (
    <div className="min-h-screen bg-background text-foreground">
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
        theme={theme}
        setTheme={setTheme}
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
  )
}

export default Dashboard
