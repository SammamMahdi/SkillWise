import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './components/auth/AuthPage'
import ProfileSettings from './components/profile/ProfileSettings'
import ProfileVisuals from './components/profile/ProfileVisuals'
import AdminDashboard from './components/admin/AdminDashboard'
import ParentDashboard from './components/parent/ParentDashboard'
import LearningDashboard from './components/dashboard/LearningDashboard'
import CourseGrid from './components/courses/CourseGrid'
import CreateCourseForm from './components/courses/CreateCourseForm'
import EditCourseForm from './components/courses/EditCourseForm'
import AddLectureForm from './components/courses/AddLectureForm'
import CourseDetail from './components/courses/CourseDetail'
import StudentCourseView from './components/courses/StudentCourseView'
import Dashboard from './components/dashboard/Dashboard'
import FriendsPage from './components/friends/FriendsPage'
import PublicProfile from './components/profile/PublicProfile'
import FriendSystemTest from './components/test/FriendSystemTest'

// Exam components
import TeacherExamDashboard from './components/exams/TeacherExamDashboard'
import CreateExamForm from './components/exams/CreateExamForm'
import StudentExamList from './components/exams/StudentExamList'
import ExamInterface from './components/exams/ExamInterface'
import AdminExamReview from './components/exams/AdminExamReview'
import ExamSubmissionReview from './components/exams/ExamSubmissionReview'
import ExamResults from './components/exams/ExamResults'
import ExamSubmissionSuccess from './components/exams/ExamSubmissionSuccess'
import ReAttemptRequests from './components/admin/ReAttemptRequests'
import TeacherDashboard from './components/teacher/TeacherDashboard'
import TeacherSubmissionReview from './components/teacher/TeacherSubmissionReview'
import TeacherReAttemptRequests from './components/teacher/TeacherReAttemptRequests'

// NEW: Set Username page (same background/glass as login)
import SetUsername from './components/auth/SetUsername'

const queryClient = new QueryClient()

// Component that has access to auth context
function AppRoutes({ theme, setTheme }) {
  const { user } = useAuth()

  return (
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
      <Route path="/courses/:id" element={<StudentCourseView />} />
      <Route path="/courses/:id/admin" element={<CourseDetail />} />
      <Route path="/courses/:id/edit" element={<EditCourseForm />} />
      <Route path="/courses/:id/add-lecture" element={<AddLectureForm />} />
      <Route path="/friends" element={<FriendsPage />} />
      <Route path="/profile/:handle" element={<PublicProfile />} />
      <Route path="/test/friends" element={<FriendSystemTest />} />

      {/* Exam routes */}
      <Route path="/exams" element={
        (user?.role === 'Teacher' || user?.role === 'Admin') ? <TeacherExamDashboard /> : <StudentExamList />
      } />
      <Route path="/courses/:courseId/create-exam" element={<CreateExamForm />} />
      <Route path="/exams/take/:attemptId" element={<ExamInterface />} />
      <Route path="/exams/submitted/:attemptId" element={<ExamSubmissionSuccess />} />
      <Route path="/exams/results/:attemptId" element={<ExamResults />} />
      <Route path="/admin/exams/review" element={<AdminExamReview />} />
      <Route path="/admin/submissions/review" element={<ExamSubmissionReview />} />
      <Route path="/admin/re-attempt-requests" element={<ReAttemptRequests />} />
      <Route path="/teacher" element={<TeacherDashboard />} />
      <Route path="/teacher/submissions/review" element={<TeacherSubmissionReview />} />
      <Route path="/teacher/re-attempt-requests" element={<TeacherReAttemptRequests />} />
    </Routes>
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
            <AppRoutes theme={theme} setTheme={setTheme} />
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
