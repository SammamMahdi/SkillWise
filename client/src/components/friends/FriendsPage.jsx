import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Check, X, Trash2, MessageCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import friendService from '../../services/friendService';
import { getProfilePicture } from '../../utils/profilePictureUtils';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../common/ThemeToggle';
import ChildLockModal from '../common/ChildLockModal';
import FriendChatBox from './FriendChatBox';
import bg from '../auth/evening-b2g.jpg';

const FriendsPage = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState({ received: [], sent: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [chatBoxOpen, setChatBoxOpen] = useState(false);
  
  // Child lock modal state
  const [showChildLockModal, setShowChildLockModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [childLockLoading, setChildLockLoading] = useState(false);

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await friendService.getFriends();
      setFriends(response.data.friends);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch friends');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await friendService.getPendingRequests();
      setPendingRequests(response.data);
    } catch (error) {
      toast.error(error.message || 'Failed to fetch pending requests');
    }
  };

  const searchUsers = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await friendService.searchUsers(query);
      setSearchResults(response.data.users);
    } catch (error) {
      toast.error(error.message || 'Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const sendFriendRequest = async (targetHandle, childLockPassword = null) => {
    try {
      // Check if user is child account and needs verification
      if (user?.role === 'Child' && !childLockPassword) {
        setPendingAction({ type: 'sendRequest', targetHandle });
        setShowChildLockModal(true);
        return;
      }

      await friendService.sendFriendRequest(targetHandle, childLockPassword);
      toast.success('Friend request sent!');
      // Remove from search results or mark as sent
      setSearchResults(prev => prev.filter(user => 
        user.handle !== targetHandle && user.username !== targetHandle
      ));
      fetchPendingRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (requesterId, childLockPassword = null) => {
    try {
      // Check if user is child account and needs verification
      if (user?.role === 'Child' && !childLockPassword) {
        setPendingAction({ type: 'acceptRequest', requesterId });
        setShowChildLockModal(true);
        return;
      }

      await friendService.acceptFriendRequest(requesterId, childLockPassword);
      toast.success('Friend request accepted!');
      fetchFriends();
      fetchPendingRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to accept friend request');
    }
  };

  const rejectFriendRequest = async (requesterId) => {
    try {
      await friendService.rejectFriendRequest(requesterId);
      toast.success('Friend request rejected');
      fetchPendingRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to reject friend request');
    }
  };

  const removeFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    try {
      await friendService.removeFriend(friendId);
      toast.success('Friend removed');
      fetchFriends();
    } catch (error) {
      toast.error(error.message || 'Failed to remove friend');
    }
  };

  const openChat = (friend) => {
    setSelectedFriend(friend);
    setChatBoxOpen(true);
  };

  const closeChat = () => {
    setChatBoxOpen(false);
    setSelectedFriend(null);
  };

  // Handle child lock verification
  const handleChildLockVerify = async (password) => {
    setChildLockLoading(true);
    try {
      if (pendingAction?.type === 'sendRequest') {
        await sendFriendRequest(pendingAction.targetHandle, password);
      } else if (pendingAction?.type === 'acceptRequest') {
        await acceptFriendRequest(pendingAction.requesterId, password);
      }
      
      setShowChildLockModal(false);
      setPendingAction(null);
    } catch (error) {
      // Error is already handled in the respective functions
      throw error;
    } finally {
      setChildLockLoading(false);
    }
  };

  const handleChildLockCancel = () => {
    setShowChildLockModal(false);
    setPendingAction(null);
  };

  return (
    <section
      className={`relative min-h-screen overflow-y-auto transition-all duration-500 ${
        theme === 'dark' ? 'auth-bg-dark' : 'auth-bg-light'
      }`}
      style={theme === 'dark' ? {
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      } : {}}
    >
      {/* Theme toggle - fixed position top right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle size="md" />
      </div>

      {/* Overlay for readability */}
      <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
          : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
      }`} />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Sidebar - Friends List */}
        <div className="w-full md:w-96 lg:w-[28rem] min-h-screen bg-black/20 backdrop-blur-xl border-r border-white/10">
          <div className="p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Link 
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/30 text-white border border-white/20 rounded-lg backdrop-blur-sm transition-all duration-300 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <div className="flex-1">
                  <h1 className={`text-xl md:text-2xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}>
                    Friends
                  </h1>
                </div>
              </div>
              <p className={`text-sm ${
                theme === 'dark' ? 'text-white/70' : 'text-slate-600'
              }`}>
                Connect and chat with your friends
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex mb-6 bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('friends')}
                className={`flex-1 px-2 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === 'friends'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Friends</span>
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                    {friends.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 px-2 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === 'search'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 px-2 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === 'requests'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Requests</span>
                  {(pendingRequests.received.length + pendingRequests.sent.length) > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {pendingRequests.received.length + pendingRequests.sent.length}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Search Bar (visible on search tab) */}
            {activeTab === 'search' && (
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by username or handle..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 backdrop-blur-sm"
                />
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              {/* Friends List */}
              {activeTab === 'friends' && (
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                      <p className="text-white/60">Loading friends...</p>
                    </div>
                  ) : friends.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-white/40 mx-auto mb-4" />
                      <p className="text-white/60 mb-2">No friends yet</p>
                      <button
                        onClick={() => setActiveTab('search')}
                        className="text-primary hover:text-primary/80 text-sm font-medium"
                      >
                        Search for friends
                      </button>
                    </div>
                  ) : (
                    friends.map(friend => (
                      <div
                        key={friend._id}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-all duration-300 cursor-pointer"
                        onClick={() => openChat(friend)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={getProfilePicture(friend)}
                              alt={friend.name}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white truncate">{friend.name}</h3>
                            <p className="text-sm text-white/60 truncate">@{friend.username || friend.handle}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openChat(friend);
                              }}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <MessageCircle className="w-4 h-4 text-white/70" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Search Results */}
              {activeTab === 'search' && (
                <div className="space-y-3">
                  {searchLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                      <p className="text-white/60">Searching...</p>
                    </div>
                  ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-white/40 mx-auto mb-4" />
                      <p className="text-white/60">No users found</p>
                    </div>
                  ) : searchQuery.length < 2 ? (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-white/40 mx-auto mb-4" />
                      <p className="text-white/60">Start typing to search for users</p>
                    </div>
                  ) : (
                    searchResults.map(searchUser => {
                      const isFriend = friends.some(f => f._id === searchUser._id);
                      const hasSentRequest = pendingRequests.sent.some(u => u._id === searchUser._id);
                      const hasReceivedRequest = pendingRequests.received.some(u => u._id === searchUser._id);
                      
                      return (
                        <div
                          key={searchUser._id}
                          className="bg-white/5 border border-white/10 rounded-xl p-4"
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={getProfilePicture(searchUser)}
                              alt={searchUser.name}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
                            />
                            <div className="flex-1">
                              <Link 
                                to={`/profile/${searchUser.username || searchUser.handle}`}
                                className="font-medium text-white hover:text-primary transition-colors"
                              >
                                {searchUser.name}
                              </Link>
                              <p className="text-sm text-white/60">@{searchUser.username || searchUser.handle}</p>
                            </div>
                            <div>
                              {isFriend ? (
                                <span className="text-green-400 text-sm font-medium">Friends</span>
                              ) : hasSentRequest ? (
                                <span className="text-yellow-400 text-sm font-medium">Pending</span>
                              ) : hasReceivedRequest ? (
                                <span className="text-blue-400 text-sm font-medium">Wants to be friends</span>
                              ) : (
                                <button
                                  onClick={() => sendFriendRequest(searchUser.username || searchUser.handle)}
                                  className="px-4 py-2 bg-primary hover:bg-primary/80 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                  Add Friend
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Friend Requests */}
              {activeTab === 'requests' && (
                <div className="space-y-6">
                  {/* Received Requests */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Received ({pendingRequests.received.length})
                    </h3>
                    {pendingRequests.received.length === 0 ? (
                      <div className="text-center py-6">
                        <UserPlus className="w-10 h-10 text-white/40 mx-auto mb-3" />
                        <p className="text-white/60 text-sm">No pending requests</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingRequests.received.map(requestUser => (
                          <div
                            key={requestUser._id}
                            className="bg-white/5 border border-white/10 rounded-xl p-4"
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={getProfilePicture(requestUser)}
                                alt={requestUser.name}
                                className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-white">{requestUser.name}</h4>
                                <p className="text-sm text-white/60">@{requestUser.username || requestUser.handle}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => acceptFriendRequest(requestUser._id)}
                                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => rejectFriendRequest(requestUser._id)}
                                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sent Requests */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Sent ({pendingRequests.sent.length})
                    </h3>
                    {pendingRequests.sent.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-white/60 text-sm">No pending sent requests</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingRequests.sent.map(sentUser => (
                          <div
                            key={sentUser._id}
                            className="bg-white/5 border border-white/10 rounded-xl p-4"
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={getProfilePicture(sentUser)}
                                alt={sentUser.name}
                                className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20"
                              />
                              <div className="flex-1">
                                <h4 className="font-medium text-white">{sentUser.name}</h4>
                                <p className="text-sm text-white/60">@{sentUser.username || sentUser.handle}</p>
                              </div>
                              <span className="text-yellow-400 text-sm font-medium px-3 py-1 bg-yellow-400/20 rounded-lg">
                                Pending
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Content Area - Chat */}
        <div className="hidden md:flex flex-1 flex-col">
          {selectedFriend && chatBoxOpen ? (
            <FriendChatBox
              isOpen={chatBoxOpen}
              onClose={closeChat}
              friend={selectedFriend}
              fullScreen={true}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className={`w-20 h-20 mx-auto mb-6 ${
                  theme === 'dark' ? 'text-white/40' : 'text-slate-400'
                }`} />
                <h2 className={`text-2xl font-bold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  Select a friend to start chatting
                </h2>
                <p className={`text-lg ${
                  theme === 'dark' ? 'text-white/70' : 'text-slate-600'
                }`}>
                  Choose a friend from the list to open a conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Chat Modal - Only show on mobile and hide desktop chat when active */}
      {selectedFriend && chatBoxOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <FriendChatBox
            isOpen={true}
            onClose={closeChat}
            friend={selectedFriend}
            fullScreen={false}
            mobileMode={true}
          />
        </div>
      )}

      {/* Child Lock Modal */}
      <ChildLockModal
        isOpen={showChildLockModal}
        onVerify={handleChildLockVerify}
        onCancel={handleChildLockCancel}
        loading={childLockLoading}
      />
    </section>
  );
};

export default FriendsPage;
