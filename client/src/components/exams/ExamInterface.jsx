import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, Send, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import examService from '../../services/examService';
import ExamViolationTerminated from './ExamViolationTerminated';

const ExamInterface = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [examData, setExamData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [violations, setViolations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [terminationData, setTerminationData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

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

  useEffect(() => {
    // Load exam attempt data (this would come from the start exam response)
    loadExamData();
    
    // Set up anti-cheat monitoring
    setupAntiCheatMonitoring();
    
    // Start timer
    startTimer();

    return () => {
      cleanup();
    };
  }, []);

  const loadExamData = () => {
    console.log('=== LOADING EXAM DATA ===');
    console.log('Attempt ID from params:', attemptId);
    
    setIsLoading(true);
    
    // First try to load from sessionStorage
    const storedExamData = sessionStorage.getItem('currentExamData');
    console.log('Stored exam data:', storedExamData);

    if (storedExamData) {
      try {
        const examData = JSON.parse(storedExamData);
        console.log('Parsed exam data:', examData);
        
        // Validate that the stored data matches the current attempt
        if (examData.attemptId === attemptId) {
          setExamData(examData);
          setTimeRemaining(examData.timeLimit * 60);
          startTimeRef.current = new Date();
          setIsLoading(false);
          console.log('Exam data loaded successfully from sessionStorage');
          
          // Show success message
          toast.success(`Exam "${examData.examTitle}" loaded successfully!`);
          return;
        } else {
          console.log('Attempt ID mismatch, clearing sessionStorage');
          sessionStorage.removeItem('currentExamData');
        }
      } catch (error) {
        console.error('Error parsing exam data:', error);
        sessionStorage.removeItem('currentExamData');
      }
    }

    // If no valid session data, try to fetch from server
    console.log('Attempting to fetch exam data from server...');
    fetchExamDataFromServer();
  };

  const fetchExamDataFromServer = async () => {
    try {
      // Get the attempt details from the server
      const response = await examService.getAttemptDetails(attemptId);
      console.log('Server response:', response);
      
      if (response.success && response.data) {
        const examData = {
          attemptId: response.data._id,
          timeLimit: response.data.examSnapshot.timeLimit,
          questions: response.data.examSnapshot.questions,
          antiCheat: response.data.examSnapshot.antiCheat || {},
          examTitle: response.data.examSnapshot.title,
          totalPoints: response.data.examSnapshot.totalPoints,
          passingScore: response.data.examSnapshot.passingScore || 60
        };
        
        console.log('Processed exam data:', examData);
        setExamData(examData);
        setTimeRemaining(examData.timeLimit * 60);
        startTimeRef.current = new Date();
        setIsLoading(false);
        
        // Store in sessionStorage for future use
        sessionStorage.setItem('currentExamData', JSON.stringify(examData));
        console.log('Exam data loaded successfully from server');
        
        // Show success message
        toast.success(`Exam "${examData.examTitle}" loaded successfully!`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to fetch exam data from server:', error);
      setIsLoading(false);
      
      // Try to get debug information
      try {
        const debugResponse = await examService.debugAttemptData(attemptId);
        console.log('Debug data:', debugResponse);
      } catch (debugError) {
        console.error('Debug failed:', debugError);
      }
      
      toast.error('Failed to load exam data. Please try refreshing the page.');
      setTimeout(() => {
        navigate('/exams');
      }, 2000);
    }
  };

  const setupAntiCheatMonitoring = () => {
    // Disable right-click
    const handleContextMenu = (e) => {
      e.preventDefault();
      // Don't record violations if exam is terminated or submitting
      if (showTerminationModal || isSubmitting) return;
      recordViolation('right_click', 'Right-click attempted');
    };

    // Disable copy/paste
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        // Don't record violations if exam is terminated or submitting
        if (showTerminationModal || isSubmitting) return;
        recordViolation('copy_paste', `${e.key.toUpperCase()} key combination blocked`);
      }
    };

    // Detect tab switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Don't record violations during submission or if terminated
        if (isSubmitting || showTerminationModal) return;
        recordViolation('tab_switch', 'Tab switched or window minimized');
      }
    };

    // Detect window focus loss
    const handleBlur = () => {
      // Don't record violations during submission or if terminated
      if (isSubmitting || showTerminationModal) return;
      recordViolation('tab_switch', 'Window lost focus');
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    // Store cleanup functions
    window.examCleanup = () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      console.log('🧹 Anti-cheat monitoring cleaned up');
    };
  };

  const recordViolation = async (type, details) => {
    // Don't record violations if exam is already terminated
    if (showTerminationModal || isSubmitting) {
      return;
    }

    try {
      console.log(`🚨 Recording violation: ${type} - ${details}`);
      const response = await examService.recordViolation(attemptId, type, details);

      setViolations(prev => [...prev, { type, details, timestamp: new Date() }]);

      if (response.data.terminated || response.data.autoSubmitted) {
        console.log('🔴 Exam terminated due to violations:', response.data);

        // Show termination modal instead of auto-redirecting
        setTerminationData({
          attemptId: response.data.attemptId,
          violationCount: response.data.violationCount,
          terminationReason: response.data.terminationReason
        });
        setShowTerminationModal(true);

        // Clear the timer
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        // Remove all event listeners to prevent further violations
        if (window.examCleanup) {
          window.examCleanup();
        }

        toast.error('Exam terminated due to multiple violations!');
      } else {
        toast.error(`Anti-cheat violation: ${details} (${response.data.violationCount}/3)`);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);
      }
    } catch (error) {
      console.error('Failed to record violation:', error);

      // If exam is already completed, show termination modal
      if (error.response?.data?.message === 'Cannot record violation for completed attempt') {
        console.log('🔴 Exam already completed due to violations');
        setTerminationData({
          attemptId: attemptId,
          violationCount: violations.length,
          terminationReason: 'Exam was terminated due to multiple violations'
        });
        setShowTerminationModal(true);

        // Clear the timer
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        // Remove all event listeners
        if (window.examCleanup) {
          window.examCleanup();
        }
      }
    }
  };

  const startTimer = () => {
    intervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    toast.error('Time is up! Submitting exam automatically.');
    handleSubmit(true);
  };

  const handleAutoSubmit = () => {
    handleSubmit(true);
  };

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (window.examCleanup) {
      window.examCleanup();
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!isAutoSubmit && !confirm('Are you sure you want to submit your exam? You cannot change your answers after submission.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        ...answer
      }));

      await examService.submitExamAttempt(attemptId, formattedAnswers);

      // Send exam completion message if course data is available
      const storedExamData = sessionStorage.getItem('currentExamData');
      if (storedExamData) {
        try {
          const examData = JSON.parse(storedExamData);
          if (examData.courseId && examData.lectureIndex !== undefined) {
            window.parent.postMessage({
              type: 'EXAM_COMPLETED',
              courseId: examData.courseId,
              lectureIndex: examData.lectureIndex,
              examData: {
                attemptId: examData.attemptId,
                score: response.data.score || 100,
                passed: response.data.passed || true
              }
            }, '*');
          }
        } catch (error) {
          console.error('Error sending exam completion message:', error);
        }
      }

      cleanup();
      // Navigate to submission success page instead of results
      navigate('/exams/submitted/' + attemptId);
      
    } catch (error) {
      console.error('Submission error:', error);

      // If exam is already completed, redirect to submission success
      if (error.response?.status === 400) {
        toast.info('Exam has already been completed. Redirecting...');
        setTimeout(() => {
          navigate('/exams/submitted/' + attemptId);
        }, 2000);
      } else {
        toast.error(error.message || 'Failed to submit exam');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const renderQuestion = (question, index) => {
    const answer = answers[question._id] || {};

    return (
      <div key={question._id} className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Question {index + 1} ({question.points} points)
          </h3>
          <span className="text-sm text-foreground/60 capitalize">
            {question.type.replace('_', ' ')}
          </span>
        </div>

        <p className="text-foreground mb-6">{question.questionText}</p>

        {question.type === 'mcq' && (
          <div className="space-y-3">
            {question.options.map((option, optionIndex) => (
              <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question._id}`}
                  value={optionIndex}
                  checked={answer.selectedOption === optionIndex}
                  onChange={(e) => handleAnswerChange(question._id, {
                    selectedOption: parseInt(e.target.value)
                  })}
                  className="text-primary focus:ring-primary"
                />
                <span>{option.text}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'short_answer' && (
          <div>
            <input
              type="text"
              value={answer.textAnswer || ''}
              onChange={(e) => handleAnswerChange(question._id, {
                textAnswer: e.target.value
              })}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your answer..."
            />
          </div>
        )}

        {question.type === 'essay' && (
          <div>
            <textarea
              value={answer.textAnswer || ''}
              onChange={(e) => handleAnswerChange(question._id, {
                textAnswer: e.target.value
              })}
              className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              rows="8"
              placeholder="Write your essay here..."
              maxLength={question.maxWords * 6} // Rough estimate: 6 chars per word
            />
            <div className="flex justify-between text-sm text-foreground/60 mt-2">
              <span>Maximum {question.maxWords} words</span>
              <span>
                {answer.textAnswer ? answer.textAnswer.split(/\s+/).length : 0} words
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading exam data...</p>
          <p className="text-xs text-foreground/40 mt-2">Attempt ID: {attemptId}</p>
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Exam Data Not Found</h2>
          <p className="text-foreground/60 mb-4">Unable to load exam data. Please try refreshing the page.</p>
          <div className="text-xs text-foreground/40 mb-4">
            <p>Attempt ID: {attemptId}</p>
            <p>Session Data: {sessionStorage.getItem('currentExamData') ? 'Available' : 'Not Available'}</p>
          </div>
          <button
            onClick={() => navigate('/exams')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return to Exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Anti-cheat Warning */}
      {showWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Anti-cheat violation detected! Multiple violations will auto-submit your exam.</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{examData.examTitle || 'Exam in Progress'}</h1>
              <p className="text-sm text-foreground/60">
                {examData.questions?.length || 0} questions • Violations: {violations.length}/3
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className={`flex items-center space-x-2 ${
                timeRemaining < 300 ? 'text-red-600' : 'text-foreground'
              }`}>
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
              </div>
              
              <button
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Exam'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-4xl mx-auto p-6">
        {examData.questions.map((question, index) => renderQuestion(question, index))}
        
        {/* Submit Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center space-x-2 mx-auto"
          >
            <Send className="w-5 h-5" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Exam'}</span>
          </button>
        </div>
      </div>

      {/* Violation Termination Modal */}
      {showTerminationModal && terminationData && (
        <ExamViolationTerminated
          attemptData={terminationData}
          onClose={() => {
            setShowTerminationModal(false);
            navigate(getDashboardRoute());
          }}
        />
      )}
    </div>
  );
};

export default ExamInterface;
