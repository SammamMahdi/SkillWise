import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, User, Tag, DollarSign, Clock, Star, ArrowLeft, Play, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch course details');
      }

      setCourse(data.data);
      
      // Check if user is enrolled
      if (user) {
        checkEnrollmentStatus();
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching course details:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      const response = await fetch(`/api/learning/courses/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        setIsEnrolled(true);
      }
    } catch (error) {
      console.error('Error checking enrollment status:', error);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      const response = await fetch(`/api/learning/courses/${id}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to enroll in course');
      }

      setIsEnrolled(true);
      alert('Successfully enrolled in course!');
    } catch (err) {
      alert(err.message);
      console.error('Error enrolling in course:', err);
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (!confirm('Are you sure you want to unenroll from this course?')) {
      return;
    }

    try {
      setEnrolling(true);
      const response = await fetch(`/api/learning/courses/${id}/enroll`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to unenroll from course');
      }

      setIsEnrolled(false);
      alert('Successfully unenrolled from course!');
    } catch (err) {
      alert(err.message);
      console.error('Error unenrolling from course:', err);
    } finally {
      setEnrolling(false);
    }
  };

  const formatPrice = (price) => {
    return price === 0 ? 'Free' : `$${price}`;
  };

  const formatDuration = (lectures) => {
    if (!lectures || lectures.length === 0) return 'No lectures';
    const totalDuration = lectures.reduce((sum, lecture) => {
      const lectureDuration = lecture.content?.reduce((lectureSum, content) => {
        return lectureSum + (content.duration || 0);
      }, 0) || 0;
      return sum + lectureDuration;
    }, 0);
    
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-card rounded-lg mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-card rounded-lg"></div>
                <div className="h-32 bg-card rounded-lg"></div>
              </div>
              <div className="h-96 bg-card rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Course Not Found</h3>
            <p className="text-foreground/60">{error}</p>
            <button
              onClick={() => navigate('/courses')}
              className="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/courses')}
            className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </button>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">{course.title}</h1>
          <p className="text-foreground/60">{course.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Image */}
            <div className="bg-gradient-to-br from-primary/20 to-primary/40 rounded-lg h-64 flex items-center justify-center">
              <BookOpen className="w-16 h-16 text-primary" />
            </div>

            {/* Course Description */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">About This Course</h2>
              <p className="text-foreground/80 leading-relaxed">{course.description}</p>
            </div>

            {/* Course Content */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Course Content</h2>
              
              {course.lectures && course.lectures.length > 0 ? (
                <div className="space-y-3">
                  {course.lectures.map((lecture, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-background rounded-lg">
                      <div className="flex items-center gap-3">
                        {lecture.isLocked ? (
                          <Lock className="w-5 h-5 text-foreground/40" />
                        ) : (
                          <Play className="w-5 h-5 text-primary" />
                        )}
                        <div>
                          <h3 className="font-medium text-foreground">
                            {lecture.title || `Lecture ${index + 1}`}
                          </h3>
                          <p className="text-sm text-foreground/60">
                            {lecture.isExam ? 'Exam' : 'Lecture'}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-foreground/60">
                        {lecture.content?.length || 0} items
                      </div>
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
          <div className="space-y-6">
            {/* Course Info Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(course.price)}
                  </span>
                  {course.price === 0 && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                      Free
                    </span>
                  )}
                </div>

                {user?.role === 'Student' && (
                  <button
                    onClick={isEnrolled ? handleUnenroll : handleEnroll}
                    disabled={enrolling}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      isEnrolled
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-primary text-white hover:bg-primary/80'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {enrolling ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        {isEnrolled ? 'Unenrolling...' : 'Enrolling...'}
                      </div>
                    ) : (
                      isEnrolled ? 'Unenroll from Course' : 'Enroll in Course'
                    )}
                  </button>
                )}

                {isEnrolled && (
                  <button
                    onClick={() => navigate('/learning')}
                    className="w-full py-3 px-4 bg-background border border-border rounded-lg text-foreground hover:bg-foreground/5 transition-colors"
                  >
                    Continue Learning
                  </button>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-foreground/60">Instructor</span>
                  <span className="font-medium text-foreground">
                    {course.teacher?.name || 'Unknown Instructor'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-foreground/60">Duration</span>
                  <span className="font-medium text-foreground">
                    {formatDuration(course.lectures)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-foreground/60">Lectures</span>
                  <span className="font-medium text-foreground">
                    {course.lectures?.length || 0}
                  </span>
                </div>

                {course.tags && course.tags.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/60">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {course.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instructor Info */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Instructor</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">
                    {course.teacher?.name || 'Unknown Instructor'}
                  </h4>
                  <p className="text-sm text-foreground/60">
                    {course.teacher?.email || 'No email available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
