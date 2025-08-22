import React from 'react'
import { ArrowLeft, Edit, Plus } from 'lucide-react'
import { canSeeInternal } from '../../utils/permissions'

const CourseHeader = ({ course, user, copy, navigate, onEdit, onAddLecture, backTarget }) => {
  return (
    <div className="mb-8">
      <button onClick={backTarget} className="flex items-center gap-2 text-foreground/60 hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </button>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-foreground/70 mt-1">{course.description}</p>

          <div className="mt-2 text-sm text-foreground/70 flex items-center gap-2">
            Public Code: <code>{course.publicCode || '—'}</code>
            {course.publicCode && <button className="opacity-70 hover:opacity-100" onClick={() => copy(course.publicCode)}>Copy</button>}
          </div>
          {canSeeInternal(user) && course.courseCode && (
            <div className="text-sm text-foreground/70 flex items-center gap-2">
              Internal Code: <code>{course.courseCode}</code>
              <button className="opacity-70 hover:opacity-100" onClick={() => copy(course.courseCode)}>Copy</button>
            </div>
          )}
        </div>

        {onEdit && (
          <div className="flex items-center gap-3 ml-4">
            <button onClick={onEdit} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit Course
            </button>
            <button onClick={onAddLecture} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Lecture
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CourseHeader


