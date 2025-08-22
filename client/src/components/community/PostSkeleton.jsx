import React from 'react'

const PostSkeleton = () => {
  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 p-6 space-y-6 shadow-xl animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-2xl animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-16 animate-pulse" />
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded-full w-20 animate-pulse" />
          </div>
        </div>
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-4/6 animate-pulse" />
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6">
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-xl w-20 animate-pulse" />
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-xl w-20 animate-pulse" />
          <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded-xl w-24 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse" />
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-8 animate-pulse" />
        </div>
      </div>

      {/* Comment section skeleton */}
      <div className="space-y-4">
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded w-24 animate-pulse" />
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32 animate-pulse" />
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-full animate-pulse" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-28 animate-pulse" />
              <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-4/5 animate-pulse" />
            </div>
          </div>
        </div>
        
        {/* Comment input skeleton */}
        <div className="bg-gray-50/80 dark:bg-gray-800/80 rounded-2xl p-4">
          <div className="flex gap-3">
            <div className="flex-1 h-12 bg-gray-300 dark:bg-gray-700 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-xl w-24 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PostSkeleton
