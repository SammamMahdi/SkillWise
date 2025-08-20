import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import parentService from '../../services/parentService';

const BecomeParentPage = () => {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [childLockPassword, setChildLockPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Check if user is eligible (25+ and not already a child account)
  const isEligible = user && user.age >= 25 && user.role !== 'Child';

  const handleConvertToParent = async (e) => {
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
      const result = await parentService.requestParentRole(childLockPassword, phoneNumber);
      console.log('✅ Child account conversion result:', result);
      
      if (result.success) {
        toast.success('🎉 Successfully converted to child account with protection! Redirecting...');
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isEligible) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 max-w-2xl w-full text-center">
          <div className="text-6xl mb-6">�</div>
          <h1 className="text-3xl font-bold text-white mb-4">Child Account Not Available</h1>
          
          {user.age < 25 ? (
            <div className="space-y-4">
              <p className="text-gray-300 text-lg">
                You must be at least 25 years old to become a child account with protection.
              </p>
              <p className="text-gray-400">
                Current age: {user.age || 'Not specified'}
              </p>
              <p className="text-sm text-gray-500">
                If your age is incorrect, please update it in your profile settings.
              </p>
            </div>
          ) : user.role === 'Child' ? (
            <div className="space-y-4">
              <p className="text-gray-300 text-lg">
                You already have a child account with protection!
              </p>
              <p className="text-gray-400">
                Your account has childlock protection enabled.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-300 text-lg">
                Child account conversion is not available for your current role.
              </p>
              <p className="text-gray-400">
                Current role: {user.role}
              </p>
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">�</div>
          <h1 className="text-3xl font-bold text-white mb-2">Become a Child Account</h1>
          <p className="text-gray-300">
            Convert your account to a child account with enhanced protection and childlock features
          </p>
        </div>

        <div className="bg-blue-900/30 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">What you'll get as a Child Account:</h2>
          <div className="grid md:grid-cols-2 gap-4 text-gray-300">
            <div className="flex items-start space-x-3">
              <div className="text-green-400 text-xl">✓</div>
              <div>
                <div className="font-medium">Childlock Protection</div>
                <div className="text-sm text-gray-400">Enhanced security with childlock password</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="text-green-400 text-xl">✓</div>
              <div>
                <div className="font-medium">Safe Learning Environment</div>
                <div className="text-sm text-gray-400">Protected access to educational content</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="text-green-400 text-xl">✓</div>
              <div>
                <div className="font-medium">Restricted Features</div>
                <div className="text-sm text-gray-400">Limited access to certain platform features for safety</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="text-green-400 text-xl">✓</div>
              <div>
                <div className="font-medium">Enhanced Privacy</div>
                <div className="text-sm text-gray-400">Phone verification and additional security measures</div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleConvertToParent} className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">
              Child Lock Password <span className="text-red-400">*</span>
            </label>
            <p className="text-gray-400 text-sm mb-3">
              Create a secure password for accessing restricted features.
              This password will protect your child account from unauthorized access.
            </p>
            <input
              type="password"
              value={childLockPassword}
              onChange={(e) => setChildLockPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="Enter a secure child lock password (min 6 characters)"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <p className="text-gray-400 text-sm mb-3">
              Your phone number for account verification and important notifications.
            </p>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-yellow-400 text-xl">⚠️</div>
              <div className="text-yellow-200">
                <div className="font-medium mb-1">Important:</div>
                <ul className="text-sm space-y-1">
                  <li>• You must be at least 25 years old to become a child account</li>
                  <li>• The child lock password will be required to access restricted features</li>
                  <li>• Keep this password secure and don't share it</li>
                  <li>• Your phone number will be used for verification purposes</li>
                  <li>• Child accounts have limited access to certain platform features for safety</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Converting...
                </>
              ) : (
                'Become Child Account'
              )}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default BecomeParentPage;
