import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  FileText, 
  MessageSquare,
  ArrowLeft,
  Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const ReAttemptRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    action: '',
    response: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReAttemptRequests();
  }, []);

  const fetchReAttemptRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/exams/re-attempt-requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data.requests || []);
      } else {
        toast.error(data.message || 'Failed to fetch re-attempt requests');
      }
    } catch (error) {
      console.error('Fetch re-attempt requests error:', error);
      toast.error('Failed to fetch re-attempt requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = (request) => {
    setSelectedRequest(request);
    setReviewData({ action: '', response: '' });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!reviewData.action) {
      toast.error('Please select an action (approve or reject)');
      return;
    }

    if (reviewData.action === 'reject' && !reviewData.response.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/exams/re-attempt-requests/${selectedRequest._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reviewData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Request ${reviewData.action}d successfully!`);
        setShowReviewModal(false);
        setSelectedRequest(null);
        fetchReAttemptRequests(); // Refresh the list
      } else {
        toast.error(data.message || `Failed to ${reviewData.action} request`);
      }
    } catch (error) {
      console.error('Submit review error:', error);
      toast.error(`Failed to ${reviewData.action} request`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const getReasonLabel = (reason) => {
    const reasonMap = {
      // Contact creator reasons
      'missed_deadline': 'Missed Deadline',
      'technical_issues': 'Technical Issues',
      'personal_emergency': 'Personal Emergency',
      'want_retake': 'Want Better Score',
      'misunderstood_content': 'Misunderstood Content',
      'other': 'Other Reason',
      // Violation types
      'tab_switching': 'Tab Switching',
      'copy_paste': 'Copy/Paste Violation',
      'right_click': 'Right-Click Violation',
      'fullscreen_exit': 'Fullscreen Exit',
      'webcam_violation': 'Webcam Violation',
      'time_exceeded': 'Time Exceeded',
      'multiple_violations': 'Multiple Violations',
      'contact_creator': 'Contact Creator Request'
    };
    return reasonMap[reason] || reason;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Re-attempt Requests</h1>
              <p className="text-foreground/60">Review and manage student exam re-attempt requests</p>
            </div>
          </div>
          <div className="text-sm text-foreground/60">
            {requests.length} total requests
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <RotateCcw className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Re-attempt Requests</h3>
            <p className="text-foreground/60">
              No students have requested to retake exams yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request._id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="w-5 h-5 text-foreground/60" />
                      <h3 className="text-lg font-semibold text-foreground">
                        {request.student?.name || 'Unknown Student'}
                      </h3>
                      {getStatusBadge(request.status || 'pending')}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-foreground/60 mb-3">
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>{request.exam?.title || 'Unknown Exam'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="text-sm font-medium text-foreground/80 mb-1">
                        Type: {getReasonLabel(request.violationType)}
                      </p>
                      <p className="text-sm text-foreground/70 mb-2">
                        <strong>Details:</strong> {request.violationDetails || 'No details provided'}
                      </p>
                      <p className="text-sm text-foreground/70">
                        <strong>Student Message:</strong> {request.studentMessage || 'No message provided'}
                      </p>
                    </div>

                    {request.adminResponse && (
                      <div className="bg-accent p-3 rounded-lg">
                        <p className="text-sm font-medium text-foreground/80 mb-1">Admin Response:</p>
                        <p className="text-sm text-foreground/70">{request.adminResponse}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  {(!request.status || request.status === 'pending') && (
                    <button
                      onClick={() => handleReviewRequest(request)}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Review Request</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedRequest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Review Re-attempt Request
                </h2>

                <div className="bg-accent p-4 rounded-lg mb-6">
                  <h3 className="font-medium text-foreground mb-2">Request Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Student:</strong> {selectedRequest.student?.name}</p>
                    <p><strong>Exam:</strong> {selectedRequest.exam?.title}</p>
                    <p><strong>Type:</strong> {getReasonLabel(selectedRequest.violationType)}</p>
                    <p><strong>Details:</strong> {selectedRequest.violationDetails}</p>
                    <p><strong>Message:</strong> {selectedRequest.studentMessage}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">
                      Decision *
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="action"
                          value="approve"
                          checked={reviewData.action === 'approve'}
                          onChange={(e) => setReviewData(prev => ({ ...prev, action: e.target.value }))}
                          className="mr-2"
                        />
                        <span className="text-green-600">Approve - Allow student to retake exam</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="action"
                          value="reject"
                          checked={reviewData.action === 'reject'}
                          onChange={(e) => setReviewData(prev => ({ ...prev, action: e.target.value }))}
                          className="mr-2"
                        />
                        <span className="text-red-600">Reject - Deny re-attempt request</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">
                      Response to Student {reviewData.action === 'reject' ? '*' : '(Optional)'}
                    </label>
                    <textarea
                      value={reviewData.response}
                      onChange={(e) => setReviewData(prev => ({ ...prev, response: e.target.value }))}
                      placeholder={reviewData.action === 'approve' 
                        ? "Optional message to the student..." 
                        : "Please explain why the request is being rejected..."
                      }
                      rows={4}
                      maxLength={300}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-foreground/40"
                      required={reviewData.action === 'reject'}
                    />
                    <p className="text-xs text-foreground/60 mt-1">
                      {reviewData.response.length}/300 characters
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(false)}
                      className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-foreground"
                    >
                      Cancel
                    </button>
                    
                    <button
                      type="submit"
                      disabled={submitting || !reviewData.action}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          {reviewData.action === 'approve' ? 'Approve Request' : 'Reject Request'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReAttemptRequests;
