import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, AlertTriangle } from 'lucide-react';
import { messagesService } from '../../services/messagesService';
import { notificationService } from '../../services/notificationService';

const ContactModal = ({ isOpen, onClose, recipientUser, skillPost }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;

    try {
      setLoading(true);
      
      const response = await messagesService.sendMessage(
        recipientUser._id,
        skillPost._id,
        message.trim()
      );

      if (response.success) {
        notificationService.success(`Message sent to ${recipientUser.name}!`);
        setMessage('');
        onClose();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorMessage = 'Failed to send message. Please try again.';
      if (error.message.includes('Authentication')) {
        errorMessage = 'Please log in again to send messages.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      notificationService.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-2xl transform transition-all duration-300 relative z-[10000]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Contact {recipientUser.name}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-lg transition-all duration-200"
          >
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        {/* Monitoring Notice */}
        <div className="p-4 border-b border-border">
          <div className="flex items-start space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                Monitored Communication
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                This conversation will be monitored for safety and quality purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Skill Post Context */}
        <div className="p-4 border-b border-border">
          <div className="bg-accent/30 rounded-lg p-3">
            <p className="text-sm text-foreground/80 mb-1">
              <strong>Regarding:</strong> {skillPost.title}
            </p>
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                skillPost.type === 'offer' 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
              }`}>
                {skillPost.type === 'offer' ? 'Skill Offer' : 'Skill Request'}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                skillPost.pricing === 'free' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : skillPost.pricing === 'barter'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {skillPost.pricing}
              </span>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <form onSubmit={handleSendMessage} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi ${recipientUser.name}, I'm interested in your ${skillPost.type} for "${skillPost.title}". `}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground resize-none placeholder:text-foreground/40 transition-all duration-200"
              rows={4}
              disabled={loading}
              required
            />
            <p className="text-xs text-foreground/60 mt-1">
              {message.length}/500 characters
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-foreground/60 hover:text-foreground transition-all duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !message.trim() || message.length > 500}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Use portal to render modal at document root level
  return createPortal(modalContent, document.body);
};

export default ContactModal;
