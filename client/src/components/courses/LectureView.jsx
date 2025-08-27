import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, CheckCircle, Clock, Award, Video, File, FileText, 
  BookOpen, User, Calendar, TrendingUp, Sparkles, Star, XCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCourse, checkEnrollment } from '../../services/courseService';
import { getEnrolledCourseDetails, updateCourseProgress } from '../../services/learningService';
import examService from '../../services/examService';
import toast from 'react-hot-toast';
import UniversalTopBar from '../common/UniversalTopBar';
import CourseThreeJSBackground from './CourseThreeJSBackground';
import ExamWarningModal from '../exams/ExamWarningModal';
import ChildLockModal from '../common/ChildLockModal';

const LectureView = () => {
  const { courseId, lectureIndex } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [lecture, setLecture] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [lectureProgress, setLectureProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showChildLockModal, setShowChildLockModal] = useState(false);

  useEffect(() => {
    loadLectureData();
  }, [courseId, lectureIndex]);

  const loadLectureData = async () => {
    try {
      setLoading(true);
      
      // Load course data
      const courseResponse = await getCourse(courseId);
      if (!courseResponse.success) {
        toast.error('Failed to load course');
        navigate('/courses');
        return;
      }

      setCourse(courseResponse.data);

      // Get the specific lecture
      const lectureIdx = parseInt(lectureIndex);
      const lectureData = courseResponse.data.lectures[lectureIdx];
      
      if (!lectureData) {
        toast.error('Lecture not found');
        navigate(`/courses/${courseId}`);
        return;
      }
      
      setLecture(lectureData);
      
      // Check enrollment
      const enrollmentResponse = await checkEnrollment(courseId);
      if (enrollmentResponse.success && enrollmentResponse.data.enrolled) {
        setEnrollment(enrollmentResponse.data);
        
        // Load progress
        const progressResponse = await getEnrolledCourseDetails(courseId);
        if (progressResponse.success) {
          setLectureProgress(progressResponse.data.lectureProgress || {});
        }
      }
      
    } catch (error) {
      console.error('Error loading lecture:', error);
      toast.error('Failed to load lecture');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = () => {
    const progress = lectureProgress[lectureIndex];
    if (progress?.completed && progress?.quizPassed) return 'completed';
    if (progress?.completed) return 'content-completed';
    if (!enrollment) return 'locked';
    if (parseInt(lectureIndex) === 0) return 'unlocked';
    const prevProgress = lectureProgress[parseInt(lectureIndex) - 1];
    return prevProgress?.completed && (!course.lectures[parseInt(lectureIndex) - 1]?.exam || prevProgress?.quizPassed) ? 'unlocked' : 'locked';
  };

  const handleViewContent = (content) => {
    setSelectedContent(content);
    setShowContentModal(true);
  };

  const handleTakeExam = (exam) => {
    if (user?.role === 'Student' && user?.childLock?.enabled) {
      setSelectedExam(exam);
      setShowChildLockModal(true);
    } else {
      proceedWithExam(exam);
    }
  };

  const handleChildLockVerify = () => {
    setShowChildLockModal(false);
    if (selectedExam) {
      proceedWithExam(selectedExam);
    }
  };

  const proceedWithExam = (exam) => {
    setSelectedExam(exam);
    setShowExamModal(true);
  };

  const handleProceedWithExam = async () => {
    try {
      setShowExamModal(false);
      
      const response = await examService.startExamAttempt(selectedExam._id, {
        courseId: courseId,
        lectureIndex: parseInt(lectureIndex)
      });
      
      if (response.success) {
        const attemptId = response.data.attemptId;
        navigate(`/exam/${attemptId}`);
      } else {
        toast.error(response.message || 'Failed to start exam');
      }
    } catch (error) {
      console.error('Error starting exam:', error);
      toast.error('Failed to start exam');
    }
  };

  const markLectureComplete = async () => {
    try {
      const response = await updateCourseProgress(courseId, parseInt(lectureIndex), 'completed');
      if (response.success) {
        setLectureProgress(prev => ({
          ...prev,
          [lectureIndex]: { ...prev[lectureIndex], completed: true }
        }));
        toast.success('Lecture marked as complete!');
      }
    } catch (error) {
      console.error('Error marking lecture complete:', error);
      toast.error('Failed to mark lecture as complete');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading lecture...</p>
        </div>
      </div>
    );
  }

  if (!course || !lecture) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Lecture Not Found</h2>
          <p className="text-foreground/60 mb-4">The requested lecture could not be found.</p>
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const status = getStatus();
  const hasContent = lecture.content && lecture.content.length > 0;
  const hasExam = lecture.exam;

  return (
    <>
      <UniversalTopBar />
      <CourseThreeJSBackground />
      <section className="relative min-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-blue-950/30 dark:to-purple-950/20">
        {/* Glass morphism overlay */}
        <div className="absolute inset-0 bg-white/10 dark:bg-black/20 backdrop-blur-[1px]" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Course</span>
          </button>

          {/* Lecture Header */}
          <div className="mb-8">
            <div className="bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
              <div className="flex items-start gap-6">
                {/* Status Icon */}
                <div className={`p-4 rounded-2xl backdrop-blur-sm border ${
                  status === 'completed' ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30' :
                  status === 'content-completed' ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30' :
                  status === 'unlocked' ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30' :
                  'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border-gray-500/30'
                }`}>
                  {status === 'completed' && <CheckCircle className="w-8 h-8 text-green-500" />}
                  {status === 'content-completed' && <Play className="w-8 h-8 text-blue-500" />}
                  {status === 'unlocked' && <Play className="w-8 h-8 text-primary" />}
                  {status === 'locked' && <BookOpen className="w-8 h-8 text-gray-500" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {lecture.title}
                    </h1>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      status === 'completed' ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                      status === 'content-completed' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                      status === 'unlocked' ? 'bg-primary/20 text-primary' :
                      'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                    }`}>
                      {status === 'completed' ? '✨ Complete' :
                       status === 'content-completed' ? '📚 Content Done' :
                       status === 'unlocked' ? '🚀 Available' :
                       '🔒 Locked'}
                    </span>
                  </div>

                  <p className="text-lg text-foreground/70 mb-4">
                    {lecture.description || 'Explore this comprehensive lesson designed to enhance your understanding.'}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-black/10 rounded-full">
                      <User className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">{course.teacher?.name || 'Instructor'}</span>
                    </div>
                    {lecture.estimatedDuration && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-black/10 rounded-full">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium">{lecture.estimatedDuration} min</span>
                      </div>
                    )}
                    {hasContent && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-black/10 rounded-full">
                        <FileText className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">{lecture.content.length} materials</span>
                      </div>
                    )}
                    {hasExam && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-black/10 rounded-full">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">Quiz Available</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          {hasContent && status !== 'locked' && (
            <div className="mb-8">
              <div className="bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl">
                    <FileText className="w-5 h-5 text-purple-500" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Course Materials</h2>
                </div>

                <div className="grid gap-4">
                  {lecture.content.map((content, contentIndex) => (
                    <div key={contentIndex} className="group flex items-center justify-between p-4 bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl backdrop-blur-sm ${
                          content.type === 'video' ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30' :
                          content.type === 'pdf' ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30' :
                          'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30'
                        }`}>
                          {content.type === 'video' ?
                            <Video className="w-6 h-6 text-blue-500" /> :
                            content.type === 'pdf' ?
                            <File className="w-6 h-6 text-red-500" /> :
                            <FileText className="w-6 h-6 text-foreground/60" />
                          }
                        </div>

                        <div>
                          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors duration-300">{content.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              content.type === 'video' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                              content.type === 'pdf' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                              'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                            }`}>
                              {content.type === 'video' ? '🎥 Video' : content.type === 'pdf' ? '📄 PDF' : '📝 Content'}
                            </span>
                            {content.duration && (
                              <span className="text-xs text-foreground/60">
                                • {Math.floor(content.duration / 60)}:{(content.duration % 60).toString().padStart(2, '0')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleViewContent(content)}
                        className="px-6 py-3 bg-gradient-to-r from-primary/20 to-purple-500/20 hover:from-primary/30 hover:to-purple-500/30 text-primary rounded-xl font-bold transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-primary/30"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quiz Section */}
          {hasExam && status !== 'locked' && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-yellow-500/5 to-orange-500/5 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 shadow-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl backdrop-blur-sm border border-yellow-500/30">
                      <Award className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground mb-1">Knowledge Quiz</h2>
                      {lectureProgress[lectureIndex]?.quizPassed ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">🎉 Quiz completed successfully!</p>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground/70">Test your understanding of this lecture</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {lectureProgress[lectureIndex]?.quizPassed ? (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30 backdrop-blur-sm">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400 font-bold">Completed</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleTakeExam(lecture.exam)}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 text-yellow-600 dark:text-yellow-400 rounded-2xl font-bold transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-yellow-500/30 flex items-center gap-2"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Take Quiz
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {status === 'unlocked' && (
            <div className="text-center">
              <div className="bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-white/10 p-8 shadow-2xl">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-foreground mb-2">Ready to Complete?</h3>
                    <p className="text-foreground/70">Mark this lecture as complete when you're done studying.</p>
                  </div>
                  <button
                    onClick={markLectureComplete}
                    className="px-12 py-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3"
                  >
                    <CheckCircle className="w-6 h-6" />
                    Mark as Complete
                  </button>
                </div>
              </div>
            </div>
          )}
        {/* Content Modal */}
        {showContentModal && selectedContent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-foreground">{selectedContent.title}</h3>
                <button
                  onClick={() => setShowContentModal(false)}
                  className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-xl transition-colors"
                >
                  <XCircle className="w-6 h-6 text-foreground/60 hover:text-foreground" />
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

                        if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
                          const videoId = url.includes('youtube.com/watch')
                            ? url.split('v=')[1]?.split('&')[0]
                            : url.split('youtu.be/')[1]?.split('?')[0];

                          if (videoId) {
                            embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&showinfo=0&controls=1&fs=1&cc_load_policy=0&iv_load_policy=3&autohide=0`;
                            isValidVideo = true;
                          }
                        } else if (url.includes('vimeo.com/')) {
                          const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
                          if (videoId && !isNaN(videoId)) {
                            embedUrl = `https://player.vimeo.com/video/${videoId}`;
                            isValidVideo = true;
                          }
                        } else if (url.match(/\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i) || url.startsWith('/uploads/')) {
                          const videoUrl = url.startsWith('/uploads/')
                            ? `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5001'}${url}`
                            : url;

                          return (
                            <video
                              controls
                              className="w-full h-full"
                              preload="metadata"
                            >
                              <source src={videoUrl} type="video/mp4" />
                              <source src={videoUrl} type="video/webm" />
                              <source src={videoUrl} type="video/ogg" />
                              Your browser does not support the video tag.
                            </video>
                          );
                        } else {
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
                </div>
              ) : selectedContent.type === 'pdf' ? (
                <div className="space-y-4">
                  <div className="aspect-[4/3] bg-black rounded-xl overflow-hidden relative">
                    {selectedContent.url ? (
                      <iframe
                        src={selectedContent.url.startsWith('/uploads')
                          ? `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5001'}${selectedContent.url}#toolbar=1&navpanes=1&scrollbar=1`
                          : selectedContent.url
                        }
                        title={selectedContent.title}
                        className="w-full h-full border-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white">
                        <div className="text-center">
                          <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg">No PDF URL provided</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center gap-3">
                    <a
                      href={selectedContent.url.startsWith('/uploads')
                        ? `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5001'}${selectedContent.url}`
                        : selectedContent.url
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                    >
                      <File className="w-4 h-4" />
                      Open in New Tab
                    </a>
                    <a
                      href={selectedContent.url.startsWith('/uploads')
                        ? `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5001'}${selectedContent.url}`
                        : selectedContent.url
                      }
                      download
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                    >
                      <File className="w-4 h-4" />
                      Download PDF
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-accent/20 rounded-xl p-4">
                    <h4 className="font-medium">{selectedContent.title}</h4>
                    <p className="text-sm text-foreground/60 mt-2">{selectedContent.description || 'No description available'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exam Warning Modal */}
        {showExamModal && selectedExam && (
          <ExamWarningModal
            exam={selectedExam}
            onProceed={handleProceedWithExam}
            onCancel={() => {
              setShowExamModal(false);
              setSelectedExam(null);
            }}
          />
        )}

        {/* Child Lock Modal */}
        <ChildLockModal
          isOpen={showChildLockModal}
          onClose={() => setShowChildLockModal(false)}
          onVerify={handleChildLockVerify}
          feature="exam_access"
        />
        </div>
      </section>
    </>
  );
};

export default LectureView;
