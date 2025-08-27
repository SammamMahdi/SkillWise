import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Lock, Play, PlayCircle, CheckCircle, ChevronDown, ChevronRight, Video, File, FileText, Clock, Award, Sparkles, Star, TrendingUp, ArrowRight } from 'lucide-react'

const StudentLectureList = ({ course, enrollment, lectureProgress, expandedLectures, toggleLectureExpansion, markLectureComplete, handleViewContent, handleTakeExam }) => {
  const navigate = useNavigate()
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
          <div key={index} className={`group relative bg-white/10 dark:bg-black/10 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 ${
            status === 'completed' ? 'ring-2 ring-green-500/30 bg-green-500/5' :
            status === 'content-completed' ? 'ring-2 ring-blue-500/30 bg-blue-500/5' :
            status === 'unlocked' ? 'ring-2 ring-primary/30 bg-primary/5' :
            'opacity-75'
          }`}>
            {/* Animated background gradient */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
              status === 'completed' ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10' :
              status === 'content-completed' ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10' :
              status === 'unlocked' ? 'bg-gradient-to-r from-primary/10 to-purple-500/10' :
              'bg-gradient-to-r from-gray-500/5 to-slate-500/5'
            }`} />

            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Enhanced Status Icons */}
                  <div className="flex-shrink-0 relative">
                    {status === 'completed' && (
                      <div className="w-14 h-14 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-green-500/30 shadow-lg">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Sparkles className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                    )}
                    {status === 'content-completed' && (
                      <div className="w-14 h-14 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-blue-500/30 shadow-lg">
                        <PlayCircle className="w-8 h-8 text-blue-500" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Star className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                    )}
                    {status === 'unlocked' && (
                      <div className="w-14 h-14 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-primary/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-8 h-8 text-primary" />
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl animate-pulse" />
                      </div>
                    )}
                    {status === 'locked' && (
                      <div className="w-14 h-14 bg-gradient-to-r from-gray-500/20 to-slate-500/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-gray-500/30 shadow-lg">
                        <Lock className="w-8 h-8 text-gray-500" />
                      </div>
                    )}
                  </div>
                  {/* Enhanced Lecture Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">
                          {lecture.title || `Lecture ${index + 1}`}
                        </h3>
                        <p className="text-sm text-foreground/70 line-clamp-2">
                          {lecture.description || 'Explore this comprehensive lesson designed to enhance your understanding.'}
                        </p>
                      </div>

                      {/* Enhanced Status Badges */}
                      <div className="flex flex-col gap-1">
                        {status === 'completed' && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-600 dark:text-green-400 text-xs font-bold rounded-full border border-green-500/30 backdrop-blur-sm">
                            ✨ Complete
                          </span>
                        )}
                        {status === 'content-completed' && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-500/30 backdrop-blur-sm">
                            📚 Content Done
                          </span>
                        )}
                        {status === 'unlocked' && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-primary/20 to-purple-500/20 text-primary text-xs font-bold rounded-full border border-primary/30 backdrop-blur-sm animate-pulse">
                            🚀 Available
                          </span>
                        )}
                        {status === 'locked' && (
                          <span className="px-3 py-1.5 bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-600 dark:text-gray-400 text-xs font-bold rounded-full border border-gray-500/30 backdrop-blur-sm">
                            🔒 {!enrollment ? 'Enroll' : 'Locked'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Metadata */}
                    <div className="flex items-center gap-4 text-sm">
                      {lecture.estimatedDuration && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-black/10 rounded-full backdrop-blur-sm">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">{lecture.estimatedDuration} min</span>
                        </div>
                      )}
                      {hasContent && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-black/10 rounded-full backdrop-blur-sm">
                          <FileText className="w-4 h-4 text-purple-500" />
                          <span className="font-medium">{lecture.content.length} items</span>
                        </div>
                      )}
                      {hasExam && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-black/10 rounded-full backdrop-blur-sm">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">Quiz Required</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* View Lecture Button */}
                {status !== 'locked' && (
                  <button
                    onClick={() => navigate(`/courses/${course._id}/lecture/${index}`)}
                    className="px-4 py-2 bg-gradient-to-r from-primary/20 to-purple-500/20 hover:from-primary/30 hover:to-purple-500/30 text-primary rounded-xl font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-primary/30 flex items-center gap-2 mr-3"
                  >
                    <ArrowRight className="w-4 h-4" />
                    View Lecture
                  </button>
                )}

                {/* Enhanced Expand Button */}
                {status !== 'locked' && (
                  <button
                    onClick={() => toggleLectureExpansion(index)}
                    className="p-3 hover:bg-white/10 dark:hover:bg-black/10 rounded-2xl transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-white/20 dark:border-white/10"
                  >
                    {isExpanded ?
                      <ChevronDown className="w-6 h-6 text-primary" /> :
                      <ChevronRight className="w-6 h-6 text-foreground/60 group-hover:text-primary transition-colors duration-300" />
                    }
                  </button>
                )}
              </div>
            </div>

            {/* Enhanced Expanded Content */}
            {isExpanded && status !== 'locked' && (
              <div className="border-t border-white/20 dark:border-white/10 bg-white/5 dark:bg-black/5 backdrop-blur-sm">
                {/* Enhanced Content Section */}
                {hasContent && (
                  <div className="p-6 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl">
                        <FileText className="w-5 h-5 text-purple-500" />
                      </div>
                      <h4 className="text-lg font-bold text-foreground">Course Materials</h4>
                    </div>

                    <div className="grid gap-4">
                      {lecture.content.map((content, contentIndex) => (
                        <div key={contentIndex} className="group flex items-center justify-between p-4 bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-white/10 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                          <div className="flex items-center gap-4">
                            {/* Enhanced Content Type Icons */}
                            <div className={`p-3 rounded-2xl backdrop-blur-sm ${
                              content.type === 'video' ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30' :
                              content.type === 'pdf' ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30' :
                              'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30'
                            }`}>
                              {content.type === 'video' ?
                                <Video className="w-6 h-6 text-blue-500" /> :
                                content.type === 'pdf' ?
                                <File className="w-6 h-6 text-red-500" /> :
                                <FileText className="w-6 h-6 text-foreground/60" />
                              }
                            </div>

                            <div>
                              <h5 className="font-bold text-foreground group-hover:text-primary transition-colors duration-300">{content.title}</h5>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  content.type === 'video' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                                  content.type === 'pdf' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                                  'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                                }`}>
                                  {content.type === 'video' ? '🎥 Video' : content.type === 'pdf' ? '📄 PDF' : '📝 Content'}
                                </span>
                                {content.duration && (
                                  <span className="text-xs text-foreground/60">
                                    • {Math.floor(content.duration / 60)}:{(content.duration % 60).toString().padStart(2, '0')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleViewContent(content)}
                            className="px-4 py-2 bg-gradient-to-r from-primary/20 to-purple-500/20 hover:from-primary/30 hover:to-purple-500/30 text-primary rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-primary/30"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Enhanced Action Buttons */}
                    <div className="mt-6 space-y-4">
                      {status === 'unlocked' && (
                        <button
                          onClick={() => markLectureComplete(index)}
                          className="w-full py-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Mark as Complete
                        </button>
                      )}

                      {status === 'unlocked' && hasExam && !lectureProgress[index]?.quizPassed && (
                        <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl backdrop-blur-sm">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/20 rounded-xl">
                              <Award className="w-5 h-5 text-yellow-500" />
                            </div>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                              ⚠️ Complete the quiz first to mark this lecture as complete
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Enhanced Quiz Section */}
                {hasExam && (
                  <div className="border-t border-white/20 dark:border-white/10 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 backdrop-blur-sm">
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl backdrop-blur-sm border border-yellow-500/30">
                            <Award className="w-6 h-6 text-yellow-500" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-foreground mb-1">Knowledge Quiz</h4>
                            {lectureProgress[index]?.quizPassed ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium">🎉 Quiz completed successfully!</p>
                              </div>
                            ) : (
                              <p className="text-sm text-foreground/70">Test your understanding of this lecture</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {lectureProgress[index]?.quizPassed ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-500/30 backdrop-blur-sm">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-sm text-green-600 dark:text-green-400 font-bold">Completed</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleTakeExam(lecture.exam)}
                              className="px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 text-yellow-600 dark:text-yellow-400 rounded-2xl font-bold transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-yellow-500/30 flex items-center gap-2"
                            >
                              <TrendingUp className="w-4 h-4" />
                              Take Quiz
                            </button>
                          )}
                        </div>
                      </div>
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


