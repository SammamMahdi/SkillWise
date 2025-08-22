import React, { useState } from 'react'
import { Plus, MessageCircle, Image, BarChart3, BookOpen } from 'lucide-react'

const FloatingActionButton = ({ onOpenCreatePost, onOpenPoll, onOpenImagePost, onOpenCourseShare }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleAction = (action) => {
    setIsExpanded(false)
    action()
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Action buttons */}
      <div className={`space-y-4 transition-all duration-300 ease-out ${
        isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}>
        {/* Course Share Button */}
        <button
          onClick={() => handleAction(onOpenCourseShare)}
          className="group flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
          title="Share Course"
        >
          <BookOpen className="w-6 h-6 text-white" />
          <div className="absolute right-16 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Share Course
          </div>
        </button>

        {/* Poll Button */}
        <button
          onClick={() => handleAction(onOpenPoll)}
          className="group flex items-center justify-center w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
          title="Create Poll"
        >
          <BarChart3 className="w-6 h-6 text-white" />
          <div className="absolute right-16 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Create Poll
          </div>
        </button>

        {/* Image Post Button */}
        <button
          onClick={() => handleAction(onOpenImagePost)}
          className="group flex items-center justify-center w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
          title="Share Image"
        >
          <Image className="w-6 h-6 text-white" />
          <div className="absolute right-16 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Share Image
          </div>
        </button>

        {/* Text Post Button */}
        <button
          onClick={() => handleAction(onOpenCreatePost)}
          className="group flex items-center justify-center w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
          title="Write Post"
        >
          <MessageCircle className="w-6 h-6 text-white" />
          <div className="absolute right-16 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Write Post
          </div>
        </button>
      </div>

      {/* Main FAB */}
      <button
        onClick={toggleExpanded}
        className={`flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-full shadow-2xl hover:shadow-primary/25 transform transition-all duration-300 ${
          isExpanded ? 'rotate-45 scale-110' : 'hover:scale-110'
        }`}
        title={isExpanded ? 'Close' : 'Create Post'}
      >
        <Plus className={`w-8 h-8 text-white transition-transform duration-300 ${
          isExpanded ? 'rotate-45' : ''
        }`} />
      </button>
    </div>
  )
}

export default FloatingActionButton
