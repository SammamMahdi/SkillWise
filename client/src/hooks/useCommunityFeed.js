import { useState, useEffect } from 'react'
import { communityService } from '../services/communityService'
import { notificationService } from '../services/notificationService'

export const useCommunityFeed = (postId) => {
  const [feed, setFeed] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)

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

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    load(nextPage)
  }

  // Load all posts across pages to allow global sorting (comments/likes)
  const loadAllForSorting = async (perPage = 20, maxPages = 100) => {
    let aggregated = []
    let currentPage = 1
    let keepFetching = true
    setLoading(true)
    try {
      while (keepFetching && currentPage <= maxPages) {
        const res = await communityService.fetchFeed({ page: currentPage, limit: perPage })
        if (!res.success || !Array.isArray(res.data) || res.data.length === 0) {
          break
        }
        aggregated = aggregated.concat(res.data)
        if (res.data.length < perPage) {
          keepFetching = false
        } else {
          currentPage += 1
        }
      }
    } finally {
      setLoading(false)
    }
    return aggregated
  }

  const onLike = async (postId) => {
    const res = await communityService.like(postId)
    if (res.success) {
      setFeed(prev => prev.map(p => 
        p._id === postId ? { ...p, likes: new Array(res.data.likes).fill(0) } : p
      ))
    }
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
        setFeed(prev => prev.map(p => 
          p._id === postId ? { ...p, shares: new Array(res.data.shares).fill(0) } : p
        ))
        
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
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) return

    // Determine if current user is the author; if not, allow entering a reason (for admins)
    const post = feed.find(p => p._id === postId)
    let reason
    if (post && post.author && post.author._id && post.author._id.toString() !== currentUserId?.toString()) {
      reason = window.prompt('Reason for deletion (sent to the author):', 'Violation of community guidelines')
      if (reason === null) return // cancelled
    }

    const res = await communityService.deletePost(postId, reason)
    if (res.success) {
      setFeed(prev => prev.filter(p => p._id !== postId))
    } else if (res.message) {
      alert(res.message)
    }
  }

  const addNewPost = (post) => {
    setFeed(prev => [post, ...prev])
  }

  const replaceFeed = (posts) => {
    setFeed(Array.isArray(posts) ? posts : [])
  }

  return {
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
    ,
    loadAllForSorting,
    replaceFeed
  }
}
