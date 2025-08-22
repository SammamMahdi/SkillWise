import React from 'react'

const CourseSidebar = ({ course, user, price, dur, isEnrolled, enrolling, doEnroll, doUnenroll, navigate, id, canSeeInternal }) => {
  return (
    <aside className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">{price(course.price)}</span>
          {course.price === 0 && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">Free</span>
          )}
        </div>

        {user?.role === 'Student' && (
          <button
            onClick={isEnrolled ? doUnenroll : doEnroll}
            disabled={enrolling}
            className={`w-full mt-4 py-3 px-4 rounded-lg font-medium transition-colors ${
              isEnrolled ? 'bg-rose-500 hover:bg-rose-600' : 'bg-primary hover:bg-primary/80'
            } text-white disabled:opacity-50`}
          >
            {enrolling ? (isEnrolled ? 'Unenrolling…' : 'Enrolling…') : (isEnrolled ? 'Unenroll' : 'Enroll')}
          </button>
        )}

        {isEnrolled && user?.role === 'Student' && (
          <button
            onClick={() => navigate(`/courses/${id}`)}
            className="w-full mt-3 py-3 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium"
          >
            Continue Learning
          </button>
        )}

        <div className="mt-6 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">Instructor</span>
            <span className="font-medium">{course.teacher?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">Duration</span>
            <span className="font-medium">{dur(course.lectures)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">Lectures</span>
            <span className="font-medium">{course.lectures?.length || 0}</span>
          </div>
        </div>
      </div>

      {course.tags?.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {course.tags.map((t, i) => (
              <span key={`${t}-${i}`} className="px-2 py-1 bg-primary/20 text-primary rounded-full text-xs">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {canSeeInternal(user) && course.courseCode && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-sm text-foreground/70 flex items-center gap-2">
            Internal Course Code: <code>{course.courseCode}</code>
          </div>
        </div>
      )}
    </aside>
  )
}

export default CourseSidebar


