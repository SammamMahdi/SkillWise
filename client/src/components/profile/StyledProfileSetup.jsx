import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  AtSign, 
  Save, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { checkUsernameAvailable, setMyUsername } from '../../services/usernameService';
import ThemeToggle from '../common/ThemeToggle';
import bg from '../auth/evening-b2g.jpg';
import toast from 'react-hot-toast';

const StyledProfileSetup = () => {
  const { user, updateProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState('');
  const [usernameDebounceTimer, setUsernameDebounceTimer] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm();

  const watchedUsername = watch('username');

  useEffect(() => {
    if (user) {
      // If user already has completed setup, redirect to dashboard
      if (!user.isFirstTimeUser && user.username && user.dateOfBirth) {
        navigate('/dashboard');
        return;
      }
      
      setValue('username', user.username || '');
      
      // Set date of birth if available
      if (user.dateOfBirth) {
        const date = new Date(user.dateOfBirth);
        const formattedDate = date.toISOString().split('T')[0];
        setValue('dateOfBirth', formattedDate);
      }
    }
  }, [user, setValue, navigate]);

  // Username validation
  const validateUsername = async (username) => {
    if (!username || username === user?.username) {
      setUsernameStatus('');
      return;
    }

    const USERNAME_REGEX = /^[a-z0-9_.]{3,20}$/;
    if (!USERNAME_REGEX.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');
    
    try {
      const result = await checkUsernameAvailable(username);
      setUsernameStatus(result.available ? 'available' : 'taken');
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameStatus('');
    }
  };

  // Debounced username validation
  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase();
    
    if (usernameDebounceTimer) {
      clearTimeout(usernameDebounceTimer);
    }
    
    const timer = setTimeout(() => {
      validateUsername(value);
    }, 500);
    
    setUsernameDebounceTimer(timer);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    
    try {
      // Handle username update if changed and valid
      if (data.username && data.username !== user?.username) {
        if (usernameStatus !== 'available') {
          toast.error('Please choose a valid and available username');
          setSaving(false);
          return;
        }
        
        const token = localStorage.getItem('token');
        await setMyUsername(data.username, token);
      }

      // Update profile with date of birth and mark as no longer first-time user
      const profileData = {
        isFirstTimeUser: false
      };

      if (data.dateOfBirth) {
        profileData.dateOfBirth = data.dateOfBirth;
      }

      await updateProfile(profileData);
      
      toast.success('Profile setup completed!');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const getUsernameStatusIcon = () => {
    switch (usernameStatus) {
      case 'checking':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-400" />;
      case 'available':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'taken':
      case 'invalid':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getUsernameStatusMessage = () => {
    switch (usernameStatus) {
      case 'checking':
        return <p className="text-blue-400 text-sm mt-1">Checking availability...</p>;
      case 'available':
        return <p className="text-green-400 text-sm mt-1">Username is available!</p>;
      case 'taken':
        return <p className="text-red-400 text-sm mt-1">Username is already taken</p>;
      case 'invalid':
        return <p className="text-red-400 text-sm mt-1">Username must be 3-20 characters, lowercase letters, numbers, dots, and underscores only</p>;
      default:
        return null;
    }
  };

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
        {/* LEFT: Branding */}
        <div className="lg:col-span-4 xl:col-span-5 flex items-start lg:items-center justify-center lg:justify-start text-center lg:text-left">
          <div className="px-8 sm:px-12 lg:pl-16 lg:pr-8">
            <div className="flex justify-center lg:justify-start mb-4">
              <div className="p-4 rounded-full bg-blue-500/20 border border-blue-400/30">
                <User className="w-12 h-12 text-blue-400" />
              </div>
            </div>
            
            <h1
              className={`text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg transition-colors duration-500 ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}
              style={{ fontFamily: '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", serif' }}
            >
              Welcome to SkillWise!
            </h1>
            <p
              className={`mt-3 text-lg leading-relaxed transition-colors duration-500 ${
                theme === 'dark' ? 'text-white/85' : 'text-slate-700'
              }`}
            >
              Let's complete your profile setup
            </p>
          </div>
        </div>

        {/* RIGHT: Profile Setup Form */}
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
              <div className="space-y-6">
                {/* Username Field */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-700'
                  }`}>
                    Choose a Username <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      {...register('username', {
                        required: !user?.username ? 'Username is required' : false,
                        pattern: {
                          value: /^[a-z0-9_.]{3,20}$/,
                          message: 'Username must be 3-20 characters, lowercase letters, numbers, dots, and underscores only'
                        }
                      })}
                      onChange={handleUsernameChange}
                      className={`w-full pl-10 pr-12 py-3 rounded-xl outline-none border transition-all duration-300 ${
                        theme === 'dark'
                          ? 'bg-white/10 border-white/20 focus:border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-blue-300/70'
                          : 'bg-white/80 border-slate-200 focus:border-slate-400 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50'
                      }`}
                      placeholder={user?.username || 'your_username'}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {getUsernameStatusIcon()}
                    </div>
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
                  )}
                  {getUsernameStatusMessage()}
                  <p className={`mt-1 text-xs transition-colors duration-500 ${
                    theme === 'dark' ? 'text-white/60' : 'text-slate-500'
                  }`}>
                    This will be your unique identifier on SkillWise
                  </p>
                </div>

                {/* Date of Birth Field */}
                <div>
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${
                    theme === 'dark' ? 'text-white' : 'text-slate-700'
                  }`}>
                    Date of Birth <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="date"
                      {...register('dateOfBirth', {
                        required: 'Date of birth is required'
                      })}
                      className={`w-full pl-10 pr-3 py-3 rounded-xl outline-none border transition-all duration-300 ${
                        theme === 'dark'
                          ? 'bg-white/10 border-white/20 focus:border-white/30 text-white focus:ring-2 focus:ring-blue-300/70'
                          : 'bg-white/80 border-slate-200 focus:border-slate-400 text-slate-800 focus:ring-2 focus:ring-blue-500/50'
                      }`}
                      placeholder="dd/mm/yyyy"
                    />
                  </div>
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-400">{errors.dateOfBirth.message}</p>
                  )}
                  <p className={`mt-1 text-xs transition-colors duration-500 ${
                    theme === 'dark' ? 'text-white/60' : 'text-slate-500'
                  }`}>
                    Used for age verification and personalized content
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || (watchedUsername && watchedUsername !== user?.username && usernameStatus !== 'available' && usernameStatus !== '')}
                className={`mt-8 w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-lg hover:shadow-xl'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Complete Setup
                  </>
                )}
              </button>

              <div className={`mt-4 text-xs text-center transition-colors duration-500 ${
                theme === 'dark' ? 'text-white/70' : 'text-slate-500'
              }`}>
                You can update these details later in your profile settings.
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StyledProfileSetup;
