import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import DashboardButton from './DashboardButton'
import ThemeToggle from './ThemeToggle'

const GlobalNavigation = ({ className = '', showThemeToggle = true, showDashboard = true }) => {
  const { user } = useAuth()

  // Don't show if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 ${className}`}>
      {showDashboard && <DashboardButton size="sm" variant="ghost" />}
      {showThemeToggle && <ThemeToggle size="md" />}
    </div>
  )
}

export default GlobalNavigation
