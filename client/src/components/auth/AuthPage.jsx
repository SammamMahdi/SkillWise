import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import bg from './evening-bg.jpg'; // keep the image here

const AuthPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentForm, setCurrentForm] = useState('login'); // 'login' | 'signup' | 'forgot-password'

  if (isAuthenticated) {
    window.location.href = '/dashboard';
    return null;
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
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
    // Full-viewport background, covers entire screen
    <section
      className="fixed inset-0"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60" />

      {/* 2-column layout, both sides vertically centered */}
      <div className="relative z-10 h-full w-full grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT: brand (vertically centered; left-aligned) */}
        <div className="lg:col-span-5 xl:col-span-6 flex items-center">
          <div className="pl-8 sm:pl-12 lg:pl-16 pr-8">
            <h1 className="text-white text-5xl md:text-6xl font-extrabold tracking-wide drop-shadow-lg font-serif">
              SkillWise
            </h1>
            <p className="mt-3 text-white/85 text-lg">
              Your learning journey starts here
            </p>
          </div>
        </div>

        {/* RIGHT: form (centered; card width narrowed) */}
        <div className="lg:col-span-7 xl:col-span-6 flex items-center justify-center p-4 sm:p-8 lg:p-16">
          <div className="w-full" style={{ width: 'min(92vw, 38rem)' }}>
            {renderForm()}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AuthPage;
