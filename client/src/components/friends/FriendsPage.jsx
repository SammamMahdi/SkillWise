import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Check, X, Trash2, MessageCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import friendService from '../../services/friendService';
import { getProfilePicture } from '../../utils/profilePictureUtils';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../common/ThemeToggle';
import DashboardButton from '../common/DashboardButton';
import ChildLockModal from '../common/ChildLockModal';
import FriendChatBox from './FriendChatBox';

const FriendsPage = () => {
  const { user } = useAuth();
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
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-3">
        <img
          src={getProfilePicture(user)}
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div className="flex-1">
          <Link 
            to={`/profile/${user.username || user.handle}`}
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            {user.name}
          </Link>
          <p className="text-sm text-foreground/60">@{user.username || user.handle}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
              {user.xp} XP
            </span>
            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded">
              {user.badges?.length || 0} badges
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          {type === 'search' && (
            <button
              onClick={() => onAction(user.username || user.handle)}
              className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          )}
          {type === 'received' && (
            <>
              <button
                onClick={() => onAction('accept', user._id)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => onAction('reject', user._id)}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
          {type === 'friend' && (
            <>
              <button
                onClick={() => openChat(user)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
                title="Start encrypted chat"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => onAction(user._id)}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                title="Remove friend"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Friends</h1>
              <p className="text-foreground/60">Connect with other users and share your learning journey</p>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <Link
                to="/friend-chat"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
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
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg">
          {[
            { id: 'friends', label: 'My Friends', icon: Users },
            { id: 'search', label: 'Find Friends', icon: Search },
            { id: 'requests', label: 'Requests', icon: UserPlus }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'requests' && pendingRequests.received.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {pendingRequests.received.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'friends' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">My Friends ({friends.length})</h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                  <p className="text-foreground/60">No friends yet. Start by searching for other users!</p>
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
              <h2 className="text-xl font-semibold mb-4">Find Friends</h2>
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/40 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by username or name..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              
              {searchLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                  <p className="text-foreground/60">No users found matching "{searchQuery}"</p>
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
                <h2 className="text-xl font-semibold mb-4">
                  Received Requests ({pendingRequests.received.length})
                </h2>
                {pendingRequests.received.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlus className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                    <p className="text-foreground/60">No pending friend requests</p>
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
                <h2 className="text-xl font-semibold mb-4">
                  Sent Requests ({pendingRequests.sent.length})
                </h2>
                {pendingRequests.sent.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-foreground/60">No pending sent requests</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingRequests.sent.map(user => (
                      <div key={user._id} className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={getProfilePicture(user)}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{user.name}</p>
                            <p className="text-sm text-foreground/60">@{user.username || user.handle}</p>
                          </div>
                          <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
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
    </div>
  );
};

export default FriendsPage;
