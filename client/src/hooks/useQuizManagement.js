import { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing quiz functionality in courses
 * Simplified approach that relies on server-side progress tracking
 */
export const useQuizManagement = (
  course, 
  lectureProgress, 
  setLectureProgress, 
  setCurrentLectureIndex, 
  isLectureUnlocked, 
  courseExams, 
  courseId, 
  navigate,
  updateQuizProgress
) => {
  const [selectedExam, setSelectedExam] = useState(null);

  /**
   * Handles quiz completion - called when quiz is submitted
   * Updates local state immediately and moves to next lecture if quiz passed
   * @param {number} lectureIndex - Index of lecture with completed quiz
   * @param {Object} quizData - Quiz completion data from server
   */
  const handleQuizComplete = async (lectureIndex, quizData) => {
    try {
      console.log(`Quiz completed for lecture ${lectureIndex}:`, quizData);
      
      // Update lecture progress state immediately using the updateQuizProgress function
      if (quizData.passed && updateQuizProgress) {
        updateQuizProgress(lectureIndex, quizData);
      } else {
        // For failed attempts, still track the attempt
        setLectureProgress(prev => ({
          ...prev,
          [lectureIndex]: {
            ...prev[lectureIndex],
            examAttempts: [
              ...(prev[lectureIndex]?.examAttempts || []),
              {
                passed: quizData.passed,
                score: quizData.score,
                totalScore: quizData.totalScore,
                attemptId: quizData.attemptId,
                completedAt: new Date().toISOString()
              }
            ]
          }
        }));
      }

      // Show appropriate message based on pass/fail
      if (quizData.passed) {
        toast.success(`Quiz passed! Score: ${quizData.score}%. Lecture completed.`);
        
        // If quiz passed and there's a next lecture, move to it after a delay
        const nextLectureIndex = lectureIndex + 1;
        if (course?.lectures && nextLectureIndex < course.lectures.length) {
          setTimeout(() => {
            setCurrentLectureIndex(nextLectureIndex);
            toast.info(`Moving to Lecture ${nextLectureIndex + 1}: ${course.lectures[nextLectureIndex].title}`);
          }, 2000);
        } else {
          // Course completed
          setTimeout(() => {
            toast.success('🎉 Congratulations! You have completed the entire course!');
          }, 2000);
        }
      } else {
        toast.error(`Quiz score: ${quizData.score}%. Try again to pass!`);
      }

    } catch (error) {
      console.error('Error handling quiz completion:', error);
      toast.error('Failed to update progress');
    }
  };

  /**
   * Legacy function - kept for compatibility but now redirects to handleQuizComplete
   * @param {number} lectureIndex - Index of lecture with completed quiz
   */
  const markQuizPassed = async (lectureIndex) => {
    console.log('markQuizPassed called - redirecting to handleQuizComplete');
    
    // Update local state immediately for external exam completions
    if (updateQuizProgress) {
      updateQuizProgress(lectureIndex, { score: 100, totalScore: 100 });
    }
    
    toast.success('Quiz completed successfully!');
    
    // Move to next lecture if available
    const nextLectureIndex = lectureIndex + 1;
    if (course?.lectures && nextLectureIndex < course.lectures.length) {
      setTimeout(() => {
        setCurrentLectureIndex(nextLectureIndex);
        toast.info(`Moving to Lecture ${nextLectureIndex + 1}: ${course.lectures[nextLectureIndex].title}`);
      }, 1500);
    }
  };

  /**
   * Handles exam modal for lecture quizzes
   * @param {Object} lectureExam - Exam object for the lecture
   */
  const handleTakeExam = (lectureExam) => {
    if (!lectureExam) return null;
    
    setSelectedExam({
      _id: lectureExam._id,
      title: lectureExam.title || 'Lecture Quiz',
      timeLimit: lectureExam.timeLimit || 30,
      totalQuestions: lectureExam.questions?.length || 0,
      passingScore: lectureExam.passingScore || 60
    });
    
    return selectedExam;
  };

  /**
   * Proceeds with exam after warning modal
   */
  const handleProceedWithExam = async () => {
    if (!selectedExam) return;
    
    try {
      const examUrl = `/exam/${selectedExam._id}?courseId=${courseId}`;
      navigate(examUrl);
    } catch (error) {
      console.error('Error navigating to exam:', error);
      toast.error('Failed to start exam');
    }
  };

  return {
    selectedExam,
    setSelectedExam,
    handleQuizComplete,
    markQuizPassed,
    handleTakeExam,
    handleProceedWithExam
  };
};
