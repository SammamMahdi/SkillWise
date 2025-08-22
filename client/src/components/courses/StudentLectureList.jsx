import React from 'react'
import { BookOpen, Lock, Play, PlayCircle, CheckCircle, ChevronDown, ChevronRight, Video, File, FileText, Clock, Award } from 'lucide-react'

const StudentLectureList = ({ course, enrollment, lectureProgress, expandedLectures, toggleLectureExpansion, markLectureComplete, handleViewContent, handleTakeExam }) => {
  const getStatus = (lecture, index) => {
    const progress = lectureProgress[index]
    if (progress?.completed && progress?.quizPassed) return 'completed'
    if (progress?.completed) return 'content-completed'
    if (!enrollment) return 'locked'
    if (index === 0) return 'unlocked'
    const prev = lectureProgress[index - 1]
    return prev?.completed && (!lecture.exam || prev?.quizPassed) ? 'unlocked' : 'locked'
  }

  return (
    <div className="space-y-4">
      {course.lectures.map((lecture, index) => {
        const status = getStatus(lecture, index)
        const isExpanded = expandedLectures.has(index)
        const hasContent = lecture.content && lecture.content.length > 0
        const hasExam = lecture.exam
        return (
          <div key={index} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex-shrink-0">
                    {status === 'completed' && (
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      </div>
                    )}
                    {status === 'content-completed' && (
                      <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <PlayCircle className="w-6 h-6 text-blue-500" />
                      </div>
                    )}
                    {status === 'unlocked' && (
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    {status === 'locked' && (
                      <div className="w-10 h-10 bg-gray-500/20 rounded-full flex items-center justify-center">
                        <Lock className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{lecture.title || `Lecture ${index + 1}`}</h3>
                      {status === 'locked' && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-500 text-xs rounded-full">{!enrollment ? 'Enroll to Access' : 'Locked'}</span>
                      )}
                      {status === 'content-completed' && (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-500 text-xs rounded-full">Content Complete</span>
                      )}
                      {status === 'completed' && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs rounded-full">Complete</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-foreground/60">
                      {lecture.estimatedDuration && (
                        <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{lecture.estimatedDuration} min</span></div>
                      )}
                      {hasContent && (
                        <div className="flex items-center gap-1"><FileText className="w-4 h-4" /><span>{lecture.content.length} items</span></div>
                      )}
                      {hasExam && (
                        <div className="flex items-center gap-1"><Award className="w-4 h-4" /><span>Quiz Required</span></div>
                      )}
                    </div>
                  </div>
                </div>
                {status !== 'locked' && (
                  <button onClick={() => toggleLectureExpansion(index)} className="p-2 hover:bg-accent/50 rounded-lg transition-colors">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>
            {isExpanded && status !== 'locked' && (
              <div className="border-t border-border/50 bg-background/30">
                {hasContent && (
                  <div className="p-6 space-y-4">
                    <h4 className="font-medium text-foreground/80">Content</h4>
                    <div className="space-y-3">
                      {lecture.content.map((content, contentIndex) => (
                        <div key={contentIndex} className="flex items-center justify-between p-4 bg-card/50 rounded-xl border border-border/30">
                          <div className="flex items-center gap-3">
                            {content.type === 'video' ? <Video className="w-5 h-5 text-blue-500" /> : content.type === 'pdf' ? <File className="w-5 h-5 text-red-500" /> : <FileText className="w-5 h-5 text-foreground/60" />}
                            <div>
                              <h5 className="font-medium text-sm">{content.title}</h5>
                              <p className="text-xs text-foreground/60">{content.type === 'video' ? 'Video' : content.type === 'pdf' ? 'PDF Document' : 'Content'}{content.duration && ` • ${Math.floor(content.duration / 60)}:${(content.duration % 60).toString().padStart(2, '0')}`}</p>
                            </div>
                          </div>
                          <button onClick={() => handleViewContent(content)} className="px-3 py-1 bg-primary/20 text-primary rounded-lg text-sm hover:bg-primary/30 transition-colors">View</button>
                        </div>
                      ))}
                    </div>
                    {status === 'unlocked' && (
                      <button onClick={() => markLectureComplete(index)} className="w-full mt-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors">Mark as Complete</button>
                    )}
                    {status === 'unlocked' && hasExam && !lectureProgress[index]?.quizPassed && (
                      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm text-yellow-700">⚠️ You must complete the quiz before marking this lecture as complete.</p>
                      </div>
                    )}
                  </div>
                )}
                {hasExam && (
                  <div className="p-6 border-t border-border/50 bg-accent/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-foreground/80 mb-2">Quiz</h4>
                        {lectureProgress[index]?.quizPassed ? (
                          <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /><p className="text-sm text-green-600">Quiz completed!</p></div>
                        ) : (
                          <p className="text-sm text-foreground/60">Complete this quiz to unlock the next lecture</p>
                        )}
                      </div>
                      {lectureProgress[index]?.quizPassed ? (
                        <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-sm text-green-600 font-medium">Completed</span></div>
                      ) : (
                        <button onClick={() => handleTakeExam(lecture.exam)} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors">Take Quiz</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default StudentLectureList


