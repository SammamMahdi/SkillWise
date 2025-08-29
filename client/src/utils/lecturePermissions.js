/**
 * Utility functions for determining lecture and quiz permissions
 */

/**
 * Determines if user can mark current lecture as complete
 * @param {Object} enrollment - Enrollment data
 * @param {Object} course - Course data
 * @param {number} currentLectureIndex - Current lecture index
 * @param {Object} lectureProgress - Progress data
 * @returns {boolean} - Whether marking complete is allowed
 */
export const canMarkCurrentLectureComplete = (enrollment, course, currentLectureIndex, lectureProgress) => {
  if (!enrollment || !course.lectures[currentLectureIndex]) return false;
  
  const currentProgress = lectureProgress[currentLectureIndex];
  
  // Can't mark complete if already completed
  if (currentProgress?.completed) return false;
  
  // Can mark content complete regardless of quiz status
  // The quiz is tracked separately
  return true;
};

/**
 * Determines if user can take quiz for current lecture
 * @param {Object} enrollment - Enrollment data
 * @param {Object} course - Course data
 * @param {number} currentLectureIndex - Current lecture index
 * @param {Object} lectureProgress - Progress data
 * @param {function} isLectureUnlocked - Function to check if lecture is unlocked
 * @returns {boolean} - Whether quiz can be taken
 */
export const canTakeCurrentQuiz = (enrollment, course, currentLectureIndex, lectureProgress, isLectureUnlocked) => {
  if (!enrollment || !course.lectures[currentLectureIndex]) return false;
  
  const currentProgress = lectureProgress[currentLectureIndex];
  
  // Can't take if already passed (but can retake if failed)
  if (currentProgress?.quizPassed) return false;
  
  // Can take if lecture is unlocked (includes retaking failed attempts)
  return isLectureUnlocked(currentLectureIndex);
};

/**
 * Handles lecture selection with permission validation
 * @param {number} lectureIndex - Index of selected lecture
 * @param {function} isLectureUnlocked - Function to check if lecture is unlocked
 * @param {function} setCurrentLectureIndex - Function to update current lecture index
 * @param {function} toast - Toast notification function
 */
export const handleLectureSelect = (lectureIndex, isLectureUnlocked, setCurrentLectureIndex, toast) => {
  if (isLectureUnlocked(lectureIndex)) {
    setCurrentLectureIndex(lectureIndex);
  } else {
    toast.error('Complete the previous lecture and quiz to unlock this one');
  }
};
