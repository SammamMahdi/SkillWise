import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Users, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  Heart, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../common/ThemeToggle';
import bg from './evening-b2g.jpg';
import toast from 'react-hot-toast';

const ParentInvitation = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [invitationData, setInvitationData] = useState(null);
  const [validatingToken, setValidatingToken] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError
  } = useForm();

  const password = watch('password');
  const token = searchParams.get('token');

  // Validate invitation token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        toast.error('Invalid invitation link');
        navigate('/');
        return;
      }

      try {
        const response = await fetch(`/api/auth/validate-invitation?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setInvitationData(data);
        } else {
          toast.error(data.error || 'Invalid or expired invitation');
          navigate('/');
        }
      } catch (error) {
        console.error('Error validating token:', error);
        toast.error('Error validating invitation');
        navigate('/');
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/accept-parent-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          password: data.password
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Parent account created and child approved!');
        // Store token and redirect to parent dashboard
        localStorage.setItem('token', result.accessToken);
        navigate('/parent/dashboard');
      } else {
        if (result.field) {
          setError(result.field, { message: result.error });
        } else {
          toast.error(result.error || 'Failed to create parent account');
        }
      }
    } catch (error) {
      console.error('Error creating parent account:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <section
        className={`relative min-h-screen overflow-y-auto transition-all duration-500 ${
          theme === 'dark' ? 'auth-bg-dark' : 'auth-bg-light'
        }`}
        style={theme === 'dark' ? {
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        } : {}}
      >
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className={`w-full max-w-md rounded-2xl border backdrop-blur-xl shadow-2xl p-6 sm:p-10 transition-all duration-500 text-center ${
            theme === 'dark'
              ? 'border-white/15 bg-white/10 text-white'
              : 'border-slate-200/50 bg-white/90 text-slate-800'
          }`}>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className={`transition-colors duration-500 ${
              theme === 'dark' ? 'text-white/80' : 'text-slate-600'
            }`}>
              Validating invitation...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={`relative min-h-screen overflow-y-auto transition-all duration-500 ${
        theme === 'dark' ? 'auth-bg-dark' : 'auth-bg-light'
      }`}
      style={theme === 'dark' ? {
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : {}}
    >
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle size="md" />
      </div>

      {/* Overlay */}
      <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
          : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
      }`} />

      {/* Content grid */}
      <div className="relative z-10 min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 items-start lg:items-center py-10 sm:py-14">
        {/* LEFT: Branding and child info */}
        <div className="lg:col-span-4 xl:col-span-5 flex items-start lg:items-center justify-center lg:justify-start text-center lg:text-left">
          <div className="px-8 sm:px-12 lg:pl-16 lg:pr-8">
            <div className="flex justify-center lg:justify-start mb-4">
              <div className="p-4 rounded-full bg-emerald-500/20 border border-emerald-400/30">
                <Users className="w-12 h-12 text-emerald-400" />
              </div>
            </div>
            
            <h1
              className={`text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", serif' }}
            >
              Parent Account
            </h1>
            <p
              className={`mt-3 text-lg leading-relaxed transition-colors duration-500 ${
                theme === 'dark' ? 'text-white/85' : 'text-slate-700'
              }`}
            >
              Create your account to approve your child's access to SkillWise.
            </p>
            
            {invitationData && (
              <div className={`mt-6 p-4 rounded-lg border transition-all duration-500 ${
                theme === 'dark' 
                  ? 'bg-white/5 border-white/10 text-white/80'
                  : 'bg-white/70 border-slate-200 text-slate-600'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="font-medium">Your child:</span>
                </div>
                <p className="text-sm">
                  <strong>{invitationData.childName}</strong> wants to join SkillWise and needs your approval.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Parent account creation form */}
        <div className="lg:col-span-7 xl:col-span-6 lg:col-start-7 xl:col-start-8 flex justify-center lg:justify-end px-4 sm:px-8 lg:pl-8 lg:pr-24">
          <div className="w-full pb-8 mx-auto lg:ml-auto max-w-sm sm:max-w-md">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className={`w-full max-w-sm sm:max-w-md md:max-w-lg min-h-[500px] rounded-2xl border backdrop-blur-xl shadow-2xl p-6 sm:p-10 overflow-hidden transition-all duration-500 ${
                theme === 'dark'
                  ? 'border-white/15 bg-white/10 text-white'
                  : 'border-slate-200/50 bg-white/90 text-slate-800'
              }`}
            >
              <div className="text-center mb-6">
                <Shield className={`w-12 h-12 mx-auto mb-4 transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-700'
                }`} />
                <h2 className={`text-2xl font-semibold transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>Create Parent Account</h2>
                <p className={`mt-2 text-sm transition-colors duration-500 ${
                  theme === 'dark' ? 'text-white/80' : 'text-slate-600'
                }`}>
                  Complete your account setup to approve your child's access.
                </p>
              </div>

              <div className="space-y-4">
                {invitationData && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-700'
                    }`}>
                      Your Information
                    </label>
                    <div className={`p-3 rounded-lg border transition-all duration-500 ${
                      theme === 'dark' 
                        ? 'bg-white/5 border-white/10 text-white/80'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <p className="text-sm">
                        <strong>Name:</strong> {invitationData.parentName}
                      </p>
                      <p className="text-sm">
                        <strong>Email:</strong> {invitationData.parentEmail}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-700'
                  }`}>
                    Create Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters'
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                          message: 'Password must contain uppercase, lowercase, and number'
                        }
                      })}
                      className={`w-full pl-10 pr-12 py-3 rounded-xl outline-none border transition-all duration-300 ${
                        theme === 'dark'
                          ? 'bg-white/10 border-white/20 focus:border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-violet-300/70'
                          : 'bg-white/80 border-slate-200 focus:border-slate-400 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-violet-500/50'
                      }`}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-700'
                  }`}>
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: value => value === password || 'Passwords do not match'
                      })}
                      className={`w-full pl-10 pr-12 py-3 rounded-xl outline-none border transition-all duration-300 ${
                        theme === 'dark'
                          ? 'bg-white/10 border-white/20 focus:border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-violet-300/70'
                          : 'bg-white/80 border-slate-200 focus:border-slate-400 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-violet-500/50'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`mt-6 w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Create Account & Approve Child
                  </>
                )}
              </button>

              <div className={`mt-6 text-xs text-center transition-colors duration-500 ${
                theme === 'dark' ? 'text-white/70' : 'text-slate-500'
              }`}>
                By creating this account, you agree to supervise your child's activities on SkillWise.
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ParentInvitation;
