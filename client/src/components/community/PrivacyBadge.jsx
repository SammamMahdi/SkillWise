import React, { useState } from 'react'

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

export default PrivacyBadge
