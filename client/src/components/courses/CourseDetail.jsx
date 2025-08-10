import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, User, Tag, DollarSign, Clock, ArrowLeft, Play, Lock, Copy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getCourse, checkEnrollment, enroll, unenroll } from '../../services/courseService';

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

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

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
    </div>
  );
}
