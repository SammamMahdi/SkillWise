import React from 'react'
import { ChevronDown, ChevronRight, Lock, Play, Edit, FileText, Eye } from 'lucide-react'
import { canSeeInternal } from '../../utils/permissions'

const CourseContent = ({ course, user, expandedLectures, toggleLectureExpansion, renderContentItem, onAddLecture, navigate, canEdit }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Course Content</h2>
        <div className="flex items-center gap-4">
          <div className="text-xs text-foreground/70">Lectures: {course.lectures?.length || 0}</div>
          {canEdit && (
            <button onClick={onAddLecture} className="px-3 py-1 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-1 text-sm">
              Add Lecture
            </button>
          )}
        </div>
      </div>

      {course.lectures?.length ? (
        <div className="space-y-3">
          {course.lectures.map((lec, i) => {
            const isExpanded = expandedLectures.has(lec._id || i)
            const hasContent = lec.content && lec.content.length > 0
            return (
              <div key={lec._id || i} className="bg-background rounded-lg border">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1">
                    <button onClick={() => toggleLectureExpansion(lec._id || i)} className="p-1 hover:bg-accent rounded transition-colors">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {lec.isLocked ? <Lock className="w-5 h-5 text-foreground/40" /> : <Play className="w-5 h-5 text-primary" />}
                    <div className="flex-1">
                      <h3 className="font-medium">{lec.title || `Lecture ${i + 1}`}</h3>
                      <p className="text-sm text-foreground/60">
                        {lec.isExam ? 'Exam' : 'Lecture'}
                        {canSeeInternal(user) && lec.lectureCode && (<> • Internal: <code>{lec.lectureCode}</code></>)}
                        {hasContent && ` • ${lec.content.length} items`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <button onClick={() => navigate(`/courses/${course._id}/lectures/${lec._id || i}/edit`)} className="p-2 text-foreground/60 hover:text-foreground hover:bg-accent rounded-lg transition-colors" title="Edit lecture">
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {isExpanded && hasContent && (
                  <div className="border-t border-border p-4 space-y-3">
                    <h4 className="font-medium text-sm text-foreground/80">Content</h4>
                    {lec.content.map((content, contentIndex) => renderContentItem(content, contentIndex))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
          <p className="text-foreground/60">No lectures available yet.</p>
        </div>
      )}
    </div>
  )
}

export default CourseContent


