import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GoogleSignInDebug from '../../utils/googleSignInDebug';

const CLIENT_ID = '269526213654-n074agil0bclv6aiu651jd2hgfdfikil.apps.googleusercontent.com';

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
        const debugInfo = GoogleSignInDebug.handleError(error, 'script-loading');
        setGoogleError(debugInfo);
      }
    };
    loadGoogleScript();
  }, []);

  // Initialize Google Sign-In (with centered button)
  useEffect(() => {
    if (!googleScriptLoaded || !googleButtonRef.current) return;

    try {
      GoogleSignInDebug.logDebugInfo();

      const config = {
        client_id: CLIENT_ID, // FIXED client ID
        callback: async (response) => {
          try {
            setIsGoogleLoading(true);
            setGoogleError(null);

            if (response.credential) {
              localStorage.setItem('googleIdToken', response.credential);
              const result = await googleLogin(response.credential);

              if (result.success) {
                window.location.href = '/dashboard';
              } else if (result.requiresRoleSelection) {
                window.location.href = '/profile';
              } else {
                setGoogleError({
                  type: 'auth',
                  message: result.error || 'Google login failed',
                  suggestion: 'Please try again or contact support.',
                });
              }
            }
          } catch (error) {
            const debugInfo = GoogleSignInDebug.handleError(error, 'login-callback');
            setGoogleError(debugInfo);
          } finally {
            setIsGoogleLoading(false);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      };

      const configValidation = GoogleSignInDebug.validateConfig(config);
      if (!configValidation.isValid) {
        setGoogleError({
          type: 'config',
          message: 'Invalid Google Sign-In configuration',
          suggestion: 'Please check the configuration and try again.',
        });
        return;
      }

      window.google.accounts.id.initialize(config);

      // CHANGE #3: responsive Google button width (clamped)
      const safePadding = 64; // account for card padding
      const btnWidth = Math.max(240, Math.min(360, window.innerWidth - safePadding));

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: btnWidth,
      });
    } catch (error) {
      const debugInfo = GoogleSignInDebug.handleError(error, 'initialization');
      setGoogleError(debugInfo);
    }
  }, [googleScriptLoaded, googleLogin]);

  const onSubmit = async (data) => {
    clearError();
    const result = await login({ email: data.email, password: data.password });
    if (result.success) {
      console.log('Login successful!');
    }
  };

  return (
    <div className="w-full">
      {/* CHANGE #2: fluid, responsive card width */}
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg min-h-[650px] rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl shadow-2xl p-6 sm:p-10 overflow-hidden">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(167,139,250,0.25)' }}
          >
            <LogIn className="w-6 h-6" style={{ color: '#a78bfa' }} />
          </div>
          {/* CHANGE #4: slightly smaller on tiny screens */}
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white"
            style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", serif' }}
          >
            Welcome Back
          </h2>
          <p
            className="text-white/80"
            style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}
          >
            Sign in to your SkillWise account
          </p>
        </div>

        {/* Errors */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-400/30 bg-red-500/15">
            <p className="text-red-200 text-sm">{'' + error}</p>
          </div>
        )}
        {googleError && (
          <div className="mb-6 p-4 rounded-lg border border-amber-400/30 bg-amber-500/15">
            <p className="text-amber-200 text-sm font-medium">{googleError.message}</p>
            {googleError.suggestion && (
              <p className="text-amber-200/80 text-sm mt-1">{googleError.suggestion}</p>
            )}
          </div>
        )}

        {/* Form (left-aligned) */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white mb-2"
              style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
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
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-violet-300/70 focus:border-transparent"
                placeholder="Enter your email"
                style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-amber-200">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-white mb-2"
              style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
              <input
                {...register('password', { required: 'Password is required' })}
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="w-full pl-10 pr-12 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-violet-300/70 focus:border-transparent"
                placeholder="Enter your password"
                style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-amber-200">{errors.password.message}</p>}
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input
                {...register('rememberMe')}
                type="checkbox"
                id="rememberMe"
                className="w-4 h-4 rounded bg-white/10 border-white/30 text-violet-300 focus:ring-violet-300/60"
              />
              <span
                className="text-sm text-white/85"
                style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}
              >
                Remember me
              </span>
            </label>
            <button
              type="button"
              onClick={onShowForgotPassword}
              className="text-sm font-medium text-yellow-300 hover:text-yellow-200 transition"
              style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg py-3 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-yellow-300/20 focus:outline-none focus:ring-2 focus:ring-yellow-300/70"
            style={{
              background:
                'linear-gradient(135deg, rgba(167,139,250,0.95) 0%, rgba(253,224,71,0.9) 100%)',
              color: '#0b0b12',
              fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            }}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-white/20" />
          <span
            className="px-4 text-sm text-white/70"
            style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}
          >
            or
          </span>
          <div className="flex-1 border-t border-white/20" />
        </div>

        {/* Google OAuth Button (centered) */}
        <div className="w-full">
          {!googleScriptLoaded ? (
            <button
              disabled
              className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white/60"
              style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Loading Google Sign-In...</span>
            </button>
          ) : (
            <div className="w-full flex justify-center">
              <div ref={googleButtonRef} className="inline-block" />
            </div>
          )}
        </div>

        {/* Signup Link */}
        <div className="mt-6 text-center">
          <p
            className="text-sm text-white/85"
            style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}
          >
            Don&apos;t have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="font-semibold underline decoration-yellow-300/70 hover:decoration-yellow-200 text-yellow-300 hover:text-yellow-200 transition"
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
