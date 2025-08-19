import React, { useState } from 'react';
import { User, ArrowLeft, Loader2, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const BecomeParentPage = () => {
  const { user, requestParentRole } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is eligible
  const isEligible = user && user.age >= 25 && user.role !== 'Parent';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🟢 Parent role request submitted!');
    console.log('Phone number:', phoneNumber);
    
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🚀 Making parent role request...');
      const result = await requestParentRole(phoneNumber);
      console.log('✅ Parent role request result:', result);
      
      if (result.success) {
        toast.success('🎉 You are now a Parent! Redirecting to dashboard...');
        // Redirect to dashboard after success
        setTimeout(() => {
          navigate('/dashboard');
          window.location.reload();
        }, 2000);
      } else {
        toast.error(result.error || result.message || 'Failed to request parent role');
      }
    } catch (error) {
      console.error('❌ Parent role request error:', error);
      toast.error(error.message || 'Failed to request parent role');
    } finally {
      setIsLoading(false);
    }
  };

  // If user is not eligible, show message
  if (!isEligible) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-foreground/70 hover:text-foreground mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </button>
              <h1 className="text-3xl font-bold text-foreground mb-2">Become a Parent</h1>
            </div>

            {/* Not Eligible Message */}
            <div className="bg-card rounded-lg p-6 border border-border text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Not Eligible</h2>
              <p className="text-foreground/70 mb-4">
                {!user ? 'You must be logged in to become a parent.' :
                 user.role === 'Parent' ? 'You are already a parent.' :
                 'You must be at least 25 years old to become a parent.'}
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
              >
                Go to Dashboard
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
              onClick={() => navigate(-1)}
              className="flex items-center text-foreground/70 hover:text-foreground mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
            <h1 className="text-3xl font-bold text-foreground mb-2">Become a Parent</h1>
            <p className="text-foreground/80">
              Join as a parent to manage child accounts and oversee their learning progress.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-lg p-6 border border-border">
            {/* Icon and Title */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Parent Role Application</h2>
              <p className="text-foreground/70">
                You're eligible to become a parent user! Please provide your phone number to continue.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground mb-2">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-foreground"
                    required
                  />
                </div>
                <p className="text-xs text-foreground/60 mt-2">
                  Required for verification and child account management communications.
                </p>
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">As a Parent, you can:</h3>
                <ul className="text-sm text-foreground/70 space-y-1">
                  <li>• Monitor your child's learning progress</li>
                  <li>• Manage child account settings</li>
                  <li>• Receive progress reports and notifications</li>
                  <li>• Control content access and restrictions</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5" />
                    <span>Become a Parent</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeParentPage;
