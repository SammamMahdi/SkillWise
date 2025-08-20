import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  User, 
  LogOut,
  RefreshCw
} from 'lucide-react';

const BlockedAccount = ({ user, onParentApproved }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleSignOut = () => {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tempToken');
    localStorage.removeItem('tempUserData');
    localStorage.removeItem('under13UserData');
    
    // Redirect to login page
    window.location.href = '/login';
  };

  const handleRefresh = () => {
    // Refresh the page to check if account has been approved
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Account Requires Parental Approval</h2>
            <p className="text-foreground/80">
              Your account is currently blocked and requires parental approval to access the platform.
            </p>
          </div>

          {/* Account Info */}
          <div className="bg-background/50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3 mb-3">
              <User className="w-5 h-5 text-foreground/60" />
              <span className="text-sm font-medium text-foreground">Account Information</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/60">Name:</span>
                <span className="text-foreground">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Email:</span>
                <span className="text-foreground">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Age:</span>
                <span className="text-foreground">{user.age || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Status:</span>
                <span className="text-red-600 font-medium">Blocked</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-yellow-50/10 border border-yellow-200/20 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">Why is my account blocked?</h3>
                <p className="text-sm text-foreground/80">
                  {user.blockedReason || 'Your account requires parental approval because you are under 13 years old. This is to ensure safe and appropriate access to the learning platform.'}
                </p>
              </div>
            </div>
          </div>

          {/* Parent Request Message */}
          <div className="space-y-4">
            <div className="bg-blue-50/10 border border-blue-200/20 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-3">Need Account Access?</h3>
              <p className="text-foreground/80 mb-4">
                Ask your parent to open an account for you on SkillWise. They can create a parent account and approve your access to the platform.
              </p>
              <p className="text-sm text-foreground/60">
                Once your parent creates an account and approves you, your access will be automatically unlocked.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleRefresh}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Check if Approved</span>
              </button>
              
              <button
                onClick={handleSignOut}
                className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center space-x-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">What your parent needs to do:</h4>
            <div className="space-y-3 text-sm text-foreground/80">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p>Visit SkillWise and create an account</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p>Connect to your account and approve your access</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p>Your account will be automatically unlocked</p>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-6 text-center">
            <p className="text-sm text-foreground/60">
              Need help?{' '}
              <a href="/support" className="text-primary hover:text-primary/80 font-medium">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockedAccount; 