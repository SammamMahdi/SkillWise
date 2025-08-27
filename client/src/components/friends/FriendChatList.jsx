import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Search, 
  User, 
  Image, 
  Paperclip, 
  Shield,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { friendChatService } from '../../services/friendChatService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import FriendChatBox from './FriendChatBox';

const FriendChatList = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [chatBoxOpen, setChatBoxOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    fetchConversations();
    
    // Auto-refresh conversations every 3 seconds when chat is closed
    const interval = setInterval(() => {
      if (!chatBoxOpen) {
        refreshConversations();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [chatBoxOpen]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await friendChatService.getConversations();
      
      if (response.success) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const refreshConversations = async () => {
    try {
      setIsRefreshing(true);
      const response = await friendChatService.getConversations();
      
      if (response.success) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const openChat = (friend) => {
    setSelectedFriend(friend);
    setChatBoxOpen(true);
  };

  const closeChat = () => {
    setChatBoxOpen(false);
    setSelectedFriend(null);
    // Refresh conversations after closing chat to update unread counts
    refreshConversations();
  };

  const getMessagePreview = (message) => {
    if (!message) return 'No messages yet';
    
    if (message.messageType === 'text') {
      return message.content;
    } else if (message.messageType === 'image') {
      return '📷 Image';
    } else {
      return `📎 ${message.fileData?.originalName || 'File'}`;
    }
  };

  const formatLastMessageTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d`;
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6 transition-colors">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center space-x-2">
                <MessageCircle className="w-7 h-7 text-primary" />
                <span>Friend Chats</span>
              </h1>
              <div className="flex items-center space-x-4">
                <p className="text-foreground/60">Secure conversations with your friends</p>
                <div className={`flex items-center space-x-1 text-xs transition-all duration-300 ${
                  !chatBoxOpen ? 'text-green-500 opacity-100' : 'text-foreground/40 opacity-60'
                }`}>
                  <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    !chatBoxOpen ? 'bg-green-500 animate-pulse' : 'bg-foreground/30'
                  }`}></div>
                  <span className="transition-all duration-300">Live updates</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground placeholder:text-foreground/40"
            />
          </div>
        </div>

        {/* Security Notice */}
        <div className="mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800 dark:text-green-200 mb-1">
                  End-to-End Encryption
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  All your friend conversations are protected with end-to-end encryption. 
                  Only you and your friends can read these messages. Images and files are also encrypted.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm ? 'No conversations found' : 'No conversations yet'}
            </h3>
            <p className="text-foreground/60 mb-4">
              {searchTerm 
                ? 'Try searching for a different friend name'
                : 'Start chatting with your friends to see conversations here'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => window.location.href = '/friends'}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Go to Friends
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conversation) => {
              const { friend, latestMessage, unreadCount } = conversation;
              const isOnline = friend.lastSeen && 
                (new Date() - new Date(friend.lastSeen)) < 5 * 60 * 1000; // 5 minutes

              return (
                <div
                  key={friend._id}
                  onClick={() => openChat(friend)}
                  className="bg-card border border-border rounded-lg p-4 hover:bg-accent/50 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                        {friend.avatar ? (
                          <img 
                            src={friend.avatar} 
                            alt={friend.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      {isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-foreground truncate">
                          {friend.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {latestMessage && (
                            <span className="text-xs text-foreground/50">
                              {formatLastMessageTime(latestMessage.createdAt)}
                            </span>
                          )}
                          {unreadCount > 0 && (
                            <div className="bg-primary text-primary-foreground text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {/* Message sender indicator */}
                          {latestMessage && (
                            <div className="flex items-center space-x-1 text-xs text-foreground/50">
                              {latestMessage.sender._id === currentUserId ? (
                                <div className="flex items-center space-x-1">
                                  <span>You:</span>
                                  {latestMessage.status === 'read' ? (
                                    <CheckCircle2 className="w-3 h-3 text-primary" />
                                  ) : latestMessage.status === 'delivered' ? (
                                    <CheckCircle2 className="w-3 h-3 text-foreground/40" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-foreground/40" />
                                  )}
                                </div>
                              ) : (
                                <span>{friend.name}:</span>
                              )}
                            </div>
                          )}
                          
                          {/* Message preview */}
                          <p className="text-sm text-foreground/60 truncate">
                            {getMessagePreview(latestMessage)}
                          </p>
                        </div>

                        {/* Encryption indicator */}
                        <div className="flex items-center space-x-1">
                          <Shield className="w-3 h-3 text-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Chat Box */}
        <FriendChatBox
          isOpen={chatBoxOpen}
          onClose={closeChat}
          friend={selectedFriend}
          popupMode={true}
        />
      </div>
    </div>
  );
};

export default FriendChatList;
