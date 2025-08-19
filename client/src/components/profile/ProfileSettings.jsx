import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Globe, Palette, Save, Loader2, ArrowLeft, Lock, Eye, EyeOff, Calendar, AtSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import AccentColorPicker from './AccentColorPicker';
import ThemeToggle from '../common/ThemeToggle';
import { checkUsernameAvailable, setMyUsername } from '../../services/usernameService';
import toast from 'react-hot-toast';

const ProfileSettings = () => {
  const { user, updateProfile, googleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [accentColor, setAccentColor] = useState('#7C3AED');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Username validation states
  const [usernameStatus, setUsernameStatus] = useState(''); // 'checking', 'available', 'taken', 'invalid'
  const [usernameDebounceTimer, setUsernameDebounceTimer] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm();

  useEffect(() => {
    if (user) {
      setValue('name', user.name || '');
      setValue('email', user.email || '');
      setValue('username', user.username || '');
      setValue('preferredLanguage', user.preferredLanguage || 'en');
      
      // Set date of birth if available
      if (user.dateOfBirth) {
        const date = new Date(user.dateOfBirth);
        const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        setValue('dateOfBirth', formattedDate);
      }
      
      setAccentColor(user.accessibility?.accentColor || '#7C3AED');
    }
  }, [user, setValue]);

  // Check for first-time user setup (instead of temp Google token)
  useEffect(() => {
    if (user && user.isFirstTimeUser) {
      console.log('First-time user detected, showing initial setup');
      // The first-time setup UI will be shown automatically based on showFirstTimeSetup
    }
  }, [user]);

  // Apply accent color on component mount
  useEffect(() => {
    if (accentColor) {
      updateAccentColor(accentColor);
    }
  }, [accentColor]);

  const updateAccentColor = (hexColor) => {
    // Convert hex to HSL for CSS variable
    const hsl = hexToHSL(hexColor);
    document.documentElement.style.setProperty('--primary', hsl);
  };

  // Convert hex to HSL
  const hexToHSL = (hex) => {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  // Username validation function
  const validateUsername = async (username) => {
    if (!username || username === user?.username) {
      setUsernameStatus('');
      return;
    }

    // Basic validation
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
    setIsLoading(true);
    try {
      // Handle username update separately if changed
      if (data.username && data.username !== user?.username) {
        if (usernameStatus !== 'available') {
          toast.error('Please choose a valid and available username');
          setIsLoading(false);
          return;
        }
        
        try {
          const token = localStorage.getItem('token');
          await setMyUsername(data.username, token);
          toast.success('Username updated successfully!');
        } catch (error) {
          toast.error('Failed to update username');
          console.error('Username update error:', error);
          setIsLoading(false);
          return;
        }
      }

      const profileData = {
        name: data.name,
        preferredLanguage: data.preferredLanguage,
        accessibility: {
          accentColor: accentColor,
        }
      };

      // Add date of birth if provided
      if (data.dateOfBirth) {
        profileData.dateOfBirth = data.dateOfBirth;
      }

      // Include role if user is admin
      if (user.role === 'Admin' && data.role) {
        profileData.role = data.role;
      }

      const result = await updateProfile(profileData);
      if (result.success) {
        toast.success('Profile updated successfully!');
        console.log('Profile updated successfully');
      } else {
        toast.error(result.error || 'Profile update failed');
        console.error('Profile update failed:', result.error);
      }
    } catch (error) {
      toast.error('Profile update failed');
      console.error('Profile update error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccentColorChange = (color) => {
    setAccentColor(color);
  };

  const handleFirstTimeSetup = async (data) => {
    setIsLoading(true);
    try {
      const profileData = {
        username: data.username,
        dateOfBirth: data.dateOfBirth,
        isFirstTimeUser: false // Mark as no longer first-time user
      };

      const result = await updateProfile(profileData);
      if (result.success) {
        toast.success('Profile setup completed successfully!');
        // Redirect to dashboard after setup
        window.location.href = '/dashboard';
      } else {
        toast.error(result.error || 'Profile setup failed');
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      toast.error('Profile setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we need to show first-time setup
  const showFirstTimeSetup = user && user.isFirstTimeUser;
  
  // If no user, show loading
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // If first-time user, show initial setup
  if (showFirstTimeSetup) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to SkillWise!</h1>
              <p className="text-foreground/80">Let's complete your profile setup</p>
            </div>

            {/* Setup Form */}
            <div className="bg-card rounded-lg p-6 border border-border max-w-2xl mx-auto">
              <form onSubmit={handleSubmit(handleFirstTimeSetup)} className="space-y-6">
                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                    Choose a Username <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register('username', {
                      required: 'Username is required',
                      pattern: {
                        value: /^[a-z0-9_.]{3,20}$/,
                        message: 'Username must be 3-20 characters, only lowercase letters, numbers, dots, and underscores'
                      }
                    })}
                    type="text"
                    id="username"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-foreground/50"
                    placeholder="Enter your username"
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
                  )}
                  <p className="mt-1 text-xs text-foreground/60">
                    This will be your unique identifier on SkillWise
                  </p>
                </div>

                {/* Birthday Field */}
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-foreground mb-2">
                    Date of Birth <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register('dateOfBirth', {
                      required: 'Date of birth is required',
                      validate: (value) => {
                        if (!value) return 'Date of birth is required';
                        const birthDate = new Date(value);
                        const today = new Date();
                        const age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                        
                        if (actualAge < 5) return 'You must be at least 5 years old';
                        if (actualAge > 120) return 'Please enter a valid date of birth';
                        return true;
                      }
                    })}
                    type="date"
                    id="dateOfBirth"
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-400">{errors.dateOfBirth.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-center pt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      'Complete Setup'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Profile Settings</h1>
              <p className="text-foreground/80">Manage your account preferences and appearance</p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <ThemeToggle size="md" />
              <a
                href="/dashboard"
                className="flex items-center space-x-2 px-4 py-2 bg-background border border-border text-foreground rounded-lg hover:bg-card transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </a>
            </div>
          </div>

                     <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

             {/* Basic Information */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center space-x-2 mb-6">
                <User className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Basic Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: 'Name is required' })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    placeholder={user.name || 'Enter your full name'}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground/60 cursor-not-allowed"
                      placeholder={user.email || 'Email address'}
                    />
                    <Mail className="w-4 h-4 text-foreground/60" />
                  </div>
                  <p className="text-xs text-foreground/60 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/60" />
                    <input
                      type="text"
                      {...register('username', {
                        pattern: {
                          value: /^[a-z0-9_.]{3,20}$/,
                          message: 'Username must be 3-20 characters, lowercase letters, numbers, dots, and underscores only'
                        }
                      })}
                      onChange={handleUsernameChange}
                      className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                      placeholder={user.username || 'Choose a username'}
                    />
                    {usernameStatus === 'checking' && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-foreground/60" />
                    )}
                    {usernameStatus === 'available' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-green-500" />
                    )}
                    {usernameStatus === 'taken' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500" />
                    )}
                  </div>
                  {errors.username && (
                    <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>
                  )}
                  {usernameStatus === 'taken' && (
                    <p className="text-red-400 text-sm mt-1">Username is already taken</p>
                  )}
                  {usernameStatus === 'invalid' && (
                    <p className="text-red-400 text-sm mt-1">Username must be 3-20 characters, lowercase letters, numbers, dots, and underscores only</p>
                  )}
                  {usernameStatus === 'available' && (
                    <p className="text-green-400 text-sm mt-1">Username is available</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/60" />
                    <input
                      type="date"
                      {...register('dateOfBirth')}
                      className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    />
                  </div>
                  <p className="text-xs text-foreground/60 mt-1">
                    Used for age verification and age-appropriate content
                  </p>
                </div>

                                 <div>
                   <label className="block text-sm font-medium text-foreground mb-2">
                     User Type
                   </label>
                                       {!user.roleConfirmed ? (
                      <div className="w-full px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-yellow-600 text-sm">Please select your role above to complete registration</p>
                      </div>
                    ) : user.role === 'Admin' ? (
                     <select
                       {...register('role')}
                       className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                       defaultValue={user.role || 'Student'}
                     >
                       <option value="Student">Student</option>
                       <option value="Teacher">Teacher</option>
                       <option value="Parent">Parent</option>
                       <option value="Admin">Admin</option>
                     </select>
                   ) : (
                     <input
                       type="text"
                       value={user.role || 'Student'}
                       disabled
                       className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground/60 cursor-not-allowed"
                       placeholder={user.role || 'Student'}
                     />
                   )}
                                       <p className="text-xs text-foreground/60 mt-1">
                      {!user.roleConfirmed ? 'Role selection required for new users' : 
                       user.role === 'Admin' ? 'User type can be changed by administrators' : 'User type cannot be changed'}
                    </p>
                 </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Preferred Language
                  </label>
                  <select
                    {...register('preferredLanguage')}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                    defaultValue={user.preferredLanguage || 'en'}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ar">Arabic</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                  </select>
                </div>
              </div>
            </div>

            {/* User Stats Display */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center space-x-2 mb-6">
                <User className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Account Statistics</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-background rounded-lg border border-border">
                  <p className="text-2xl font-bold text-primary">{user.xp || 0}</p>
                  <p className="text-sm text-foreground/60">Experience Points</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg border border-border">
                  <p className="text-2xl font-bold text-primary">{user.credits || 0}</p>
                  <p className="text-sm text-foreground/60">Credits</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg border border-border">
                  <p className="text-2xl font-bold text-primary">{user.badges?.length || 0}</p>
                  <p className="text-sm text-foreground/60">Badges</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg border border-border">
                  <p className="text-2xl font-bold text-primary">{user.avatarsUnlocked?.length || 0}</p>
                  <p className="text-sm text-foreground/60">Avatars</p>
                </div>
              </div>
            </div>

            {/* Appearance Settings */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center space-x-2 mb-6">
                <Palette className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
              </div>

              <AccentColorPicker
                currentColor={accentColor}
                onColorChange={handleAccentColorChange}
              />
            </div>

            {/* Security Settings */}
            <div className="bg-card rounded-lg p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Security</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="text-sm text-primary hover:text-primary/80 font-medium"
                >
                  {showPasswordChange ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {user.googleId ? (
                <div className="text-center py-4">
                  <p className="text-foreground/80 mb-2">You're signed in with Google</p>
                  <a
                    href="https://myaccount.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Manage your Google Account
                  </a>
                </div>
              ) : showPasswordChange ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-12 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/40 hover:text-foreground/60"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-12 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/40 hover:text-foreground/60"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-12 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/40 hover:text-foreground/60"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="cosmic-button w-full"
                  >
                    Update Password
                  </button>
                </div>
              ) : (
                <p className="text-foreground/60 text-sm">
                  Keep your account secure by using a strong password
                </p>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="cosmic-button flex items-center space-x-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings; 