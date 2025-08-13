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
  Send,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TeacherReAttemptRequests = () => {
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
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReAttemptRequests();
  }, [filter]);

  const fetchReAttemptRequests = async () => {
    try {
      setLoading(true);
      const url = filter === 'all' 
        ? '/api/exams/re-attempt-requests' 
        : `/api/exams/re-attempt-requests?status=${filter}`;
        
      const response = await fetch(url, {
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
      toast.error('Please select an action');
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
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

  const getViolationTypeLabel = (type) => {
    const labels = {
      'tab_switching': 'Tab Switching',
      'copy_paste': 'Copy/Paste Detected',
      'right_click': 'Right Click Disabled',
      'fullscreen_exit': 'Fullscreen Exit',
      'webcam_violation': 'Webcam Violation',
      'time_exceeded': 'Time Exceeded',
      'multiple_violations': 'Multiple Violations',
      'contact_creator': 'Contact Creator',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/teacher')}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Re-attempt Requests</h1>
              <p className="text-foreground/60">Review and manage student exam re-attempt requests for your courses</p>
            </div>
          </div>
          <div className="text-sm text-foreground/60">
            {filteredRequests.length} requests
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-md transition-colors ${
                filter === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <RotateCcw className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {filter === 'all' ? 'No Re-attempt Requests' : `No ${filter} Requests`}
            </h3>
            <p className="text-foreground/60">
              {filter === 'all' 
                ? 'No students have requested to retake your exams yet.'
                : `No ${filter} re-attempt requests found.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request._id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {request.exam?.title || 'Unknown Exam'}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status || 'pending')}`}>
                        {(request.status || 'pending').charAt(0).toUpperCase() + (request.status || 'pending').slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/60 mb-3">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        <span>{request.student?.name || 'Unknown Student'}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(request.createdAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        <span>{getViolationTypeLabel(request.violationType)}</span>
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        <span>{request.course?.title || 'Unknown Course'}</span>
                      </div>
                    </div>

                    <div className="bg-accent p-3 rounded border border-border mb-3">
                      <p className="text-sm text-foreground">
                        <strong>Student's message:</strong> {request.studentMessage}
                      </p>
                    </div>

                    {request.violationDetails && (
                      <div className="bg-red-50 border border-red-200 p-3 rounded mb-3">
                        <p className="text-sm text-red-800">
                          <strong>Violation details:</strong> {request.violationDetails}
                        </p>
                      </div>
                    )}

                    {request.creatorResponse && (
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>Your response:</strong> {request.creatorResponse}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {getStatusIcon(request.status || 'pending')}
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
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-foreground/80">Student:</label>
                    <p className="text-foreground">{selectedRequest.student?.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground/80">Exam:</label>
                    <p className="text-foreground">{selectedRequest.exam?.title}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground/80">Violation Type:</label>
                    <p className="text-foreground">{getViolationTypeLabel(selectedRequest.violationType)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground/80">Student's Message:</label>
                    <p className="text-foreground bg-accent p-3 rounded border border-border">
                      {selectedRequest.studentMessage}
                    </p>
                  </div>
                  
                  {selectedRequest.violationDetails && (
                    <div>
                      <label className="text-sm font-medium text-foreground/80">Violation Details:</label>
                      <p className="text-foreground bg-red-50 border border-red-200 p-3 rounded">
                        {selectedRequest.violationDetails}
                      </p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Decision *
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="action"
                          value="approve"
                          checked={reviewData.action === 'approve'}
                          onChange={(e) => setReviewData({ ...reviewData, action: e.target.value })}
                          className="mr-2"
                        />
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <span>Approve - Allow student to retake the exam</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="action"
                          value="reject"
                          checked={reviewData.action === 'reject'}
                          onChange={(e) => setReviewData({ ...reviewData, action: e.target.value })}
                          className="mr-2"
                        />
                        <XCircle className="w-4 h-4 text-red-600 mr-2" />
                        <span>Reject - Deny the re-attempt request</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Response to Student {reviewData.action === 'reject' && '*'}
                    </label>
                    <textarea
                      value={reviewData.response}
                      onChange={(e) => setReviewData({ ...reviewData, response: e.target.value })}
                      placeholder={reviewData.action === 'approve' 
                        ? "Optional message to the student..." 
                        : "Please explain why the request is being rejected..."
                      }
                      className="w-full p-3 border border-border rounded-lg bg-background text-foreground resize-none"
                      rows={4}
                      maxLength={300}
                    />
                    <p className="text-xs text-foreground/60 mt-1">
                      {reviewData.response.length}/300 characters
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(false)}
                      className="px-4 py-2 text-foreground/60 hover:text-foreground transition-colors"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !reviewData.action}
                      className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit Decision</span>
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

export default TeacherReAttemptRequests;
