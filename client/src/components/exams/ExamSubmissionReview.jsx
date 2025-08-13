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
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import examService from '../../services/examService';

const ExamSubmissionReview = () => {
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
      setSubmissions(response.data.attempts || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch pending submissions');
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
    return new Date(dateString).toLocaleString();
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case 'mcq': return '🔘';
      case 'short_answer': return '📝';
      case 'essay': return '📄';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (reviewMode && selectedSubmission) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-background min-h-screen">
        {/* Header */}
        <div className="bg-card border border-border rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
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
                  {Math.floor(selectedSubmission.timeSpent / 60)}m {selectedSubmission.timeSpent % 60}s
                </div>
              </div>
            </div>
            <button
              onClick={() => setReviewMode(false)}
              className="px-4 py-2 text-foreground/60 hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors"
            >
              ← Back to List
            </button>
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="space-y-6">
          {selectedSubmission.exam.questions.map((question, index) => {
            const studentAnswer = selectedSubmission.answers.find(
              answer => answer.questionId.toString() === question._id.toString()
            );
            
            return (
              <div key={question._id} className="bg-card border border-border rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {getQuestionTypeIcon(question.type)} Question {index + 1}
                  </h3>
                  <span className="text-sm text-foreground/60">
                    {question.points} points
                  </span>
                </div>

                <p className="text-foreground/80 mb-4">{question.questionText}</p>
                
                {/* Show options for MCQ */}
                {question.type === 'mcq' && question.options && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground/70 mb-2">Options:</p>
                    <div className="space-y-1">
                      {question.options.map((option, optIndex) => (
                        <div
                          key={optIndex}
                          className={`p-2 rounded border ${
                            optIndex === studentAnswer?.selectedOption
                              ? 'bg-primary/10 border-primary/30 text-foreground'
                              : 'bg-accent border-border text-foreground/80'
                          }`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {option.text}
                          {optIndex === studentAnswer?.selectedOption && (
                            <span className="ml-2 text-primary font-medium">(Selected)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Show text answer */}
                {studentAnswer?.textAnswer && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-foreground/70 mb-2">Student's Answer:</p>
                    <div className="bg-accent p-3 rounded border border-border text-foreground">
                      {studentAnswer.textAnswer}
                    </div>
                  </div>
                )}

                {/* Grading Section */}
                <div className="border-t border-border pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1">
                        Score (out of {question.points})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={question.points}
                        value={grades[question._id]?.score || 0}
                        onChange={(e) => handleGradeChange(question._id, 'score', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/80 mb-1">
                        Feedback (optional)
                      </label>
                      <input
                        type="text"
                        value={grades[question._id]?.feedback || ''}
                        onChange={(e) => handleGradeChange(question._id, 'feedback', e.target.value)}
                        placeholder="Add feedback for this question..."
                        className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-foreground/40"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall Feedback and Publish */}
        <div className="bg-card border border-border rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Overall Feedback & Publish Score</h3>

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Overall Feedback (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide overall feedback for the student..."
              rows={4}
              className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-foreground/40"
            />
          </div>

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
        <h1 className="text-2xl font-bold text-foreground mb-2">Exam Submissions for Review</h1>
        <p className="text-foreground/60">Review and grade student exam submissions</p>
      </div>

      {submissions.length === 0 ? (
        <div className="bg-card border border-border rounded-lg shadow-md p-12 text-center">
          <FileText className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Pending Submissions</h3>
          <p className="text-foreground/60">All exam submissions have been reviewed and graded.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {submissions.map((submission) => (
            <div key={submission._id} className="bg-card border border-border rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {submission.exam.title}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-foreground/60 mb-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      <span>{submission.student.name}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDate(submission.submittedAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{Math.floor(submission.timeSpent / 60)}m {submission.timeSpent % 60}s</span>
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

export default ExamSubmissionReview;
