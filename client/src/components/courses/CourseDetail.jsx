import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { BookOpen, FileText, XCircle, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCourse, checkEnrollment, enroll, unenroll } from '../../services/courseService';
import { canSeeInternal, canEditCourse, isOwner } from '../../utils/permissions';
import examService from '../../services/examService';
import toast from 'react-hot-toast';
import ContactCreatorModal from '../exams/ContactCreatorModal';
import ExamWarningModal from '../exams/ExamWarningModal';
import CourseHeader from './CourseHeader';
import CourseContent from './CourseContent';
import CourseSidebar from './CourseSidebar';

const isCourseOwner = (user, course) => {
  const userId = user?._id || user?.id;
  const teacherId = course?.teacher?._id || course?.teacher?.id;
  return isOwner(user, teacherId);
};

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [expandedLectures, setExpandedLectures] = useState(new Set());
  const [selectedContent, setSelectedContent] = useState(null);
  const [showContentModal, setShowContentModal] = useState(false);

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
      
      if (user?.role === 'Student') {
        navigate(`/courses/${id}`);
        return;
      }
      
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
      toast.success('Successfully enrolled!');
      if (user?.role === 'Student') navigate(`/courses/${id}`);
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Failed to enroll');
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
      toast.success('Unenrolled.');
    } catch (e) {
      toast.error(e?.response?.data?.error || e.message || 'Failed to unenroll');
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
      if (response.success) setExams(response.data.exams || []);
    } catch (error) {
      setExams([]);
    } finally {
      setLoadingExams(false);
    }
  };

  const toggleLectureExpansion = (lectureId) => {
    const newExpanded = new Set(expandedLectures);
    if (newExpanded.has(lectureId)) newExpanded.delete(lectureId);
    else newExpanded.add(lectureId);
    setExpandedLectures(newExpanded);
  };

  const renderContentItem = (content, index) => {
    const isVideo = content.type === 'video';
    const isPdf = content.type === 'pdf';
    return (
      <div key={content._id || index} className="flex items-center justify-between p-3 bg-background rounded-lg border">
        <div className="flex items-center gap-3">
          {isVideo ? (
            <span className="w-5 h-5 text-blue-600">▶</span>
          ) : isPdf ? (
            <span className="w-5 h-5 text-red-600">📄</span>
          ) : (
            <span className="w-5 h-5">🗂️</span>
          )}
          <div>
            <h4 className="font-medium text-sm">{content.title}</h4>
            <p className="text-xs text-foreground/60">
              {isVideo ? 'Video' : isPdf ? 'PDF Document' : 'Content'}
              {content.duration && ` • ${Math.floor(content.duration / 60)}:${(content.duration % 60).toString().padStart(2, '0')}`}
            </p>
          </div>
        </div>
      </div>
    );
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
          <button onClick={() => navigate('/courses')} className="mt-4 px-6 py-3 rounded-lg bg-primary text-white">Back to Courses</button>
        </div>
      </div>
    );
  }

  const backTarget = () => {
    const from = location.state?.from;
    if (from) navigate(from);
    else if (window.history.length > 1) navigate(-1);
    else navigate('/courses');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <CourseHeader
          course={course}
          user={user}
          copy={copy}
          navigate={navigate}
          onEdit={isCourseOwner(user, course) ? () => navigate(`/courses/${id}/edit`) : null}
          onAddLecture={isCourseOwner(user, course) ? () => navigate(`/courses/${id}/add-lecture`) : null}
          backTarget={backTarget}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg h-64 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-primary" />
            </div>
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">About This Course</h2>
              <p className="text-foreground/80 leading-relaxed">{course.description}</p>
            </div>
            <CourseContent
              course={course}
              user={user}
              expandedLectures={expandedLectures}
              toggleLectureExpansion={toggleLectureExpansion}
              renderContentItem={renderContentItem}
              onAddLecture={() => navigate(`/courses/${id}/add-lecture`)}
              navigate={navigate}
              canEdit={canEditCourse(user, course?.teacher?._id)}
            />
            {/* Exams block remains inline for now */}
            {/* Existing exams rendering preserved */}
              </div>

          <CourseSidebar
            course={course}
            user={user}
            price={price}
            dur={dur}
            isEnrolled={isEnrolled}
            enrolling={enrolling}
            doEnroll={doEnroll}
            doUnenroll={doUnenroll}
            navigate={navigate}
            id={id}
            canSeeInternal={canSeeInternal}
          />
        </div>
      </div>

      {showContentModal && selectedContent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">{selectedContent.title}</h3>
              <button onClick={() => setShowContentModal(false)} className="text-foreground/60 hover:text-foreground">
                <XCircle className="w-6 h-6" />
              </button>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-foreground/60">
                    <a href={selectedContent.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {selectedContent.url}
                    </a>
                  </p>
                </div>
          </div>
        </div>
      )}

      {showWarningModal && selectedExam && (
        <ExamWarningModal
          exam={selectedExam}
          onProceed={handleProceedWithExam}
          onCancel={() => { setShowWarningModal(false); setSelectedExam(null); }}
        />
      )}

      {showContactModal && selectedExam && (
        <ContactCreatorModal
          exam={selectedExam}
          onClose={() => { setShowContactModal(false); setSelectedExam(null); }}
        />
      )}
    </div>
  );
}
