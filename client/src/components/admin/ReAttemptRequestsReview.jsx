import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  MessageSquare,
  Eye,
  Send
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ReAttemptRequestsReview = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewData, setReviewData] = useState({
    action: '',
    response: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/exams/re-attempt-requests?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
      } else {
        toast.error('Failed to fetch re-attempt requests');
      }
    } catch (error) {
      console.error('Fetch requests error:', error);
      toast.error('Failed to fetch re-attempt requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async (e) => {
    e.preventDefault();
    
    if (!reviewData.action) {
      toast.error('Please select an action');
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
        setReviewMode(false);
        setSelectedRequest(null);
        setReviewData({ action: '', response: '' });
        fetchRequests(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to review request');
      }
    } catch (error) {
      console.error('Review request error:', error);
      toast.error('Failed to review request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: XCircle }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getViolationTypeLabel = (type) => {
    const labels = {
      tab_switching: 'Tab Switching',
      copy_paste: 'Copy/Paste',
      right_click: 'Right Click',
      fullscreen_exit: 'Fullscreen Exit',
      webcam_violation: 'Webcam Issue',
      time_exceeded: 'Time Exceeded',
      multiple_violations: 'Multiple Violations',
      other: 'Other'
    };
    return labels[type] || type;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (reviewMode && selectedRequest) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-background min-h-screen">
        {/* Review Header */}
        <div className="bg-card border border-border rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Review Re-attempt Request
              </h1>
              <div className="flex items-center space-x-4 text-sm text-foreground/60">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {selectedRequest.student.name}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(selectedRequest.createdAt)}
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

        {/* Request Details */}
        <div className="bg-card border border-border rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Request Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">Exam</label>
              <p className="text-foreground">{selectedRequest.exam.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">Course</label>
              <p className="text-foreground">{selectedRequest.course.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">Violation Type</label>
              <p className="text-foreground">{getViolationTypeLabel(selectedRequest.violationType)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">Original Attempt</label>
              <p className="text-foreground/60 text-sm">
                Submitted: {formatDate(selectedRequest.originalAttempt.submittedAt)}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground/70 mb-2">Violation Details</label>
            <div className="bg-accent p-3 rounded border border-border">
              <p className="text-foreground">{selectedRequest.violationDetails}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground/70 mb-2">Student's Message</label>
            <div className="bg-accent p-3 rounded border border-border">
              <p className="text-foreground">{selectedRequest.studentMessage}</p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="bg-card border border-border rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Your Decision</h3>
          
          <form onSubmit={handleReviewRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">Action</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="approve"
                    checked={reviewData.action === 'approve'}
                    onChange={(e) => setReviewData(prev => ({ ...prev, action: e.target.value }))}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="ml-2 text-green-600 font-medium">Approve Re-attempt</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="reject"
                    checked={reviewData.action === 'reject'}
                    onChange={(e) => setReviewData(prev => ({ ...prev, action: e.target.value }))}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-red-600 font-medium">Reject Request</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Response to Student (optional)
              </label>
              <textarea
                value={reviewData.response}
                onChange={(e) => setReviewData(prev => ({ ...prev, response: e.target.value }))}
                placeholder="Provide feedback or explanation for your decision..."
                rows={4}
                maxLength={300}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-foreground/40"
              />
              <p className="text-xs text-foreground/60 mt-1">
                {reviewData.response.length}/300 characters
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setReviewMode(false)}
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
                    Submit Decision
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-background min-h-screen">
      <div className="bg-card border border-border rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Re-attempt Requests</h1>
        <p className="text-foreground/60">Review student requests to retake exams after violations</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-accent rounded-lg p-1">
          {[
            { key: 'all', label: 'All Requests' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/60 hover:text-foreground hover:bg-background'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-card border border-border rounded-lg shadow-md p-12 text-center">
          <MessageSquare className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Re-attempt Requests</h3>
          <p className="text-foreground/60">
            {filter === 'all' 
              ? 'No students have requested exam re-attempts yet.'
              : `No ${filter} re-attempt requests found.`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div key={request._id} className="bg-card border border-border rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-foreground">
                      {request.exam.title}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-foreground/60 mb-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      <span>{request.student.name}</span>
                    </div>
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      <span>{getViolationTypeLabel(request.violationType)}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-foreground/80 line-clamp-2">
                      <strong>Student's message:</strong> {request.studentMessage}
                    </p>
                  </div>

                  {request.status !== 'pending' && request.creatorResponse && (
                    <div className="bg-accent p-3 rounded border border-border">
                      <p className="text-sm text-foreground">
                        <strong>Your response:</strong> {request.creatorResponse}
                      </p>
                    </div>
                  )}
                </div>
                
                {request.status === 'pending' && (
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setReviewMode(true);
                    }}
                    className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors ml-4"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReAttemptRequestsReview;
