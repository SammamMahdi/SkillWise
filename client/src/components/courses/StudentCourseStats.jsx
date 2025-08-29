import React from 'react'
import { Star } from 'lucide-react'

const StudentCourseStats = ({ course, enrollment, progress, serverProgress }) => {
  return (
    <div className="space-y-6">
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Course Overview</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">Instructor</span>
            <span className="font-medium">{course.teacher?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">Lectures</span>
            <span className="font-medium">{course.lectures?.length || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">Duration</span>
            <span className="font-medium">{course.lectures?.reduce((total, l) => total + (l.estimatedDuration || 0), 0)} min</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">Rating</span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="font-medium">
                {course.ratingStats?.averageRating ? `${course.ratingStats.averageRating.toFixed(1)}/5` : 'No ratings'}
              </span>
              {course.ratingStats?.totalRatings > 0 && (
                <span className="text-foreground/40 text-sm">({course.ratingStats.totalRatings})</span>
              )}
            </div>
          </div>
          {enrollment && (
            <div className="flex items-center justify-between">
              <span className="text-foreground/60">Your Progress</span>
              <span className="font-medium text-primary">{typeof serverProgress === 'number' ? Math.round(serverProgress) : progress}%</span>
            </div>
          )}
        </div>
      </div>

      {course.tags?.length > 0 && (
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {course.tags.map((tag, index) => (
              <span key={index} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentCourseStats


