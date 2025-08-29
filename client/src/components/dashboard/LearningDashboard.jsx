import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';
import DashboardButton from '../common/DashboardButton';
import StudentGrades from '../grades/StudentGrades';

const LearningDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLearningDashboard();
  }, []);

  const fetchLearningDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/learning/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch learning dashboard');
      }

      setDashboardData(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching learning dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollCourse = () => {
    navigate('/courses');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'text-green-400';
    if (progress >= 60) return 'text-yellow-400';
    if (progress >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getProgressBarColor = (progress) => {
    if (progress >= 80) return 'bg-green-400';
    if (progress >= 60) return 'bg-yellow-400';
    if (progress >= 40) return 'bg-orange-400';
    return 'bg-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/20 text-foreground relative overflow-hidden">
        <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-10 py-8 sm:py-10 md:py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-card/50 rounded-lg mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-card/50 rounded-2xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-card/50 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/20 text-foreground relative overflow-hidden">
        <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-10 py-8 sm:py-10 md:py-12">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error</h2>
            <p className="text-foreground/80">{error}</p>
            <button
              onClick={fetchLearningDashboard}
              className="mt-4 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary font-semibold rounded-xl transition-all duration-300"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/20 text-foreground relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-primary/30 rounded-full animate-pulse-subtle"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-primary/20 rounded-full animate-float"></div>
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-primary/25 rounded-full animate-bounce-gentle"></div>
        <div className="absolute top-1/2 right-1/3 w-1 h-1 bg-primary/15 rounded-full animate-pulse-subtle"></div>
      </div>

      <div className="max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 lg:px-10 py-8 sm:py-10 md:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <DashboardButton variant="secondary" />
            
            {/* Theme Toggle */}
            <ThemeToggle size="md" />
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
              Learning Dashboard
            </h1>
            <p className="text-foreground/70 text-base sm:text-lg">
              Track your learning progress, enrolled courses, and achievements
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        {dashboardData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12 animate-fade-in">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-primary/20 shadow-lg group-hover:shadow-[0_8px_25px_rgba(124,58,237,0.15)] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mb-1">
                      {dashboardData.stats.totalEnrolledCourses}
                    </p>
                    <p className="text-xs sm:text-sm text-foreground/60">Enrolled</p>
                    <p className="text-xs sm:text-sm text-foreground/60">Courses</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-400/5 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-green-500/20 shadow-lg group-hover:shadow-[0_8px_25px_rgba(34,197,94,0.15)] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-400 mb-1">
                      {dashboardData.stats.completedCourses}
                    </p>
                    <p className="text-xs sm:text-sm text-foreground/60">Completed</p>
                    <p className="text-xs sm:text-sm text-foreground/60">Courses</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-400/5 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-blue-500/20 shadow-lg group-hover:shadow-[0_8px_25px_rgba(59,130,246,0.15)] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-400 mb-1">
                      {dashboardData.stats.totalSkillPosts}
                    </p>
                    <p className="text-xs sm:text-sm text-foreground/60">Skill</p>
                    <p className="text-xs sm:text-sm text-foreground/60">Posts</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-purple-400/5 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-purple-500/20 shadow-lg group-hover:shadow-[0_8px_25px_rgba(147,51,234,0.15)] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-400 mb-1">
                      {dashboardData.feedbackScore || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-foreground/60">Feedback</p>
                    <p className="text-xs sm:text-sm text-foreground/60">Score</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enrolled Courses Section */}
        <div className="mb-8 sm:mb-12 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Enrolled Courses
            </h2>
            {dashboardData?.enrolledCourses?.length === 0 && (
              <button
                onClick={handleEnrollCourse}
                className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary font-semibold rounded-xl transition-all duration-300"
              >
                Enroll in Courses
              </button>
            )}
          </div>

          {dashboardData?.enrolledCourses?.length === 0 ? (
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-primary/20 shadow-lg group-hover:shadow-[0_8px_25px_rgba(124,58,237,0.15)] transition-all duration-300 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No courses enrolled</h3>
                <p className="text-foreground/60 mb-4 text-sm sm:text-base">
                  You haven't enrolled in any courses yet. Start your learning journey today!
                </p>
                <button
                  onClick={handleEnrollCourse}
                  className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary font-semibold rounded-xl transition-all duration-300"
                >
                  Browse Courses
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {dashboardData?.enrolledCourses?.map((enrollment) => (
                <div key={enrollment._id} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-primary/20 shadow-lg group-hover:shadow-[0_8px_25px_rgba(124,58,237,0.15)] transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                          {enrollment.course?.title || 'Course Title'}
                        </h3>
                        <p className="text-xs sm:text-sm text-foreground/60">
                          by {enrollment.course?.teacher?.name || 'Instructor'}
                        </p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs sm:text-sm text-foreground/60">Progress</span>
                        <span className={`text-xs sm:text-sm font-medium ${getProgressColor(enrollment.progress)}`}>
                          {enrollment.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-background/50 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-1000 ease-out ${getProgressBarColor(enrollment.progress)}`}
                          style={{ width: `${enrollment.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm mb-4">
                      <div>
                        <p className="text-foreground/60">Lectures</p>
                        <p className="font-medium">
                          {enrollment.completedLectures?.length || 0} / {enrollment.totalLectures || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-foreground/60">Quizzes</p>
                        <p className="font-medium">
                          {enrollment.completedQuizzes?.length || 0} completed
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate(`/courses/${enrollment.course._id}`)}
                      className="w-full px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary font-semibold rounded-xl transition-all duration-300"
                    >
                      Continue Learning
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grades Section */}
        <div className="mb-8 sm:mb-12 animate-fade-in">
          <StudentGrades />
        </div>

        {/* Current Skills Section */}
        <div className="mb-8 sm:mb-12 animate-fade-in">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Current Skills
          </h2>
          
          {(!user?.interests || user.interests.length === 0) && (!user?.concentrations || user.concentrations.length === 0) ? (
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-400/5 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-blue-500/20 shadow-lg group-hover:shadow-[0_8px_25px_rgba(59,130,246,0.15)] transition-all duration-300 text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No skills to show</h3>
                <p className="text-foreground/60 mb-4 text-sm sm:text-base">
                  You haven't added any skills or interests yet. Start building your skill profile!
                </p>
                <button
                  onClick={() => navigate('/profile')}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-semibold rounded-xl transition-all duration-300"
                >
                  Add Skills
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Interests */}
              {user?.interests && user.interests.length > 0 && (
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-400/5 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-blue-500/20 shadow-lg group-hover:shadow-[0_8px_25px_rgba(59,130,246,0.15)] transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">Interests</h3>
                        <p className="text-xs sm:text-sm text-foreground/60">
                          {user.interests.length} interest{user.interests.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                      {user.interests.slice(0, 6).map((interest, index) => (
                        <span
                          key={index}
                          className="px-2 sm:px-3 py-1 bg-blue-500/20 text-blue-400 text-xs sm:text-sm rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                      {user.interests.length > 6 && (
                        <span className="px-2 sm:px-3 py-1 bg-background/50 text-foreground/60 text-xs sm:text-sm rounded-full">
                          +{user.interests.length - 6} more
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate('/profile')}
                      className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-semibold rounded-xl transition-all duration-300"
                    >
                      Manage Interests
                    </button>
                  </div>
                </div>
              )}

              {/* Concentrations */}
              {user?.concentrations && user.concentrations.length > 0 && (
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-400/5 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-green-500/20 shadow-lg group-hover:shadow-[0_8px_25px_rgba(34,197,94,0.15)] transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">Concentrations</h3>
                        <p className="text-xs sm:text-sm text-foreground/60">
                          {user.concentrations.length} concentration{user.concentrations.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="space-y-2 sm:space-y-3 mb-4">
                      {user.concentrations.slice(0, 3).map((concentration, index) => (
                        <div key={index} className="bg-background/50 rounded-lg p-2 sm:p-3">
                          <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                            <span className="text-xs sm:text-sm font-medium text-foreground">
                              {concentration.key}
                            </span>
                            <span className="text-xs text-foreground/60">
                              {concentration.treeProgress?.length || 0} nodes
                            </span>
                          </div>
                          {concentration.treeProgress && concentration.treeProgress.length > 0 && (
                            <div className="w-full bg-background/50 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-1.5 bg-green-400 rounded-full transition-all duration-1000 ease-out"
                                style={{
                                  width: `${Math.round(
                                    (concentration.treeProgress.reduce((sum, node) => sum + (node.progressPercent || 0), 0) / concentration.treeProgress.length)
                                  )}%`
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      ))}
                      {user.concentrations.length > 3 && (
                        <div className="text-center">
                          <span className="text-xs sm:text-sm text-foreground/60">
                            +{user.concentrations.length - 3} more concentrations
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => navigate('/profile')}
                      className="w-full px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold rounded-xl transition-all duration-300"
                    >
                      Manage Concentrations
                    </button>
                  </div>
                </div>
              )}

              {/* Badges */}
              {user?.badges && user.badges.length > 0 && (
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-yellow-400/5 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-yellow-500/20 shadow-lg group-hover:shadow-[0_8px_25px_rgba(234,179,8,0.15)] transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">Badges Earned</h3>
                        <p className="text-xs sm:text-sm text-foreground/60">
                          {user.badges.length} badge{user.badges.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                      {user.badges.slice(0, 6).map((badge, index) => (
                        <span
                          key={index}
                          className="px-2 sm:px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs sm:text-sm rounded-full"
                        >
                          {badge}
                        </span>
                      ))}
                      {user.badges.length > 6 && (
                        <span className="px-2 sm:px-3 py-1 bg-background/50 text-foreground/60 text-xs sm:text-sm rounded-full">
                          +{user.badges.length - 6} more
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate('/profile')}
                      className="w-full px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-semibold rounded-xl transition-all duration-300"
                    >
                      View All Badges
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Certificates Section */}
        {dashboardData?.certificates?.length > 0 && (
          <div className="mb-8 sm:mb-12 animate-fade-in">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Certificates Earned
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {dashboardData.certificates.map((certificate) => (
                <div key={certificate._id} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-400/5 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-green-500/20 shadow-lg group-hover:shadow-[0_8px_25px_rgba(34,197,94,0.15)] transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                          {certificate.course?.title || 'Course Certificate'}
                        </h3>
                        <p className="text-xs sm:text-sm text-foreground/60">
                          Issued on {formatDate(certificate.issueDate)}
                        </p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm mb-4">
                      <p className="text-foreground/60">Credential ID</p>
                      <p className="font-mono text-xs bg-background/50 p-2 rounded mt-1">
                        {certificate.credentialId || 'N/A'}
                      </p>
                    </div>
                    <button className="w-full px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 font-semibold rounded-xl transition-all duration-300">
                      View Certificate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skill Posts Section */}
        {dashboardData?.skillPosts?.length > 0 && (
          <div className="mb-8 sm:mb-12 animate-fade-in">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Skill Exchanges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {dashboardData.skillPosts.map((skillPost) => (
                <div key={skillPost._id} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-400/5 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-blue-500/20 shadow-lg group-hover:shadow-[0_8px_25px_rgba(59,130,246,0.15)] transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                          {skillPost.title || 'Skill Post'}
                        </h3>
                        <p className="text-xs sm:text-sm text-foreground/60">
                          {formatDate(skillPost.createdAt)}
                        </p>
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-foreground/80 text-xs sm:text-sm mb-4">
                      {skillPost.content?.substring(0, 100)}...
                    </p>
                    <button className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-semibold rounded-xl transition-all duration-300">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningDashboard;
