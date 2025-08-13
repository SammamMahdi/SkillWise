import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Clock, BookOpen, User, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import examService from '../../services/examService';

const AdminExamReview = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingExams();
  }, []);

  const fetchPendingExams = async () => {
    try {
      setLoading(true);
      console.log('Fetching pending exams for admin review...');
      const response = await examService.getPendingReviewExams();
      console.log('Pending exams response:', response);
      console.log('Number of pending exams:', response.data.exams?.length || 0);
      setExams(response.data.exams || []);
    } catch (error) {
      console.error('Error fetching pending exams:', error);
      toast.error(error.message || 'Failed to fetch pending exams');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewAction) {
      toast.error('Please select an action (approve or reject)');
      return;
    }

    if (reviewAction === 'reject' && !comments.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setSubmitting(true);
      await examService.reviewExam(selectedExam._id, reviewAction, comments);
      toast.success(`Exam ${reviewAction}d successfully`);
      
      // Remove from pending list
      setExams(prev => prev.filter(exam => exam._id !== selectedExam._id));
      setSelectedExam(null);
      setReviewAction('');
      setComments('');
      
    } catch (error) {
      toast.error(error.message || `Failed to ${reviewAction} exam`);
    } finally {
      setSubmitting(false);
    }
  };

  const ExamCard = ({ exam }) => (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-2">{exam.title}</h3>
          <p className="text-sm text-foreground/60 mb-2">{exam.course?.title}</p>
          {exam.description && (
            <p className="text-sm text-foreground/80 mb-3 line-clamp-2">{exam.description}</p>
          )}
        </div>
        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
          Pending Review
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-foreground/60" />
          <span>{exam.teacher?.name} ({exam.teacher?.role})</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-foreground/60" />
          <span>{exam.timeLimit}m</span>
        </div>
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-foreground/60" />
          <span>{exam.questions?.length || 0} questions</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-foreground/60" />
          <span>{exam.totalPoints} points</span>
        </div>
      </div>

      <div className="text-xs text-foreground/60 mb-4">
        Submitted: {new Date(exam.createdAt).toLocaleDateString()}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setSelectedExam(exam)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
        >
          <Eye className="w-4 h-4" />
          <span>Review</span>
        </button>
      </div>
    </div>
  );

  const ExamReviewModal = ({ exam, onClose }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b border-border p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{exam.title}</h2>
            <button
              onClick={onClose}
              className="text-foreground/60 hover:text-foreground"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
          <p className="text-foreground/60 mt-2">{exam.course?.title} • {exam.teacher?.name}</p>
        </div>

        <div className="p-6">
          {/* Exam Details */}
          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Time Limit:</span> {exam.timeLimit} minutes
              </div>
              <div>
                <span className="font-medium">Questions:</span> {exam.questions?.length || 0}
              </div>
              <div>
                <span className="font-medium">Total Points:</span> {exam.totalPoints}
              </div>
              <div>
                <span className="font-medium">Passing Score:</span> {exam.passingScore}%
              </div>
            </div>
          </div>

          {exam.description && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-foreground/80">{exam.description}</p>
            </div>
          )}

          {/* Questions Preview */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Questions ({exam.questions?.length || 0})</h3>
            <div className="space-y-4">
              {exam.questions?.map((question, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium">Question {index + 1}</h4>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                        {question.points} pts
                      </span>
                      <span className="bg-secondary/10 text-secondary px-2 py-1 rounded capitalize">
                        {question.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-foreground mb-3">{question.questionText}</p>
                  
                  {question.type === 'mcq' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-2 rounded border ${
                            option.isCorrect
                              ? 'bg-green-50 border-green-200 text-green-800'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          {option.isCorrect && <CheckCircle className="w-4 h-4 inline mr-2" />}
                          {option.text}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.type === 'short_answer' && question.correctAnswer && (
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <span className="font-medium text-green-800">Correct Answer: </span>
                      <span className="text-green-700">{question.correctAnswer}</span>
                    </div>
                  )}
                  
                  {question.type === 'essay' && (
                    <div className="text-sm text-foreground/60">
                      Maximum words: {question.maxWords}
                    </div>
                  )}
                  
                  {question.explanation && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                      <span className="font-medium text-blue-800">Explanation: </span>
                      <span className="text-blue-700">{question.explanation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Anti-cheat Settings */}
          {exam.antiCheat && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Anti-cheat Settings</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className={exam.antiCheat.blockCopyPaste ? 'text-green-700' : 'text-gray-500'}>
                    {exam.antiCheat.blockCopyPaste ? '✓' : '✗'} Block Copy/Paste
                  </div>
                  <div className={exam.antiCheat.blockTabSwitching ? 'text-green-700' : 'text-gray-500'}>
                    {exam.antiCheat.blockTabSwitching ? '✓' : '✗'} Monitor Tab Switching
                  </div>
                  <div className={exam.antiCheat.blockRightClick ? 'text-green-700' : 'text-gray-500'}>
                    {exam.antiCheat.blockRightClick ? '✓' : '✗'} Block Right Click
                  </div>
                  <div className={exam.antiCheat.fullScreenRequired ? 'text-green-700' : 'text-gray-500'}>
                    {exam.antiCheat.fullScreenRequired ? '✓' : '✗'} Require Full Screen
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review Actions */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-4">Review Decision</h3>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="reviewAction"
                    value="approve"
                    checked={reviewAction === 'approve'}
                    onChange={(e) => setReviewAction(e.target.value)}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-green-700 font-medium">Approve</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="reviewAction"
                    value="reject"
                    checked={reviewAction === 'reject'}
                    onChange={(e) => setReviewAction(e.target.value)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-red-700 font-medium">Reject</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Comments {reviewAction === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  rows="3"
                  placeholder={
                    reviewAction === 'approve'
                      ? 'Optional feedback for the teacher...'
                      : 'Please explain why this exam is being rejected...'
                  }
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewSubmit}
                  disabled={submitting || !reviewAction}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    reviewAction === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : reviewAction === 'reject'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  {submitting ? 'Processing...' : `${reviewAction === 'approve' ? 'Approve' : 'Reject'} Exam`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Exam Review</h1>
          <p className="text-foreground/60">Review and approve exams submitted by teachers and other admins</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Exams Pending Review</h3>
            <p className="text-foreground/60">
              All submitted exams have been reviewed. New submissions from teachers and other admins will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {exams.map(exam => (
              <ExamCard key={exam._id} exam={exam} />
            ))}
          </div>
        )}

        {selectedExam && (
          <ExamReviewModal
            exam={selectedExam}
            onClose={() => {
              setSelectedExam(null);
              setReviewAction('');
              setComments('');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AdminExamReview;
