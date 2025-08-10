import React from 'react'

const CurrentCoursesSection = ({ currentCourses, fmtDate }) => {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Current Courses</h2>
      <div className="space-y-4">
        {currentCourses.map((c, i) => (
          <div key={i} className="rounded-2xl bg-fuchsia-100/10 border border-fuchsia-200/40 p-6">
            <div className="flex items-center justify-between">
              <div className="font-medium">{c.title}</div>
              <div className="text-sm">Completed: {c.progressPct}%</div>
            </div>
            <div className="mt-2 text-sm opacity-80">
              Last Lesson Attended: {c.lastLessonTitle || '—'}
            </div>
            <div className="mt-1 text-xs opacity-70">
              Course started on {fmtDate(c.startedAt)}
            </div>
            {typeof c.percentileInCourse === 'number' && (
              <div className="mt-1 text-xs opacity-70">
                Top {(c.percentileInCourse * 100).toFixed(1)}% of the course participants
              </div>
            )}
          </div>
        ))}
        {!currentCourses.length && <div className="text-sm opacity-70">No active courses.</div>}
      </div>
    </>
  )
}

export default CurrentCoursesSection
