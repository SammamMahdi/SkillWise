import React, { useState, useEffect } from 'react'
import { communityService } from '../../services/communityService'

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public', icon: '🌍' },
  { value: 'friends', label: 'Friends', icon: '👥' },
  { value: 'only_me', label: 'Only Me', icon: '🔒' }
]

const EditPostModal = ({ post, isOpen, onClose, onPostUpdated }) => {
  const [formData, setFormData] = useState({
    title: '',
    text: '',
    privacy: 'public'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (post && isOpen) {
      setFormData({
        title: post.title || '',
        text: post.text || '',
        privacy: post.privacy || 'public'
      })
      setError('')
    }
  }, [post, isOpen])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.text.trim() && !formData.title.trim()) {
      setError('Post must have either title or text content')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Update post content
      const editRes = await communityService.editPost(post._id, {
        title: formData.title.trim() || undefined,
        text: formData.text.trim() || undefined
      })

      if (editRes.success) {
        // Update privacy if changed
        if (formData.privacy !== post.privacy) {
          await communityService.updatePostPrivacy(post._id, formData.privacy)
        }

        onPostUpdated(editRes.data)
        onClose()
      } else {
        setError(editRes.message || 'Failed to update post')
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating the post')
    } finally {
      setLoading(false)
    }
  }

  const handlePrivacyChange = async (newPrivacy) => {
    if (newPrivacy === formData.privacy) return

    setLoading(true)
    try {
      const res = await communityService.updatePostPrivacy(post._id, newPrivacy)
      if (res.success) {
        setFormData(prev => ({ ...prev, privacy: newPrivacy }))
        // Update the post in the parent component
        onPostUpdated({ ...post, privacy: newPrivacy })
      }
    } catch (err) {
      setError('Failed to update privacy setting')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !post) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Post</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Privacy Settings */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Privacy Settings
            </label>
            <div className="flex gap-3">
              {PRIVACY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handlePrivacyChange(option.value)}
                  disabled={loading}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                    formData.privacy === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title Input */}
          {post.type === 'blog' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter post title..."
                disabled={loading}
              />
            </div>
          )}

          {/* Text Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {post.type === 'blog' ? 'Content' : 'Text'}
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => handleInputChange('text', e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              placeholder={post.type === 'blog' ? 'Write your blog content...' : 'Write your post...'}
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!formData.text.trim() && !formData.title.trim())}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditPostModal
