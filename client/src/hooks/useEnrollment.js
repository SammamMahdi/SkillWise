import { useState } from 'react';
import { enroll } from '../services/courseService';
import { getEnrolledCourseDetails } from '../services/learningService';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing course enrollment
 * @param {string} courseId - Course ID
 * @param {Object} user - Current user object
 * @param {function} setEnrollment - Function to update enrollment state
 * @returns {Object} - Enrollment functions and state
 */
export const useEnrollment = (courseId, user, setEnrollment) => {
  const [enrolling, setEnrolling] = useState(false);
  const [showChildLockModal, setShowChildLockModal] = useState(false);

  const handleEnroll = async () => {
    // Check if user is a child account
    if (user?.role === 'Child') {
      setShowChildLockModal(true);
      return;
    }

    // Regular enrollment for non-child accounts
    try {
      setEnrolling(true);
      await enroll(courseId, localStorage.getItem('token'));
      
      // Reload enrollment data
      const enrollmentData = await getEnrolledCourseDetails(courseId);
      setEnrollment(enrollmentData);
      
      toast.success('Successfully enrolled in course!');
    } catch (err) {
      toast.error(err?.response?.data?.error || err.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const handleChildLockVerify = async (childLockPassword) => {
    try {
      setEnrolling(true);
      await enroll(courseId, localStorage.getItem('token'), childLockPassword);
      
      // Reload enrollment data
      const enrollmentData = await getEnrolledCourseDetails(courseId);
      setEnrollment(enrollmentData);
      
      toast.success('Successfully enrolled in course!');
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || 'Failed to enroll';
      throw new Error(errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  return {
    enrolling,
    showChildLockModal,
    setShowChildLockModal,
    handleEnroll,
    handleChildLockVerify
  };
};
