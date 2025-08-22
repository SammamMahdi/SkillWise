import React, { useState } from 'react'
import { Send, User, Clock, Heart, Reply } from 'lucide-react'

const CommentSection = ({ post, onComment }) => {
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showAllComments, setShowAllComments] = useState(false)

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

  const formatCommentTime = (date) => {
    const now = new Date()
    const commentDate = new Date(date)
    const diffInSeconds = Math.floor((now - commentDate) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return commentDate.toLocaleDateString()
  }

  const displayedComments = showAllComments 
    ? post.comments || []
    : (post.comments || []).slice(0, 3)

  return (
    <div className="space-y-4">
      {/* Comments header */}
      {post.comments && post.comments.length > 0 && (
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Comments ({post.comments.length})
          </h4>
          {post.comments.length > 3 && (
            <button
              onClick={() => setShowAllComments(!showAllComments)}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200"
            >
              {showAllComments ? 'Show less' : `Show ${post.comments.length - 3} more`}
            </button>
          )}
        </div>
      )}

      {/* Display existing comments */}
      {displayedComments.length > 0 && (
        <div className="space-y-3">
          {displayedComments.map((comment, idx) => (
            <div 
              key={idx} 
              className="group bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 hover:shadow-md"
            >
              <div className="flex gap-3">
                {/* Comment avatar */}
                <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700 flex-shrink-0">
                  {comment.user?.avatarUrl ? (
                    <img src={comment.user.avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Comment content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {comment.user?.name || 'Anonymous User'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatCommentTime(comment.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed text-left">
                    {comment.text}
                  </div>

                  {/* Comment actions */}
                  <div className="flex items-center gap-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors duration-200">
                      <Heart className="w-3 h-3" />
                      <span>Like</span>
                    </button>
                    <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors duration-200">
                      <Reply className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Comment input */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-left"
              disabled={submitting}
            />
            {commentText.length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {commentText.length}/500
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!commentText.trim() || submitting}
            className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Comment
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CommentSection
