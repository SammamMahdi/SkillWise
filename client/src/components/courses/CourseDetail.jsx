import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, User, Tag, DollarSign, Clock, ArrowLeft, Play, Lock, Copy, Plus, FileText, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCourse, checkEnrollment, enroll, unenroll } from '../../services/courseService';
import examService from '../../services/examService';
import toast from 'react-hot-toast';
import ContactCreatorModal from '../exams/ContactCreatorModal';
import ExamWarningModal from '../exams/ExamWarningModal';

const canSeeInternal = (user) => user?.role === 'Teacher' || user?.role === 'Admin';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  useEffect(() => {
    load();
    loadExams();
    /* eslint-disable-next-line */
  }, [id]);

  async function load() {
    try {
      setLoading(true);
      const res = await getCourse(id);
      const c = res.course || res.data || res;
      setCourse(c);
      if (user) {
        const ok = await checkEnrollment(id, localStorage.getItem('token'));
        setIsEnrolled(ok);
      }
    } catch (e) {
      setErr(e.message || 'Failed to fetch course');
    } finally {
      setLoading(false);
    }
  }

  const doEnroll = async () => {
    try {
      setEnrolling(true);
      await enroll(id, localStorage.getItem('token'));
      setIsEnrolled(true);
      alert('Successfully enrolled!');
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const doUnenroll = async () => {
    if (!confirm('Unenroll from this course?')) return;
    try {
      setEnrolling(true);
      await unenroll(id, localStorage.getItem('token'));
      setIsEnrolled(false);
      alert('Unenrolled.');
    } catch (e) {
      alert(e?.response?.data?.error || e.message || 'Failed to unenroll');
    } finally {
      setEnrolling(false);
    }
  };

  const copy = async (text) => { try { await navigator.clipboard.writeText(text); } catch {} };
  const price = (p) => (p === 0 ? 'Free' : `$${p}`);
  const dur = (lectures) => {
    const total = (lectures || []).reduce((sum, l) => {
      const secs = (l.content || []).reduce((s, c) => s + (c.duration || 0), 0);
      return sum + secs;
    }, 0);
    if (!total) return 'No lectures';
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return h ? `${h}h ${m}m` : `${m}m`;
  };

  const loadExams = async () => {
    try {
      setLoadingExams(true);
      const response = await examService.getCourseExams(id);
      if (response.success) {
        setExams(response.data.exams || []);
      }
    } catch (error) {
      console.error('Failed to load exams:', error);
      setExams([]);
    } finally {
      setLoadingExams(false);
    }
  };

  const canCreateExam = () => {
    return (user?.role === 'Teacher' || user?.role === 'Admin') &&
           course?.instructor?._id === user?.id;
  };

  const handleCreateExam = () => {
    // Navigate to create exam form for this specific course
    navigate(`/courses/${id}/create-exam`);
  };

  const handleTakeExam = (exam) => {
    if (!exam.canAttempt) {
      toast.error('You have reached the maximum number of attempts for this exam');
      return;
    }

    // Show warning modal first
    setSelectedExam(exam);
    setShowWarningModal(true);
  };

  const handleProceedWithExam = async () => {
    setShowWarningModal(false);

    console.log('=== COURSE DETAIL - STARTING EXAM ===');
    console.log('Exam data:', selectedExam);

    try {
      const browserInfo = examService.getBrowserInfo();
      console.log('Calling startExamAttempt API...');
      const response = await examService.startExamAttempt(selectedExam._id, browserInfo);
      console.log('API response:', response);

      // Store exam data in session storage for the exam interface
      const examData = {
        attemptId: response.data.attemptId,
        timeLimit: response.data.timeLimit,
        questions: response.data.questions,
        antiCheat: response.data.antiCheat
      };

      console.log('Storing exam data in sessionStorage:', examData);
      sessionStorage.setItem('currentExamData', JSON.stringify(examData));

      // Navigate to exam interface
      console.log('Navigating to exam interface:', `/exams/take/${response.data.attemptId}`);
      navigate(`/exams/take/${response.data.attemptId}`);

    } catch (error) {
      console.error('=== COURSE DETAIL - EXAM START ERROR ===');
      console.error('Error details:', error);
      toast.error(error.message || 'Failed to start exam');
    }
  };

  const handleContactCreator = (exam) => {
    setSelectedExam(exam);
    setShowContactModal(true);
  };

  const getExamStatusBadge = (exam) => {
    if (!exam.isPublished) {
      return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Not Published</span>;
    }

    // Show re-attempt status if applicable
    if (exam.reAttemptRequest) {
      if (exam.reAttemptRequest.status === 'approved' && exam.reAttemptRequest.newAttemptGranted && !exam.reAttemptRequest.newAttemptUsed) {
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Retake Approved</span>;
      } else if (exam.reAttemptRequest.status === 'pending') {
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Request Pending</span>;
      } else if (exam.reAttemptRequest.status === 'rejected') {
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Request Rejected</span>;
      }
    }

    if (exam.lastAttempt) {
      if (exam.lastAttempt.passed) {
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Passed</span>;
      } else {
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Failed</span>;
      }
    }

    return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Available</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-card rounded-lg mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-card rounded-lg" />
                <div className="h-32 bg-card rounded-lg" />
              </div>
              <div className="h-96 bg-card rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (err || !course) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto text-center">
          <BookOpen className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Course Not Found</h3>
          <p className="text-foreground/60">{err || '—'}</p>
          <button onClick={() => navigate('/courses')} className="mt-4 px-6 py-3 rounded-lg bg-primary text-white">
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate('/courses')} className="flex items-center gap-2 text-foreground/60 hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Courses
          </button>

          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-foreground/70 mt-1">{course.description}</p>

          <div className="mt-2 text-sm text-foreground/70 flex items-center gap-2">
            Public Code: <code>{course.publicCode || '—'}</code>
            {course.publicCode && <button className="opacity-70 hover:opacity-100" onClick={() => copy(course.publicCode)}><Copy className="w-3 h-3" /></button>}
          </div>
          {canSeeInternal(user) && course.courseCode && (
            <div className="text-sm text-foreground/70 flex items-center gap-2">
              Internal Code: <code>{course.courseCode}</code>
              <button className="opacity-70 hover:opacity-100" onClick={() => copy(course.courseCode)}><Copy className="w-3 h-3" /></button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg h-64 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-primary" />
            </div>

            {/* About */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">About This Course</h2>
              <p className="text-foreground/80 leading-relaxed">{course.description}</p>
            </div>

            {/* Content */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Course Content</h2>
                <div className="text-xs text-foreground/70">
                  Lectures: {course.lectures?.length || 0}
                </div>
              </div>

              {course.lectures?.length ? (
                <div className="space-y-3">
                  {course.lectures.map((lec, i) => (
                    <div key={lec._id || i} className="flex items-center justify-between p-4 bg-background rounded-lg">
                      <div className="flex items-center gap-3">
                        {lec.isLocked ? <Lock className="w-5 h-5 text-foreground/40" /> : <Play className="w-5 h-5 text-primary" />}
                        <div>
                          <h3 className="font-medium">{lec.title || `Lecture ${i + 1}`}</h3>
                          <p className="text-sm text-foreground/60">
                            {lec.isExam ? 'Exam' : 'Lecture'}
                            {canSeeInternal(user) && lec.lectureCode && (
                              <> • Internal: <code>{lec.lectureCode}</code></>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-foreground/60">{lec.content?.length || 0} items</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                  <p className="text-foreground/60">No lectures available yet.</p>
                </div>
              )}
            </div>

            {/* Exams */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Exams</h2>
                <div className="flex items-center space-x-4">
                  <div className="text-xs text-foreground/70">
                    Exams: {exams.length}
                  </div>
                  {canCreateExam() && (
                    <button
                      onClick={handleCreateExam}
                      className="bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Exam</span>
                    </button>
                  )}
                </div>
              </div>

              {loadingExams ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : exams.length > 0 ? (
                <div className="space-y-3">
                  {exams.map((exam) => (
                    <div key={exam._id} className="bg-background rounded-lg border border-border">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <h3 className="font-medium">{exam.title}</h3>
                            <p className="text-sm text-foreground/60">
                              {exam.timeLimit}m • {exam.questions?.length || 0} questions • {exam.totalPoints} points
                              {exam.teacher?.role && (
                                <> • Created by {exam.teacher.role}</>
                              )}
                            </p>
                            {exam.lastAttempt && (
                              <p className="text-xs text-foreground/50 mt-1">
                                Last attempt: {exam.lastAttempt.score || 0} points • {exam.lastAttempt.passed ? 'Passed' : 'Failed'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getExamStatusBadge(exam)}
                          {user?.role === 'Student' && exam.isPublished && (
                            <button
                              onClick={() => handleContactCreator(exam)}
                              className="border border-border text-foreground px-3 py-1 rounded text-sm hover:bg-accent transition-colors flex items-center space-x-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Contact Creator</span>
                            </button>
                          )}
                          {user?.role === 'Student' && exam.isPublished && exam.canAttempt && (
                            <button
                              onClick={() => handleTakeExam(exam)}
                              className={`px-3 py-1 rounded text-sm transition-colors ${
                                exam.isRetake
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
                              }`}
                            >
                              {exam.isRetake ? 'Retake Exam' : 'Take Exam'}
                            </button>
                          )}
                          {user?.role === 'Student' && exam.lastAttempt && (
                            <button
                              onClick={() => navigate(`/exams/results/${exam.lastAttempt.attemptId || exam.lastAttempt._id}`)}
                              className="bg-secondary text-secondary-foreground px-3 py-1 rounded text-sm hover:bg-secondary/90 transition-colors"
                            >
                              View Results
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Show re-attempt request information */}
                      {user?.role === 'Student' && exam.reAttemptRequest && (
                        <div className="border-t border-border p-4 bg-accent/20">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-foreground mb-2">
                                Re-attempt Request Status
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center space-x-2">
                                  <span className="text-foreground/60">Status:</span>
                                  <span className={`font-medium ${
                                    exam.reAttemptRequest.status === 'approved' ? 'text-green-600' :
                                    exam.reAttemptRequest.status === 'rejected' ? 'text-red-600' :
                                    'text-yellow-600'
                                  }`}>
                                    {exam.reAttemptRequest.status.charAt(0).toUpperCase() + exam.reAttemptRequest.status.slice(1)}
                                  </span>
                                </div>
                                {exam.reAttemptRequest.creatorResponse && (
                                  <div>
                                    <span className="text-foreground/60">Instructor Response:</span>
                                    <p className="text-foreground mt-1 p-2 bg-background rounded border">
                                      {exam.reAttemptRequest.creatorResponse}
                                    </p>
                                  </div>
                                )}
                                {exam.reAttemptRequest.reviewedAt && (
                                  <div className="text-xs text-foreground/50">
                                    Reviewed on {new Date(exam.reAttemptRequest.reviewedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                  <p className="text-foreground/60">
                    {canCreateExam()
                      ? 'No exams created yet. Create your first exam!'
                      : 'No exams available for this course yet.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">{price(course.price)}</span>
                {course.price === 0 && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">Free</span>
                )}
              </div>

              {user?.role === 'Student' && (
                <button
                  onClick={isEnrolled ? doUnenroll : doEnroll}
                  disabled={enrolling}
                  className={`w-full mt-4 py-3 px-4 rounded-lg font-medium transition-colors ${
                    isEnrolled ? 'bg-rose-500 hover:bg-rose-600' : 'bg-primary hover:bg-primary/80'
                  } text-white disabled:opacity-50`}
                >
                  {enrolling ? (isEnrolled ? 'Unenrolling…' : 'Enrolling…') : (isEnrolled ? 'Unenroll' : 'Enroll')}
                </button>
              )}

              {isEnrolled && (
                <button
                  onClick={() => navigate('/learning')}
                  className="w-full mt-3 py-3 px-4 bg-background border border-border rounded-lg hover:bg-foreground/5"
                >
                  Continue Learning
                </button>
              )}

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-foreground/60">Instructor</span>
                  <span className="font-medium">{course.teacher?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground/60">Duration</span>
                  <span className="font-medium">{dur(course.lectures)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground/60">Lectures</span>
                  <span className="font-medium">{course.lectures?.length || 0}</span>
                </div>
              </div>
            </div>

            {course.tags?.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {course.tags.map((t, i) => (
                    <span key={`${t}-${i}`} className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* show internal code again for admins/teachers */}
            {canSeeInternal(user) && course.courseCode && (
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-sm text-foreground/70 flex items-center gap-2">
                  Internal Course Code: <code>{course.courseCode}</code>
                  <button className="opacity-70 hover:opacity-100" onClick={() => copy(course.courseCode)}><Copy className="w-3 h-3" /></button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Modals */}
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

      {showContactModal && selectedExam && (
        <ContactCreatorModal
          exam={selectedExam}
          onClose={() => {
            setShowContactModal(false);
            setSelectedExam(null);
          }}
        />
      )}
    </div>
  );
}
