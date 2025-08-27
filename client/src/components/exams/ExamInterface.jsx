import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, Send, Eye, EyeOff, Award, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import examService from '../../services/examService';
import ExamViolationTerminated from './ExamViolationTerminated';
import { useTheme } from '../../contexts/ThemeContext';

const ExamInterface = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
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
    const isAnswered = question.type === 'mcq' ? answer.selectedOption !== undefined : answer.textAnswer?.trim();

    return (
      <div key={question._id} className={`group bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 ${
        isAnswered ? 'ring-2 ring-green-500/30 bg-green-500/5' : ''
      }`}>
        {/* Enhanced Question Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
              isAnswered
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30'
                : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30'
            }`}>
              <span className="text-xl font-bold text-foreground">{index + 1}</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">
                Question {index + 1}
              </h3>
              <div className="flex items-center gap-3 text-sm text-foreground/60">
                <span className="px-2 py-1 bg-primary/20 text-primary rounded-full font-medium">
                  {question.points} points
                </span>
                <span className="px-2 py-1 bg-white/20 dark:bg-black/20 rounded-full font-medium capitalize">
                  {question.type.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Answer Status Indicator */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
            isAnswered
              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 dark:text-green-400 border border-green-500/30'
              : 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30'
          }`}>
            {isAnswered ? '✓ Answered' : '○ Pending'}
          </div>
        </div>

        {/* Enhanced Question Text */}
        <div className="bg-white/5 dark:bg-black/5 rounded-2xl p-6 mb-8 border border-white/10 dark:border-white/5">
          <p className="text-lg text-foreground leading-relaxed">{question.questionText}</p>
        </div>

        {/* Enhanced MCQ Options */}
        {question.type === 'mcq' && (
          <div className="space-y-4">
            {question.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={`group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                  answer.selectedOption === optionIndex
                    ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-2 border-primary/40 shadow-lg'
                    : 'bg-white/10 dark:bg-black/10 border-2 border-white/20 dark:border-white/10 hover:border-primary/30 hover:bg-primary/5'
                }`}
              >
                <div className={`relative w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                  answer.selectedOption === optionIndex
                    ? 'border-primary bg-primary'
                    : 'border-foreground/30 group-hover:border-primary/50'
                }`}>
                  <input
                    type="radio"
                    name={`question-${question._id}`}
                    value={optionIndex}
                    checked={answer.selectedOption === optionIndex}
                    onChange={(e) => handleAnswerChange(question._id, {
                      selectedOption: parseInt(e.target.value)
                    })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {answer.selectedOption === optionIndex && (
                    <div className="absolute inset-1 bg-white rounded-full"></div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    answer.selectedOption === optionIndex
                      ? 'bg-primary text-white'
                      : 'bg-white/20 dark:bg-black/20 text-foreground/70'
                  }`}>
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <span className="text-foreground font-medium">{option.text}</span>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Enhanced Short Answer */}
        {question.type === 'short_answer' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground/80">Your Answer:</label>
            <input
              type="text"
              value={answer.textAnswer || ''}
              onChange={(e) => handleAnswerChange(question._id, {
                textAnswer: e.target.value
              })}
              className="w-full p-4 bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-2xl text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
              placeholder="Enter your answer here..."
            />
          </div>
        )}

        {/* Enhanced Essay */}
        {question.type === 'essay' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground/80">Your Essay:</label>
              <div className="text-sm text-foreground/60">
                <span className={`font-medium ${
                  answer.textAnswer && answer.textAnswer.split(/\s+/).length > question.maxWords
                    ? 'text-red-500' : 'text-foreground/60'
                }`}>
                  {answer.textAnswer ? answer.textAnswer.split(/\s+/).filter(word => word.length > 0).length : 0}
                </span>
                <span> / {question.maxWords} words</span>
              </div>
            </div>
            <textarea
              value={answer.textAnswer || ''}
              onChange={(e) => handleAnswerChange(question._id, {
                textAnswer: e.target.value
              })}
              className="w-full p-4 bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-2xl text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 resize-none"
              rows="8"
              placeholder="Write your essay here..."
              maxLength={question.maxWords * 6} // Rough estimate: 6 chars per word
            />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20">
      {/* Glass morphism overlay */}
      <div className="absolute inset-0 bg-white/10 dark:bg-black/20 backdrop-blur-[1px]" />

      {/* Enhanced Anti-cheat Warning */}
      {showWarning && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-red-500/90 to-pink-500/90 backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-2xl border border-red-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="font-medium">Anti-cheat violation detected! Multiple violations will auto-submit your exam.</span>
          </div>
        </div>
      )}

      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 bg-white/20 dark:bg-black/20 backdrop-blur-xl border-b border-white/20 dark:border-white/10 shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl backdrop-blur-sm border border-yellow-500/30">
                <Award className="w-8 h-8 text-yellow-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {examData.examTitle || 'Exam in Progress'}
                </h1>
                <div className="flex items-center gap-4 text-sm text-foreground/70">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>{examData.questions?.length || 0} questions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className={`w-4 h-4 ${violations.length > 0 ? 'text-red-500' : 'text-green-500'}`} />
                    <span>Violations: {violations.length}/3</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Enhanced Timer */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
                timeRemaining < 300
                  ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/30 text-red-600 dark:text-red-400'
                  : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-600 dark:text-green-400'
              }`}>
                <Clock className="w-5 h-5" />
                <span className="font-mono text-xl font-bold">{formatTime(timeRemaining)}</span>
              </div>

              {/* Enhanced Submit Button */}
              <button
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Exam'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Questions Section */}
      <div className="relative z-10 max-w-6xl mx-auto p-6">
        <div className="space-y-8">
          {examData.questions.map((question, index) => renderQuestion(question, index))}
        </div>

        {/* Enhanced Submit Button */}
        <div className="text-center mt-12">
          <div className="bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-foreground mb-2">Ready to Submit?</h3>
                <p className="text-foreground/70">Make sure you've answered all questions before submitting.</p>
              </div>
              <button
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="px-12 py-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-3"
              >
                <Send className="w-6 h-6" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Exam'}</span>
              </button>
            </div>
          </div>
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
