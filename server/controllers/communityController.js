const CommunityPost = require('../models/CommunityPost');
const User = require('../models/User');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const PostReport = require('../models/PostReport');

function canViewPost(post, viewerId, author) {
  if (post.privacy === 'public') return true;
  if (!viewerId) return false;
  if (post.author.toString() === viewerId.toString()) return true; // author can always view
  if (post.privacy === 'friends') {
    const isFriend = author?.friends?.some(f => f.toString() === viewerId.toString());
    return !!isFriend;
  }
  // only_me
  return false;
}

exports.createPost = async (req, res) => {
  try {
    const author = req.userId;
    const { type, privacy = 'public', title, text, images = [], poll, debateTopic, sharedCourse } = req.body;

    const doc = new CommunityPost({
      author,
      type,
      privacy,
      title,
      text,
      images,
      poll,
      debateTopic,
      sharedCourse
    });
    await doc.save();
    const populated = await doc.populate('author', 'name avatarUrl handle');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.listFeed = async (req, res) => {
  try {
    const userId = req.userId;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
    const skip = (page - 1) * limit;

    // Preload viewer's friends for privacy filtering
    const viewer = await User.findById(userId).select('friends');
    const friendIds = new Set((viewer?.friends || []).map(f => f.toString()));

    // Load recent posts, then filter in memory by privacy+friendship if needed
    const posts = await CommunityPost.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatarUrl handle friends')
      .populate('sharedCourse.course', 'title teacher coverImage')
      .populate('sharedFrom', 'author title text type images poll debateTopic sharedCourse')
      .populate('sharedFrom.author', 'name avatarUrl handle')
      .populate('comments.user', 'name avatarUrl handle')
      .populate('poll.options.votes', 'name avatarUrl handle');

    const visible = posts.filter(p => {
      if (p.privacy === 'public') return true;
      if (p.author._id.toString() === userId) return true;
      if (p.privacy === 'friends') return friendIds.has(p.author._id.toString());
      return false; // only_me
    });

    res.json({ success: true, data: visible });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load feed' });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;
    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const idx = post.likes.findIndex(u => u.toString() === userId);
    if (idx >= 0) post.likes.splice(idx, 1); else post.likes.push(userId);
    post.updatedAt = new Date();
    await post.save();
    res.json({ success: true, data: { likes: post.likes.length } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;
    const { text } = req.body;
    const post = await CommunityPost.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    
    // Add the new comment
    post.comments.push({ user: userId, text });
    post.updatedAt = new Date();
    await post.save();
    
    // Populate the user data for the new comment
    const populatedPost = await post.populate('comments.user', 'name avatarUrl handle');
    const newComment = populatedPost.comments[populatedPost.comments.length - 1];
    
    res.json({ success: true, data: newComment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.votePoll = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;
    const { optionId } = req.body;
    const post = await CommunityPost.findById(postId);
    if (!post || post.type !== 'poll') return res.status(404).json({ success: false, message: 'Poll not found' });
    if (!post.poll?.options?.length) return res.status(400).json({ success: false, message: 'No options' });
    
    // Check if user has already voted for this option
    const target = post.poll.options.find(o => o.optionId === optionId);
    if (!target) return res.status(400).json({ success: false, message: 'Invalid option' });
    
    const userVoteIndex = target.votes.findIndex(v => v.toString() === userId);
    
    if (userVoteIndex >= 0) {
      // User has already voted for this option - remove their vote (undo)
      target.votes.splice(userVoteIndex, 1);
    } else {
      // Remove previous vote by this user from any other option
      post.poll.options.forEach(opt => {
        const i = opt.votes.findIndex(v => v.toString() === userId);
        if (i >= 0) opt.votes.splice(i, 1);
      });
      // Add new vote
      target.votes.push(userId);
    }
    
    post.updatedAt = new Date();
    await post.save();
    
    // Populate the votes to get user information
    await post.populate('poll.options.votes', 'name avatarUrl handle');
    
    res.json({ 
      success: true, 
      data: post.poll.options.map(o => ({ 
        optionId: o.optionId, 
        text: o.text, 
        votes: o.votes.length,
        userVoted: o.votes.some(v => v._id.toString() === userId)
      }))
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.sharePost = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;
    const { text } = req.body; // Optional text to add when sharing
    
    // Get current user info for notifications
    const currentUser = await User.findById(userId).select('name avatarUrl handle');
    
    const postToShare = await CommunityPost.findById(postId)
      .populate('author', 'name avatarUrl handle')
      .populate('sharedCourse.course', 'title teacher coverImage');
    
    if (!postToShare) return res.status(404).json({ success: false, message: 'Post not found' });
    
    // Check if the post being shared is itself a shared post
    let originalPost = postToShare;
    if (postToShare.sharedFrom) {
      // If it is, get the original post
      originalPost = await CommunityPost.findById(postToShare.sharedFrom)
        .populate('author', 'name avatarUrl handle');
      
      if (!originalPost) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot share: Original post not found' 
        });
      }
      
      // Tell the client to share the original post instead
      return res.status(200).json({ 
        success: false, 
        message: `You need to share this post from the original creator (${originalPost.author.name})`,
        originalPostId: originalPost._id,
        isSharedPost: true
      });
    }
    
    // Check if the original post is public - only public posts can be shared
    if (originalPost.privacy !== 'public') {
      return res.status(403).json({ 
        success: false, 
        message: 'This post cannot be shared because it is not public' 
      });
    }
    
    // Check if user can view the original post
    if (!canViewPost(originalPost, userId, originalPost.author)) {
      return res.status(403).json({ success: false, message: 'You cannot share this post' });
    }
    
    // Create a new shared post
    const sharedPost = new CommunityPost({
      author: userId,
      type: 'shared', // Use the new shared type
      privacy: 'public', // Shared posts are always public
      text: text || `Shared from ${originalPost.author.name}`,
      sharedFrom: postId,
      // Copy relevant data from original post
      title: originalPost.title,
      images: originalPost.images,
      poll: originalPost.poll,
      debateTopic: originalPost.debateTopic,
      sharedCourse: originalPost.sharedCourse,
      // Set the type based on the original post type
      type: originalPost.type === 'share_course' ? 'share_course' : 'shared'
    });
    
    await sharedPost.save();
    
    // Add to original post's shares array
    if (!originalPost.shares.some(s => s.toString() === userId.toString())) {
      originalPost.shares.push(userId);
      await originalPost.save();
      
      // Create notification for the original post author (only if it's not their own post)
      if (originalPost.author.toString() !== userId.toString()) {
        try {
          const notification = new Notification({
            recipient: originalPost.author,
            type: 'post_shared',
            title: 'Your post was shared!',
            message: `${currentUser?.name || 'Someone'} shared your post`,
            data: {
              postId: originalPost._id,
              sharedBy: userId,
              sharedByUser: currentUser?.name || 'User',
              postType: originalPost.type,
              postTitle: originalPost.title || originalPost.text?.substring(0, 50) || 'Your post'
            },
            read: false
          });
          await notification.save();
        } catch (notifError) {
          console.error('Failed to create share notification:', notifError);
          // Don't fail the share operation if notification fails
        }
      }
    }
    
    // Populate the new shared post for response
    const populatedSharedPost = await sharedPost.populate('author', 'name avatarUrl handle');
    
    res.json({ 
      success: true, 
      data: { 
        shares: originalPost.shares.length,
        sharedPost: populatedSharedPost
      } 
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.uploadImages = async (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs');
    let sharp = null;
    try { sharp = require('sharp'); } catch (_) { /* optional */ }

    const results = [];
    for (const f of (req.files || [])) {
      const original = `/uploads/${f.filename}`;
      const out = { original };

      if (sharp) {
        try {
          const base = path.basename(f.filename, path.extname(f.filename));
          const dir = path.join(__dirname, '..', 'uploads');
          const webpName = `${base}.webp`;
          const thumbName = `${base}_thumb.webp`;
          const webpPath = path.join(dir, webpName);
          const thumbPath = path.join(dir, thumbName);

          await sharp(f.path).webp({ quality: 80 }).toFile(webpPath);
          await sharp(f.path).resize({ width: 480 }).webp({ quality: 70 }).toFile(thumbPath);

          out.webp = `/uploads/${webpName}`;
          out.thumb = `/uploads/${thumbName}`;
        } catch (e) {
          // Fallback silently
        }
      }

      results.push(out);
    }

    res.json({ success: true, data: results });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getHighestVotedOption = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await CommunityPost.findById(postId);
    if (!post || post.type !== 'poll') return res.status(404).json({ success: false, message: 'Poll not found' });
    const sorted = [...(post.poll?.options || [])].sort((a, b) => (b.votes.length) - (a.votes.length));
    const top = sorted[0] ? { optionId: sorted[0].optionId, text: sorted[0].text, votes: sorted[0].votes.length } : null;
    res.json({ success: true, data: top });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getShareableEnrollments = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'dashboardData.enrolledCourses.course',
        select: 'title coverImage teacher',
        populate: { path: 'teacher', select: 'name' }
      });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const enrollments = (user.dashboardData?.enrolledCourses || []).map(e => ({
      course: e.course,
      enrolledAt: e.enrolledAt,
      overallProgress: e.overallProgress,
      currentLectureIndex: e.currentLectureIndex
    }));
    res.json({ success: true, data: enrollments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load enrollments' });
  }
};

exports.getUserSharedContent = async (req, res) => {
  try {
    const userId = req.userId;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(parseInt(req.query.limit || '10', 10), 50);
    const skip = (page - 1) * limit;

    // Get posts that the user has shared (posts with sharedFrom field)
    const sharedPosts = await CommunityPost.find({ 
      author: userId, 
      sharedFrom: { $exists: true, $ne: null } 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatarUrl handle')
      .populate('sharedFrom', 'author title text type images poll debateTopic sharedCourse')
      .populate('sharedFrom.author', 'name avatarUrl handle')
      .populate('sharedCourse.course', 'title teacher coverImage');

    res.json({ success: true, data: sharedPosts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load shared content' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;
    const { reason } = req.body || {};
    const requester = await User.findById(userId).select('name role isSuperUser');
    
    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    const isAuthor = post.author.toString() === userId.toString();
    const isAdmin = requester?.role === 'Admin' || requester?.isSuperUser === true;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'You can only delete your own posts' });
    }

    await CommunityPost.findByIdAndDelete(postId);

    // If admin deleted someone else's post, notify the author with the reason
    if (isAdmin && !isAuthor) {
      try {
        const notification = new Notification({
          recipient: post.author,
          type: 'post_deleted',
          title: 'Your post was removed by admin',
          message: reason ? String(reason).slice(0, 400) : 'An administrator removed your post for violating our community guidelines.',
          data: {
            postId: post._id,
            deletedBy: userId,
            deletedByUser: requester?.name || 'Admin'
          },
          read: false
        });
        await notification.save();
      } catch (notifError) {
        console.error('Failed to create deletion notification:', notifError);
      }
    }

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.editPost = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;
    const updates = req.body;
    
    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    // Check if user is the author of the post
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own posts' });
    }
    
    // Update allowed fields
    const allowedUpdates = ['title', 'text', 'images', 'poll', 'debateTopic'];
    const filteredUpdates = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });
    
    // Add updatedAt timestamp
    filteredUpdates.updatedAt = new Date();
    
    const updatedPost = await CommunityPost.findByIdAndUpdate(
      postId, 
      filteredUpdates, 
      { new: true, runValidators: true }
    ).populate('author', 'name avatarUrl handle')
     .populate('sharedCourse.course', 'title teacher coverImage')
     .populate('sharedFrom', 'author title text type images poll debateTopic sharedCourse')
     .populate('sharedFrom.author', 'name avatarUrl handle')
     .populate('comments.user', 'name avatarUrl handle')
     .populate('poll.options.votes', 'name avatarUrl handle');
    
    res.json({ success: true, data: updatedPost });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePostPrivacy = async (req, res) => {
  try {
    const userId = req.userId;
    const { postId } = req.params;
    const { privacy } = req.body;
    
    // Validate privacy value
    const validPrivacyValues = ['public', 'friends', 'only_me'];
    if (!validPrivacyValues.includes(privacy)) {
      return res.status(400).json({ success: false, message: 'Invalid privacy value' });
    }
    
    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    // Check if user is the author of the post
    if (post.author.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only change privacy of your own posts' });
    }
    
    post.privacy = privacy;
    post.updatedAt = new Date();
    await post.save();
    
    res.json({ success: true, data: { privacy: post.privacy } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get community statistics
exports.getCommunityStats = async (req, res) => {
  try {
    // Get total number of posts
    const totalPosts = await CommunityPost.countDocuments();
    
    // Get total number of community members (users)
    const totalMembers = await User.countDocuments();
    
    // Get trending posts count (posts created in the last 24 hours with high engagement)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const trendingPosts = await CommunityPost.countDocuments({
      createdAt: { $gte: twentyFourHoursAgo },
      $expr: {
        $gte: [
          { $add: [{ $size: '$likes' }, { $size: '$shares' }, { $size: '$comments' }] },
          5 // Posts with at least 5 total interactions are considered trending
        ]
      }
    });
    
    // Alternative: Get posts from last 24 hours as "trending today"
    const postsToday = await CommunityPost.countDocuments({
      createdAt: { $gte: twentyFourHoursAgo }
    });
    
    res.json({
      success: true,
      data: {
        totalPosts,
        totalMembers,
        trendingToday: Math.max(trendingPosts, postsToday) // Use whichever is higher
      }
    });
  } catch (err) {
    console.error('Error fetching community stats:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch community stats' });
  }
};

// Report a post
exports.reportPost = async (req, res) => {
  try {
    const reporter = req.userId;
    const { postId } = req.params;
    const { reason } = req.body || {};

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    try {
      const report = new PostReport({ post: postId, reporter, reason: String(reason).slice(0, 500) });
      await report.save();
      return res.json({ success: true, data: report });
    } catch (e) {
      if (e.code === 11000) {
        return res.status(409).json({ success: false, message: 'You have already reported this post' });
      }
      throw e;
    }
  } catch (err) {
    console.error('Report post error:', err);
    res.status(500).json({ success: false, message: 'Failed to report post' });
  }
};

// Admin: list reports
exports.listReports = async (req, res) => {
  try {
    const requester = await User.findById(req.userId).select('role isSuperUser');
    if (!(requester?.role === 'Admin' || requester?.isSuperUser)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    const reports = await PostReport.find()
      .sort({ createdAt: -1 })
      .populate({ path: 'post', populate: [
        { path: 'author', select: 'name handle' },
        { path: 'sharedFrom', populate: { path: 'author', select: 'name handle' } }
      ]})
      .populate('reporter', 'name handle');
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
};

// Admin: resolve report (optionally delete post and notify creator)
exports.resolveReport = async (req, res) => {
  try {
    const adminId = req.userId;
    const { reportId } = req.params;
    const { action = 'none', resolutionNote } = req.body || {};

    const requester = await User.findById(adminId).select('name role isSuperUser');
    if (!(requester?.role === 'Admin' || requester?.isSuperUser)) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const report = await PostReport.findById(reportId).populate({ path: 'post', populate: [
      { path: 'author', select: 'name handle' },
      { path: 'sharedFrom', populate: { path: 'author', select: 'name handle' } }
    ]});
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    // If delete action
    if (action === 'deleted_post' && report.post) {
      // If the reported post is a shared post, delete the original post instead
      const targetPostId = report.post.sharedFrom ? report.post.sharedFrom._id || report.post.sharedFrom : report.post._id;
      const targetPost = await CommunityPost.findById(targetPostId).populate('author', 'name');
      if (targetPost) {
        await CommunityPost.findByIdAndDelete(targetPostId);
        try {
          const notification = new Notification({
            recipient: targetPost.author,
            type: 'post_deleted',
            title: 'Your post was removed by admin',
            message: resolutionNote ? String(resolutionNote).slice(0, 400) : 'Admin removed your post after review',
            data: { postId: targetPost._id, deletedBy: adminId, deletedByUser: requester?.name || 'Admin' },
            read: false
          });
          await notification.save();
        } catch (e) {
          console.error('Notify on resolve error:', e);
        }
      }
    }

    report.status = 'resolved';
    report.resolutionNote = resolutionNote;
    report.resolvedBy = adminId;
    report.actionTaken = action;
    await report.save();

    // Notify the reporter about the resolution
    try {
      const reporterNotification = new Notification({
        recipient: report.reporter,
        type: 'report_resolved',
        title: 'Your report was reviewed',
        message: resolutionNote ? String(resolutionNote).slice(0, 400) : `Your report was ${action === 'deleted_post' ? 'resolved by removing the post' : 'reviewed and resolved'}`,
        data: {
          reportId: report._id,
          postId: report.post._id,
          action: action,
          resolvedBy: adminId,
          resolvedByUser: requester?.name || 'Admin'
        },
        read: false
      });
      await reporterNotification.save();
    } catch (e) {
      console.error('Failed to create reporter notification:', e);
    }

    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to resolve report' });
  }
};


