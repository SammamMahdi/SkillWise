import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const DashboardButton = ({ className = '', size = 'md', variant = 'primary' }) => {
  const { user } = useAuth()
  const location = useLocation()

  // Don't show on auth pages or dashboard itself
  if (!user || location.pathname === '/dashboard' || location.pathname === '/' || location.pathname === '/auth') {
    return null
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const variantClasses = {
    primary: `
      bg-gradient-to-r from-primary/90 to-primary 
      hover:from-primary hover:to-primary/90
      text-primary-foreground 
      shadow-md hover:shadow-lg
      border border-primary/20
    `,
    secondary: `
      bg-secondary/80 
      hover:bg-secondary 
      text-secondary-foreground 
      border border-border/50
    `,
    ghost: `
      bg-transparent 
      hover:bg-accent 
      text-foreground 
      border border-border/30 
      hover:border-border/60
    `
  }

  return (
    <Link
      to="/dashboard"
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        inline-flex items-center gap-2
        rounded-full
        font-medium
        backdrop-blur-sm
        transition-all duration-300
        hover:scale-105
        active:scale-95
        hover:shadow-[0_8px_32px_rgba(124,58,237,0.3)]
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
        ${className}
      `}
      title="Go to Dashboard"
    >
      <svg 
        className="w-4 h-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" 
        />
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" 
        />
      </svg>
      <span>Dashboard</span>
    </Link>
  )
}

export default DashboardButton
