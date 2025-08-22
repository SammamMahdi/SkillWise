import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Share2, MessageCircle, MoreVertical, Edit3, Trash2, Eye, Clock, User } from 'lucide-react'
import PrivacyBadge from './PrivacyBadge'
import Poll from './Poll'
import ImageGrid from './ImageGrid'
import CommentSection from './CommentSection'
import EditPostModal from './EditPostModal'

const FeedCard = ({ post, onLike, onComment, onVote, onShare, onDelete, onPostUpdated, onPrivacyChange, currentUserId }) => {
  const navigate = useNavigate()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const handleEditClick = () => {
    setShowEditModal(true)
  }

  const handlePostUpdated = (updatedPost) => {
    onPostUpdated(updatedPost)
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    onLike(post._id)
  }

  const formatTimeAgo = (date) => {
    const now = new Date()
    const postDate = new Date(date)
    const diffInSeconds = Math.floor((now - postDate) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return postDate.toLocaleDateString()
  }

  return (
    <div className="group relative">
      {/* Card container */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 p-6 space-y-6 shadow-xl">
        
        {/* Header section */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-primary/20">
              {post.author?.avatarUrl ? (
                <img src={post.author.avatarUrl} className="w-full h-full object-cover" alt="avatar" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
          </div>

          {/* Author info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">
                {post.author?.name || 'Anonymous User'}
              </h3>
              {post.author?.verified && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
              {post.updatedAt && post.updatedAt !== post.createdAt && (
                <span className="text-primary">(edited)</span>
              )}
            </div>

            {/* Privacy and shareability */}
            <div className="flex items-center gap-2 mt-2">
              <PrivacyBadge 
                privacy={post.privacy} 
                onPrivacyChange={onPrivacyChange} 
                isAuthor={currentUserId && post.author?._id === currentUserId} 
                postId={post._id} 
              />
              {post.privacy === 'public' && (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                  📤 Shareable
                </span>
              )}
            </div>
          </div>

          {/* Actions menu */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              <MoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {showActions && currentUserId && post.author?._id === currentUserId && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-10">
                <button
                  onClick={handleEditClick}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Post
                </button>
                <button
                  onClick={() => onDelete(post._id)}
                  className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content section */}
        <div className="space-y-4">
          {post.title && (
            <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {post.title}
            </h2>
          )}
          
          {post.text && (
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {post.text}
            </div>
          )}

          {/* Shared content preview */}
          {post.sharedFrom && (
            <div 
              className="border-l-4 border-primary/50 pl-6 py-4 bg-gradient-to-r from-primary/5 to-transparent rounded-r-2xl cursor-pointer transition-colors duration-300"
              onClick={() => navigate(`/community/posts/${post.sharedFrom._id}`)}
            >
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Shared from {post.sharedFrom.author?.name || 'User'}</span>
              </div>
              
              {post.sharedFrom.title && (
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{post.sharedFrom.title}</h3>
              )}
              
              {post.sharedFrom.text && (
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{post.sharedFrom.text}</p>
              )}
              
              {/* Shared content media */}
              {post.sharedFrom.type === 'image' && post.sharedFrom.images && (
                <ImageGrid images={post.sharedFrom.images} />
              )}
              
              {post.sharedFrom.type === 'poll' && post.sharedFrom.poll && (
                <Poll post={post.sharedFrom} onVote={onVote} />
              )}
            </div>
          )}

          {/* Post media */}
          {post.type === 'image' && <ImageGrid images={post.images} />}
          {post.type === 'poll' && <Poll post={post} onVote={onVote} />}

          {/* Course share */}
          {post.type === 'share_course' && post.sharedCourse?.course && (
            <div 
              className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-700/50 cursor-pointer transition-colors duration-300"
              onClick={() => navigate(`/courses/${post.sharedCourse.course._id || post.sharedCourse.course.id || post.sharedCourse.course}`)}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                    {post.sharedCourse.course.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    By {post.sharedCourse.course.teacher?.name || 'Instructor'}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-1000"
                          style={{ width: `${post.sharedCourse.overallProgress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {post.sharedCourse.overallProgress || 0}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-blue-500">
                  →
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                isLiked 
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              <Heart className={`w-5 h-5 transition-all duration-300 ${isLiked ? 'fill-current' : ''}`} />
              <span className="font-medium">{post.likes?.length || 0}</span>
            </button>

            <button 
              onClick={() => onShare(post._id)} 
              disabled={post.privacy !== 'public'}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                post.privacy === 'public' 
                  ? 'text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium">{post.shares?.length || 0}</span>
            </button>

            <div className="flex items-center gap-2 px-4 py-2 text-gray-500">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">{post.comments?.length || 0}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>

        {/* Comment section */}
        <CommentSection post={post} onComment={onComment} />
      </div>

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

export default FeedCard
