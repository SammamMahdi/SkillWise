import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { communityService } from '../../services/communityService'
import { notificationService } from '../../services/notificationService'
import CreatePost from './CreatePost'
import EditPostModal from './EditPostModal'

const PrivacyBadge = ({ privacy, onPrivacyChange, isAuthor, postId }) => {
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  const getPrivacyInfo = (privacy) => {
    switch (privacy) {
      case 'public':
        return { icon: '🌍', label: 'Public', color: 'bg-green-500/20 border-green-400/30 text-green-300' }
      case 'friends':
        return { icon: '👥', label: 'Friends', color: 'bg-blue-500/20 border-blue-400/30 text-blue-300' }
      case 'only_me':
        return { icon: '🔒', label: 'Only Me', color: 'bg-gray-500/20 border-gray-400/30 text-gray-300' }
      default:
        return { icon: '🌍', label: 'Public', color: 'bg-green-500/20 border-green-400/30 text-green-300' }
    }
  }

  const { icon, label, color } = getPrivacyInfo(privacy)

  const handlePrivacyChange = async (newPrivacy) => {
    if (newPrivacy === privacy) return
    
    // Show warning when changing from public to private
    if (privacy === 'public' && newPrivacy !== 'public') {
      const confirmed = window.confirm(
        'Changing this post to private will prevent other users from sharing it. Are you sure you want to continue?'
      )
      if (!confirmed) return
    }
    
    setLoading(true)
    try {
      await onPrivacyChange(postId, newPrivacy)
      setShowPrivacyMenu(false)
    } catch (error) {
      console.error('Failed to update privacy:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => isAuthor && setShowPrivacyMenu(!showPrivacyMenu)}
        className={`text-xs px-2 py-1 rounded-full border ${color} ${isAuthor ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
        title={isAuthor ? 'Click to change privacy' : `Privacy: ${label}`}
      >
        {icon} {label}
      </button>

      {/* Privacy Menu */}
      {showPrivacyMenu && isAuthor && (
        <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]">
          <div className="py-1">
            <button
              onClick={() => handlePrivacyChange('public')}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
            >
              🌍 Public
            </button>
            <button
              onClick={() => handlePrivacyChange('friends')}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
            >
              👥 Friends
            </button>
            <button
              onClick={() => handlePrivacyChange('only_me')}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
            >
              🔒 Only Me
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const Poll = ({ post, onVote }) => {
  const [voting, setVoting] = useState(false)
  const options = post.poll?.options || []
  
  // Calculate total votes and percentages
  const totalVotes = options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0)
  
  const getVotePercentage = (votes) => {
    if (totalVotes === 0) return 0
    return Math.round((votes / totalVotes) * 100)
  }
  
  // Check if current user has already voted
  const [currentUserId, setCurrentUserId] = useState(null)
  
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUserId(payload.userId)
      } catch (e) {
        console.error('Failed to parse token:', e)
      }
    }
  }, [])
  
  const hasUserVoted = options.some(opt => 
    opt.votes?.some(vote => vote.toString() === currentUserId?.toString())
  )
  
  const getUserVotedOption = () => {
    return options.find(opt => 
      opt.votes?.some(vote => vote.toString() === currentUserId?.toString())
    )
  }
  
  const handleVote = async (optionId) => {
    setVoting(true)
    try {
      await onVote(post._id, optionId)
    } finally {
      setVoting(false)
    }
  }
  
  return (
    <div className="space-y-3">
      <div className="font-medium text-lg">{post.poll?.question}</div>
      <div className="space-y-2">
        {options.map(opt => {
          const voteCount = opt.votes?.length || 0
          const percentage = getVotePercentage(voteCount)
          const isVoted = opt.votes?.some(vote => vote.toString() === currentUserId?.toString())
          
          return (
            <div key={opt.optionId} className="relative">
              <button
                disabled={voting}
                onClick={() => handleVote(opt.optionId)}
                className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                  isVoted 
                    ? 'border-blue-400 bg-blue-400/20 hover:bg-blue-400/30 cursor-pointer' 
                    : hasUserVoted 
                      ? 'border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer'
                      : 'border-white/10 hover:bg-white/10 cursor-pointer'
                }`}
                title={isVoted ? 'Click to remove your vote' : hasUserVoted ? 'Click to change your vote' : 'Click to vote'}
              >
                <span className="flex-1">{opt.text}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-sm">{voteCount} votes</span>
                  <span className="text-white/80 text-sm font-medium">{percentage}%</span>
                  {isVoted && (
                    <span className="text-blue-400 text-xs">✓ Your vote</span>
                  )}
                </div>
              </button>
              
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 h-1 bg-white/10 rounded-b-lg overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    isVoted ? 'bg-blue-400' : 'bg-blue-400/60'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              {/* Show usernames who voted for this option */}
              {opt.votes && opt.votes.length > 0 && (
                <div className="mt-1 ml-2 text-xs text-white/60">
                  Voted by: {opt.votes.map((vote, idx) => (
                    <span key={idx}>
                      {vote.name || 'User'}{idx < opt.votes.length - 1 ? ', ' : ''}
                    </span>
                  )).slice(0, 3)}
                  {opt.votes.length > 3 && ` and ${opt.votes.length - 3} more`}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {hasUserVoted && (
        <div className="text-sm text-blue-400">
          You voted for: "{getUserVotedOption()?.text}"
          <span className="text-xs text-blue-300 ml-2">(Click on any option to change or remove your vote)</span>
        </div>
      )}
      
      {!hasUserVoted && totalVotes > 0 && (
        <div className="text-sm text-white/60">
          Total votes: {totalVotes}
        </div>
      )}
    </div>
  )
}

const ImageGrid = ({ images }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
    {(images || []).map((img, idx) => (
      <img key={idx} src={img.webp || img.original} alt="post" className="rounded-lg object-cover w-full h-40" />
    ))}
  </div>
)

const CommentSection = ({ post, onComment }) => {
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    
    setSubmitting(true)
    try {
      const res = await onComment(post._id, commentText)
      if (res.success) {
        setCommentText('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Display existing comments */}
      {post.comments && post.comments.length > 0 && (
        <div className="space-y-2">
          {post.comments.map((comment, idx) => (
            <div key={idx} className="flex gap-2 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0">
                {comment.user?.avatarUrl ? (
                  <img src={comment.user.avatarUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <span className="text-white/60 text-xs font-medium">
                      {comment.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white/90">{comment.user?.name || 'User'}</span>
                  <span className="text-xs text-white/50">•</span>
                  <span className="text-xs text-white/50">{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-sm text-white/80">{comment.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/50"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={!commentText.trim() || submitting}
          className="px-3 py-2 rounded-lg bg-primary/30 border border-primary/40 text-sm disabled:opacity-50 hover:bg-primary/40 transition-colors"
        >
          {submitting ? 'Posting...' : 'Comment'}
        </button>
      </form>
    </div>
  )
}

const FeedCard = ({ post, onLike, onComment, onVote, onShare, onDelete, onPostUpdated, onPrivacyChange, currentUserId }) => {
  const navigate = useNavigate()
  const [showEditModal, setShowEditModal] = useState(false)

  const handleEditClick = () => {
    setShowEditModal(true)
  }

  const handlePostUpdated = (updatedPost) => {
    onPostUpdated(updatedPost)
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/10">
          {post.author?.avatarUrl ? (
            <img src={post.author.avatarUrl} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-white/10" />
          )}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{post.author?.name || 'User'}</div>
          <div className="text-xs text-white/60">
            {post.sharedFrom ? (
              <span>shared • {new Date(post.createdAt).toLocaleString()}</span>
            ) : (
              new Date(post.createdAt).toLocaleString()
            )}
            {post.updatedAt && post.updatedAt !== post.createdAt && (
              <span className="text-white/40 ml-2">(edited)</span>
            )}
          </div>
          {post.sharedFrom && (
            <div className="text-xs text-blue-400">
              Original post by {post.sharedFrom.author?.name || 'User'}
            </div>
          )}
          {/* Shareability indicator */}
          {!post.sharedFrom && (
            <div className="text-xs mt-1">
              {post.privacy === 'public' ? (
                <span className="text-green-400">✅ This post can be shared by other users</span>
              ) : (
                <span className="text-gray-400">🔒 This post cannot be shared (private/friends-only)</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <PrivacyBadge privacy={post.privacy} onPrivacyChange={onPrivacyChange} isAuthor={currentUserId && post.author?._id === currentUserId} postId={post._id} />
          {/* Share indicator */}
          {post.privacy === 'public' ? (
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">
              📤 Shareable
            </span>
          ) : (
            <span className="text-xs text-gray-400 bg-gray-400/10 px-2 py-1 rounded-full border border-gray-400/20">
              🔒 Private
            </span>
          )}
          {/* Edit and Delete buttons for post author */}
          {currentUserId && post.author?._id === currentUserId && (
            <>
              <button
                onClick={handleEditClick}
                className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded hover:bg-blue-400/10"
                title="Edit post"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(post._id)}
                className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-400/10"
                title="Delete post"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      </div>

      {post.title && <div className="text-lg font-semibold">{post.title}</div>}
      {post.text && <div className="text-white/80 whitespace-pre-wrap">{post.text}</div>}

      {/* For shared posts, show the original post content */}
      {post.sharedFrom && (
        <div 
          className="border-l-4 border-blue-400/50 pl-4 bg-blue-400/5 rounded-r-lg hover:bg-blue-400/10 cursor-pointer transition-colors"
          onClick={() => navigate(`/community/posts/${post.sharedFrom._id}`)}
          title="Click to view original post"
        >
          <div className="text-sm text-blue-400 mb-2">📤 Shared Content - Click to view original</div>
          
          {/* Original post title */}
          {post.sharedFrom.title && (
            <div className="text-lg font-semibold text-white/90">{post.sharedFrom.title}</div>
          )}
          
          {/* Original post text */}
          {post.sharedFrom.text && (
            <div className="text-white/70 whitespace-pre-wrap mb-3">{post.sharedFrom.text}</div>
          )}
          
          {/* Original post images */}
          {post.sharedFrom.type === 'image' && post.sharedFrom.images && (
            <ImageGrid images={post.sharedFrom.images} />
          )}
          
          {/* Original post poll */}
          {post.sharedFrom.type === 'poll' && post.sharedFrom.poll && (
            <Poll post={post.sharedFrom} onVote={onVote} />
          )}
          
          {/* Original post course share */}
          {post.sharedFrom.type === 'share_course' && post.sharedFrom.sharedCourse?.course && (
            <div className="rounded-xl border border-white/10 p-3 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                 onClick={() => navigate(`/courses/${post.sharedFrom.sharedCourse.course._id || post.sharedFrom.sharedCourse.course.id || post.sharedFrom.sharedCourse.course}`)}>
              <div className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
                📚 {post.sharedFrom.sharedCourse.course.title}
              </div>
              <div className="text-xs text-white/60">By {post.sharedFrom.sharedCourse.course.teacher?.name || 'Instructor'} • Progress {post.sharedFrom.sharedCourse.overallProgress || 0}%</div>
              <div className="text-xs text-blue-400 mt-1">Click to view course details →</div>
            </div>
          )}
        </div>
      )}

      {post.type === 'image' && <ImageGrid images={post.images} />}
      {post.type === 'poll' && <Poll post={post} onVote={onVote} />}

      {post.type === 'share_course' && post.sharedCourse?.course && (
        <div className="rounded-xl border border-white/10 p-3 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
             onClick={() => navigate(`/courses/${post.sharedCourse.course._id || post.sharedCourse.course.id || post.sharedCourse.course}`)}>
          <div className="font-medium text-blue-400 hover:text-blue-300 transition-colors">
            📚 {post.sharedCourse.course.title}
          </div>
          <div className="text-xs text-white/60">By {post.sharedCourse.course.teacher?.name || 'Instructor'} • Progress {post.sharedCourse.overallProgress || 0}%</div>
          <div className="text-xs text-blue-400 mt-1">Click to view course details →</div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => onLike(post._id)} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-sm">Like {post.likes?.length || 0}</button>
        <button 
          onClick={() => onShare(post._id)} 
          disabled={post.privacy !== 'public'}
          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
            post.privacy === 'public' 
              ? 'bg-white/10 hover:bg-white/15 cursor-pointer' 
              : 'bg-white/5 text-white/40 cursor-not-allowed'
          }`}
          title={post.privacy === 'public' ? 'Share this post' : 'Only public posts can be shared'}
        >
          Share {post.shares?.length || 0}
        </button>
        <span className="text-sm text-white/60">Comments {post.comments?.length || 0}</span>
      </div>

      {/* Comment section */}
      <CommentSection post={post} onComment={onComment} />

      {/* Edit Post Modal */}
      <EditPostModal
        post={post}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onPostUpdated={handlePostUpdated}
      />
    </div>
  )
}

const CommunityFeed = () => {
  const [feed, setFeed] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const { postId } = useParams()
  const postRef = useRef(null)

  useEffect(() => {
    // Get current user ID from localStorage or context
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setCurrentUserId(payload.userId)
      } catch (e) {
        console.error('Failed to parse token:', e)
      }
    }
  }, [])

  const load = async (nextPage = 1) => {
    setLoading(true)
    const res = await communityService.fetchFeed({ page: nextPage })
    if (res.success) {
      setFeed(prev => nextPage === 1 ? res.data : [...prev, ...res.data])
    }
    setLoading(false)
  }

  useEffect(() => { 
    load(1).then(() => {
      // If there's a postId in the URL, scroll to it after loading
      if (postId) {
        const timer = setTimeout(() => {
          const postElement = document.getElementById(`post-${postId}`)
          if (postElement) {
            postElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // Add a highlight effect
            postElement.style.transition = 'box-shadow 0.5s ease-in-out'
            postElement.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)'
            
            // Remove the highlight after some time
            setTimeout(() => {
              postElement.style.boxShadow = 'none'
            }, 3000)
          }
        }, 500)
        return () => clearTimeout(timer)
      }
    })
  }, [postId])

  const onLike = async (postId) => {
    const res = await communityService.like(postId)
    if (res.success) setFeed(prev => prev.map(p => p._id === postId ? { ...p, likes: new Array(res.data.likes).fill(0) } : p))
  }

  const onShare = async (postId) => {
    // Find the post to check its privacy
    const post = feed.find(p => p._id === postId)
    if (!post) return
    
    // Check if post is public
    if (post.privacy !== 'public') {
      alert('Only public posts can be shared. This post has restricted privacy settings.')
      return
    }
    
    const text = prompt('Add a message to your share (optional):')
    if (text === null) return // User cancelled
    
    try {
      const res = await communityService.share(postId, text ? { text } : {})
      if (res.success) {
        // Update the original post's share count
        setFeed(prev => prev.map(p => p._id === postId ? { ...p, shares: new Array(res.data.shares).fill(0) } : p))
        
        // Add the new shared post to the feed if it exists
        if (res.data.sharedPost) {
          setFeed(prev => [res.data.sharedPost, ...prev])
        }
        
        // Show success notification
        notificationService.success('Post shared successfully!', 3000)
      } else {
        alert(res.message || 'Failed to share post')
      }
    } catch (error) {
      if (error.response?.status === 403) {
        alert('This post cannot be shared because it is not public.')
      } else {
        alert('An error occurred while sharing the post.')
      }
      console.error('Share error:', error)
    }
  }

  const onVote = async (postId, optionId) => {
    const res = await communityService.vote(postId, optionId)
    if (res.success) {
      // Find the post and option to determine if this was a vote or unvote
      const post = feed.find(p => p._id === postId)
      const option = post?.poll?.options?.find(opt => opt.optionId === optionId)
      const wasVoted = option?.votes?.some(vote => vote.toString() === currentUserId?.toString())
      
      // Update the poll data in the feed
      setFeed(prev => prev.map(p => {
        if (p._id === postId && p.poll) {
          return {
            ...p,
            poll: {
              ...p.poll,
              options: p.poll.options.map(opt => {
                // Find the updated option data from the response
                const updatedOpt = res.data.find(r => r.optionId === opt.optionId)
                if (updatedOpt) {
                  return {
                    ...opt,
                    votes: new Array(updatedOpt.votes).fill(0),
                    // Update the userVoted property if it exists
                    ...(updatedOpt.userVoted !== undefined && { userVoted: updatedOpt.userVoted })
                  }
                }
                return opt
              })
            }
          }
        }
        return p
      }))
      
      // Show success message
      const updatedOption = res.data.find(r => r.optionId === optionId)
      if (updatedOption) {
        if (updatedOption.userVoted) {
          notificationService.success(`Voted for "${updatedOption.text}"`, 2000)
        } else {
          notificationService.success('Vote removed', 2000)
        }
      }
    }
  }

  const onComment = async (postId, text) => {
    const res = await communityService.comment(postId, text)
    if (res.success) {
      // Add the new comment to the existing post in the feed
      setFeed(prev => prev.map(p => {
        if (p._id === postId) {
          return {
            ...p,
            comments: [...(p.comments || []), res.data]
          }
        }
        return p
      }))
      return res
    }
    return res
  }

  const onPostUpdated = (updatedPost) => {
    setFeed(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p))
  }

  const onPrivacyChange = async (postId, newPrivacy) => {
    try {
      const res = await communityService.updatePostPrivacy(postId, newPrivacy)
      if (res.success) {
        setFeed(prev => prev.map(p => p._id === postId ? { ...p, privacy: newPrivacy } : p))
      }
    } catch (error) {
      console.error('Failed to update privacy:', error)
    }
  }

  const onDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      const res = await communityService.deletePost(postId)
      if (res.success) {
        setFeed(prev => prev.filter(p => p._id !== postId))
      }
    }
  }

  return (
    <section className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Community Feed</h1>
      <CreatePost onCreated={(p) => setFeed(prev => [p, ...prev])} />
      {feed.map(post => (
        <div id={`post-${post._id}`} ref={post._id === postId ? postRef : null}>
        <FeedCard
          key={post._id}
          post={post}
          onLike={onLike}
          onComment={onComment}
          onVote={onVote}
          onShare={onShare}
          onDelete={onDelete}
          onPostUpdated={onPostUpdated}
          onPrivacyChange={onPrivacyChange}
          currentUserId={currentUserId}
        />
      </div>
      ))}
      <div className="flex justify-center py-4">
        <button disabled={loading} onClick={() => { const n = page + 1; setPage(n); load(n) }} className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15">
          {loading ? 'Loading...' : 'Load more'}
        </button>
      </div>
    </section>
  )
}

export default CommunityFeed


