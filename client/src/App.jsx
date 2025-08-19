import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { hasTeacherPermissions } from './utils/permissions'
import AuthPage from './components/auth/AuthPage'
import ProfileSettings from './components/profile/ProfileSettings'
import ProfileVisuals from './components/profile/ProfileVisuals'
import AdminDashboard from './components/admin/AdminDashboard'
import PaymentCodeManager from './components/admin/PaymentCodeManager'
import ParentDashboard from './components/parent/ParentDashboard'
import BecomeParentPage from './components/parent/BecomeParentPage'
import LearningDashboard from './components/dashboard/LearningDashboard'
import CourseGrid from './components/courses/CourseGrid'
import CreateCourseForm from './components/courses/CreateCourseForm'
import EditCourseForm from './components/courses/EditCourseForm'
import AddLectureForm from './components/courses/AddLectureForm'
import CourseDetail from './components/courses/CourseDetail'
import StudentCourseView from './components/courses/StudentCourseView'
import Dashboard from './components/dashboard/Dashboard'
import FriendsPage from './components/friends/FriendsPage'
import FriendChatList from './components/friends/FriendChatList'
import PublicProfile from './components/profile/PublicProfile'
import FriendSystemTest from './components/test/FriendSystemTest'

// Exam components
import TeacherExamDashboard from './components/exams/TeacherExamDashboard'
import CreateExamForm from './components/exams/CreateExamForm'
import StudentExamList from './components/exams/StudentExamList'
import ExamInterface from './components/exams/ExamInterface'

import ExamSubmissionReview from './components/exams/ExamSubmissionReview'
import ExamResults from './components/exams/ExamResults'
import ExamSubmissionSuccess from './components/exams/ExamSubmissionSuccess'
import ReAttemptRequests from './components/admin/ReAttemptRequests'
import TeacherDashboard from './components/teacher/TeacherDashboard'
import TeacherSubmissionReview from './components/teacher/TeacherSubmissionReview'
import TeacherReAttemptRequests from './components/teacher/TeacherReAttemptRequests'

// NEW: Set Username page (same background/glass as login)
import SetUsername from './components/auth/SetUsername'

// NEW: Parental Approval page for users under 13
import ParentalApproval from './components/auth/ParentalApproval'

// NEW: Parent Email Required page for under-13 users
import ParentEmailRequired from './components/auth/ParentEmailRequired'

// NEW: Blocked Account page
import BlockedAccount from './components/auth/BlockedAccount'

// NEW: Parent Invitation page
import ParentInvitation from './components/auth/ParentInvitation'

// NEW: Styled Profile Setup page  
import StyledProfileSetup from './components/profile/StyledProfileSetup'

// NEW: Age verification wrapper
import AgeVerificationWrapper from './components/auth/AgeVerificationWrapper'

// Payment components
import SkillPayWallet from './components/payment/SkillPayWallet'

// Skills components
import SkillsWall from './components/skills/SkillsWall'

// Messages components
import Messages from './components/messages/Messages'

// SuperUser components
import SuperUserRoleManagement from './components/superuser/SuperUserRoleManagement'

// Teacher Application components
import TeacherApplicationForm from './components/teacher/TeacherApplicationForm'
import ApproveTeacherPage from './components/admin/ApproveTeacherPage'

// Test components
import SuperUserAccessTest from './components/test/SuperUserAccessTest'

// Common components
import NotificationContainer from './components/common/NotificationContainer'

const queryClient = new QueryClient()

