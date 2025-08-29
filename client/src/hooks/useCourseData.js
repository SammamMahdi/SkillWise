import { useState, useEffect } from 'react';
import { getCourse, checkEnrollment } from '../services/courseService';
import { getEnrolledCourseDetails } from '../services/learningService';
import examService from '../services/examService';

/**
 * Custom hook for managing course data loading and state
 * @param {string} courseId - Course ID from URL params
 * @param {Object} user - Current user object
 * @param {function} navigate - React Router navigate function
 * @returns {Object} - Course data and loading state
 */
export const useCourseData = (courseId, user, navigate) => {
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseExams, setCourseExams] = useState([]);

  // Load course exams
  const loadCourseExams = async () => {
    try {
      const currentCourseId = course?._id || courseId;
      console.log('Loading course exams for course ID:', currentCourseId);
      const response = await examService.getCourseExams(currentCourseId);
      console.log('Course exams response:', response);
      if (response.success && response.data.exams) {
        setCourseExams(response.data.exams);
        console.log('Set course exams:', response.data.exams);
      }
    } catch (error) {
      console.error('Error loading course exams:', error);
    }
  };

  // Load course and enrollment data
  useEffect(() => {
    const loadCourseData = async () => {
      try {
        setLoading(true);
        setError('');

        // Load course details
        const courseRes = await getCourse(courseId);
        const courseData = courseRes.course || courseRes.data || courseRes;
        console.log('Course data loaded:', courseData);
        console.log('Course lectures:', courseData.lectures);
        
        // Debug lecture content
        if (courseData.lectures && courseData.lectures.length > 0) {
          courseData.lectures.forEach((lecture, index) => {
            console.log(`Lecture ${index}:`, lecture);
            console.log(`Lecture ${index} content:`, lecture.content);
          });
        }
        
        setCourse(courseData);

        // If the URL parameter was a title instead of an ID, redirect to the proper URL
        if (courseData._id && courseData._id !== courseId) {
          console.log('Redirecting from title to ID:', courseId, '->', courseData._id);
          navigate(`/courses/${courseData._id}`, { replace: true });
          return;
        }

        // Check enrollment status
        const isEnrolled = await checkEnrollment(courseData._id || courseId, localStorage.getItem('token'));
        
        if (isEnrolled) {
          // Load enrollment details with progress
          try {
            const enrollmentData = await getEnrolledCourseDetails(courseData._id || courseId);
            setEnrollment(enrollmentData);
          } catch (enrollmentError) {
            console.error('Error loading enrollment details:', enrollmentError);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    if (courseId && user) {
      loadCourseData();
    }
  }, [courseId, user, navigate]);

  return {
    course,
    setCourse,
    enrollment,
    setEnrollment,
    loading,
    error,
    courseExams,
    setCourseExams,
    loadCourseExams
  };
};
