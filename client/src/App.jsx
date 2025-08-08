import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './components/auth/AuthPage'
import ProfileSettings from './components/profile/ProfileSettings'
import AdminDashboard from './components/admin/AdminDashboard'
import ParentDashboard from './components/parent/ParentDashboard'
import BlockedAccount from './components/auth/BlockedAccount'
import NotificationCenter from './components/notifications/NotificationCenter'
import LearningDashboard from './components/dashboard/LearningDashboard'

// Create a client
const queryClient = new QueryClient()

// Dashboard component
const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  // Check if user is blocked
  if (user?.isAccountBlocked) {
    return <BlockedAccount user={user} />;
  }

  // Check if user requires parental approval but hasn't been approved yet
  if (user?.requiresParentalApproval && !user?.parentConfirmed) {
    return <BlockedAccount user={user} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground neon-glow">Welcome to SkillWise</h1>
              <p className="text-foreground/80 mt-2">Your comprehensive learning platform</p>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <a
                href="/profile"
                className="cosmic-button"
              >
                Profile Settings
              </a>
              {user?.role === 'Admin' && (
                <a
                  href="/admin"
                  className="cosmic-button"
                >
                  Admin Dashboard
                </a>
              )}
              {user?.role === 'Parent' && (
                <a
                  href="/parent"
                  className="cosmic-button"
                >
                  Parent Dashboard
                </a>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-background border border-border text-foreground rounded-lg hover:bg-card transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-card border border-border rounded-lg shadow-lg p-6 mb-8 card-hover">
            <h2 className="text-xl font-semibold text-foreground mb-4">User Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-foreground/60 text-sm">Name</p>
                <p className="text-foreground font-medium">{user?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-foreground/60 text-sm">Email</p>
                <p className="text-foreground font-medium">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-foreground/60 text-sm">Role</p>
                <p className="text-foreground font-medium">{user?.role || 'Student'}</p>
              </div>
              <div>
                <p className="text-foreground/60 text-sm">Login Method</p>
                <p className="text-foreground font-medium">
                  {user?.googleId ? (
                    <span className="flex items-center space-x-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>Google OAuth</span>
                    </span>
                  ) : (
                    'Email/Password'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* User Stats Card */}
          <div className="bg-card border border-border rounded-lg shadow-lg p-6 mb-8 card-hover">
            <h2 className="text-xl font-semibold text-foreground mb-4">Account Statistics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-background rounded-lg border border-border">
                <p className="text-2xl font-bold text-primary">{user?.xp || 0}</p>
                <p className="text-sm text-foreground/60">Experience Points</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg border border-border">
                <p className="text-2xl font-bold text-primary">{user?.credits || 0}</p>
                <p className="text-sm text-foreground/60">Credits</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg border border-border">
                <p className="text-2xl font-bold text-primary">{user?.badges?.length || 0}</p>
                <p className="text-sm text-foreground/60">Badges</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg border border-border">
                <p className="text-2xl font-bold text-primary">{user?.avatarsUnlocked?.length || 0}</p>
                <p className="text-sm text-foreground/60">Avatars</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg shadow-lg p-6 card-hover">
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/learning" className="cosmic-button text-center">
                Learning Dashboard
              </a>
              <button className="cosmic-button">
                View Progress
              </button>
              <button className="cosmic-button">
                Explore Skills
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  // Apply dark theme by default
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App dark">
            <Routes>
              <Route path="/" element={<AuthPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/signup" element={<AuthPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/learning" element={<LearningDashboard />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/parent" element={<ParentDashboard />} />
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