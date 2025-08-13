import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  User, 
  BookOpen, 
  MessageSquare,
  Send,
  Star,
  FileText,
  Calendar,
  ClipboardCheck,
  RotateCcw,
  Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import examService from '../../services/examService';
import { useAuth } from '../../contexts/AuthContext';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalExams: 0,
    publishedExams: 0,
    pendingSubmissions: 0,
    totalStudents: 0,
    pendingReAttemptRequests: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching teacher dashboard data...');

      let exams = [];
      let submissions = [];

      // Fetch teacher's exams with error handling
      try {
        console.log('📚 Fetching teacher exams...');
        const examsResponse = await examService.getTeacherExams();
        console.log('✅ Exams response:', examsResponse);

        if (examsResponse.success && examsResponse.data && examsResponse.data.exams) {
          exams = examsResponse.data.exams;
          console.log(`📊 Found ${exams.length} exams`);
        } else {
          console.warn('⚠️ Unexpected exams response structure:', examsResponse);
          exams = [];
        }
      } catch (examError) {
        console.error('❌ Error fetching exams:', examError);
        toast.error('Failed to load exams data');
        exams = [];
      }

      // Fetch pending submissions with error handling
      try {
        console.log('📝 Fetching pending submissions...');
        const submissionsResponse = await examService.getPendingReviewAttempts();
        console.log('✅ Submissions response:', submissionsResponse);

        if (submissionsResponse.success && submissionsResponse.data && submissionsResponse.data.attempts) {
          submissions = submissionsResponse.data.attempts;
          console.log(`📊 Found ${submissions.length} pending submissions`);
        } else {
          console.warn('⚠️ Unexpected submissions response structure:', submissionsResponse);
          submissions = [];
        }
      } catch (submissionError) {
        console.error('❌ Error fetching submissions:', submissionError);
        toast.error('Failed to load submissions data');
        submissions = [];
      }

      // Fetch re-attempt requests
      let reAttemptRequests = [];
      try {
        console.log('🔄 Fetching re-attempt requests...');
        const reAttemptResponse = await fetch('/api/exams/re-attempt-requests?status=pending', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const reAttemptData = await reAttemptResponse.json();
        if (reAttemptData.success) {
          reAttemptRequests = reAttemptData.data.requests || [];
          console.log('✅ Re-attempt requests:', reAttemptRequests.length);
        }
      } catch (error) {
        console.error('❌ Error fetching re-attempt requests:', error);
      }

      // Calculate stats
      const publishedExams = exams.filter(exam => exam.isPublished).length;
      const pendingSubmissions = submissions.length;
      const pendingReAttemptRequests = reAttemptRequests.length;

      console.log('📈 Dashboard stats calculated:', {
        totalExams: exams.length,
        publishedExams,
        pendingSubmissions,
        pendingReAttemptRequests
      });

      setStats({
        totalExams: exams.length,
        publishedExams,
        pendingSubmissions,
        totalStudents: 0, // We'll calculate this later if needed
        pendingReAttemptRequests
      });

      console.log('✅ Dashboard data loaded successfully');

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      toast.error(`Failed to load dashboard data: ${error.message || 'Unknown error'}`);

      // Set default stats on error
      setStats({
        totalExams: 0,
        publishedExams: 0,
        pendingSubmissions: 0,
        totalStudents: 0,
        pendingReAttemptRequests: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Teacher Dashboard</h1>
          <p className="text-foreground/60">
            Welcome back, {user?.name}! Manage your courses, exams, and review student submissions.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">Total Exams</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalExams}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">Published Exams</p>
                <p className="text-2xl font-bold text-foreground">{stats.publishedExams}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">Pending Reviews</p>
                <p className="text-2xl font-bold text-foreground">{stats.pendingSubmissions}</p>
              </div>
              <ClipboardCheck className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">Active Students</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">Re-attempt Requests</p>
                <p className="text-2xl font-bold text-foreground">{stats.pendingReAttemptRequests}</p>
              </div>
              <RotateCcw className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/courses"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>My Courses</span>
            </Link>
            <Link
              to="/exams"
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/90 transition-colors flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>My Exams</span>
            </Link>
            <Link
              to="/teacher/submissions/review"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2 relative"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Review Submissions</span>
              {stats.pendingSubmissions > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {stats.pendingSubmissions}
                </span>
              )}
            </Link>
            <Link
              to="/create-course"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Create Course</span>
            </Link>
            <Link
              to="/teacher/re-attempt-requests"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 relative"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Re-attempt Requests</span>
              {stats.pendingReAttemptRequests > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {stats.pendingReAttemptRequests}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {stats.pendingSubmissions > 0 && (
              <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <ClipboardCheck className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-foreground">
                      {stats.pendingSubmissions} student submission{stats.pendingSubmissions !== 1 ? 's' : ''} awaiting review
                    </p>
                    <p className="text-sm text-foreground/60">
                      Students are waiting for their exam results
                    </p>
                  </div>
                </div>
                <Link
                  to="/teacher/submissions/review"
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Review Now
                </Link>
              </div>
            )}

            {stats.pendingReAttemptRequests > 0 && (
              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <RotateCcw className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-foreground">
                      {stats.pendingReAttemptRequests} re-attempt request{stats.pendingReAttemptRequests !== 1 ? 's' : ''} awaiting review
                    </p>
                    <p className="text-sm text-foreground/60">
                      Students are requesting to retake exams
                    </p>
                  </div>
                </div>
                <Link
                  to="/teacher/re-attempt-requests"
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Review Requests
                </Link>
              </div>
            )}

            {stats.pendingSubmissions === 0 && stats.pendingReAttemptRequests === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">All Caught Up!</h3>
                <p className="text-foreground/60">
                  No pending submissions or re-attempt requests to review. Great job staying on top of student work!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