// Component that has access to auth context
function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />

      {/* NEW: Set Username route */}
      <Route path="/auth/set-username" element={<SetUsername />} />

      {/* NEW: Parental Approval route for users under 13 */}
      <Route path="/auth/parental-approval" element={<ParentalApproval />} />

      {/* NEW: Parent Email Required route for under-13 users */}
      <Route path="/auth/parent-email-required" element={<ParentEmailRequired />} />

      {/* NEW: Blocked Account route */}
      <Route path="/auth/blocked-account" element={<BlockedAccount />} />

      {/* NEW: Parent Invitation route */}
      <Route path="/auth/parent-invitation" element={<ParentInvitation />} />

      {/* NEW: Become Parent route */}
      <Route path="/become-parent" element={
        <AgeVerificationWrapper>
          <BecomeParentPage />
        </AgeVerificationWrapper>
      } />

      <Route path="/dashboard" element={
        <AgeVerificationWrapper>
          <Dashboard />
        </AgeVerificationWrapper>
      } />
      <Route path="/learning" element={
        <AgeVerificationWrapper>
          <LearningDashboard />
        </AgeVerificationWrapper>
      } />
      <Route path="/profile" element={
        <AgeVerificationWrapper>
          <StyledProfileSetup />
        </AgeVerificationWrapper>
      } />
      <Route path="/profile/settings" element={
        <AgeVerificationWrapper>
          <ProfileSettings />
        </AgeVerificationWrapper>
      } />
      <Route path="/profile/visuals" element={
        <AgeVerificationWrapper>
          <ProfileVisuals />
        </AgeVerificationWrapper>
      } />
      <Route path="/admin" element={
        <AgeVerificationWrapper>
          <AdminDashboard />
        </AgeVerificationWrapper>
      } />
      <Route path="/admin/payment-codes" element={
        <AgeVerificationWrapper>
          <PaymentCodeManager />
        </AgeVerificationWrapper>
      } />
      <Route path="/parent" element={
        <AgeVerificationWrapper>
          <ParentDashboard />
        </AgeVerificationWrapper>
      } />
      <Route path="/parent/dashboard" element={
        <AgeVerificationWrapper>
          <ParentDashboard />
        </AgeVerificationWrapper>
      } />
      <Route path="/courses" element={
        <AgeVerificationWrapper>
          <CourseGrid />
        </AgeVerificationWrapper>
      } />
      <Route path="/create-course" element={
        <AgeVerificationWrapper>
          <CreateCourseForm />
        </AgeVerificationWrapper>
      } />
      <Route path="/courses/:id" element={
        <AgeVerificationWrapper>
          <StudentCourseView />
        </AgeVerificationWrapper>
      } />
      <Route path="/courses/:id/admin" element={
        <AgeVerificationWrapper>
          <CourseDetail />
        </AgeVerificationWrapper>
      } />
      <Route path="/courses/:id/edit" element={
        <AgeVerificationWrapper>
          <EditCourseForm />
        </AgeVerificationWrapper>
      } />
      <Route path="/courses/:id/add-lecture" element={
        <AgeVerificationWrapper>
          <AddLectureForm />
        </AgeVerificationWrapper>
      } />
      <Route path="/skills" element={
        <AgeVerificationWrapper>
          <SkillsWall />
        </AgeVerificationWrapper>
      } />
      <Route path="/messages" element={
        <AgeVerificationWrapper>
          <Messages />
        </AgeVerificationWrapper>
      } />
      <Route path="/friends" element={
        <AgeVerificationWrapper>
          <FriendsPage />
        </AgeVerificationWrapper>
      } />
      <Route path="/friend-chat" element={
        <AgeVerificationWrapper>
          <FriendChatList />
        </AgeVerificationWrapper>
      } />
      <Route path="/profile/:handle" element={
        <AgeVerificationWrapper>
          <PublicProfile />
        </AgeVerificationWrapper>
      } />
      <Route path="/test/friends" element={
        <AgeVerificationWrapper>
          <FriendSystemTest />
        </AgeVerificationWrapper>
      } />

      {/* Exam routes */}
      <Route path="/exams" element={
        hasTeacherPermissions(user) ? <TeacherExamDashboard /> : <StudentExamList />
      } />
      <Route path="/courses/:courseId/create-exam" element={<CreateExamForm />} />
      <Route path="/exams/take/:attemptId" element={<ExamInterface />} />
      <Route path="/exams/submitted/:attemptId" element={<ExamSubmissionSuccess />} />
      <Route path="/exams/results/:attemptId" element={<ExamResults />} />
      
      <Route path="/admin/submissions/review" element={<ExamSubmissionReview />} />
      <Route path="/admin/re-attempt-requests" element={<ReAttemptRequests />} />
      <Route path="/teacher" element={<TeacherDashboard />} />
      <Route path="/teacher/submissions/review" element={<TeacherSubmissionReview />} />
      <Route path="/teacher/re-attempt-requests" element={<TeacherReAttemptRequests />} />

      {/* Payment routes */}
      <Route path="/skillpay" element={<SkillPayWallet />} />
      
      {/* SuperUser routes */}
      <Route path="/superuser/roles" element={<SuperUserRoleManagement />} />
      <Route path="/test/superuser" element={<SuperUserAccessTest />} />
      
      {/* Teacher Application routes */}
      <Route path="/apply-teacher" element={<TeacherApplicationForm />} />
      <Route path="/admin/approve-teachers" element={<ApproveTeacherPage />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <AppRoutes />
              <NotificationContainer />
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
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
