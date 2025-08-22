import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { communityService } from '../../services/communityService'

const SharedContentSection = () => {
  const [sharedContent, setSharedContent] = useState([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadSharedContent()
  }, [])

  const loadSharedContent = async () => {
    setLoading(true)
    try {
      const res = await communityService.getUserSharedContent({ page: 1, limit: 5 })
      if (res.success) {
        setSharedContent(res.data)
      }
    } catch (error) {
      console.error('Failed to load shared content:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const renderPostContent = (post) => {
    // For shared posts, show content from the original post
    const contentPost = post.sharedFrom || post;
    
    if (contentPost.type === 'image' && contentPost.images?.length > 0) {
      return (
        <div className="grid grid-cols-2 gap-2">
          {contentPost.images.slice(0, 2).map((img, idx) => (
            <img 
              key={idx} 
              src={img.webp || img.original} 
              alt="post" 
              className="w-full h-20 object-cover rounded-lg" 
            />
          ))}
        </div>
      )
    }
    
    if (contentPost.type === 'poll' && contentPost.poll?.question) {
      return (
        <div className="text-sm text-gray-400 dark:text-gray-300">
          <span className="font-medium">Poll:</span> {contentPost.poll.question}
        </div>
      )
    }
    
    if (contentPost.type === 'share_course' && contentPost.sharedCourse?.course) {
      return (
        <div className="text-sm text-gray-400 dark:text-gray-300">
          <span className="font-medium">Course:</span>{' '}
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/courses/${contentPost.sharedCourse.course._id || contentPost.sharedCourse.course.id || contentPost.sharedCourse.course}`)
            }}
            className="text-blue-400 dark:text-blue-300 hover:text-blue-300 dark:hover:text-blue-200 underline font-medium transition-colors"
          >
            {contentPost.sharedCourse.course.title}
          </button>
        </div>
      )
    }
    
    return null
  }

  const handlePostClick = (post) => {
    // Navigate to the original post if it's a shared post, otherwise to the post itself
    const postId = post.sharedFrom?._id || post._id
    navigate(`/community/posts/${postId}`)
  }

  if (loading) {
    return (
      <section className="bg-gray-800 dark:bg-gray-900 rounded-xl shadow-sm border border-gray-700 dark:border-gray-600 p-6">
        <h2 className="text-xl font-semibold text-gray-100 dark:text-white mb-4">Shared Content</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-700 dark:bg-gray-600 rounded-lg"></div>
          ))}
        </div>
      </section>
    )
  }

  if (sharedContent.length === 0) {
    return (
      <section className="bg-gray-800 dark:bg-gray-900 rounded-xl shadow-sm border border-gray-700 dark:border-gray-600 p-6">
        <h2 className="text-xl font-semibold text-gray-100 dark:text-white mb-4">Shared Content</h2>
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <div className="text-4xl mb-2">📤</div>
          <p>You haven't shared any posts yet</p>
          <p className="text-sm">Share interesting posts from the community to see them here</p>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-gray-800 dark:bg-gray-900 rounded-xl shadow-sm border border-gray-700 dark:border-gray-600 p-6">
      <h2 className="text-xl font-semibold text-gray-100 dark:text-white mb-4">Shared Content</h2>
      <div className="space-y-4">
        {sharedContent.map((post) => (
          <div 
            key={post._id} 
            className="border border-gray-600 dark:border-gray-500 rounded-lg p-4 hover:bg-gray-700 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={() => handlePostClick(post)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-blue-400 dark:ring-blue-500 flex-shrink-0">
                {post.author?.avatarUrl ? (
                  <img src={post.author.avatarUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {post.author?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-100 dark:text-white">{post.author?.name || 'User'}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">shared</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(post.createdAt)}</span>
                </div>
                
                {post.text && (
                  <p className="text-gray-300 dark:text-gray-200 text-sm mb-2 line-clamp-2">{post.text}</p>
                )}
                
                {/* For shared posts, also show the original post content */}
                {post.sharedFrom && (
                  <div className="mb-2">
                    {post.sharedFrom.title && (
                      <p className="text-gray-200 dark:text-gray-100 text-sm font-medium line-clamp-2 mb-1">
                        {post.sharedFrom.title}
                      </p>
                    )}
                    {post.sharedFrom.text && (
                      <p className="text-gray-300 dark:text-gray-200 text-sm line-clamp-2">
                        {post.sharedFrom.text}
                      </p>
                    )}
                  </div>
                )}
                
                {renderPostContent(post)}
                
                {post.sharedFrom && (
                  <div className="mt-2 p-2 bg-gray-700 dark:bg-gray-800 rounded border-l-4 border-blue-500 dark:border-blue-400">
                    <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">Original post by {post.sharedFrom.author?.name || 'User'}</div>
                    
                    {/* Show the actual content from the original post */}
                    {post.sharedFrom.title && (
                      <div className="font-medium text-sm text-gray-200 dark:text-gray-100 mb-1">
                        {post.sharedFrom.title}
                      </div>
                    )}
                    
                    {post.sharedFrom.text && (
                      <div className="text-sm text-gray-400 dark:text-gray-300 mb-2 line-clamp-2">
                        {post.sharedFrom.text}
                      </div>
                    )}
                    
                    {/* Show original post images if any */}
                    {post.sharedFrom.type === 'image' && post.sharedFrom.images?.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        {post.sharedFrom.images.slice(0, 2).map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img.webp || img.original} 
                            alt="original post" 
                            className="w-full h-16 object-cover rounded-lg" 
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* Show original post poll if any */}
                    {post.sharedFrom.type === 'poll' && post.sharedFrom.poll?.question && (
                      <div className="text-xs text-gray-400 dark:text-gray-300">
                        <span className="font-medium">Poll:</span> {post.sharedFrom.poll.question}
                      </div>
                    )}
                    
                    {/* Show original post course if any */}
                    {post.sharedFrom.type === 'share_course' && post.sharedFrom.sharedCourse?.course && (
                      <div className="text-xs text-gray-400 dark:text-gray-300">
                        <span className="font-medium">Course:</span>{' '}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/courses/${post.sharedFrom.sharedCourse.course._id || post.sharedFrom.sharedCourse.course.id || post.sharedFrom.sharedCourse.course}`)
                          }}
                          className="text-blue-400 dark:text-blue-300 hover:text-blue-300 dark:hover:text-blue-200 underline font-medium transition-colors"
                        >
                          {post.sharedFrom.sharedCourse.course.title}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {sharedContent.length >= 5 && (
        <div className="mt-4 text-center">
          <button 
            onClick={() => loadSharedContent()}
            className="text-blue-400 dark:text-blue-300 hover:text-blue-300 dark:hover:text-blue-200 text-sm font-medium transition-colors"
          >
            View all shared content →
          </button>
        </div>
      )}
    </section>
  )
}

export default SharedContentSection
