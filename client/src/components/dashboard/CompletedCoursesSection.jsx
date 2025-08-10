import React from 'react'

const CompletedCoursesSection = ({ completedCourses, fmtDate }) => {
  return (
    <>
      <h2 className="text-xl font-semibold mt-6 mb-4">Completed Courses</h2>
      <div className="space-y-4">
        {completedCourses.map((c, i) => (
          <div key={i} className="rounded-2xl bg-card shadow-sm border border-border p-6">
            <div className="flex items-center justify-between">
              <div className="font-medium">{c.title}</div>
              <div className="text-sm opacity-80">Completed: 100%</div>
            </div>
            <div className="mt-2 text-sm grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-80">
              <div>Course started on {fmtDate(c.startedAt)}</div>
              <div>Course finished on {fmtDate(c.finishedAt)}</div>
            </div>
          </div>
        ))}
        {!completedCourses.length && <div className="text-sm opacity-70">No completed courses yet.</div>}
      </div>
    </>
  )
}

export default CompletedCoursesSection
