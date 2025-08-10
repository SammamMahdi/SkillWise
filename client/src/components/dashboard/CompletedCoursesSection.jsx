import React from 'react'
import { useNavigate } from 'react-router-dom'

const CompletedCoursesSection = ({ completedCourses, fmtDate }) => {
  const navigate = useNavigate()

  const handleCourseClick = (courseId) => {
    if (courseId) {
      navigate(`/courses/${courseId}`)
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
        Completed Courses
      </h2>
      <div className="space-y-3 sm:space-y-4">
        {completedCourses.map((c, i) => (
          <div 
            key={c.id || i} 
            className="group relative cursor-pointer"
            onClick={() => handleCourseClick(c.courseId)}
          >
            {/* Background glow effect - reduced */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-green-400/3 rounded-xl sm:rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            
            {/* Main card */}
            <div className="relative bg-card/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-500/20 shadow-lg group-hover:shadow-[0_8px_25px_rgba(34,197,94,0.1)] transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                  <div className="font-semibold text-base sm:text-lg text-foreground">{c.title}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm font-medium text-green-400">Completed: 100%</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-foreground/70">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-green-400">Started:</span>
                  <span className="font-medium">{fmtDate(c.startedAt)}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-green-400">Finished:</span>
                  <span className="font-medium">{fmtDate(c.finishedAt)}</span>
                </div>
              </div>
              
              {/* Additional course info */}
              {c.teacher && (
                <div className="mt-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-green-400">Instructor:</span>
                    <span className="font-medium text-foreground/80">{c.teacher}</span>
                  </div>
                </div>
              )}
              
              {/* Click hint */}
              <div className="mt-3 text-xs text-green-400/60 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Click to view course details
              </div>
            </div>
          </div>
        ))}
        {!completedCourses.length && (
          <div className="bg-card/30 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-border/50 text-center">
            <div className="text-foreground/50 text-base sm:text-lg font-medium">No completed courses yet.</div>
            <div className="text-foreground/30 text-xs sm:text-sm mt-2">Start your learning journey today!</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompletedCoursesSection
