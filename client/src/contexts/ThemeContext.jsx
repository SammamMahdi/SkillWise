import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('skillwise-theme')
    if (saved === 'dark' || saved === 'light') return saved
    
    // Check system preference
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
    return prefersDark ? 'dark' : 'light'
  })

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('skillwise-theme', theme)
  }, [theme])

  useEffect(() => {
    // Listen for theme changes from auth events
    const handleThemeChange = (event) => {
      setTheme(event.detail)
    }

    window.addEventListener('themeChanged', handleThemeChange)
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange)
    }
  }, [])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
