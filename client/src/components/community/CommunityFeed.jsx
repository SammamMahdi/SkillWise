import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, RefreshCw, ArrowLeft } from 'lucide-react'
import CreatePost from './CreatePost'
import FeedCard from './FeedCard'
import PostHighlighter from './PostHighlighter'
import ThreeJSBackground from './ThreeJSBackground'
import CommunityHeader from './CommunityHeader'
import FloatingActionButton from './FloatingActionButton'
import UniversalTopBar from '../common/UniversalTopBar'
import { useCommunityFeed } from '../../hooks/useCommunityFeed'

const CommunityFeed = () => {
  const { postId } = useParams()
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState('all')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [createPostType, setCreatePostType] = useState('blog')
  
  const {
    feed,
    loading,
    currentUserId,
    load,
    loadMore,
    onLike,
    onShare,
    onVote,
    onComment,
    onPostUpdated,
    onPrivacyChange,
    onDelete,
    addNewPost
  } = useCommunityFeed(postId)

  useEffect(() => { 
    load(1)
  }, [postId])

  const handleFilterChange = (filter) => {
    setActiveFilter(filter)
    // Here you could implement actual filtering logic
    // For now, we'll just reload the feed
    load(1)
  }

  const handleOpenCreatePost = () => {
    console.log('Opening create post (blog)')
    setCreatePostType('blog')
    setShowCreatePost(true)
    scrollToCreatePost()
  }

  const handleOpenPoll = () => {
    console.log('Opening create post (poll)')
    setCreatePostType('poll')
    setShowCreatePost(true)
    scrollToCreatePost()
  }

  const handleOpenImagePost = () => {
    console.log('Opening create post (image)')
    setCreatePostType('image')
    setShowCreatePost(true)
    scrollToCreatePost()
  }

  const handleOpenCourseShare = () => {
    console.log('Opening create post (share_course)')
    setCreatePostType('share_course')
    setShowCreatePost(true)
    scrollToCreatePost()
  }

  const handleRefresh = () => {
    load(1)
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  const scrollToCreatePost = () => {
    setTimeout(() => {
      const createPostElement = document.querySelector('[data-create-post]')
      if (createPostElement) {
        const headerOffset = 100 // Adjust this value based on your header height
        const elementPosition = createPostElement.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }, 100)
  }

  const handlePostCreated = (post) => {
    addNewPost(post)
    setShowCreatePost(false)
    setCreatePostType('blog')
  }

  const handleCancelCreatePost = () => {
    setShowCreatePost(false)
    setCreatePostType('blog')
  }
  
  return (
    <>
      <UniversalTopBar />

      {/* Three.js Background */}
      <ThreeJSBackground />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen bg-gradient-to-br from-gray-50/50 via-white/50 to-gray-100/50 dark:from-gray-900/50 dark:via-gray-800/50 dark:to-gray-900/50">
        <div className="max-w-6xl mx-auto">


          
          {/* Community Header */}
          <CommunityHeader 
            onFilterChange={handleFilterChange} 
            activeFilter={activeFilter} 
          />

          {/* Create Post Section */}
          {showCreatePost && (
            <div 
              className="px-6 mb-8 animate-fade-in" 
              data-create-post
              style={{ animationDelay: '0ms' }}
            >
              <CreatePost 
                initialType={createPostType}
                onCreated={handlePostCreated}
                onCancel={handleCancelCreatePost}
              />
              
              {/* Scroll to top button */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 text-sm"
                >
                  <ArrowLeft className="w-4 h-4 rotate-90" />
                  Back to Top
                </button>
              </div>
            </div>
          )}

          {/* Feed Content */}
          <div className="px-6 pb-8">
            {/* Refresh Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-lg"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                {loading ? 'Loading...' : 'Refresh Feed'}
              </button>
            </div>

            {/* Posts Grid */}
            <div className="space-y-8">
              {feed.map((post, index) => (
                <PostHighlighter key={post._id} postId={postId} post={post}>
                  <div 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
        <FeedCard
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
                </PostHighlighter>
              ))}
            </div>

            {/* Load More Button */}
            {feed.length > 0 && (
              <div className="flex justify-center mt-12">
                <button 
                  disabled={loading} 
                  onClick={loadMore} 
                  className="group relative px-8 py-4 bg-gradient-to-r from-primary to-primary/80 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More Posts
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && feed.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">💬</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Be the first to share something with your community! Start a conversation, share your progress, or ask a question.
                </p>
                <button
                  onClick={handleOpenCreatePost}
                  className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Create Your First Post
        </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton
        onOpenCreatePost={handleOpenCreatePost}
        onOpenPoll={handleOpenPoll}
        onOpenImagePost={handleOpenImagePost}
        onOpenCourseShare={handleOpenCourseShare}
      />
    </>
  )
}

export default CommunityFeed


