import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Check, X, Shield, Mail, User, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { validatePasswordStrength, getPasswordRequirements, getPasswordStrengthColor, getPasswordStrengthWidth, getPasswordStrengthBgColor, generateSecurePassword } from '../../utils/passwordUtils';
import GoogleRoleSelectionModal from './GoogleRoleSelectionModal';
import GoogleSignInDebug from '../../utils/googleSignInDebug';

const SignupForm = ({ onSwitchToLogin }) => {
  const { register: registerUser, googleLogin, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '', isValid: false });
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [googleUserData, setGoogleUserData] = useState(null);
  const [googleIdToken, setGoogleIdToken] = useState(null);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [googleError, setGoogleError] = useState(null);
  const googleButtonRef = useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    setError,
  } = useForm();

  const watchedPassword = watch('password', '');
  const watchedConfirmPassword = watch('confirmPassword', '');
  const watchedDateOfBirth = watch('dateOfBirth', '');
  const watchedRole = watch('role', '');
  const watchedParentEmail = watch('parentEmail', '');
  const watchedAge = watch('age', '');

  // Update password strength when password changes
  React.useEffect(() => {
    const strength = validatePasswordStrength(watchedPassword);
    setPasswordStrength(strength);
    setPasswordRequirements(getPasswordRequirements(watchedPassword));
  }, [watchedPassword]);

  // Calculate age when date of birth changes
  React.useEffect(() => {
    if (watchedDateOfBirth) {
      const birthDate = new Date(watchedDateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const calculatedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      setValue('age', calculatedAge);

      // Only set requiresParentalApproval for students under 13
      if (calculatedAge < 13 && watchedRole === 'Student') {
        setValue('requiresParentalApproval', true);
      } else {
        setValue('requiresParentalApproval', false);
      }
    }
  }, [watchedDateOfBirth, watchedRole, setValue]);

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

              // Decode the JWT to get user info for role selection
              const payload = JSON.parse(atob(response.credential.split('.')[1]));
              const userData = {
                name: payload.name,
                email: payload.email,
                profilePhoto: payload.picture
              };

              // Try Google auth - if new user, they'll be redirected to profile page
              const result = await googleLogin(response.credential);
              if (result.success) {
                console.log('Google signup successful!');
                // Redirect to dashboard or profile page
                window.location.href = '/dashboard';
              } else if (result.requiresRoleSelection) {
                console.log('New user - redirecting to profile page for role selection');
                // Redirect to profile page for role selection
                window.location.href = '/profile';
              } else {
                console.error('Google signup failed:', result.error);
                setGoogleError({
                  type: 'auth',
                  message: result.error || 'Google signup failed',
                  suggestion: 'Please try again or contact support.'
                });
              }
            }
          } catch (error) {
            console.error('Google signup error:', error);
            const debugInfo = GoogleSignInDebug.handleError(error, 'signup-callback');
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
        text: 'signup_with',
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
    
    // Validate password strength
    if (!passwordStrength.isValid) {
      return;
    }

    // Validate password confirmation
    if (data.password !== data.confirmPassword) {
      return;
    }

    // Ensure age is provided
    let finalAge = data.age;
    if (!finalAge) {
      if (data.dateOfBirth) {
        // Calculate age from date of birth if age is not provided
        const birthDate = new Date(data.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      } else {
        // If neither age nor date of birth is provided, show error
        setError('age', { type: 'manual', message: 'Please enter your age or date of birth' });
        return;
      }
    }

    // Only require parental approval for students under 13
    const requiresParentalApproval = (finalAge < 13 && data.role === 'Student') ? true : false;

    // Validate parent email for students under 13
    if (requiresParentalApproval && !data.parentEmail) {
      setError('parentEmail', { type: 'manual', message: 'Parent email address is required for students under 13' });
      return;
    }

    const result = await registerUser({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      dateOfBirth: data.dateOfBirth || null, // Make dateOfBirth optional
      age: finalAge,
      requiresParentalApproval: requiresParentalApproval,
      parentEmail: data.parentEmail, // Include parent email in registration
    });

    if (result.success) {
      // Registration successful, show success message or redirect
      console.log('Registration successful!');
    }
  };

  const handleRoleSelection = async (selectedRole) => {
    try {
      setIsGoogleLoading(true);
      const result = await googleLogin(googleIdToken, selectedRole);
      
      if (result.success) {
        console.log('Google signup with role successful!');
        setShowRoleModal(false);
        // Redirect to dashboard or show success message
      } else {
        console.error('Google signup failed:', result.error);
      }
    } catch (error) {
      console.error('Role selection error:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const generatePassword = () => {
    const newPassword = generateSecurePassword(16);
    setValue('password', newPassword);
    setValue('confirmPassword', newPassword);
  };

  const getRequirementIcon = (met) => {
    return met ? (
      <Check className="w-4 h-4 text-green-400" />
    ) : (
      <X className="w-4 h-4 text-red-400" />
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border border-border rounded-lg shadow-xl p-8 card-hover">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Create Account</h2>
          <p className="text-foreground/80">Join SkillWise and start your learning journey</p>
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
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  maxLength: { value: 50, message: 'Name must be less than 50 characters' },
                })}
                type="text"
                id="name"
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-foreground/50"
                placeholder="Enter your full name"
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>

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

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">
              I am a
            </label>
            <select
              {...register('role', { required: 'Please select your role' })}
              id="role"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            >
              <option value="">Select your role</option>
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
              <option value="Parent">Parent</option>
              <option value="Admin">Admin</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-400">{errors.role.message}</p>
            )}
          </div>

          {/* Date of Birth Field */}
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-foreground mb-2">
              Date of Birth (Optional)
            </label>
            <input
              {...register('dateOfBirth', {
                validate: (value) => {
                  if (!value) return true; // Optional field
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
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-foreground/50"
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-400">{errors.dateOfBirth.message}</p>
            )}
            <p className="mt-1 text-xs text-foreground/60">
              Leave empty if you prefer to enter your age directly below
            </p>
          </div>

          {/* Age Field */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-foreground mb-2">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              {...register('age', {
                required: 'Age is required',
                min: { value: 5, message: 'You must be at least 5 years old' },
                max: { value: 120, message: 'Please enter a valid age' },
                valueAsNumber: true,
                validate: (value) => {
                  if (!value || value < 5) return 'You must be at least 5 years old';
                  if (value > 120) return 'Please enter a valid age';
                  return true;
                }
              })}
              type="number"
              id="age"
              min="5"
              max="120"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-foreground/50"
              placeholder="Enter your age (5-120)"
            />
            {errors.age && (
              <p className="mt-1 text-sm text-red-400">{errors.age.message}</p>
            )}
            {watchedDateOfBirth && (
              <p className="mt-1 text-xs text-foreground/60">
                Age calculated from date of birth: {(() => {
                  const birthDate = new Date(watchedDateOfBirth);
                  const today = new Date();
                  const age = today.getFullYear() - birthDate.getFullYear();
                  const monthDiff = today.getMonth() - birthDate.getMonth();
                  return monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
                })()} years (you can edit this if needed)
              </p>
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
                  validate: () => passwordStrength.isValid || 'Password does not meet requirements',
                })}
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-foreground/50"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/40 hover:text-foreground/60"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {watchedPassword && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-foreground/80">Password strength:</span>
                  <span className={`text-sm font-medium ${getPasswordStrengthColor(passwordStrength.score)}`}>
                    {passwordStrength.feedback}
                  </span>
                </div>
                <div className="w-full bg-background border border-border rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthBgColor(passwordStrength.score)}`}
                    style={{ width: getPasswordStrengthWidth(passwordStrength.score) }}
                  />
                </div>
              </div>
            )}

            {/* Password Requirements */}
            {watchedPassword && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-foreground/80">Requirements:</p>
                <div className="space-y-1">
                  {Object.entries(passwordRequirements).map(([requirement, met]) => (
                    <div key={requirement} className="flex items-center space-x-2">
                      {getRequirementIcon(met)}
                      <span className={`text-sm ${met ? 'text-green-400' : 'text-red-400'}`}>
                        {requirement === 'length' && 'At least 12 characters'}
                        {requirement === 'uppercase' && 'One uppercase letter'}
                        {requirement === 'lowercase' && 'One lowercase letter'}
                        {requirement === 'number' && 'One number'}
                        {requirement === 'special' && 'One special character (@$!%*?&)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Password Button */}
            <button
              type="button"
              onClick={generatePassword}
              className="mt-2 text-sm text-primary hover:text-primary/80 font-medium"
            >
              Generate secure password
            </button>

            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === watchedPassword || 'Passwords do not match',
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className="w-full pl-10 pr-12 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-foreground/50"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/40 hover:text-foreground/60"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Parental Approval Section */}
          {watchedRole === 'Student' && (() => {
            let calculatedAge = null;
            
            // Calculate age from date of birth if available
            if (watchedDateOfBirth) {
              const birthDate = new Date(watchedDateOfBirth);
              const today = new Date();
              const age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              calculatedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
            } else if (watchedAge) {
              // Use age from form if date of birth is not provided
              calculatedAge = parseInt(watchedAge);
            }
            
            if (calculatedAge === null) return null;
            
            const isUnder13 = calculatedAge < 13;
            
            return (
              <div className={`p-4 rounded-lg border ${isUnder13 ? 'bg-yellow-50/10 border-yellow-200/20' : 'bg-green-50/10 border-green-200/20'}`}>
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${isUnder13 ? 'bg-yellow-100' : 'bg-green-100'}`}>
                    {isUnder13 ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium ${isUnder13 ? 'text-yellow-800' : 'text-green-800'}`}>
                      {isUnder13 ? 'Parental Approval Required' : 'Age Verification Complete'}
                    </h3>
                    <p className="text-sm text-foreground/80 mt-1">
                      {isUnder13 
                        ? `You are ${calculatedAge} years old. Students under 13 require parental approval to access the platform. Please provide your parent's email address below.`
                        : `You are ${calculatedAge} years old. No parental approval required for students.`
                      }
                    </p>
                    {isUnder13 && (
                      <div className="mt-3">
                        <div className="flex items-center">
                          <input
                            {...register('requiresParentalApproval')}
                            type="checkbox"
                            id="requiresParentalApproval"
                            checked={true}
                            disabled={true}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary bg-background"
                          />
                          <label htmlFor="requiresParentalApproval" className="ml-2 text-sm text-foreground/80">
                            Parental approval required (mandatory for students under 13)
                          </label>
                        </div>
                        <p className="text-xs text-foreground/60 mt-2">
                          After registration, we'll automatically send a request to your parent for approval.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Parent Email Field (for students under 13) */}
          {watchedRole === 'Student' && (() => {
            let calculatedAge = null;
            
            // Calculate age from date of birth if available
            if (watchedDateOfBirth) {
              const birthDate = new Date(watchedDateOfBirth);
              const today = new Date();
              const age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              calculatedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
            } else if (watchedAge) {
              // Use age from form if date of birth is not provided
              calculatedAge = parseInt(watchedAge);
            }
            
            if (!calculatedAge || calculatedAge >= 13) return null;
            
            return (
              <div className="mt-4">
                <label htmlFor="parentEmail" className="block text-sm font-medium text-foreground mb-2">
                  Parent's Email Address <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-foreground/60 mb-2">
                  We'll send a request to your parent to approve your account.
                </p>
                <input
                  {...register('parentEmail', {
                    required: 'Parent email address is required for students under 13',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  id="parentEmail"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-foreground/50"
                  placeholder="parent@example.com"
                />
                {errors.parentEmail && (
                  <p className="mt-1 text-sm text-red-400">{errors.parentEmail.message}</p>
                )}
              </div>
            );
          })()}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="cosmic-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
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

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-foreground/80">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>

      {/* Google Role Selection Modal */}
      <GoogleRoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onRoleSelect={handleRoleSelection}
        userData={googleUserData}
      />
    </div>
  );
};

export default SignupForm; 