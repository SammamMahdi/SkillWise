import React, { useEffect } from 'react';
import { 
  Play, Lock, CheckCircle, Clock, Award, FileText, 
  ChevronRight, PlayCircle 
} from 'lucide-react';

/**
 * LectureSidebar Component
 * 
 * Displays a vertical navigation bar listing all lectures in the course.
 * Highlights the current lecture and manages lecture accessibility based on progress.
 * 
 * @param {Object} props
 * @param {Object} props.course - Course data containing lectures
 * @param {Object} props.enrollment - User enrollment data
 * @param {Object} props.lectureProgress - Progress tracking for each lecture
 * @param {number} props.currentLectureIndex - Index of currently selected lecture
 * @param {function} props.onLectureSelect - Callback when lecture is selected
 */
const LectureSidebar = ({ 
  course, 
  enrollment, 
  lectureProgress, 
  currentLectureIndex, 
  onLectureSelect 
}) => {
  
  // Debug: Log when lectureProgress changes
  useEffect(() => {
    console.log('LectureSidebar: lectureProgress updated:', lectureProgress);
  }, [lectureProgress]);
  
  /**
   * Determines if a lecture is unlocked based on enrollment and progress
   * @param {number} lectureIndex - Index of the lecture to check
   * @returns {boolean} - Whether the lecture is accessible
   */
  const isLectureUnlocked = (lectureIndex) => {
    if (!enrollment) return false; // Non-enrolled students can't access any lectures
    if (lectureIndex === 0) return true; // First lecture is always unlocked for enrolled students
    
    // Check if previous lecture is completed and quiz passed (if applicable)
    const previousLecture = course.lectures[lectureIndex - 1];
    const previousProgress = lectureProgress[lectureIndex - 1];
    
    console.log(`Checking unlock for lecture ${lectureIndex}:`, {
      previousLecture: previousLecture?.title,
      previousProgress,
      hasExam: !!previousLecture?.exam
    });
    
    if (!previousProgress?.completed) {
      console.log(`Lecture ${lectureIndex} locked: previous lecture not completed`);
      return false;
    }
    
    // If previous lecture has a quiz, it must be passed
    if (previousLecture?.exam && !previousProgress?.quizPassed) {
      console.log(`Lecture ${lectureIndex} locked: previous lecture quiz not passed`);
      return false;
    }
    
    console.log(`Lecture ${lectureIndex} unlocked`);
    return true;
  };

  /**
   * Gets the status of a lecture for UI styling and behavior
   * @param {number} lectureIndex - Index of the lecture
   * @returns {string} - Status: 'completed', 'content-completed', 'unlocked', or 'locked'
   */
  const getLectureStatus = (lectureIndex) => {
    const progress = lectureProgress[lectureIndex];
    const lecture = course.lectures[lectureIndex];
    
    // Fully completed: content viewed and quiz passed (if applicable)
    if (progress?.completed && (!lecture?.exam || progress?.quizPassed)) {
      return 'completed';
    }
    
    // Content completed but quiz not passed
    if (progress?.completed && lecture?.exam && !progress?.quizPassed) {
      return 'content-completed';
    }
    
    // Accessible but not started
    if (isLectureUnlocked(lectureIndex)) {
      return 'unlocked';
    }
    
    return 'locked';
  };

  /**
   * Handles lecture selection with validation
   * @param {number} lectureIndex - Index of selected lecture
   */
  const handleLectureClick = (lectureIndex) => {
    const status = getLectureStatus(lectureIndex);
    
    // Only allow navigation to unlocked lectures
    if (status !== 'locked') {
      onLectureSelect(lectureIndex);
    }
  };

  /**
   * Gets appropriate icon based on lecture status
   * @param {string} status - Lecture status
   * @returns {JSX.Element} - Icon component
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'content-completed':
        return <PlayCircle className="w-5 h-5 text-blue-500" />;
      case 'unlocked':
        return <Play className="w-5 h-5 text-primary" />;
      default:
        return <Lock className="w-5 h-5 text-gray-400" />;
    }
  };

  /**
   * Gets status badge text and styling
   * @param {string} status - Lecture status
   * @returns {Object|null} - Badge configuration or null if no badge needed
   */
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { text: 'Complete', class: 'bg-green-500/20 text-green-600' };
      case 'content-completed':
        return { text: 'Quiz Pending', class: 'bg-blue-500/20 text-blue-600' };
      case 'locked':
        return { text: 'Locked', class: 'bg-gray-500/20 text-gray-500' };
      default:
        return null;
    }
  };

  if (!course?.lectures?.length) {
    return (
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-4">Course Content</h3>
        <p className="text-foreground/60 text-sm">No lectures available</p>
      </div>
    );
  }

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-border/50">
        <h3 className="text-lg font-semibold">Course Content</h3>
        <p className="text-sm text-foreground/60 mt-1">
          {course.lectures.length} lecture{course.lectures.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Lecture List */}
      <div className="max-h-[600px] overflow-y-auto">
        {course.lectures.map((lecture, index) => {
          const status = getLectureStatus(index);
          const isSelected = index === currentLectureIndex;
          const hasContent = lecture.content && lecture.content.length > 0;
          const hasExam = lecture.exam;
          const badge = getStatusBadge(status);

          return (
            <div
              key={index}
              onClick={() => handleLectureClick(index)}
              className={`
                p-4 border-b border-border/30 transition-all duration-200 
                ${status === 'locked' 
                  ? 'cursor-not-allowed opacity-50' 
                  : 'cursor-pointer hover:bg-accent/30'
                }
                ${isSelected ? 'bg-primary/10 border-r-4 border-r-primary' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getStatusIcon(status)}
                </div>

                {/* Lecture Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`
                      font-medium text-sm truncate
                      ${isSelected ? 'text-primary' : 'text-foreground'}
                    `}>
                      {lecture.title || `Lecture ${index + 1}`}
                    </h4>
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                      <ChevronRight className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </div>

                  {/* Lecture Metadata */}
                  <div className="flex items-center gap-3 text-xs text-foreground/60 mb-2">
                    {lecture.estimatedDuration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{lecture.estimatedDuration}m</span>
                      </div>
                    )}
                    {hasContent && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{lecture.content.length}</span>
                      </div>
                    )}
                    {hasExam && (
                      <div className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        <span>Quiz</span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  {badge && (
                    <span className={`
                      inline-block px-2 py-1 rounded-full text-xs font-medium
                      ${badge.class}
                    `}>
                      {badge.text}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LectureSidebar;
