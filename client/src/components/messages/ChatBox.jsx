import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Send, 
  ArrowLeft, 
  User, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  Paperclip,
  Smile
} from 'lucide-react';
import { messagesService } from '../../services/messagesService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const ChatBox = ({ 
  isOpen, 
  onClose, 
  conversation, 
  otherUser, 
  skillPost 
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [lastMessageId, setLastMessageId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen && otherUser && skillPost) {
      fetchMessages();
      // Start auto-refresh interval
      startAutoRefresh();
      
      // Add scroll event listener
      const container = messagesContainerRef.current;
      if (container) {
        container.addEventListener('scroll', checkScrollPosition);
      }
    }
    
    return () => {
      // Cleanup interval on unmount or when chat closes
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      
      // Remove scroll event listener
      const container = messagesContainerRef.current;
      if (container) {
        container.removeEventListener('scroll', checkScrollPosition);
      }
    };
  }, [isOpen, otherUser, skillPost]);

  useEffect(() => {
    // Only auto-scroll if user hasn't scrolled up or if it's a new message from current user
    if (shouldAutoScroll && !userScrolledUp) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll, userScrolledUp]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newMessage]);

  // Check if user is near bottom of messages
  const checkScrollPosition = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
      setUserScrolledUp(!isNearBottom);
      setShouldAutoScroll(isNearBottom);
    }
  };

  const startAutoRefresh = () => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    // Start new interval for refreshing messages every 1 second
    refreshIntervalRef.current = setInterval(() => {
      refreshMessages();
    }, 1000);
  };

  const refreshMessages = async () => {
    if (!otherUser || !skillPost || loading || sending || isTyping) return;

    try {
      setIsRefreshing(true);
      const response = await messagesService.getMessages(
        otherUser._id, 
        skillPost._id, 
        1, 
        50
      );

      if (response.success && response.data.length > 0) {
        const newMessages = response.data;
        const latestMessageId = newMessages[newMessages.length - 1]?._id;
        
        // Only update if we have new messages
        if (latestMessageId !== lastMessageId) {
          setMessages(newMessages);
          setLastMessageId(latestMessageId);
        }
      }
    } catch (error) {
      // Silently fail for auto-refresh to avoid spam
      console.log('Auto-refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchMessages = async (pageNum = 1) => {
    if (!otherUser || !skillPost) return;

    try {
      setLoading(pageNum === 1);
      
      const response = await messagesService.getMessages(
        otherUser._id, 
        skillPost._id, 
        pageNum, 
        50
      );

      if (response.success) {
        if (pageNum === 1) {
          setMessages(response.data);
          // Set the last message ID for auto-refresh comparison
          if (response.data.length > 0) {
            setLastMessageId(response.data[response.data.length - 1]._id);
          }
        } else {
          setMessages(prev => [...response.data, ...prev]);
        }
        
        setHasMore(response.data.length === 50);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsTyping(false);
    setShouldAutoScroll(true); // Always scroll after sending
    setUserScrolledUp(false);

    try {
      setSending(true);
      
      const response = await messagesService.sendMessage(
        otherUser._id,
        skillPost._id,
        messageContent
      );

      if (response.success) {
        // Add the new message to the list
        setMessages(prev => [...prev, response.data]);
        setLastMessageId(response.data._id);
        
        // Reset textarea height and refocus
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          // Refocus the textarea after a brief delay
          setTimeout(() => {
            textareaRef.current?.focus();
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
      setNewMessage(messageContent); // Restore message on error
      // Refocus on error too
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsTyping(false);
      handleSendMessage(e);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMoreMessages = () => {
    if (hasMore && !loading) {
      fetchMessages(page + 1);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  if (!isOpen) return null;

  const messageGroups = groupMessagesByDate(messages);

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl h-[80vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-accent/30">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded-lg transition-colors md:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-foreground/60" />
            </button>
            
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              {otherUser?.avatarUrl ? (
                <img
                  src={otherUser.avatarUrl}
                  alt={otherUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {otherUser?.name}
              </h3>
              <p className="text-sm text-foreground/60 truncate">
                Re: {skillPost?.title}
              </p>
              <div className={`flex items-center space-x-1 text-xs transition-all duration-300 ${
                isRefreshing ? 'text-green-500 opacity-100' : 'text-foreground/40 opacity-60'
              }`}>
                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isRefreshing ? 'bg-green-500 animate-pulse' : 'bg-foreground/30'
                }`}></div>
                <span className="transition-all duration-300">Live</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-lg transition-colors hidden md:block"
          >
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        {/* Monitoring Notice */}
        <div className="px-4 py-2 border-b border-border bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              All conversations are monitored for safety and quality purposes.
            </p>
          </div>
        </div>

        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          onScroll={checkScrollPosition}
        >
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {hasMore && messages.length > 0 && (
                <div className="text-center">
                  <button
                    onClick={loadMoreMessages}
                    disabled={loading}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    {loading ? 'Loading...' : 'Load older messages'}
                  </button>
                </div>
              )}

              {messageGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {/* Date Separator */}
                  <div className="flex items-center justify-center py-2">
                    <div className="bg-accent px-3 py-1 rounded-full">
                      <span className="text-xs text-foreground/60 font-medium">
                        {formatDate(group.date)}
                      </span>
                    </div>
                  </div>

                  {/* Messages */}
                  {group.messages.map((message, index) => {
                    const isCurrentUser = message.sender._id === currentUserId;
                    const showAvatar = !isCurrentUser && (
                      index === 0 || 
                      group.messages[index - 1]?.sender._id !== message.sender._id
                    );

                    return (
                      <div
                        key={message._id}
                        className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${
                          showAvatar ? 'mt-4' : 'mt-1'
                        }`}
                      >
                        {!isCurrentUser && showAvatar && (
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                            {otherUser?.avatarUrl ? (
                              <img
                                src={otherUser.avatarUrl}
                                alt={otherUser.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-4 h-4 text-primary" />
                            )}
                          </div>
                        )}
                        
                        {!isCurrentUser && !showAvatar && (
                          <div className="w-8 mr-2" /> // Spacer
                        )}

                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            isCurrentUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-accent text-foreground'
                          } ${
                            isCurrentUser 
                              ? 'rounded-br-md' 
                              : showAvatar 
                                ? 'rounded-bl-md' 
                                : 'rounded-bl-2xl'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          
                          <div className={`flex items-center justify-end mt-1 space-x-1 ${
                            isCurrentUser ? 'text-primary-foreground/60' : 'text-foreground/60'
                          }`}>
                            <span className="text-xs">
                              {formatTime(message.createdAt)}
                            </span>
                            {isCurrentUser && (
                              <div>
                                {message.isRead ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : (
                                  <Circle className="w-3 h-3" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {messages.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-foreground/60">No messages yet</p>
                  <p className="text-sm text-foreground/40 mt-1">
                    Start the conversation!
                  </p>
                </div>
              )}
            </>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to Bottom Button */}
        {userScrolledUp && (
          <div className="absolute bottom-20 right-6 z-10">
            <button
              onClick={() => {
                setShouldAutoScroll(true);
                setUserScrolledUp(false);
                scrollToBottom();
              }}
              className="bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary/90 transition-all duration-200 flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4 rotate-90" />
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={() => setIsTyping(newMessage.length > 0)}
                onBlur={() => setIsTyping(false)}
                placeholder="Type a message..."
                className="w-full px-3 py-2 pr-10 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground resize-none placeholder:text-foreground/40 transition-all duration-200 max-h-32"
                rows={1}
                disabled={sending}
              />
              
              {/* Character count */}
              {newMessage.length > 400 && (
                <div className="absolute -top-6 right-0 text-xs text-foreground/60">
                  {newMessage.length}/500
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={sending || !newMessage.trim() || newMessage.length > 500}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ChatBox;
