import React, { useState, useEffect } from 'react';
import { 
  Award, CheckCircle, Clock, AlertTriangle, 
  Play, Trophy, Target, ChevronDown, ChevronUp,
  FileText, Send, RotateCcw, XCircle
} from 'lucide-react';
import examService from '../../services/examService';
import toast from 'react-hot-toast';

/**
 * QuizSection Component
 * 
 * Displays quiz content inline with all quiz functionality.
 * Manages quiz states, questions, answers, and completion logic.
 * 
 * @param {Object} props
 * @param {Object} props.lecture - Current lecture data
 * @param {number} props.lectureIndex - Index of current lecture
 * @param {Object} props.lectureProgress - Progress data for current lecture
 * @param {function} props.onQuizComplete - Callback when quiz is completed
 * @param {boolean} props.canTakeQuiz - Whether user can take the quiz
 */
const QuizSection = ({ 
  lecture, 
  lectureIndex, 
  lectureProgress, 
  onQuizComplete, 
  canTakeQuiz 
}) => {
  
  // Quiz states
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Return null if lecture has no quiz/exam
  if (!lecture.exam) {
    return null;
  }

  const progress = lectureProgress[lectureIndex];
  const isQuizPassed = progress?.quizPassed;
  const exam = lecture.exam;

  // Timer effect
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0 && quizStarted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [timeRemaining, quizStarted]);

  /**
   * Handles time up scenario
   */
  const handleTimeUp = async () => {
    if (currentAttempt && !isSubmitting) {
      toast.error('Time is up! Submitting your answers...');
      await handleSubmitQuiz();
    }
  };

  /**
   * Starts the quiz attempt
   */
  const handleStartQuiz = async () => {
    if (!canTakeQuiz || !exam) return;
    
    try {
      setIsLoading(true);
      
      // Start exam attempt
      const browserInfo = examService.getBrowserInfo();
      const response = await examService.startExamAttempt(exam._id, browserInfo);
      
      if (response.success) {
        setCurrentAttempt(response.data);
        setQuestions(response.data.questions || []);
        
        if (response.data.resumed) {
          // Resuming existing attempt
          setTimeRemaining(response.data.timeRemaining);
          toast.info('Resuming your previous quiz attempt...');
        } else {
          // New attempt
          setTimeRemaining(exam.timeLimit ? exam.timeLimit * 60 : null);
          toast.success('Quiz started! Good luck!');
        }
        
        setQuizStarted(true);
        setIsExpanded(true);
        setAnswers({});
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      
      if (error.message?.includes('ongoing attempt')) {
        // For lecture quizzes, the server will auto-cancel and retry
        toast.info('Previous quiz attempt found. Starting fresh...');
        // Retry starting the quiz after a brief delay
        setTimeout(() => handleStartQuiz(), 1000);
      } else {
        toast.error(error.message || 'Failed to start quiz');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles answer change for a question
   */
  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  /**
   * Submits the quiz
   */
  const handleSubmitQuiz = async () => {
    if (!currentAttempt || isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      // Format answers for submission with proper data types
      const formattedAnswers = questions.map((question, index) => {
        const userAnswer = answers[index];
        
        if (question.type === 'mcq') {
          // For MCQ, convert text answer to option index
          let selectedOptionIndex = null;
          if (userAnswer) {
            selectedOptionIndex = question.options.findIndex(option => option.text === userAnswer);
            // If not found, try to parse as number (in case it's already an index)
            if (selectedOptionIndex === -1 && !isNaN(userAnswer)) {
              selectedOptionIndex = parseInt(userAnswer);
            }
          }
          
          return {
            questionId: question._id,
            questionType: question.type,
            selectedOption: selectedOptionIndex !== -1 ? selectedOptionIndex : null,
            maxPoints: question.points
          };
        } else {
          // For text-based questions
          return {
            questionId: question._id,
            questionType: question.type,
            textAnswer: userAnswer || '',
            maxPoints: question.points
          };
        }
      });
      
      console.log('Submitting answers:', formattedAnswers);
      console.log('Questions structure:', questions.map(q => ({ id: q._id, type: q.type, text: q.text })));
      
      const response = await examService.submitExamAttempt(currentAttempt.attemptId, formattedAnswers);
      
      if (response.success) {
        toast.success('Quiz submitted successfully!');
        
        // Extract score data from response - server returns percentage field
        const passed = response.data.passed;
        const score = response.data.percentage || response.data.score || 0;
        const totalScore = response.data.totalScore || 0;
        
        console.log('Quiz submission response:', response.data);
        console.log('Extracted score data:', { passed, score, totalScore });
        
        if (passed) {
          toast.success(`Congratulations! You scored ${score}% and passed the quiz!`);
          // Call the completion callback to update progress
          onQuizComplete && onQuizComplete(lectureIndex, {
            passed: true,
            score: score,
            totalScore: totalScore,
            attemptId: currentAttempt.attemptId
          });
        } else {
          toast.error(`You scored ${score}%. You need ${lecture.passingScore || 60}% to pass. Try again!`);
          // Call completion callback even for failed attempts to track the attempt
          onQuizComplete && onQuizComplete(lectureIndex, {
            passed: false,
            score: score,
            totalScore: totalScore,
            attemptId: currentAttempt.attemptId
          });
        }
        
        // Reset quiz state
        setQuizStarted(false);
        setCurrentAttempt(null);
        setQuestions([]);
        setAnswers({});
        setTimeRemaining(null);
        setIsExpanded(false);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error(error.message || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Formats time in MM:SS format
   */
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Gets quiz status for UI display
   */
  const getQuizStatus = () => {
    const progress = lectureProgress[lectureIndex];
    
    if (isQuizPassed) {
      return {
        text: 'Quiz Completed',
        subtext: 'Congratulations! You passed the quiz.',
        color: 'text-green-600',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        icon: <CheckCircle className="w-5 h-5 text-green-500" />
      };
    }
    
    // Check if quiz was attempted but failed
    if (progress?.lastQuizAttempt && !progress.quizPassed) {
      return {
        text: 'Quiz Failed - Retake Available',
        subtext: `Last score: ${progress.lastQuizAttempt.score}%. You can try again!`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        icon: <XCircle className="w-5 h-5 text-orange-500" />
      };
    }
    
    if (!canTakeQuiz) {
      return {
        text: 'Quiz Locked',
        subtext: 'Complete the content above to unlock this quiz.',
        color: 'text-gray-600',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/20',
        icon: <AlertTriangle className="w-5 h-5 text-gray-500" />
      };
    }
    
    return {
      text: 'Quiz Available',
      subtext: 'Complete this quiz to unlock the next lecture.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      icon: <Award className="w-5 h-5 text-blue-500" />
    };
  };

  /**
   * Renders a multiple choice question
   */
  const renderMCQQuestion = (question, questionIndex) => (
    <div className="space-y-3">
      <div className="space-y-2">
        {question.options?.map((option, optionIndex) => {
          // Handle both string options and object options with text property
          const optionText = typeof option === 'string' ? option : option.text;
          const optionValue = typeof option === 'string' ? option : option.text;
          
          return (
            <label 
              key={optionIndex}
              className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/20 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name={`question-${questionIndex}`}
                value={optionValue}
                checked={answers[questionIndex] === optionValue}
                onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
                className="mt-1 text-primary"
                disabled={isSubmitting}
              />
              <span className="flex-1 text-sm">{optionText}</span>
            </label>
          );
        })}
      </div>
    </div>
  );

  /**
   * Renders a short answer question
   */
  const renderShortQuestion = (question, questionIndex) => (
    <div className="space-y-3">
      <textarea
        placeholder="Enter your answer here..."
        value={answers[questionIndex] || ''}
        onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
        className="w-full p-3 border border-border/50 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
        rows={3}
        disabled={isSubmitting}
      />
    </div>
  );

  /**
   * Renders an essay question
   */
  const renderEssayQuestion = (question, questionIndex) => (
    <div className="space-y-3">
      <textarea
        placeholder="Write your essay answer here..."
        value={answers[questionIndex] || ''}
        onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
        className="w-full p-3 border border-border/50 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
        rows={6}
        disabled={isSubmitting}
      />
    </div>
  );

  /**
   * Renders a question based on its type
   */
  const renderQuestion = (question, questionIndex) => {
    return (
      <div key={questionIndex} className="bg-accent/10 rounded-lg p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
            {questionIndex + 1}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground mb-3">{question.question}</h4>
            
            {question.type === 'mcq' && renderMCQQuestion(question, questionIndex)}
            {question.type === 'short' && renderShortQuestion(question, questionIndex)}
            {question.type === 'essay' && renderEssayQuestion(question, questionIndex)}
            
            {question.points && (
              <div className="mt-2 text-xs text-foreground/60">
                Points: {question.points}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const status = getQuizStatus();

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden">
      {/* Quiz Header */}
      <div className={`p-6 ${status.bgColor} border-b border-border/30`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {status.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                Lecture Quiz
              </h3>
              <p className={`text-sm ${status.color} font-medium mb-1`}>
                {status.text}
              </p>
              <p className="text-sm text-foreground/60">
                {status.subtext}
              </p>
            </div>
          </div>
          
          {/* Timer Display */}
          {quizStarted && timeRemaining !== null && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <Clock className="w-4 h-4 text-red-500" />
              <span className="text-sm font-mono font-medium text-red-600">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
          
          {/* Quiz Badge */}
          <div className={`
            px-3 py-1 rounded-full text-xs font-medium border
            ${status.bgColor} ${status.borderColor} ${status.color}
          `}>
            {isQuizPassed ? 'Passed' : 'Required'}
          </div>
        </div>
      </div>

      {/* Quiz Details and Content */}
      <div className="p-6 space-y-4">
        {/* Quiz Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {exam.timeLimit && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-foreground/60" />
              <span className="text-foreground/80">
                {exam.timeLimit} minutes
              </span>
            </div>
          )}
          
          {exam.questions && (
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-foreground/60" />
              <span className="text-foreground/80">
                {exam.questions?.length || exam.questionCount || 'Multiple'} questions
              </span>
            </div>
          )}
          
          {lecture.passingScore && (
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="w-4 h-4 text-foreground/60" />
              <span className="text-foreground/80">
                {lecture.passingScore}% to pass
              </span>
            </div>
          )}
        </div>

        {/* Previous Attempt Info (for failed attempts) */}
        {lectureProgress[lectureIndex]?.lastQuizAttempt && !isQuizPassed && (
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-600">Previous Attempt</span>
            </div>
            <div className="text-sm text-foreground/70">
              Score: {lectureProgress[lectureIndex].lastQuizAttempt.score}% 
              (Need {lecture.passingScore || 60}% to pass)
            </div>
          </div>
        )}

        {/* Quiz Description */}
        {exam.description && (
          <div className="bg-accent/20 rounded-lg p-4">
            <p className="text-sm text-foreground/80">
              {exam.description}
            </p>
          </div>
        )}

        {/* Quiz Content */}
        {!isQuizPassed && canTakeQuiz && (
          <div className="space-y-4">
            {!quizStarted ? (
              /* Start Quiz Button */
              <button
                onClick={handleStartQuiz}
                disabled={isLoading}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Starting Quiz...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    {lectureProgress[lectureIndex]?.lastQuizAttempt && !isQuizPassed ? 'Retake Quiz' : 'Start Quiz'}
                  </>
                )}
              </button>
            ) : (
              /* Quiz Content */
              <div className="space-y-6">
                {/* Questions */}
                <div className="space-y-4">
                  {questions.map((question, questionIndex) => renderQuestion(question, questionIndex))}
                </div>

                {/* Progress Indicator */}
                <div className="bg-accent/20 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-foreground/60">
                      {Object.keys(answers).length} of {questions.length} answered
                    </span>
                  </div>
                  <div className="w-full bg-border/50 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ 
                        width: `${(Object.keys(answers).length / questions.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting || Object.keys(answers).length === 0}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Quiz
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Completed State */}
        {isQuizPassed && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-600">
              <Trophy className="w-4 h-4" />
              <span>
                Great job! You've completed this quiz and unlocked the next lecture.
              </span>
            </div>
          </div>
        )}

        {/* Locked State */}
        {!canTakeQuiz && !isQuizPassed && (
          <button
            disabled
            className="w-full py-3 bg-gray-500/20 text-gray-500 rounded-xl font-medium cursor-not-allowed flex items-center justify-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            Complete Content First
          </button>
        )}

        {/* Important Notes */}
        {!isQuizPassed && canTakeQuiz && !quizStarted && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-700 dark:text-yellow-600 mb-1">
                  Important Quiz Guidelines:
                </p>
                <ul className="text-yellow-700 dark:text-yellow-600 space-y-1">
                  <li>• You must pass this quiz to unlock the next lecture</li>
                  <li>• Make sure you have a stable internet connection</li>
                  <li>• Do not refresh the page or navigate away during the quiz</li>
                  {exam.timeLimit && (
                    <li>• Complete within the time limit of {exam.timeLimit} minutes</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizSection;
