import React, { useState, useEffect } from 'react';
import { MessageCircle, Clock, User, AlertTriangle } from 'lucide-react';
import { messagesService } from '../../services/messagesService';
import { useAuth } from '../../contexts/AuthContext';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await messagesService.getConversations();
      if (response.success) {
        setConversations(response.data);
      } else {
        setError(response.message || 'Failed to load conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError(error.message || 'Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = Math.floor((now - messageDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-foreground/60">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 transition-colors">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Messages</h1>
          <p className="text-foreground/60">Your skill-related conversations</p>
        </div>

        {/* Monitoring Notice */}
        <div className="mb-6">
          <div className="flex items-start space-x-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                Monitored Communication
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                All conversations are monitored for safety and quality purposes to ensure a positive learning environment.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm mb-2">{error}</p>
            <button
              onClick={fetchConversations}
              className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              Try again
            </button>
          </div>
        )}

        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No conversations yet</h3>
            <p className="text-foreground/60 mb-4">
              Start connecting with other users by visiting the Skills Wall and contacting skill posters.
            </p>
            <a
              href="/skills"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Browse Skills
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => {
              const { lastMessage } = conversation;
              const otherUser = lastMessage.sender._id === currentUserId 
                ? lastMessage.recipient 
                : lastMessage.sender;

              return (
                <div
                  key={`${conversation._id.participants.join('-')}-${conversation._id.skillPost}`}
                  className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.01]"
                  onClick={() => {
                    // Future: Navigate to conversation detail view
                    console.log('Open conversation:', conversation);
                  }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      {otherUser.avatarUrl ? (
                        <img
                          src={otherUser.avatarUrl}
                          alt={otherUser.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {otherUser.name}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-foreground/60">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(lastMessage.createdAt)}</span>
                        </div>
                      </div>

                      <div className="mb-2">
                        <span className="text-sm text-primary font-medium">
                          Re: {lastMessage.skillPost.title}
                        </span>
                        <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                          lastMessage.skillPost.type === 'offer'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        }`}>
                          {lastMessage.skillPost.type}
                        </span>
                      </div>

                      <p className="text-sm text-foreground/80 truncate">
                        {lastMessage.sender._id === currentUserId ? 'You: ' : ''}
                        {lastMessage.content}
                      </p>

                      {conversation.unreadCount > 0 && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                            {conversation.unreadCount} new
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
