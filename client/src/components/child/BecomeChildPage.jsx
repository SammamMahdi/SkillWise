import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import childService from '../../services/childService';

const BecomeChildPage = () => {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [childLockPassword, setChildLockPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Check if user is eligible (25+ and not already a child)
  const isEligible = user && user.age >= 25 && user.role !== 'Child';

  const handleConvertToChild = async (e) => {
    e.preventDefault();
    
    if (!childLockPassword || childLockPassword.length < 6) {
      toast.error('Child lock password must be at least 6 characters long');
      return;
    }

    if (!phoneNumber || phoneNumber.trim().length < 10) {
      toast.error('Please provide a valid phone number (at least 10 digits)');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🟢 Converting to child account...');
      const result = await childService.convertToChildRole(childLockPassword, phoneNumber);
      console.log('✅ Child account conversion result:', result);
      
      if (result.success) {
        toast.success('🎉 Successfully converted to child account! Redirecting...');
        // Refresh user data
        await refreshUser();
        // Redirect to dashboard after success
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        toast.error(result.error || result.message || 'Failed to convert to child account');
      }
    } catch (error) {
      console.error('❌ Child account conversion error:', error);
      toast.error(error.message || 'Failed to convert to child account');
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not eligible, show message
  if (!isEligible) {
    const message = !user 
      ? 'Please log in to continue'
      : user.age < 25 
        ? 'You must be at least 25 years old to convert to a child account'
        : user.role === 'Child'
          ? 'You already have a child account'
          : 'Unable to convert to child account';

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <button
                onClick={() => window.history.back()}
                className="flex items-center text-foreground/70 hover:text-foreground mb-4"
              >
                ← Back
              </button>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Convert to Child Account
              </h1>
              <p className="text-foreground/70">
                Child accounts have restricted access to certain features for safety.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">⛔</div>
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Not Eligible
              </h2>
              <p className="text-foreground/70 mb-6">
                {message}
              </p>
              <button
                onClick={() => window.history.back()}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => window.history.back()}
              className="flex items-center text-foreground/70 hover:text-foreground mb-4"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Convert to Child Account
            </h1>
            <p className="text-foreground/70">
              Child accounts provide a safer learning environment with restricted access to certain features.
            </p>
          </div>

          {/* Info Card */}
          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              What happens when you convert to a child account?
            </h2>
            <ul className="space-y-2 text-foreground/70">
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                You will not be able to access skill posts
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                You will not be able to enroll in courses
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                You will not be able to send friend requests
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                All restricted features will require your child lock password to access
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                You can still view courses and content, just not interact with certain features
              </li>
            </ul>
          </div>

          {/* Conversion Form */}
          <div className="bg-card border border-border rounded-lg p-6">
            <form onSubmit={handleConvertToChild} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Child Lock Password
                </label>
                <input
                  type="password"
                  value={childLockPassword}
                  onChange={(e) => setChildLockPassword(e.target.value)}
                  placeholder="Enter a secure password for child lock"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={6}
                />
                <p className="text-sm text-foreground/60 mt-1">
                  This password will be required to access restricted features.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                  minLength={10}
                />
                <p className="text-sm text-foreground/60 mt-1">
                  Used for account verification and security purposes.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Converting...' : 'Convert to Child Account'}
                </button>
              </div>
            </form>
          </div>

          {/* Warning */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <div className="text-yellow-400 mr-3">⚠️</div>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Important Note
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Converting to a child account is permanent and cannot be easily reversed. 
                  Make sure you understand the restrictions before proceeding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeChildPage;
