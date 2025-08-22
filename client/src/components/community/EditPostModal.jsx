import React, { useState, useEffect } from 'react'
import { X, Globe, Users, Lock, Edit3, Save, AlertCircle } from 'lucide-react'
import { communityService } from '../../services/communityService'

const PRIVACY_OPTIONS = [
  { value: 'public', label: 'Public', icon: Globe, description: 'Visible to everyone' },
  { value: 'friends', label: 'Friends', icon: Users, description: 'Visible to friends only' },
  { value: 'only_me', label: 'Only Me', icon: Lock, description: 'Visible only to you' }
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
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Post</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Update your post content and privacy</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Privacy Settings */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Privacy Settings
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PRIVACY_OPTIONS.map(option => {
                const IconComponent = option.icon
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handlePrivacyChange(option.value)}
                    disabled={loading}
                    className={`group p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                      formData.privacy === option.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        formData.privacy === option.value
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                      }`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            
            {/* Privacy information */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs">ℹ</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formData.privacy === 'public' ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">🌍 Public posts can be viewed and shared by everyone</span>
                  ) : formData.privacy === 'friends' ? (
                    <span className="text-blue-600 dark:text-blue-400 font-medium">👥 Friends-only posts can only be viewed by your friends</span>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400 font-medium">🔒 Private posts are only visible to you</span>
                  )}
                  {formData.privacy !== 'public' && (
                    <div className="mt-1 text-gray-500 dark:text-gray-500">
                      Note: Only public posts can be shared by other users
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Title Input */}
          {post.type === 'blog' && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                placeholder="Enter post title..."
                disabled={loading}
              />
            </div>
          )}

          {/* Text Input */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {post.type === 'blog' ? 'Content' : 'Text'}
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => handleInputChange('text', e.target.value)}
              rows={6}
              className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              placeholder={post.type === 'blog' ? 'Write your blog content...' : 'Write your post...'}
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200">Error</h4>
                  <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!formData.text.trim() && !formData.title.trim())}
              className="group relative flex-1 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Post
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditPostModal
