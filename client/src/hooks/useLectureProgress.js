import { useState, useEffect, useMemo } from 'react';
import { updateCourseProgress } from '../services/learningService';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing lecture progress - simplified to work with server-side progress tracking
 * @param {Object} course - Course data
 * @param {Object} enrollment - Enrollment data
 * @param {Array} courseExams - Course exams data
 * @param {string} courseId - Course ID
 * @returns {Object} - Progress state and management functions
 */
export const useLectureProgress = (course, enrollment, courseExams, courseId) => {
  const [lectureProgress, setLectureProgress] = useState({});
  const [currentLectureIndex, setCurrentLectureIndex] = useState(0);

  // Initialize lecture progress from enrollment data
  useEffect(() => {
    if (enrollment?.lectureProgress && Array.isArray(enrollment.lectureProgress)) {
      console.log('Loading lecture progress from enrollment (array format):', enrollment.lectureProgress);
      // Convert array format to object format for easier access
      const progressObj = {};
      enrollment.lectureProgress.forEach(progress => {
        if (progress.lectureIndex !== undefined) {
          progressObj[progress.lectureIndex] = {
            completed: progress.completed || false,
            completedAt: progress.completedAt,
            timeSpent: progress.timeSpent || 0,
            quizPassed: progress.examAttempts?.some(attempt => attempt.passed) || false,
            examAttempts: progress.examAttempts || [],
            lastAccessed: progress.lastAccessed
          };
        }
      });
      setLectureProgress(progressObj);
    } else if (enrollment?.lectureProgress && typeof enrollment.lectureProgress === 'object') {
      console.log('Loading lecture progress from enrollment (object format):', enrollment.lectureProgress);
      setLectureProgress(enrollment.lectureProgress);
    } else {
      console.log('No lecture progress found, initializing empty');
      setLectureProgress({});
    }
  }, [enrollment]);

  // Calculate overall progress percentage
  const progress = useMemo(() => {
    if (!course?.lectures?.length) return 0;
    
    const totalLectures = course.lectures.length;
    let completedLectures = 0;

    for (let i = 0; i < totalLectures; i++) {
      const lectureData = lectureProgress[i];
      const lecture = course.lectures[i];
      
      // Lecture is complete if: content viewed AND (no quiz OR quiz passed)
      const isComplete = lectureData?.completed && (!lecture.exam || lectureData?.quizPassed);
      if (isComplete) {
        completedLectures++;
      }
    }

    return Math.round((completedLectures / totalLectures) * 100);
  }, [course?.lectures, lectureProgress]);

  /**
   * Check if a lecture is unlocked based on previous lecture completion
   * @param {number} lectureIndex - Index of lecture to check
   * @returns {boolean} - Whether lecture is unlocked
   */
  const isLectureUnlocked = (lectureIndex) => {
    // First lecture is always unlocked
    if (lectureIndex === 0) return true;
    
    // Check if previous lecture is completed (including quiz if required)
    const previousIndex = lectureIndex - 1;
    const previousLecture = course?.lectures?.[previousIndex];
    const previousProgress = lectureProgress[previousIndex];
    
    if (!previousProgress?.completed) return false;
    
    // If previous lecture has a quiz, it must be passed
    if (previousLecture?.exam && !previousProgress?.quizPassed) return false;
    
    return true;
  };

  /**
   * Mark a lecture as complete (content viewed)
   * @param {number} lectureIndex - Index of lecture to mark complete
   */
  const markLectureComplete = async (lectureIndex) => {
    try {
      const lecture = course.lectures[lectureIndex];
      
      // Update local state
      setLectureProgress(prev => ({
        ...prev,
        [lectureIndex]: {
          ...prev[lectureIndex],
          completed: true
        }
      }));

      // Save to server
      await updateCourseProgress(courseId, {
        lectureProgress: [{
          lectureIndex: lectureIndex,
          completed: true,
          timeSpent: 0
        }]
      });

      toast.success('Lecture marked as complete!');
      
      // Show hint about quiz if lecture has exam and quiz not passed yet
      if (lecture.exam && !lectureProgress[lectureIndex]?.quizPassed) {
        setTimeout(() => {
          toast.info('Complete the quiz below to fully finish this lecture!');
        }, 1000);
      }

    } catch (error) {
      console.error('Error marking lecture complete:', error);
      toast.error('Failed to save progress');
    }
  };

  /**
   * Mark a lecture quiz as passed
   * @param {number} lectureIndex - Index of lecture with passed quiz
   * @param {Object} quizData - Quiz completion data
   */
  const updateQuizProgress = (lectureIndex, quizData) => {
    setLectureProgress(prev => ({
      ...prev,
      [lectureIndex]: {
        ...prev[lectureIndex],
        quizPassed: true,
        examAttempts: [
          ...(prev[lectureIndex]?.examAttempts || []),
          {
            passed: true,
            score: quizData?.score || 100,
            totalScore: quizData?.totalScore || 100,
            attemptId: quizData?.attemptId,
            completedAt: new Date().toISOString()
          }
        ]
      }
    }));
  };

  return {
    lectureProgress,
    setLectureProgress,
    currentLectureIndex,
    setCurrentLectureIndex,
    progress,
    isLectureUnlocked,
    markLectureComplete,
    updateQuizProgress
  };
};
