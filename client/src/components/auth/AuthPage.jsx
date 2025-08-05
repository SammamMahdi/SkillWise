import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';

const AuthPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentForm, setCurrentForm] = useState('login'); // 'login', 'signup', 'forgot-password'

  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated) {
    // In a real app, you'd use React Router to redirect
    window.location.href = '/dashboard';
    return null;
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-foreground/80">Loading...</p>
        </div>
      </div>
    );
  }

  const renderForm = () => {
    switch (currentForm) {
      case 'signup':
        return <SignupForm onSwitchToLogin={() => setCurrentForm('login')} />;
      case 'forgot-password':
        return <ForgotPasswordForm onBackToLogin={() => setCurrentForm('login')} />;
      case 'login':
      default:
        return (
          <LoginForm
            onSwitchToSignup={() => setCurrentForm('signup')}
            onShowForgotPassword={() => setCurrentForm('forgot-password')}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 neon-glow">SkillWise</h1>
          <p className="text-foreground/80">Your learning journey starts here</p>
        </div>

        {/* Form Container */}
        {renderForm()}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-foreground/60">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 