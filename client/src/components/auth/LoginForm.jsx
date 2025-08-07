import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GoogleSignInDebug from '../../utils/googleSignInDebug';

const LoginForm = ({ onSwitchToSignup, onShowForgotPassword }) => {
  const { login, googleLogin, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [googleError, setGoogleError] = useState(null);
  const googleButtonRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Load Google Identity Services script
  useEffect(() => {
    const loadGoogleScript = async () => {
      if (window.google) {
        setGoogleScriptLoaded(true);
        return;
      }

      try {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        
        await new Promise((resolve, reject) => {
          script.onload = () => {
            setGoogleScriptLoaded(true);
            resolve();
          };
          script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
          document.head.appendChild(script);
        });
      } catch (error) {
        console.error('Failed to load Google script:', error);
        const debugInfo = GoogleSignInDebug.handleError(error, 'script-loading');
        setGoogleError(debugInfo);
      }
    };

    loadGoogleScript();
  }, []);

  // Initialize Google Sign-In when script is loaded
  useEffect(() => {
    if (!googleScriptLoaded || !googleButtonRef.current) return;

    try {
      // Log debug information
      GoogleSignInDebug.logDebugInfo();

      const config = {
        client_id: '269526213654-n074agil0bclv6aiu651jd2hgfdfikil.apps.googleusercontent.com',
        callback: async (response) => {
          try {
            console.log('Google callback received:', response);
            setIsGoogleLoading(true);
            setGoogleError(null);
            
            if (response.credential) {
              // Store the ID token
              localStorage.setItem('googleIdToken', response.credential);
              
              // Call our backend with the Google ID token
              const result = await googleLogin(response.credential);
              
              if (result.success) {
                console.log('Google login successful!');
                // Redirect to dashboard or home page
                window.location.href = '/dashboard';
              } else if (result.requiresRoleSelection) {
                console.log('Role selection required, redirecting to profile');
                // Redirect to profile page for role selection
                window.location.href = '/profile';
              } else {
                console.error('Google login failed:', result.error);
                setGoogleError({
                  type: 'auth',
                  message: result.error || 'Google login failed',
                  suggestion: 'Please try again or contact support.'
                });
              }
            }
          } catch (error) {
            console.error('Google login error:', error);
            const debugInfo = GoogleSignInDebug.handleError(error, 'login-callback');
            setGoogleError(debugInfo);
          } finally {
            setIsGoogleLoading(false);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      };

      // Validate configuration
      const configValidation = GoogleSignInDebug.validateConfig(config);
      if (!configValidation.isValid) {
        console.error('Invalid Google Sign-In configuration:', configValidation.errors);
        setGoogleError({
          type: 'config',
          message: 'Invalid Google Sign-In configuration',
          suggestion: 'Please check the configuration and try again.'
        });
        return;
      }

      window.google.accounts.id.initialize(config);

      // Render the Google Sign-In button
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: '100%',
      });

    } catch (error) {
      console.error('Failed to initialize Google Sign-In:', error);
      const debugInfo = GoogleSignInDebug.handleError(error, 'initialization');
      setGoogleError(debugInfo);
    }
  }, [googleScriptLoaded, googleLogin]);

  const onSubmit = async (data) => {
    clearError();
    
    const result = await login({
      email: data.email,
      password: data.password,
    });

    if (result.success) {
      // Login successful, redirect to dashboard or home
      console.log('Login successful!');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border border-border rounded-lg shadow-xl p-8 card-hover">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h2>
          <p className="text-foreground/80">Sign in to your SkillWise account</p>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {googleError && (
          <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <p className="text-orange-400 text-sm font-medium">{googleError.message}</p>
            {googleError.suggestion && (
              <p className="text-orange-400/80 text-sm mt-1">{googleError.suggestion}</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                type="email"
                id="email"
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-foreground/50"
                placeholder="Enter your email"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                {...register('password', {
                  required: 'Password is required',
                })}
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-foreground/50"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/40 hover:text-foreground/60"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                type="checkbox"
                id="rememberMe"
                className="w-4 h-4 text-primary border-border rounded focus:ring-primary bg-background"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-foreground/80">
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={onShowForgotPassword}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="cosmic-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-border" />
          <span className="px-4 text-sm text-foreground/60">or</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Google OAuth Button */}
        <div className="w-full">
          {!googleScriptLoaded ? (
            <button
              disabled
              className="w-full bg-background border border-border text-foreground/50 py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span>Loading Google Sign-In...</span>
            </button>
          ) : (
            <div ref={googleButtonRef} className="w-full"></div>
          )}
        </div>

        {/* Signup Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-foreground/80">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 