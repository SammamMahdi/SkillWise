import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import AuthPage from './components/auth/AuthPage'
import ProfileSettings from './components/profile/ProfileSettings'
import ProfileVisuals from './components/profile/ProfileVisuals'
import AdminDashboard from './components/admin/AdminDashboard'
import ParentDashboard from './components/parent/ParentDashboard'
import LearningDashboard from './components/dashboard/LearningDashboard'
import CourseGrid from './components/courses/CourseGrid'
import CreateCourseForm from './components/courses/CreateCourseForm'
import CourseDetail from './components/courses/CourseDetail'
import Dashboard from './components/dashboard/Dashboard'

// NEW: Set Username page (same background/glass as login)
import SetUsername from './components/auth/SetUsername'

const queryClient = new QueryClient()

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

              {/* NEW: Set Username route */}
              <Route path="/auth/set-username" element={<SetUsername />} />

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
