import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, BookOpen, CheckCircle, AlertCircle, Play, Pause, FileText } from 'lucide-react';
import modernSystem from '../../services/modernSystem';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import UniversalTopBar from '../common/UniversalTopBar';

const ModernLectureViewer = () => {
  const { theme } = useTheme();
  const { courseId, lectureIndex } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);
  
  const [course, setCourse] = useState(null);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [progress, setProgress] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStartedQuiz, setHasStartedQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  const lectureIdx = parseInt(lectureIndex);

  useEffect(() => {
    loadLectureData();
  }, [courseId, lectureIndex]);

  useEffect(() => {
    // Track view when component mounts
    if (courseId && lectureIndex) {
      modernSystem.progress.trackView(courseId, lectureIdx);
    }
  }, [courseId, lectureIndex]);

  const loadLectureData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load course details
      const courseResponse = await modernSystem.learning.getCourseDetails(courseId);
      console.log('Course response:', courseResponse);
      
      // Handle different response structures
      const courseData = courseResponse.data || courseResponse.course || courseResponse;
      console.log('Course data:', courseData);
      
      if (!courseData || !courseData.lectures) {
        setError('Course not found or has no lectures');
        return;
      }
      
      setCourse(courseData);

      // Get current lecture
      const lecture = courseData.lectures[lectureIdx];
      if (!lecture) {
        setError('Lecture not found');
        return;
      }
      setCurrentLecture(lecture);

      // Load progress
      const progressResponse = await modernSystem.progress.getCourseProgress(courseId);
      console.log('Progress response:', progressResponse);
      
      // Handle different response structures for progress
      const progressData = progressResponse.data || progressResponse;
      setProgress(progressData);

      // Load quiz if exists
      if (lecture.modernQuiz || lecture.exam || (lecture.quiz && lecture.quiz.length > 0)) {
        try {
          let quizData = null;
          
          if (lecture.quiz && lecture.quiz.length > 0) {
            // Handle inline quiz in lecture
            quizData = {
              _id: `lecture-${lectureIdx}-quiz`,
              title: `${lecture.title} Quiz`,
              questions: lecture.quiz,
              timeLimit: lecture.timeLimit || 30,
              passingScore: lecture.passingScore || 70,
              shuffleQuestions: lecture.shuffleQuestions || false
            };
            console.log('Using inline quiz:', quizData);
            setQuiz(quizData);
          } else {
            // Handle external quiz reference
            const quizId = lecture.modernQuiz || lecture.exam?._id || lecture.exam;
            console.log('Loading external quiz:', quizId);
            
            const quizResponse = await modernSystem.quiz.getQuiz(quizId);
            console.log('Quiz response:', quizResponse);
            
            // Handle different response structures for quiz
            quizData = quizResponse.data?.quiz || quizResponse.quiz || quizResponse.data || quizResponse;
            setQuiz(quizData);
            
            // Check for existing attempts
            const attemptsResponse = await modernSystem.quiz.getUserAttempts(quizId);
            const attemptsData = attemptsResponse.data?.attempts || attemptsResponse.attempts || [];
            
            if (attemptsData && attemptsData.length > 0) {
              const lastAttempt = attemptsData[0];
              setQuizAttempt(lastAttempt);
              if (lastAttempt.score !== undefined) {
                setShowResults(true);
              }
            }
          }
        } catch (quizError) {
          console.log('No quiz found for this lecture:', quizError);
        }
      }

    } catch (err) {
      console.error('Error loading lecture data:', err);
      setError(err.message || 'Failed to load lecture data');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      const progressPercent = (current / duration) * 100;
      
      setVideoProgress(progressPercent);
      
      // Track progress every 10 seconds
      if (Math.floor(current) % 10 === 0) {
        modernSystem.progress.trackCompletion(courseId, lectureIdx, {
          videoProgress: progressPercent,
          timeSpent: current
        });
      }
    }
  };

  const handleVideoEnded = () => {
    setVideoProgress(100);
    modernSystem.progress.trackCompletion(courseId, lectureIdx, {
      videoProgress: 100,
      contentViewed: true,
      timeSpent: videoRef.current?.duration || 0
    });
  };

  const startQuiz = () => {
    setHasStartedQuiz(true);
    setShowResults(false);
  };

  const handleQuizAnswer = (questionIndex, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const submitQuiz = async () => {
    try {
      const formattedAnswers = quiz.questions.map((q, index) => ({
        questionIndex: index,
        answer: quizAnswers[index] || ''
      }));

      // Handle inline quiz vs external quiz differently
      if (quiz._id.startsWith('lecture-')) {
        // For inline quizzes, calculate score locally
        let correctAnswers = 0;
        quiz.questions.forEach((question, index) => {
          const userAnswer = quizAnswers[index];
          if (question.type === 'mcq' && userAnswer === question.answer) {
            correctAnswers++;
          }
          // For short answer questions, we'll mark them as correct for now
          // In a real implementation, this would need teacher review
          else if (question.type === 'short' && userAnswer && userAnswer.trim().length > 0) {
            correctAnswers++;
          }
        });
        
        const score = Math.round((correctAnswers / quiz.questions.length) * 100);
        const passed = score >= (quiz.passingScore || 70);
        
        const mockAttempt = {
          _id: `attempt-${Date.now()}`,
          quizId: quiz._id,
          answers: formattedAnswers,
          score,
          correctAnswers,
          totalQuestions: quiz.questions.length,
          passed,
          submittedAt: new Date().toISOString()
        };
        
        setQuizAttempt(mockAttempt);
        setShowResults(true);
        setHasStartedQuiz(false);
        
        console.log('Inline quiz completed:', mockAttempt);
      } else {
        // For external quizzes, use the API
        const response = await modernSystem.quiz.submitAttempt(quiz._id, formattedAnswers);
        const attemptData = response.data?.attempt || response.attempt || response.data || response;
        setQuizAttempt(attemptData);
        setShowResults(true);
        setHasStartedQuiz(false);
      }
      
      // Refresh progress
      loadLectureData();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError('Failed to submit quiz');
    }
  };

  const navigateToLecture = (index) => {
    navigate(`/courses/${courseId}/lecture/${index}`);
  };

  const lectureProgress = useMemo(() => {
    return progress?.lectureProgress?.find(lp => lp.lectureIndex === lectureIdx);
  }, [progress, lectureIdx]);

  const isCompleted = lectureProgress?.completed || false;

  if (loading) {
    return (
      <>
        <UniversalTopBar />
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <UniversalTopBar />
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => navigate(`/courses/${courseId}`)}
              className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              Back to Course
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!currentLecture) {
    return (
      <>
        <UniversalTopBar />
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20">
          <p className="text-foreground">Lecture not found</p>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20">
      <UniversalTopBar />
      {/* Glass morphism overlay */}
      <div className="absolute inset-0 bg-white/10 dark:bg-black/20 backdrop-blur-[1px]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{currentLecture.title}</h1>
                <p className="text-foreground/60 mt-2">{course.title} - Lecture {lectureIdx + 1}</p>
              </div>
              <div className="flex items-center space-x-4">
                {isCompleted && (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>Completed</span>
                  </div>
                )}
                <span className="text-sm text-foreground/60">
                  Progress: {Math.round(progress?.overallPercentage || 0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Lecture Content */}
            {currentLecture.content && currentLecture.content.length > 0 && (
              <div className="space-y-6">
                {currentLecture.content.map((contentItem, index) => (
                  <div key={index} className="bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
                    <div className="p-4 border-b border-white/20 dark:border-white/10">
                      <h3 className="text-lg font-semibold text-foreground">{contentItem.title}</h3>
                    </div>
                  
                    {contentItem.type === 'video' && (
                      <>
                        <div className="aspect-video">
                          {contentItem.videoType === 'youtube' && contentItem.videoId ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${contentItem.videoId}?autoplay=0&rel=0&modestbranding=1&showinfo=0&controls=1&fs=1`}
                              title={contentItem.title}
                              className="w-full h-full border-0"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            />
                          ) : contentItem.videoType === 'vimeo' && contentItem.videoId ? (
                            <iframe
                              src={`https://player.vimeo.com/video/${contentItem.videoId}`}
                              title={contentItem.title}
                              className="w-full h-full border-0"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            />
                          ) : contentItem.url ? (
                            <video
                              ref={videoRef}
                              src={contentItem.url}
                              controls
                              className="w-full h-full object-cover"
                              onTimeUpdate={handleVideoTimeUpdate}
                              onEnded={handleVideoEnded}
                              onPlay={() => setIsPlaying(true)}
                              onPause={() => setIsPlaying(false)}
                            >
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800">
                              <p className="text-gray-500 dark:text-gray-400">No video source available</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Video Progress Bar - only for direct video */}
                        {contentItem.videoType === 'direct' && contentItem.url && (
                          <div className="p-4 bg-white/10 dark:bg-black/10">
                            <div className="flex items-center justify-between text-sm text-foreground/60 mb-2">
                              <span>Video Progress</span>
                              <span>{Math.round(videoProgress)}%</span>
                            </div>
                            <div className="w-full bg-white/20 dark:bg-black/20 rounded-full h-2">
                              <div 
                                className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${videoProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    
                    {contentItem.type === 'pdf' && (
                      <div className="p-6">
                        <div className="flex items-center justify-center space-x-4">
                          <FileText className="h-8 w-8 text-red-500 dark:text-red-400" />
                          <div>
                            <p className="font-medium text-foreground">{contentItem.title}</p>
                            <a 
                              href={contentItem.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              Open PDF
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Quiz Section */}
            {quiz && (
              <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-foreground">Lecture Quiz</h3>
                  <div className="flex items-center space-x-4">
                    {quiz.timeLimit && (
                      <div className="flex items-center text-foreground/60">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{quiz.timeLimit} minutes</span>
                      </div>
                    )}
                    <span className="text-sm text-foreground/60">
                      Passing Score: {quiz.passingScore}%
                    </span>
                  </div>
                </div>

                {showResults && quizAttempt ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${quizAttempt.passed ? 'bg-green-50/80 dark:bg-green-900/20 border border-green-200 dark:border-green-700' : 'bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-700'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {quizAttempt.passed ? (
                            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                          ) : (
                            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3" />
                          )}
                          <div>
                            <p className={`font-semibold ${quizAttempt.passed ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                              {quizAttempt.passed ? 'Quiz Passed!' : 'Quiz Failed'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Score: {quizAttempt.score}% ({quizAttempt.correctAnswers}/{quiz.questions.length} correct)
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={startQuiz}
                          className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600"
                        >
                          Retake Quiz
                        </button>
                      </div>
                    </div>
                  </div>
                ) : hasStartedQuiz ? (
                  <div className="space-y-6">
                    {quiz.questions.map((question, index) => (
                      <div key={index} className="border border-white/20 dark:border-white/10 rounded-lg p-4 bg-white/10 dark:bg-black/10">
                        <h4 className="font-medium mb-3 text-foreground">
                          {index + 1}. {question.question}
                        </h4>
                        
                        {question.type === 'mcq' ? (
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <label key={optionIndex} className="flex items-center">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value={option}
                                  onChange={() => handleQuizAnswer(index, option)}
                                  className="mr-3"
                                />
                                <span className="text-foreground">{option}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <textarea
                            placeholder="Enter your answer..."
                            className="w-full p-3 border border-white/20 dark:border-white/10 rounded-lg bg-white/10 dark:bg-black/10 text-foreground placeholder-foreground/50"
                            rows="3"
                            onChange={(e) => handleQuizAnswer(index, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                    
                    <div className="flex justify-end">
                      <button
                        onClick={submitQuiz}
                        className="bg-green-600 dark:bg-green-500 text-white px-6 py-2 rounded hover:bg-green-700 dark:hover:bg-green-600"
                        disabled={Object.keys(quizAnswers).length !== quiz.questions.length}
                      >
                        Submit Quiz
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-foreground/60 mb-4">
                      Complete this quiz to progress to the next lecture.
                    </p>
                    <button
                      onClick={startQuiz}
                      className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      Start Quiz
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Progress */}
            <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Course Progress</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-foreground">
                  <span>Overall Progress</span>
                  <span>{Math.round(progress?.overallPercentage || 0)}%</span>
                </div>
                <div className="w-full bg-white/20 dark:bg-black/20 rounded-full h-2">
                  <div 
                    className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full"
                    style={{ width: `${progress?.overallPercentage || 0}%` }}
                  ></div>
                </div>
                <div className="text-sm text-foreground/60">
                  {progress?.completedLectures || 0} of {progress?.totalLectures || 0} lectures completed
                </div>
              </div>
            </div>

            {/* Lecture Navigation */}
            <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Lectures</h3>
              <div className="space-y-2">
                {course.lectures.map((lecture, index) => {
                  const lectureProgress = progress?.lectureProgress?.find(lp => lp.lectureIndex === index);
                  const isCurrentLecture = index === lectureIdx;
                  const isLectureCompleted = lectureProgress?.completed || false;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => navigateToLecture(index)}
                      className={`w-full text-left p-3 rounded-xl transition-colors ${
                        isCurrentLecture 
                          ? 'bg-blue-100/50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400' 
                          : 'hover:bg-white/30 dark:hover:bg-black/30 border border-white/20 dark:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${
                            isLectureCompleted 
                              ? 'bg-green-500 dark:bg-green-400 text-white' 
                              : isCurrentLecture 
                                ? 'bg-blue-500 dark:bg-blue-400 text-white' 
                                : 'bg-white/30 dark:bg-black/30 text-foreground/60'
                          }`}>
                            {isLectureCompleted ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <span className="text-xs">{index + 1}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{lecture.title}</p>
                          </div>
                        </div>
                        {(lecture.modernQuiz || lecture.exam || (lecture.quiz && lecture.quiz.length > 0)) && (
                          <BookOpen className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernLectureViewer;
