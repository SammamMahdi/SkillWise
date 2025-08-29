import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, Eye, Calendar, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import examService from '../../services/examService';
import { toast } from 'react-hot-toast';

const StudentGrades = () => {
  const navigate = useNavigate();
  const [gradesData, setGradesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await examService.getStudentExamResults();
      setGradesData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch grades');
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = (attemptId) => {
    navigate(`/exams/results/${attemptId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-500 bg-green-500/10';
    if (percentage >= 80) return 'text-blue-500 bg-blue-500/10';
    if (percentage >= 70) return 'text-yellow-500 bg-yellow-500/10';
    if (percentage >= 60) return 'text-orange-500 bg-orange-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-card/50 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-card/50 rounded-xl"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-card/50 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <div className="flex items-center space-x-2 text-red-400 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-semibold">Error Loading Grades</h3>
        </div>
        <p className="text-foreground/80 mb-4">{error}</p>
        <button
          onClick={fetchGrades}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!gradesData || gradesData.results.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No Grades Available</h3>
        <p className="text-foreground/60 mb-6">
          You haven't taken any exams yet, or your results haven't been published.
        </p>
        <button
          onClick={() => navigate('/courses')}
          className="px-6 py-3 bg-primary/20 hover:bg-primary/30 text-primary font-semibold rounded-xl transition-all duration-300"
        >
          Browse Courses
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">My Grades</h2>
        <p className="text-foreground/60">
          View your exam results and track your academic progress
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">{gradesData.totalExams}</p>
              <p className="text-sm text-foreground/60">Total Exams</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-500">{gradesData.passedExams}</p>
              <p className="text-sm text-foreground/60">Passed</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-500">{gradesData.averageScore}%</p>
              <p className="text-sm text-foreground/60">Average Score</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Grades List */}
      <div className="space-y-4">
        {gradesData.results.map((result) => (
          <div
            key={result.attemptId}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {result.examTitle}
                </h3>
                <p className="text-sm text-foreground/60 mb-2">
                  {result.courseTitle}
                </p>
                <div className="flex items-center space-x-4 text-sm text-foreground/50">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Submitted: {formatDate(result.submittedAt)}</span>
                  </div>
                  {result.publishedAt && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Published: {formatDate(result.publishedAt)}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Time: {formatTime(result.timeSpent)}</span>
                  </div>
                </div>
              </div>

              {/* Grade Badge */}
              <div className={`px-4 py-2 rounded-xl font-bold text-lg ${getGradeColor(result.percentage)}`}>
                {getGradeLetter(result.percentage)}
              </div>
            </div>

            {/* Score Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{result.percentage}%</p>
                <p className="text-xs text-foreground/60">Percentage</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {result.totalScore}/{result.totalPoints}
                </p>
                <p className="text-xs text-foreground/60">Points</p>
              </div>
              <div className="text-center">
                <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  result.passed 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {result.passed ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  <span>{result.passed ? 'Passed' : 'Failed'}</span>
                </div>
                <p className="text-xs text-foreground/60 mt-1">
                  Required: {result.passingScore}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{result.violationCount}</p>
                <p className="text-xs text-foreground/60">Violations</p>
              </div>
            </div>

            {/* Instructor Feedback */}
            {result.instructorFeedback && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-blue-400 mb-1">Instructor Feedback:</p>
                <p className="text-sm text-foreground/80">{result.instructorFeedback}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end">
              <button
                onClick={() => handleViewResults(result.attemptId)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentGrades;
