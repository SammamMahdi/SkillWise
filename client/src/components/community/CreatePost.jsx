import React, { useEffect, useMemo, useState } from 'react'
import { Send, Image as ImageIcon, BarChart3, MessageSquare, BookOpen, X, Plus, Globe, Users, Lock } from 'lucide-react'
import { communityService } from '../../services/communityService'

const PRIVACY = [
  { value: 'public', label: 'Public', icon: Globe, description: 'Visible to everyone' },
  { value: 'friends', label: 'Friends', icon: Users, description: 'Visible to friends only' },
  { value: 'only_me', label: 'Only Me', icon: Lock, description: 'Visible only to you' },
]

const TYPE_TABS = [
  { value: 'blog', label: 'Blog', icon: MessageSquare, color: 'from-orange-500 to-orange-600' },
  { value: 'image', label: 'Images', icon: ImageIcon, color: 'from-purple-500 to-purple-600' },
  { value: 'poll', label: 'Poll', icon: BarChart3, color: 'from-green-500 to-green-600' },
  { value: 'debate', label: 'Debate', icon: MessageSquare, color: 'from-red-500 to-red-600' },
  { value: 'share_course', label: 'Share Course', icon: BookOpen, color: 'from-blue-500 to-blue-600' },
]

const CreatePost = ({ onCreated, onCancel, initialType = 'blog' }) => {
  const [type, setType] = useState(initialType)
  const [privacy, setPrivacy] = useState('public')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState([{ optionId: 'a', text: '' }, { optionId: 'b', text: '' }])
  const [debateTopic, setDebateTopic] = useState('')
  const [enrollments, setEnrollments] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update type when initialType changes
  useEffect(() => {
    setType(initialType)
  }, [initialType])

  useEffect(() => {
    if (type === 'share_course') {
      communityService.getShareableEnrollments().then(res => {
        if (res.success) setEnrollments(res.data)
      })
    }
  }, [type])

  const onImageFiles = async (files) => {
    setUploading(true)
    try {
      const arr = Array.from(files)
      const res = await communityService.uploadImages(arr)
      if (res.success) setImages(prev => [...prev, ...res.data])
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const canSubmit = useMemo(() => {
    if (type === 'blog') return title.trim() || text.trim()
    if (type === 'image') return images.length > 0
    if (type === 'poll') return pollQuestion.trim() && pollOptions.every(o => o.text.trim())
    if (type === 'debate') return debateTopic.trim()
    if (type === 'share_course') return !!selectedCourseId
    return false
  }, [type, title, text, images, pollQuestion, pollOptions, debateTopic, selectedCourseId])

  const submit = async () => {
    if (!canSubmit) return
    
    setIsSubmitting(true)
    try {
      const payload = { type, privacy }
      if (type === 'blog') Object.assign(payload, { title, text })
      if (type === 'image') Object.assign(payload, { images, text })
      if (type === 'poll') Object.assign(payload, { poll: { question: pollQuestion, options: pollOptions } })
      if (type === 'debate') Object.assign(payload, { debateTopic, text })
      if (type === 'share_course') {
        const chosen = enrollments.find(e => (e.course?._id || e.course?.id || e.course) === selectedCourseId)
        if (chosen) Object.assign(payload, { sharedCourse: {
          course: selectedCourseId,
          enrolledAt: chosen.enrolledAt,
          overallProgress: chosen.overallProgress,
          currentLectureIndex: chosen.currentLectureIndex
        }})
      }
      
      const res = await communityService.createPost(payload)
      if (res.success) {
        onCreated?.(res.data)
        // Reset form
        setTitle('')
        setText('')
        setImages([])
        setPollQuestion('')
        setPollOptions([{ optionId: 'a', text: '' }, { optionId: 'b', text: '' }])
        setDebateTopic('')
        setSelectedCourseId('')
        setType(initialType)
        setPrivacy('public')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setText('')
    setImages([])
    setPollQuestion('')
    setPollOptions([{ optionId: 'a', text: '' }, { optionId: 'b', text: '' }])
    setDebateTopic('')
    setSelectedCourseId('')
    setType(initialType)
    setPrivacy('public')
    onCancel?.()
  }

  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 p-8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Post</h2>
        {onCancel && (
          <button
            onClick={resetForm}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Type Selection Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        {TYPE_TABS.map(tab => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.value}
              onClick={() => setType(tab.value)}
              className={`group flex items-center gap-2 px-4 py-3 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                type === tab.value
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Privacy Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Privacy Settings
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRIVACY.map(option => {
            const IconComponent = option.icon
            return (
              <button
                key={option.value}
                onClick={() => setPrivacy(option.value)}
                className={`group p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                  privacy === option.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-primary/50 hover:bg-primary/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    privacy === option.value
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
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-primary text-xs">ℹ</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {privacy === 'public' ? (
                <span className="text-green-600 dark:text-green-400 font-medium">🌍 Public posts can be viewed and shared by everyone</span>
              ) : privacy === 'friends' ? (
                <span className="text-blue-600 dark:text-blue-400 font-medium">👥 Friends-only posts can only be viewed by your friends</span>
              ) : (
                <span className="text-gray-600 dark:text-gray-400 font-medium">🔒 Private posts are only visible to you</span>
              )}
              {privacy !== 'public' && (
                <div className="mt-1 text-gray-500 dark:text-gray-500">
                  Note: Only public posts can be shared by other users
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Forms */}
      <div className="space-y-6">
        {type === 'blog' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title (optional)
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Give your post a catchy title..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Share your thoughts, experiences, or insights..."
                className="w-full px-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-32 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>
          </div>
        )}

        {type === 'image' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Images
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors duration-200">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => onImageFiles(e.target.files)}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <div className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-primary hover:text-primary/80">Click to upload</span> or drag and drop
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    PNG, JPG, GIF up to 10MB
                  </div>
                </label>
              </div>
            </div>
            
            {uploading && (
              <div className="flex items-center gap-2 text-primary">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-sm">Uploading images...</span>
              </div>
            )}
            
            {images.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview ({images.length} images)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img.webp || img.original}
                        alt="preview"
                        className="w-full h-32 object-cover rounded-2xl"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (optional)
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Say something about these images..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>
          </div>
        )}

        {type === 'poll' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Poll Question
              </label>
              <input
                value={pollQuestion}
                onChange={e => setPollQuestion(e.target.value)}
                placeholder="What would you like to ask?"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Poll Options
              </label>
              <div className="space-y-3">
                {pollOptions.map((opt, idx) => (
                  <div key={opt.optionId} className="flex gap-3">
                    <div className="w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <input
                      value={opt.text}
                      onChange={e => setPollOptions(prev => prev.map((o, i) => i === idx ? { ...o, text: e.target.value } : o))}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => setPollOptions(prev => [...prev, { optionId: Math.random().toString(36).slice(2, 7), text: '' }])}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </button>
                {pollOptions.length > 2 && (
                  <button
                    onClick={() => setPollOptions(prev => prev.slice(0, -1))}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Remove Last
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {type === 'debate' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Debate Topic
              </label>
              <input
                value={debateTopic}
                onChange={e => setDebateTopic(e.target.value)}
                placeholder="What's the debate about?"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Opening Statement (optional)
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Share your initial thoughts or position..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>
          </div>
        )}

        {type === 'share_course' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Course
              </label>
              <select
                value={selectedCourseId}
                onChange={e => setSelectedCourseId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              >
                <option value="">Choose one of your enrolled courses</option>
                {enrollments.map(en => (
                  <option key={en.course?._id || en.course?.id || en.course} value={en.course?._id || en.course?.id || en.course}>
                    {en.course?.title} - {en.overallProgress || 0}% complete
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Share Your Journey (optional)
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Tell others about your learning experience..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 min-h-24 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <button
            onClick={resetForm}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Cancel
          </button>
        )}
        <button
          disabled={!canSubmit || isSubmitting}
          onClick={submit}
          className="group relative px-8 py-3 bg-gradient-to-r from-primary to-primary/80 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
        >
          <span className="relative z-10 flex items-center gap-2">
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Create Post
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>
    </div>
  )
}

export default CreatePost




