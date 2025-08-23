import React, { useState, useEffect } from 'react'
import { TrendingUp, Users, Sparkles, Filter } from 'lucide-react'
import { communityService } from '../../services/communityService'

const CommunityHeader = ({ onFilterChange, activeFilter }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [stats, setStats] = useState({
    posts: 0,
    members: 0,
    trending: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await communityService.getCommunityStats()
        
        if (response.success) {
          setStats({
            posts: response.data.totalPosts,
            members: response.data.totalMembers,
            trending: response.data.trendingToday
          })
        }
      } catch (error) {
        console.error('Failed to fetch community stats:', error)
        // Fallback to default values if API fails
        setStats({
          posts: 0,
          members: 0,
          trending: 0
        })
      } finally {
        setLoading(false)
        // Animate in after data loads
        setTimeout(() => {
          setIsVisible(true)
        }, 100)
      }
    }

    fetchStats()
  }, [])

  const filters = [
    { id: 'all', label: 'All Posts', icon: '🌍' },
    { id: 'trending', label: 'Trending', icon: '🔥' },
    { id: 'recent', label: 'Recent', icon: '⚡' },
    { id: 'popular', label: 'Popular', icon: '⭐' }
  ]

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-float" />
        <div className="absolute top-10 right-1/3 w-1 h-1 bg-primary/40 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-20 left-1/2 w-1.5 h-1.5 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative px-6 py-8">
        {/* Main header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent mb-4">
            Community Hub
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Connect, share, and grow with your learning community. Discover insights, share experiences, and build meaningful connections.
          </p>
        </div>

        {/* Stats cards */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Posts</p>
                {loading ? (
                  <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.posts.toLocaleString()}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Community Members</p>
                {loading ? (
                  <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.members.toLocaleString()}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Trending Today</p>
                {loading ? (
                  <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                ) : (
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.trending.toLocaleString()}</p>
                )}
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-3">
          {filters.map((filter, index) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`group relative px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${
                activeFilter === filter.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-primary/10 hover:text-primary border border-white/20'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <span className="mr-2">{filter.icon}</span>
              {filter.label}
              {activeFilter === filter.id && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CommunityHeader
