import React from 'react'
import { useNavigate } from 'react-router-dom'

const CurrentCoursesSection = ({ currentCourses, fmtDate }) => {
  const navigate = useNavigate()

  const handleCourseClick = (courseId) => {
    if (courseId) {
      navigate(`/courses/${courseId}`)
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
        Current Courses
      </h2>
      <div className="space-y-3 sm:space-y-4">
        {currentCourses.map((c, i) => (
          <div 
            key={c.id || i} 
            className="group relative cursor-pointer"
            onClick={() => handleCourseClick(c.courseId)}
          >
            {/* Background glow effect - reduced */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/3 rounded-xl sm:rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            
            {/* Main card */}
            <div className="relative bg-card/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-primary/20 shadow-lg group-hover:shadow-[0_8px_25px_rgba(124,58,237,0.1)] transition-all duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-primary rounded-full animate-pulse"></div>
                  <div className="font-semibold text-base sm:text-lg text-foreground">{c.title}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-primary">{c.progressPct}%</div>
                  <div className="text-xs sm:text-xs text-foreground/60">Completed</div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mb-3 sm:mb-4">
                <div className="flex items-center justify-between text-xs sm:text-sm text-foreground/70 mb-1.5 sm:mb-2">
                  <span>Progress</span>
                  <span>{c.progressPct}%</span>
                </div>
                <div className="w-full bg-background/50 rounded-full h-1.5 sm:h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${c.progressPct}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Course details */}
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-primary/80">Last Lesson:</span>
                  <span className="font-medium text-foreground">{c.lastLessonTitle || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-primary/80">Started:</span>
                  <span className="font-medium text-foreground">{fmtDate(c.startedAt)}</span>
                </div>
                {c.teacher && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-primary/80">Instructor:</span>
                    <span className="font-medium text-foreground">{c.teacher}</span>
                  </div>
                )}
                  {/* Ranking removed as requested */}
              </div>
              
              {/* Click hint */}
              <div className="mt-3 text-xs text-primary/60 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Click to continue learning
              </div>
            </div>
          </div>
        ))}
        {!currentCourses.length && (
          <div className="bg-card/30 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-border/50 text-center">
            <div className="text-foreground/50 text-base sm:text-lg font-medium">No active courses.</div>
            <div className="text-foreground/30 text-xs sm:text-sm mt-2">Explore our course catalog to get started!</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CurrentCoursesSection
