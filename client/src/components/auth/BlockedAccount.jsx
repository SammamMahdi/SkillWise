import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Shield, 
  Mail, 
  User, 
  Lock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

const BlockedAccount = ({ user, onParentApproved }) => {
  const [parentEmail, setParentEmail] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleParentRequest = async (e) => {
    e.preventDefault();
    if (!parentEmail) return;

    try {
      setIsRequesting(true);
      setError('');
      
      const response = await fetch('/api/parent/request-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ childEmail: user.email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRequestSent(true);
      } else {
        setError(data.message || 'Failed to send parent request');
      }
    } catch (error) {
      console.error('Error requesting parent approval:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsRequesting(false);
    }
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

          {/* Parent Request Form */}
          {!requestSent ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Request Parental Approval</h3>
                <p className="text-sm text-foreground/80 mb-4">
                  Enter your parent's email address to send them a connection request. They will need to approve your account to unlock access.
                </p>
              </div>

              {error && (
                <div className="bg-red-50/10 border border-red-200/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm text-red-600">{error}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleParentRequest} className="space-y-4">
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
                      className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-foreground/50"
                      placeholder="parent@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRequesting || !parentEmail}
                  className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isRequesting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      <span>Send Parent Request</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Request Sent Successfully</h3>
                <p className="text-sm text-foreground/80">
                  A connection request has been sent to your parent's email address. They will need to:
                </p>
                <ul className="text-sm text-foreground/80 mt-3 space-y-1">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Create a Parent account (if they don't have one)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Accept the connection request</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Approve your account access</span>
                  </li>
                </ul>
              </div>
              <div className="bg-blue-50/10 border border-blue-200/20 rounded-lg p-4">
                <p className="text-sm text-foreground/80">
                  <strong>Note:</strong> You will receive a notification once your parent approves your account. 
                  You can also ask your parent to check their email for the connection request.
                </p>
              </div>
              
              <button
                onClick={handleRefresh}
                className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Check if Approved</span>
              </button>
            </div>
          )}

          {/* Additional Information */}
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-3">What happens next?</h4>
            <div className="space-y-3 text-sm text-foreground/80">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p>Your parent will receive an email with instructions to connect to your account</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p>Once connected, your parent can monitor your learning progress</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <p>Your account will be automatically unlocked once approved</p>
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