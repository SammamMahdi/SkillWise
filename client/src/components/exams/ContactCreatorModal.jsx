import React, { useState } from 'react';
import { Send, X, MessageSquare, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ContactCreatorModal = ({ exam, onClose }) => {
  const [requestData, setRequestData] = useState({
    reason: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const reasonOptions = [
    { value: 'missed_deadline', label: 'Missed the exam deadline' },
    { value: 'technical_issues', label: 'Had technical issues during exam' },
    { value: 'personal_emergency', label: 'Personal emergency prevented taking exam' },
    { value: 'want_retake', label: 'Want to retake for better score' },
    { value: 'misunderstood_content', label: 'Misunderstood exam content' },
    { value: 'other', label: 'Other reason' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!requestData.reason || !requestData.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (requestData.message.length < 20) {
      toast.error('Please provide a more detailed explanation (at least 20 characters)');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/exams/contact-creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          examId: exam._id,
          reason: requestData.reason,
          message: requestData.message
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Request sent to exam creator successfully!');
        onClose();
      } else {
        toast.error(data.message || 'Failed to send request');
      }
    } catch (error) {
      console.error('Contact creator error:', error);
      toast.error('Failed to send request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Contact Exam Creator</h2>
                <p className="text-sm text-foreground/60">Request permission to take: {exam.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-foreground/60" />
            </button>
          </div>

          {/* Exam Info */}
          <div className="bg-accent p-4 rounded-lg mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <User className="w-4 h-4 text-foreground/60" />
              <span className="text-sm text-foreground/80">
                Exam Creator: {exam.course?.teacher?.name || 'Unknown'}
              </span>
            </div>
            <div className="text-sm text-foreground/60">
              Course: {exam.course?.title || 'Unknown Course'}
            </div>
          </div>

          {/* Request Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Reason for Request *
              </label>
              <select
                value={requestData.reason}
                onChange={(e) => setRequestData(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                required
              >
                <option value="">Select a reason</option>
                {reasonOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-2">
                Message to Exam Creator * (20-500 characters)
              </label>
              <textarea
                value={requestData.message}
                onChange={(e) => setRequestData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Please explain your situation and why you need to take this exam. Be specific and honest about your circumstances..."
                rows={6}
                maxLength={500}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-foreground/40"
                required
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-foreground/60">
                  {requestData.message.length}/500 characters
                </p>
                <p className="text-xs text-foreground/60">
                  Minimum: 20 characters
                </p>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2">
                📋 Important Information
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Your request will be sent directly to the exam creator</li>
                <li>• The creator will review your request and decide whether to approve it</li>
                <li>• You will receive a notification with their decision</li>
                <li>• If approved, you will be able to take the exam again</li>
                <li>• Be honest and specific about your situation</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-foreground"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={submitting || !requestData.reason || requestData.message.length < 20}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactCreatorModal;
