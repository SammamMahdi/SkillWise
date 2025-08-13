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
  ArrowLeft
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import examService from '../../services/examService';

const TeacherSubmissionReview = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [grades, setGrades] = useState({});
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingSubmissions();
  }, []);

  const fetchPendingSubmissions = async () => {
    try {
      setLoading(true);
      const response = await examService.getPendingReviewAttempts();
      setSubmissions(response.data.attempts);
    } catch (error) {
      console.error('Error fetching pending submissions:', error);
      toast.error('Failed to load pending submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleViewSubmission = async (submission) => {
    try {
      const response = await examService.getAttemptForReview(submission._id);
      setSelectedSubmission(response.data);
      setReviewMode(true);
      
      // Initialize grades object
      const initialGrades = {};
      response.data.answers.forEach(answer => {
        initialGrades[answer.questionId] = {
          score: answer.score || 0,
          feedback: answer.feedback || ''
        };
      });
      setGrades(initialGrades);
    } catch (error) {
      console.error('Error fetching submission details:', error);
      toast.error('Failed to load submission details');
    }
  };

  const handleGradeChange = (questionId, field, value) => {
    setGrades(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));
  };

  const handlePublishScore = async () => {
    if (!selectedSubmission) return;

    try {
      setSubmitting(true);
      
      // Calculate final score
      const finalScore = Object.values(grades).reduce((total, grade) => total + (grade.score || 0), 0);
      
      await examService.publishExamScore(selectedSubmission._id, {
        finalScore,
        feedback: feedback.trim()
      });

      toast.success('Score published successfully! Student has been notified.');
      
      // Remove from pending list
      setSubmissions(prev => prev.filter(sub => sub._id !== selectedSubmission._id));
      setSelectedSubmission(null);
      setReviewMode(false);
      setGrades({});
      setFeedback('');
      
    } catch (error) {
      console.error('Error publishing score:', error);
      toast.error('Failed to publish score');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (reviewMode && selectedSubmission) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-background min-h-screen">
        {/* Header */}
        <div className="bg-card border border-border rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => setReviewMode(false)}
                  className="flex items-center space-x-2 text-foreground/60 hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Submissions</span>
                </button>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Review Submission: {selectedSubmission.exam.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-foreground/60">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {selectedSubmission.student.name}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(selectedSubmission.submittedAt)}
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatTime(selectedSubmission.timeSpent)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questions and Grading */}
        <div className="space-y-6 mb-8">
          {selectedSubmission.answers.map((answer, index) => (
            <div key={answer.questionId} className="bg-card border border-border rounded-lg p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground mb-2">
                  Question {index + 1} ({answer.maxPoints} points)
                </h3>
                <p className="text-foreground/80 mb-4">{answer.questionText}</p>

                {/* Student's Answer */}
                <div className="bg-background border border-border rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-foreground mb-2">Student's Answer:</h4>
                  {answer.questionType === 'mcq' ? (
                    <div>
                      <p className="text-foreground/80">
                        Selected Option: {answer.selectedOption !== null ? answer.selectedOption + 1 : 'No answer'}
                      </p>
                      {answer.options && (
                        <div className="mt-2 space-y-1">
                          {answer.options.map((option, optIndex) => (
                            <div 
                              key={optIndex} 
                              className={`p-2 rounded ${
                                answer.selectedOption === optIndex 
                                  ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-300' 
                                  : 'bg-gray-50 dark:bg-gray-800'
                              }`}
                            >
                              {optIndex + 1}. {option.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-foreground/80 whitespace-pre-wrap">
                      {answer.textAnswer || 'No answer provided'}
                    </p>
                  )}
                </div>

                {/* Correct Answer (for reference) */}
                {answer.correctAnswer && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-green-800 dark:text-green-400 mb-2">Correct Answer:</h4>
                    <p className="text-green-700 dark:text-green-300">{answer.correctAnswer}</p>
                  </div>
                )}

                {/* Grading Section */}
                <div className="border-t border-border pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Score (out of {answer.maxPoints})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={answer.maxPoints}
                        value={grades[answer.questionId]?.score || 0}
                        onChange={(e) => handleGradeChange(answer.questionId, 'score', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Feedback (optional)
                      </label>
                      <textarea
                        value={grades[answer.questionId]?.feedback || ''}
                        onChange={(e) => handleGradeChange(answer.questionId, 'feedback', e.target.value)}
                        placeholder="Provide feedback for this answer..."
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Feedback and Publish */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-foreground mb-4">Overall Feedback</h3>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide overall feedback for the student (optional)..."
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none mb-4"
            rows="4"
          />

          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-foreground">
              Total Score: {Object.values(grades).reduce((total, grade) => total + (grade.score || 0), 0)} / {selectedSubmission.exam.totalPoints}
            </div>

            <button
              onClick={handlePublishScore}
              disabled={submitting}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? 'Publishing...' : 'Publish Score'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-background min-h-screen">
      <div className="bg-card border border-border rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Student Submissions for Review</h1>
        <p className="text-foreground/60">Review and grade student exam submissions for your courses</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardCheck className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No Submissions Pending Review</h3>
          <p className="text-foreground/60">
            All student submissions have been reviewed. New submissions will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {submissions.map(submission => (
            <div key={submission._id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {submission.exam.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-foreground/60 mb-2">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {submission.student.name}
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {submission.exam.course?.title || 'Unknown Course'}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(submission.submittedAt)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending Review
                    </span>
                    <span className="text-sm text-foreground/60">
                      Score: {submission.totalScore} / {submission.exam.totalPoints}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleViewSubmission(submission)}
                  className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Review & Grade
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherSubmissionReview;
