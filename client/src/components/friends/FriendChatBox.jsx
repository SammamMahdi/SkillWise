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
  Image,
  Download,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { friendChatService } from '../../services/friendChatService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const FriendChatBox = ({ 
  isOpen, 
  onClose, 
  friend
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    if (isOpen && friend) {
      fetchMessages();
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
  }, [isOpen, friend]);

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
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(() => {
      if (!isTyping && !loading && !sending) {
        refreshMessages();
      }
    }, 1000); // Refresh every 1 second for friend chat too
  };

  const refreshMessages = async () => {
    try {
      setIsRefreshing(true);
      const response = await friendChatService.getMessages(friend._id, 1, 50);
      
      if (response.success && response.data.length > 0) {
        const latestMessage = response.data[response.data.length - 1];
        
        // Only update if we have new messages
        if (!lastMessageId || latestMessage._id !== lastMessageId) {
          setMessages(response.data);
          setLastMessageId(latestMessage._id);
        }
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchMessages = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await friendChatService.getMessages(friend._id, pageNum, 50);
      
      if (response.success) {
        if (pageNum === 1) {
          setMessages(response.data);
          if (response.data.length > 0) {
            setLastMessageId(response.data[response.data.length - 1]._id);
          }
        } else {
          setMessages(prev => [...response.data, ...prev]);
        }
        
        setPage(pageNum);
        setHasMore(response.pagination?.hasMore || false);
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
    
    if ((!newMessage.trim() && !selectedFile) || sending) return;

    setSending(true);
    setShouldAutoScroll(true);
    setUserScrolledUp(false);

    try {
      let response;
      
      if (selectedFile) {
        // Send file
        response = await friendChatService.sendFileMessage(friend._id, selectedFile);
        setSelectedFile(null);
        setPreviewMode(false);
      } else {
        // Send text
        const messageContent = newMessage.trim();
        setNewMessage('');
        setIsTyping(false);
        response = await friendChatService.sendTextMessage(friend._id, messageContent);
      }

      if (response.success) {
        setMessages(prev => [...prev, response.data]);
        setLastMessageId(response.data._id);
        
        // Reset textarea height and refocus
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          setTimeout(() => {
            textareaRef.current?.focus();
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
      // Restore message on error if it was text
      if (!selectedFile && newMessage.trim()) {
        setNewMessage(newMessage);
      }
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMoreMessages = () => {
    if (hasMore && !loading) {
      fetchMessages(page + 1);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
      setPreviewMode(true);
    }
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    setPreviewMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === new Date(today.getTime() - 86400000).toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <Paperclip className="w-4 h-4" />;
  };

  const downloadFile = async (message) => {
    try {
      await friendChatService.downloadFile(message._id, message.fileData.originalName);
      toast.success('File downloaded');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  // Group messages by date
  const messageGroups = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toDateString();
    const existingGroup = groups.find(group => group.date === date);
    
    if (existingGroup) {
      existingGroup.messages.push(message);
    } else {
      groups.push({
        date,
        messages: [message]
      });
    }
    
    return groups;
  }, []);

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Chat Window */}
      <div className="relative w-full max-w-2xl mx-auto my-4 bg-background border border-border rounded-lg shadow-2xl flex flex-col max-h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm rounded-t-lg">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded-lg transition-colors md:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-foreground/60" />
            </button>
            
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {friend?.avatar ? (
                <img 
                  src={friend.avatar} 
                  alt={friend.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate">
                {friend?.name}
              </h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Shield className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-500">End-to-end encrypted</span>
                </div>
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
          </div>
          
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-lg transition-colors hidden md:block"
          >
            <X className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="px-4 py-2 border-b border-border bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <p className="text-xs text-green-800 dark:text-green-200">
              Your conversation is protected with end-to-end encryption. Only you and {friend?.name} can read these messages.
            </p>
          </div>
        </div>

        {/* File Preview */}
        {previewMode && selectedFile && (
          <div className="px-4 py-3 border-b border-border bg-accent/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(selectedFile.type)}
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                  <p className="text-xs text-foreground/60">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={clearFileSelection}
                className="p-1 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-foreground/60" />
              </button>
            </div>
            {selectedFile.type.startsWith('image/') && (
              <div className="mt-3">
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  className="max-w-full h-32 object-cover rounded-lg border border-border"
                />
              </div>
            )}
          </div>
        )}

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
                  {group.messages.map((message) => {
                    const isOwn = message.sender._id === currentUserId;
                    
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}
                      >
                        <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`p-3 rounded-2xl ${
                              isOwn 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-accent text-foreground'
                            }`}
                          >
                            {message.messageType === 'text' ? (
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  {getFileIcon(message.fileData.mimeType)}
                                  <span className="text-sm font-medium truncate">
                                    {message.fileData.originalName}
                                  </span>
                                </div>
                                
                                {message.messageType === 'image' && (
                                  <img
                                    src={friendChatService.getFileUrl(message._id)}
                                    alt={message.fileData.originalName}
                                    className="max-w-full h-48 object-cover rounded-lg cursor-pointer"
                                    onClick={() => downloadFile(message)}
                                  />
                                )}
                                
                                <button
                                  onClick={() => downloadFile(message)}
                                  className={`flex items-center space-x-1 text-xs ${
                                    isOwn ? 'text-primary-foreground/80 hover:text-primary-foreground' 
                                           : 'text-foreground/60 hover:text-foreground'
                                  } transition-colors`}
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <div className={`flex items-center space-x-1 mt-1 ${
                            isOwn ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className="text-xs text-foreground/50">
                              {formatTime(message.createdAt)}
                            </span>
                            {isOwn && (
                              <div className="flex items-center space-x-1">
                                {message.status === 'read' ? (
                                  <CheckCircle2 className="w-3 h-3 text-primary" />
                                ) : message.status === 'delivered' ? (
                                  <CheckCircle2 className="w-3 h-3 text-foreground/40" />
                                ) : (
                                  <Clock className="w-3 h-3 text-foreground/40" />
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
                    Start your encrypted conversation with {friend?.name}!
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
                placeholder={selectedFile ? "Add a caption..." : "Type your encrypted message..."}
                disabled={sending}
                className="w-full px-3 py-2 pr-10 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground resize-none placeholder:text-foreground/40 transition-all duration-200 max-h-32"
                rows="1"
                maxLength={1000}
              />
              
              <div className="absolute bottom-2 right-2 text-xs text-foreground/40">
                {newMessage.length}/1000
              </div>
            </div>

            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-foreground/60 hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
              disabled={sending}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!newMessage.trim() && !selectedFile) || sending}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px]"
            >
              {sending ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />

          {/* Helper Text */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-foreground/50">
              {selectedFile ? 'Ready to send file' : 'Enter to send, Shift+Enter for new line'}
            </p>
            <div className="flex items-center space-x-1 text-xs text-green-500">
              <Shield className="w-3 h-3" />
              <span>Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default FriendChatBox;
