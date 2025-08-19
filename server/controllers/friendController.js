const User = require('../models/User');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

// @desc    Send friend request
// @route   POST /api/friends/request
// @access  Private
const sendFriendRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const senderId = req.userId;
    const { targetHandle } = req.body;

    // Get sender
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(403).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find target user by handle or username
    const target = await User.findOne({
      $or: [
        { handle: targetHandle.toLowerCase() },
        { username: targetHandle.toLowerCase() }
      ]
    });

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (target._id.toString() === senderId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }

    // Check if already friends
    if (sender.friends.includes(target._id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already friends with this user'
      });
    }

    // Check if request already sent
    if (sender.sentFriendRequests.includes(target._id)) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent to this user'
      });
    }

    // Check if target has already sent a request to sender
    if (sender.receivedFriendRequests.includes(target._id)) {
      return res.status(400).json({
        success: false,
        message: 'This user has already sent you a friend request. Check your pending requests.'
      });
    }

    // Add to pending requests
    sender.sentFriendRequests.push(target._id);
    target.receivedFriendRequests.push(sender._id);
    await sender.save();
    await target.save();

    // Create notification for target
    const notification = new Notification({
      recipient: target._id,
      sender: senderId,
      type: 'friend_request',
      title: 'Friend Request',
      message: `${sender.name} wants to be your friend.`,
      isActionRequired: true,
      actionUrl: '/friends/requests',
      data: {
        friendId: senderId,
        requestId: `${senderId}-${target._id}`
      }
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });

  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending friend request'
    });
  }
};

// @desc    Accept friend request
// @route   PUT /api/friends/accept/:requesterId
// @access  Private
const acceptFriendRequest = async (req, res) => {
  try {
    const recipientId = req.userId;
    const { requesterId } = req.params;

    // Get recipient
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(403).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get requester
    const requester = await User.findById(requesterId);
    if (!requester) {
      return res.status(404).json({
        success: false,
        message: 'Requester not found'
      });
    }

    // Check if request exists
    if (!recipient.receivedFriendRequests.includes(requesterId) || 
        !requester.sentFriendRequests.includes(recipientId)) {
      return res.status(400).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    // Remove from pending requests
    recipient.receivedFriendRequests = recipient.receivedFriendRequests.filter(
      id => id.toString() !== requesterId
    );
    requester.sentFriendRequests = requester.sentFriendRequests.filter(
      id => id.toString() !== recipientId
    );

    // Add to friends
    recipient.friends.push(requesterId);
    requester.friends.push(recipientId);

    await recipient.save();
    await requester.save();

    // Create notification for requester
    const notification = new Notification({
      recipient: requesterId,
      sender: recipientId,
      type: 'friend_accepted',
      title: 'Friend Request Accepted',
      message: `${recipient.name} accepted your friend request.`,
      data: {
        friendId: recipientId
      }
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Friend request accepted successfully'
    });

  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accepting friend request'
    });
  }
};

// @desc    Reject friend request
// @route   PUT /api/friends/reject/:requesterId
// @access  Private
const rejectFriendRequest = async (req, res) => {
  try {
    const recipientId = req.userId;
    const { requesterId } = req.params;

    // Get recipient
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(403).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get requester
    const requester = await User.findById(requesterId);
    if (!requester) {
      return res.status(404).json({
        success: false,
        message: 'Requester not found'
      });
    }

    // Check if request exists
    if (!recipient.receivedFriendRequests.includes(requesterId) || 
        !requester.sentFriendRequests.includes(recipientId)) {
      return res.status(400).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    // Remove from pending requests
    recipient.receivedFriendRequests = recipient.receivedFriendRequests.filter(
      id => id.toString() !== requesterId
    );
    requester.sentFriendRequests = requester.sentFriendRequests.filter(
      id => id.toString() !== recipientId
    );

    await recipient.save();
    await requester.save();

    // Create notification for requester
    const notification = new Notification({
      recipient: requesterId,
      sender: recipientId,
      type: 'friend_rejected',
      title: 'Friend Request Declined',
      message: `${recipient.name} declined your friend request.`,
      data: {
        friendId: recipientId
      }
    });
    await notification.save();

    res.json({
      success: true,
      message: 'Friend request rejected successfully'
    });

  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rejecting friend request'
    });
  }
};

// @desc    Get friends list
// @route   GET /api/friends
// @access  Private
const getFriends = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)
      .populate('friends', 'name handle username profilePhoto avatarUrl xp badges role')
      .select('friends role');

    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { friends: user.friends }
    });

  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching friends'
    });
  }
};

// @desc    Get pending friend requests
// @route   GET /api/friends/requests
// @access  Private
const getPendingRequests = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)
      .populate('receivedFriendRequests', 'name handle username profilePhoto avatarUrl xp badges')
      .populate('sentFriendRequests', 'name handle username profilePhoto avatarUrl xp badges')
      .select('receivedFriendRequests sentFriendRequests role');

    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        received: user.receivedFriendRequests,
        sent: user.sentFriendRequests
      }
    });

  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending requests'
    });
  }
};

// @desc    Remove friend
// @route   DELETE /api/friends/:friendId
// @access  Private
const removeFriend = async (req, res) => {
  try {
    const userId = req.userId;
    const { friendId } = req.params;

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!friend) {
      return res.status(404).json({
        success: false,
        message: 'Friend not found'
      });
    }

    // Check if they are actually friends
    if (!user.friends.includes(friendId) || !friend.friends.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not friends with this user'
      });
    }

    // Remove from friends lists
    user.friends = user.friends.filter(id => id.toString() !== friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== userId);

    await user.save();
    await friend.save();

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });

  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while removing friend'
    });
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getPendingRequests,
  removeFriend
};
