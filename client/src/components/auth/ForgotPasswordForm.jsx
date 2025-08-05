import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ForgotPasswordForm = ({ onBackToLogin }) => {
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    clearError();
    
    const result = await forgotPassword(data.email);

    if (result.success) {
      setIsEmailSent(true);
      setSentEmail(data.email);
    }
  };

  const handleBackToLogin = () => {
    clearError();
    setIsEmailSent(false);
    setSentEmail('');
    onBackToLogin();
  };

  if (isEmailSent) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-xl p-8 card-hover">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Check Your Email</h2>
            <p className="text-foreground/80">We've sent a password reset link to:</p>
            <p className="text-primary font-medium mt-1">{sentEmail}</p>
          </div>

          {/* Instructions */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-primary mb-2">What's next?</h3>
            <ul className="text-sm text-foreground/80 space-y-1">
              <li>• Check your email inbox (and spam folder)</li>
              <li>• Click the password reset link in the email</li>
              <li>• Create a new strong password</li>
              <li>• Sign in with your new password</li>
            </ul>
          </div>

          {/* Additional Help */}
          <div className="text-center text-sm text-foreground/80 mb-6">
            <p>Didn't receive the email? Check your spam folder or</p>
            <button
              onClick={() => setIsEmailSent(false)}
              className="text-primary hover:text-primary/80 font-medium"
            >
              try again with a different email
            </button>
          </div>

          {/* Back to Login Button */}
          <button
            onClick={handleBackToLogin}
            className="w-full bg-background border border-border text-foreground py-3 px-4 rounded-lg font-medium hover:bg-card focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card border border-border rounded-lg shadow-xl p-8 card-hover">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Forgot Password?</h2>
          <p className="text-foreground/80">Enter your email to receive a password reset link</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
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
                placeholder="Enter your email address"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="cosmic-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <button
            onClick={handleBackToLogin}
            className="text-primary hover:text-primary/80 font-medium flex items-center justify-center space-x-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm; 