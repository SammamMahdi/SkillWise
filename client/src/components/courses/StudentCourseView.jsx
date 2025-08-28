import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen, ArrowLeft, Play, Lock, CheckCircle, XCircle,
  ChevronDown, ChevronRight, Video, File, FileText, Clock,
  User, Calendar, Award, Target, BarChart3, Eye, EyeOff,
  Loader2, AlertCircle, CheckSquare, Square, PlayCircle,
  Download, ExternalLink, Bookmark, BookmarkCheck, Sparkles,
  TrendingUp, Star, Users, Globe
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCourse, checkEnrollment, enroll } from '../../services/courseService';
import { getEnrolledCourseDetails, updateCourseProgress } from '../../services/learningService';
import examService from '../../services/examService';
import toast from 'react-hot-toast';
import ExamWarningModal from '../exams/ExamWarningModal';
import ChildLockModal from '../common/ChildLockModal';
import UniversalTopBar from '../common/UniversalTopBar';
import StudentCourseHeader from './StudentCourseHeader'
import StudentCourseStats from './StudentCourseStats'
import StudentLectureList from './StudentLectureList'
import CourseThreeJSBackground from './CourseThreeJSBackground';
import { useTheme } from '../../contexts/ThemeContext'

export default function StudentCourseView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();

  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [expandedLectures, setExpandedLectures] = useState(new Set());
  const [selectedContent, setSelectedContent] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showChildLockModal, setShowChildLockModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [lectureProgress, setLectureProgress] = useState({});
  const [courseExams, setCourseExams] = useState([]);

  // Load course and enrollment data
  useEffect(() => {
    const loadCourseData = async () => {
      try {
        setLoading(true);
        setError('');

        // Load course details
        const courseRes = await getCourse(id);
        const courseData = courseRes.course || courseRes.data || courseRes;
        console.log('Course data loaded:', courseData);
        console.log('Course lectures:', courseData.lectures);
        setCourse(courseData);

        // Check enrollment status
        const isEnrolled = await checkEnrollment(id, localStorage.getItem('token'));
        
        if (isEnrolled) {
          // Load enrollment details with progress
          try {
            const enrollmentData = await getEnrolledCourseDetails(id);
            setEnrollment(enrollmentData);
            
            // Initialize lecture progress from enrollment
            const progress = {};
            
            // Initialize from completed lectures
            enrollmentData.progress?.completedLectures?.forEach(lectureIndex => {
              progress[lectureIndex] = { completed: true, quizPassed: true };
            });
            
            // Initialize from enhanced lecture progress
            if (enrollmentData.progress?.lectureProgress) {
              enrollmentData.progress.lectureProgress.forEach(lectureProgress => {
                const index = lectureProgress.lectureIndex;
                progress[index] = {
                  completed: lectureProgress.completed || false,
                  quizPassed: lectureProgress.examAttempts?.some(attempt => attempt.passed) || false,
                  timeSpent: lectureProgress.timeSpent || 0
                };
              });
            }
            
            setLectureProgress(progress);

            // Load course exams
            await loadCourseExams();

            // Check for recent exam completion (will be called after courseExams are loaded)
          } catch (enrollmentError) {
            console.error('Error loading enrollment details:', enrollmentError);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    if (id && user) {
      loadCourseData();
    }
  }, [id, user]);

  // Check for recent exam completion when courseExams are loaded
  useEffect(() => {
    if (courseExams.length > 0 && course && Object.keys(lectureProgress).length > 0) {
      checkRecentExamCompletion();
    }
  }, [courseExams, course, lectureProgress]);

  // Load course exams
  const loadCourseExams = async () => {
    try {
      console.log('Loading course exams for course ID:', id);
      const response = await examService.getCourseExams(id);
      console.log('Course exams response:', response);
      if (response.success && response.data.exams) {
        setCourseExams(response.data.exams);
        console.log('Set course exams:', response.data.exams);
      }
    } catch (error) {
      console.error('Error loading course exams:', error);
    }
  };

  // Check for recent exam completion
  const checkRecentExamCompletion = async () => {
    try {
      // Use the loaded course exams
      for (const exam of courseExams) {
        if (exam.lastAttempt && exam.lastAttempt.passed) {
          // Find the lecture index for this exam
          const lectureIndex = course.lectures.findIndex(l => l.exam?._id === exam._id);
          if (lectureIndex !== -1 && !lectureProgress[lectureIndex]?.quizPassed) {
            // Mark quiz as passed
            setLectureProgress(prev => ({
              ...prev,
              [lectureIndex]: { ...prev[lectureIndex], quizPassed: true }
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error checking recent exam completion:', error);
    }
  };

  const handleEnroll = async () => {
    // Check if user is a child account
    if (user?.role === 'Child') {
      setShowChildLockModal(true);
      return;
    }

    // Regular enrollment for non-child accounts
    try {
      setEnrolling(true);
      await enroll(id, localStorage.getItem('token'));
      
      // Reload enrollment data
      const enrollmentData = await getEnrolledCourseDetails(id);
      setEnrollment(enrollmentData);
      
      toast.success('Successfully enrolled in course!');
    } catch (err) {
      toast.error(err?.response?.data?.error || err.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const handleChildLockVerify = async (childLockPassword) => {
    try {
      setEnrolling(true);
      await enroll(id, localStorage.getItem('token'), childLockPassword);
      
      // Reload enrollment data
      const enrollmentData = await getEnrolledCourseDetails(id);
      setEnrollment(enrollmentData);
      
      toast.success('Successfully enrolled in course!');
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to enroll';
      throw new Error(errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  const toggleLectureExpansion = (lectureIndex) => {
    const newExpanded = new Set(expandedLectures);
    if (newExpanded.has(lectureIndex)) {
      newExpanded.delete(lectureIndex);
    } else {
      newExpanded.add(lectureIndex);
    }
    setExpandedLectures(newExpanded);
  };

  const isLectureUnlocked = (lectureIndex) => {
    // Once enrolled, all lectures are unlocked
    return !!enrollment;
  };

  const markLectureComplete = async (lectureIndex) => {
    try {
      // Check if lecture has an exam that needs to be passed first
      const lecture = course.lectures[lectureIndex];
      if (lecture.exam && !lectureProgress[lectureIndex]?.quizPassed) {
        toast.error('You must complete the quiz before marking this lecture as complete');
        return;
      }

      const updatedProgress = {
        ...lectureProgress,
        [lectureIndex]: { ...lectureProgress[lectureIndex], completed: true }
      };
      setLectureProgress(updatedProgress);

      // Convert progress to array format for backend
      const lectureProgressArray = Object.entries(updatedProgress).map(([index, progress]) => ({
        lectureIndex: parseInt(index),
        completed: progress.completed,
        timeSpent: progress.timeSpent || 0
      }));

      // Update progress on server
      await updateCourseProgress(id, {
        lectureProgress: lectureProgressArray
      });

      toast.success('Lecture marked as complete!');
    } catch (err) {
      toast.error('Failed to update progress');
      // Revert on error
      setLectureProgress(prev => ({
        ...prev,
        [lectureIndex]: { ...prev[lectureIndex], completed: false }
      }));
    }
  };

  const markQuizPassed = async (lectureIndex) => {
    try {
      const updatedProgress = {
        ...lectureProgress,
        [lectureIndex]: { ...lectureProgress[lectureIndex], quizPassed: true }
      };
      setLectureProgress(updatedProgress);

      // Convert progress to array format for backend
      const lectureProgressArray = Object.entries(updatedProgress).map(([index, progress]) => ({
        lectureIndex: parseInt(index),
        completed: progress.completed,
        timeSpent: progress.timeSpent || 0
      }));

      // Get the exam attempt data
      const lecture = course.lectures[lectureIndex];
      const examAttempts = [];
      if (lecture.exam && selectedExam) {
        examAttempts.push({
          lectureIndex: lectureIndex,
          examId: lecture.exam._id,
          attemptId: selectedExam.attemptId,
          score: selectedExam.score || 100, // Default score for passed exam
          passed: true
        });
      }

      // Update progress on server
      await updateCourseProgress(id, {
        lectureProgress: lectureProgressArray,
        examAttempts: examAttempts
      });

      toast.success('Quiz completed! Next lecture unlocked.');
    } catch (err) {
      toast.error('Failed to update quiz progress');
      // Revert on error
      setLectureProgress(prev => ({
        ...prev,
        [lectureIndex]: { ...prev[lectureIndex], quizPassed: false }
      }));
    }
  };

  const handleTakeExam = (lectureExam) => {
    console.log('handleTakeExam called with:', lectureExam);
    console.log('courseExams:', courseExams);
    
    // Check if lectureExam has an _id
    if (!lectureExam || !lectureExam._id) {
      console.error('Lecture exam missing _id:', lectureExam);
      toast.error('Invalid exam data. Please try refreshing the page.');
      return;
    }
    
    // Find the complete exam data from courseExams
    const completeExam = courseExams.find(exam => exam._id === lectureExam._id);
    console.log('Found complete exam:', completeExam);
    
    if (!completeExam) {
      console.error('Exam not found in courseExams. Available exams:', courseExams.map(e => ({ id: e._id, title: e.title })));
      toast.error('Exam data not found. Please try refreshing the page.');
      return;
    }
    setSelectedExam(completeExam);
    setShowWarningModal(true);
  };

  const handleProceedWithExam = async () => {
    setShowWarningModal(false);
    
    console.log('handleProceedWithExam called with selectedExam:', selectedExam);
    
    if (!selectedExam || !selectedExam._id) {
      console.error('Selected exam is missing _id:', selectedExam);
      toast.error('Invalid exam data. Please try again.');
      return;
    }
    
    try {
      const browserInfo = examService.getBrowserInfo();
      console.log('Starting exam attempt with exam ID:', selectedExam._id);
      const response = await examService.startExamAttempt(selectedExam._id, browserInfo);
      
      const examData = {
        attemptId: response.data.attemptId,
        timeLimit: response.data.timeLimit,
        questions: response.data.questions,
        antiCheat: response.data.antiCheat,
        courseId: id,
        lectureIndex: course.lectures.findIndex(l => l.exam?._id === selectedExam._id)
      };

      sessionStorage.setItem('currentExamData', JSON.stringify(examData));
      navigate(`/exams/take/${response.data.attemptId}`);
    } catch (error) {
      toast.error(error.message || 'Failed to start exam');
    }
  };

  // Listen for exam completion
  useEffect(() => {
    const handleExamCompletion = (event) => {
      if (event.data.type === 'EXAM_COMPLETED' && event.data.courseId === id) {
        const lectureIndex = event.data.lectureIndex;
        const examData = event.data.examData;
        
        if (lectureIndex !== undefined) {
          // Store exam data for the markQuizPassed function
          setSelectedExam(examData);
          markQuizPassed(lectureIndex);
        }
      }
    };

    window.addEventListener('message', handleExamCompletion);
    return () => window.removeEventListener('message', handleExamCompletion);
  }, [id, markQuizPassed]);

  const handleViewContent = (content) => {
    setSelectedContent(content);
    setShowContentModal(true);
  };

  const calculateProgress = useMemo(() => {
    if (!course?.lectures?.length) return 0;
    const completedCount = Object.entries(lectureProgress).filter(([index, progress]) => {
      const lectureIndex = parseInt(index);
      const lecture = course.lectures[lectureIndex];
      return progress.completed && (!lecture?.exam || progress.quizPassed);
    }).length;
    return Math.round((completedCount / course.lectures.length) * 100);
  }, [course?.lectures, lectureProgress]);

  const getLectureStatus = (lectureIndex) => {
    const progress = lectureProgress[lectureIndex];
    if (progress?.completed && progress?.quizPassed) return 'completed';
    if (progress?.completed) return 'content-completed';
    if (!!enrollment) return 'unlocked';
    return 'locked';
  };

    const renderLectureContent = (lecture, lectureIndex) => {
    const status = getLectureStatus(lectureIndex);
    const isExpanded = expandedLectures.has(lectureIndex);
    const hasContent = lecture.content && lecture.content.length > 0;
    const hasExam = lecture.exam;
    
    if (hasExam) {
      console.log(`Lecture ${lectureIndex} exam:`, lecture.exam);
    }

    return (
      <div key={lectureIndex} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg">
        {/* Lecture Header */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {status === 'completed' && (
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                )}
                {status === 'content-completed' && (
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-blue-500" />
                  </div>
                )}
                {status === 'unlocked' && (
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-primary" />
                  </div>
                )}
                {status === 'locked' && (
                  <div className="w-10 h-10 bg-gray-500/20 rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Lecture Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {lecture.title || `Lecture ${lectureIndex + 1}`}
                  </h3>
                  {status === 'locked' && (
                    <span className="px-2 py-1 bg-gray-500/20 text-gray-500 text-xs rounded-full">
                      {!enrollment ? 'Enroll to Access' : 'Locked'}
                    </span>
                  )}
                  {status === 'content-completed' && (
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-500 text-xs rounded-full">
                      Content Complete
                    </span>
                  )}
                  {status === 'completed' && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs rounded-full">
                      Complete
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-foreground/60">
                  {lecture.estimatedDuration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{lecture.estimatedDuration} min</span>
                    </div>
                  )}
                  {hasContent && (
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{lecture.content.length} items</span>
                    </div>
                  )}
                  {hasExam && (
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      <span>Quiz Required</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Expand/Collapse Button */}
            {status !== 'locked' && (
              <button
                onClick={() => toggleLectureExpansion(lectureIndex)}
                className="p-2 hover:bg-accent/50 rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && status !== 'locked' && (
          <div className="border-t border-border/50 bg-background/30">
            {/* Content Items */}
            {hasContent && (
              <div className="p-6 space-y-4">
                {/* Editable Lecture Description display */}
                {lecture.description && (
                  <div className="mb-4">
                    <h4 className="font-medium text-foreground/80">Overview</h4>
                    <p className="text-sm text-foreground/70 whitespace-pre-wrap">{lecture.description}</p>
                  </div>
                )}
                <h4 className="font-medium text-foreground/80">Content</h4>
                <div className="space-y-3">
                  {lecture.content.map((content, contentIndex) => (
                    <div key={contentIndex} className="flex items-center justify-between p-4 bg-card/50 rounded-xl border border-border/30">
                      <div className="flex items-center gap-3">
                        {content.type === 'video' ? (
                          <Video className="w-5 h-5 text-blue-500" />
                        ) : content.type === 'pdf' ? (
                          <File className="w-5 h-5 text-red-500" />
                        ) : (
                          <FileText className="w-5 h-5 text-foreground/60" />
                        )}
                        <div>
                          <h5 className="font-medium text-sm">{content.title}</h5>
                          <p className="text-xs text-foreground/60">
                            {content.type === 'video' ? 'Video' : content.type === 'pdf' ? 'PDF Document' : 'Content'}
                            {content.duration && ` • ${Math.floor(content.duration / 60)}:${(content.duration % 60).toString().padStart(2, '0')}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewContent(content)}
                        className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
                
                                 {/* Mark Complete Button */}
                 {status === 'unlocked' && (
                   <button
                     onClick={() => markLectureComplete(lectureIndex)}
                     className="w-full mt-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                   >
                     Mark as Complete
                   </button>
                 )}
                 
                 {/* Quiz is optional for unlocking lectures */}
              </div>
            )}

            {/* Quiz Section */}
            {hasExam && (
              <div className="p-6 border-t border-border/50 bg-accent/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground/80 mb-2">Quiz</h4>
                    {lectureProgress[lectureIndex]?.quizPassed ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <p className="text-sm text-green-600">Quiz completed!</p>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground/60">
                        Complete this quiz to unlock the next lecture
                      </p>
                    )}
                  </div>
                  {lectureProgress[lectureIndex]?.quizPassed ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">Completed</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleTakeExam(lecture.exam)}
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                    >
                      Take Quiz
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Auto Quiz Section (separate system) */}
            {lecture.autoQuizEnabled !== false && Array.isArray(lecture.autoQuiz) && lecture.autoQuiz.length >= 5 && (
              <div className="p-6 border-t border-border/50 bg-primary/5">
                <h4 className="font-medium text-foreground/80 mb-2">Auto Quiz</h4>
                <p className="text-xs text-foreground/60 mb-4">Answer all questions correctly to mark this lecture complete. Up to 5 attempts allowed.</p>
                {/* Simple inline renderer; full behavior handled in ModernLectureViewer */}
                <button
                  onClick={() => navigate(`/courses/${id}/lecture/${lectureIndex}`)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >Start Auto Quiz</button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/20 text-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-card/50 rounded-lg w-1/3"></div>
            <div className="h-64 bg-card/50 rounded-2xl"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-card/50 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/20 text-foreground">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Course Not Found</h2>
            <p className="text-foreground/60 mb-4">{error || '—'}</p>
            <button
              onClick={() => navigate('/courses')}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = calculateProgress;

  return (
    <>
      <UniversalTopBar />
      <CourseThreeJSBackground />
      <section className="relative min-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20">
        {/* Glass morphism overlay */}
        <div className="absolute inset-0 bg-white/10 dark:bg-black/20 backdrop-blur-[1px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Course Header */}
        <div className="mb-8">
          <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
            {/* Course Title and Info */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl backdrop-blur-sm">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                      {course.title}
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-foreground/60">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{course.teacher?.name || 'Unknown Teacher'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.lectures?.length || 0} Lectures</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.enrolledCount || 0} Students</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-foreground/70 text-lg leading-relaxed mb-6">
                  {course.description}
                </p>

                {/* Course Tags */}
                {course.tags && course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {course.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 lg:min-w-[200px]">
                {(user?.role === 'Teacher' || user?.role === 'Admin') && (
                  <button
                    onClick={() => navigate(`/courses/${id}/admin`)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-500/30 transition-all duration-300 backdrop-blur-sm"
                  >
                    Admin View
                  </button>
                )}

                {!enrollment && (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {enrolling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Enroll Now
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Progress Section */}
        {enrollment && (
          <div className="mb-8">
            <div className="bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Course Progress</h3>
                    <p className="text-sm text-foreground/60">Keep up the great work!</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{progress}%</div>
                  <div className="text-xs text-foreground/60">Complete</div>
                </div>
              </div>

              <div className="relative">
                <div className="w-full bg-white/20 dark:bg-black/20 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 h-4 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-foreground/50 mt-2">
                  <span>Started</span>
                  <span>In Progress</span>
                  <span>Completed</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Lectures Section */}
          <div className="lg:col-span-3">
            <div className="bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-white/20 dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl">
                    <PlayCircle className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Course Content</h2>
                    <p className="text-sm text-foreground/60">{course.lectures?.length || 0} lectures available</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {course.lectures?.length > 0 ? (
                  <StudentLectureList
                    course={course}
                    enrollment={enrollment}
                    lectureProgress={lectureProgress}
                    expandedLectures={expandedLectures}
                    toggleLectureExpansion={toggleLectureExpansion}
                    markLectureComplete={markLectureComplete}
                    handleViewContent={setSelectedContent}
                    handleTakeExam={handleTakeExam}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-2xl w-fit mx-auto mb-4">
                      <BookOpen className="w-16 h-16 text-foreground/40" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Content Available</h3>
                    <p className="text-foreground/60">This course doesn't have any lectures yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Course Stats Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Course Stats</h3>
                  <p className="text-sm text-foreground/60">Your progress</p>
                </div>
              </div>

              <StudentCourseStats course={course} enrollment={enrollment} progress={progress} />
            </div>
          </div>
        </div>
        </div>

        {/* Content Modal */}
      {showContentModal && selectedContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">{selectedContent.title}</h3>
              <button
                onClick={() => setShowContentModal(false)}
                className="text-foreground/60 hover:text-foreground"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {selectedContent.type === 'video' ? (
              <div className="space-y-4">
                <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
                  {selectedContent.url ? (
                    (() => {
                      const url = selectedContent.url;
                      let embedUrl = url;
                      let isValidVideo = false;

                      // Handle YouTube URLs
                      if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
                        const videoId = url.includes('youtube.com/watch')
                          ? url.split('v=')[1]?.split('&')[0]
                          : url.split('youtu.be/')[1]?.split('?')[0];

                        if (videoId) {
                          embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&showinfo=0&controls=1&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=0`;
                          isValidVideo = true;
                        }
                      }
                      // Handle Vimeo URLs
                      else if (url.includes('vimeo.com/')) {
                        const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
                        if (videoId && !isNaN(videoId)) {
                          embedUrl = `https://player.vimeo.com/video/${videoId}`;
                          isValidVideo = true;
                        }
                      }
                      // Handle direct video URLs (mp4, webm, etc.)
                      else if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
                        return (
                          <video
                            controls
                            className="w-full h-full"
                            preload="metadata"
                          >
                            <source src={url} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        );
                      }
                      // For other URLs, try as iframe
                      else {
                        embedUrl = url;
                        isValidVideo = true;
                      }

                      return isValidVideo ? (
                        <iframe
                          src={embedUrl}
                          title={selectedContent.title}
                          className="w-full h-full border-0"
                          allowFullScreen
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-white">
                          <div className="text-center">
                            <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg mb-2">Unable to load video</p>
                            <p className="text-sm opacity-75">Invalid video URL format</p>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline mt-2 inline-block"
                            >
                              Open in new tab
                            </a>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <div className="text-center">
                        <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No video URL provided</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{selectedContent.title}</h3>
                  <a 
                    href={selectedContent.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary hover:underline text-sm inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in new tab
                  </a>
                </div>
              </div>
            ) : selectedContent.type === 'pdf' ? (
              <div className="space-y-4">
                <div className="aspect-[4/3] bg-gray-100 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">PDF Document</p>
                    <a
                      href={selectedContent.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 inline-flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Open PDF
                    </a>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">{selectedContent.title}</h4>
                  <a href={selectedContent.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                    {selectedContent.url}
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-accent/20 rounded-xl p-4">
                  <h4 className="font-medium">{selectedContent.title}</h4>
                  <p className="text-sm text-foreground/60 mt-2">
                    <a href={selectedContent.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {selectedContent.url}
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exam Warning Modal */}
      {showWarningModal && selectedExam && (
        <ExamWarningModal
          exam={selectedExam}
          onProceed={handleProceedWithExam}
          onCancel={() => {
            setShowWarningModal(false);
            setSelectedExam(null);
          }}
        />
      )}

        {/* Child Lock Modal */}
        <ChildLockModal
          isOpen={showChildLockModal}
          onClose={() => setShowChildLockModal(false)}
          onVerify={handleChildLockVerify}
          feature="course_enrollment"
        />
      </section>
    </>
  );
}