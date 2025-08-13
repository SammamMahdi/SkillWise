import React, { useState } from 'react';
import { AlertTriangle, Send, ArrowLeft, Clock, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ExamViolationTerminated = ({ attemptData, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getDashboardRoute = () => {
    if (!user?.role) return '/dashboard'; // Default to student dashboard

    switch (user.role) {
      case 'Teacher':
        return '/teacher';
      case 'Admin':
        return '/admin';
      case 'Parent':
        return '/parent';
      case 'Student':
      default:
        return '/dashboard';
    }
  };

  const handleGoBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(getDashboardRoute());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Exam Auto-Submitted
            </h2>
            <p className="text-foreground/60">
              Your exam has been automatically submitted due to multiple violations (3 or more)
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-400 mb-1">
                  Why was my exam terminated?
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                  {attemptData.terminationReason || 'Your exam was automatically submitted after 3 or more violations were detected'}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  Total violations detected: {attemptData.violationCount || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-400 mb-1">
                  What Happens Next?
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Your exam has been submitted with your current answers</li>
                  <li>• The instructor has been notified about the violation</li>
                  <li>• You can request permission to retake the exam if this was accidental</li>
                  <li>• The instructor will review your request and decide</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleGoBack}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Dashboard
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-foreground/60">
              Need to retake this exam? Use the "Contact Creator" button next to the exam to request permission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamViolationTerminated;
