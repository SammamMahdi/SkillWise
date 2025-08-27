import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Check, X, Trash2, MessageCircle, ArrowLeft, Paperclip, Image, File } from 'lucide-react';
import { toast } from 'react-hot-toast';
import friendService from '../../services/friendService';
import { getProfilePicture } from '../../utils/profilePictureUtils';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../common/ThemeToggle';
import DashboardButton from '../common/DashboardButton';
import ChildLockModal from '../common/ChildLockModal';
import FriendChatBox from './FriendChatBox';
import CourseThreeJSBackground from '../courses/CourseThreeJSBackground';
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

  const UserCard = ({ user, type = 'friend', onAction }) => (
    <div className="group bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-xl p-3 hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-300 hover:scale-[1.01]">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <img
            src={getProfilePicture(user)}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/20 dark:ring-white/10"
            onError={(e) => {
              e.target.src = '/default-avatar.png';
            }}
          />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>
        <div className="flex-1 min-w-0">
          <Link
            to={`/profile/${user.username || user.handle}`}
            className="font-medium text-white hover:text-blue-400 transition-colors block truncate"
          >
            {user.name}
          </Link>
          <p className="text-xs text-white/60 truncate">@{user.username || user.handle}</p>
          <div className="flex items-center space-x-1 mt-1">
            <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">
              {user.xp || 0} XP
            </span>
            <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">
              {user.badges?.length || 0} badges
            </span>
          </div>
        </div>
        <div className="flex space-x-1.5">
          {type === 'search' && (
            <button
              onClick={() => onAction(user.username || user.handle)}
              className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-400 p-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-blue-500/30"
            >
              <UserPlus className="w-3.5 h-3.5" />
            </button>
          )}
          {type === 'received' && (
            <>
              <button
                onClick={() => onAction('accept', user._id)}
                className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 text-green-400 p-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-green-500/30"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onAction('reject', user._id)}
                className="bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-400 p-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-red-500/30"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {type === 'friend' && (
            <>
              <button
                onClick={() => openChat(user)}
                className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-400 p-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-blue-500/30"
                title="Start encrypted chat"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onAction(user._id)}
                className="bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 text-red-400 p-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-red-500/30"
                title="Remove friend"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <CourseThreeJSBackground />
      <div
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
        {/* Overlay for readability */}
        <div className={`pointer-events-none absolute inset-0 transition-all duration-500 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-black/60 via-slate-900/45 to-blue-950/60'
            : 'bg-gradient-to-br from-white/20 via-white/10 to-transparent'
        }`} />

        {/* Main Content */}
        <div className="relative z-10 min-h-screen">
          <div className="max-w-5xl mx-auto p-4">
            {/* Header */}
            <div className="mb-4 bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Friends</h1>
                    <p className="text-sm text-white/70">Connect and share your learning journey</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <Link
                    to="/friend-chat"
                    className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-400 px-4 py-2 rounded-2xl font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-blue-500/30 flex items-center space-x-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Friend Chats</span>
                  </Link>
                  <DashboardButton />
                  <ThemeToggle size="md" />
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-xl p-1 gap-1 mb-4">
              {[
                { id: 'friends', label: 'My Friends', icon: Users, count: friends.length },
                { id: 'search', label: 'Find Friends', icon: Search },
                { id: 'requests', label: 'Requests', icon: UserPlus, count: pendingRequests.received.length }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                        : 'text-white/70 hover:text-white hover:bg-white/10 dark:hover:bg-black/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="bg-white/10 dark:bg-black/20 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 p-4">
              {activeTab === 'friends' && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 text-white">My Friends ({friends.length})</h2>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-white/60">Loading friends...</p>
                    </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No friends yet. Start by searching for other users!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {friends.map(friend => (
                    <UserCard
                      key={friend._id}
                      user={friend}
                      type="friend"
                      onAction={removeFriend}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div>
              <h2 className="text-xl font-semibold mb-6 text-white">Find Friends</h2>
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by username or name..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                  />
                </div>
              </div>

              {searchLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-white/60">Searching...</p>
                </div>
              ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No users found matching "{searchQuery}"</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {searchResults.map(user => (
                    <UserCard
                      key={user._id}
                      user={user}
                      type="search"
                      onAction={sendFriendRequest}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-6">
              {/* Received Requests */}
              <div>
                <h2 className="text-xl font-semibold mb-6 text-white">
                  Received Requests ({pendingRequests.received.length})
                </h2>
                {pendingRequests.received.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/60">No pending friend requests</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingRequests.received.map(user => (
                      <UserCard
                        key={user._id}
                        user={user}
                        type="received"
                        onAction={(action, userId) => {
                          if (action === 'accept') {
                            acceptFriendRequest(userId);
                          } else if (action === 'reject') {
                            rejectFriendRequest(userId);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Sent Requests */}
              <div>
                <h2 className="text-xl font-semibold mb-6 text-white">
                  Sent Requests ({pendingRequests.sent.length})
                </h2>
                {pendingRequests.sent.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-white/60">No pending sent requests</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingRequests.sent.map(user => (
                      <div key={user._id} className="bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20 dark:border-white/10 rounded-2xl p-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <img
                              src={getProfilePicture(user)}
                              alt={user.name}
                              className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20 dark:ring-white/10"
                              onError={(e) => {
                                e.target.src = '/default-avatar.png';
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">{user.name}</p>
                            <p className="text-sm text-white/60">@{user.username || user.handle}</p>
                          </div>
                          <span className="text-sm text-yellow-400 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30">
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

        {/* Friend Chat Box */}
        <FriendChatBox
          isOpen={chatBoxOpen}
          onClose={closeChat}
          friend={selectedFriend}
        />

        {/* Child Lock Modal */}
        <ChildLockModal
          isOpen={showChildLockModal}
          onVerify={handleChildLockVerify}
          onCancel={handleChildLockCancel}
          loading={childLockLoading}
        />
      </div>
    </>
  );
};

export default FriendsPage;
