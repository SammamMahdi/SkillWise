import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Clock, User } from 'lucide-react';

const ExamSubmissionSuccess = () => {
  const navigate = useNavigate();
  const { attemptId } = useParams();

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Exam Submitted Successfully!
        </h1>

        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-center text-gray-600">
            <Clock className="w-5 h-5 mr-2" />
            <span>Your answers have been submitted for review</span>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm leading-relaxed">
              You will receive your results after being reviewed by the course creator. 
              Please hold some patience while your exam is being evaluated.
            </p>
          </div>

          <div className="flex items-center justify-center text-gray-500 text-sm">
            <User className="w-4 h-4 mr-2" />
            <span>You will be notified once results are published</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGoToProfile}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Go to Profile
        </button>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Submission ID: {attemptId?.slice(-8) || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExamSubmissionSuccess;
