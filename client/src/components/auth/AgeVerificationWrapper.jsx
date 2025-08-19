import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AgeVerificationWrapper = ({ children }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      // Check if user is under 13 and requires parental approval
      if (user.age < 13 && user.requiresParentalApproval && !user.parentConfirmed) {
        // Redirect to parental approval page
        navigate('/auth/parental-approval');
        return;
      }

      // Check if user needs to set username or is first-time user
      if (!user.username || user.isFirstTimeUser) {
        navigate('/profile');
        return;
      }
    }
  }, [user, isLoading, navigate]);

  // Don't render children if user is under 13 and needs approval
  if (user && user.age < 13 && user.requiresParentalApproval && !user.parentConfirmed) {
    return null;
  }

  return children;
};

export default AgeVerificationWrapper;
