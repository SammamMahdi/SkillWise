import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Shield, 
  User, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Lock
} from 'lucide-react';

const ParentEmailRequired = () => {
  const [parentEmail, setParentEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  // Get user data from localStorage on component mount
  useEffect(() => {
    const tempUserData = localStorage.getItem('tempUserData');
    if (tempUserData) {
      setUser(JSON.parse(tempUserData));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parentEmail) {
      setError('Please enter your parent\'s email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      const response = await fetch('/api/auth/submit-parent-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('tempToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ parentEmail })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRequestSent(true);
        // Clear temporary data
        localStorage.removeItem('tempUserData');
        localStorage.removeItem('tempToken');
      } else {
        setError(data.message || 'Failed to submit parent email');
      }
    } catch (error) {
      console.error('Error submitting parent email:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tempToken');
    localStorage.removeItem('tempUserData');
    window.location.href = '/auth/login';
  };

  // Show loading if no user data
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-card border border-border rounded-lg shadow-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Access Error</h2>
            <p className="text-foreground/80 mb-6">
              Unable to load user information. Please log in again.
            </p>
            <button
              onClick={handleLogout}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (requestSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-card border border-border rounded-lg shadow-xl p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Parent Request Sent!</h2>
            <p className="text-foreground/80 mb-6">
              We've sent a request to your parent at <strong>{parentEmail}</strong>. 
              Your account will be unlocked once they approve your access.
            </p>
            <p className="text-sm text-foreground/60 mb-6">
              Please ask your parent to check their email and follow the instructions to approve your account.
            </p>
            <button
              onClick={handleLogout}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Parental Approval Required</h2>
            <p className="text-foreground/80">
              Since you're under 13, we need your parent's permission to continue.
            </p>
          </div>

          {/* User Info */}
          <div className="bg-background/50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <User className="w-5 h-5 text-foreground/60" />
              <span className="text-sm font-medium text-foreground">Your Account</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/60">Name:</span>
                <span className="text-foreground">{user.name || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Email:</span>
                <span className="text-foreground">{user.email || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Age:</span>
                <span className="text-foreground">{user.age ? `${user.age} years old` : 'Under 13'}</span>
              </div>
            </div>
          </div>

          {/* Safety Message */}
          <div className="bg-blue-50/10 border border-blue-200/20 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">Why do we need this?</h4>
                <p className="text-xs text-foreground/70">
                  We follow safety guidelines to protect young learners. Your parent will receive 
                  an email to approve your access to SkillWise.
                </p>
              </div>
            </div>
          </div>

          {/* Parent Email Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="parentEmail" className="block text-sm font-medium text-foreground mb-2">
                Parent's Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                <input
                  type="email"
                  id="parentEmail"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50/10 border border-red-200/20 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !parentEmail}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Send Parent Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Logout Option */}
          <div className="mt-6 pt-6 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full text-foreground/60 hover:text-foreground text-sm py-2 transition-colors"
            >
              Sign out and return to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentEmailRequired;
