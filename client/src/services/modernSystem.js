import axios from 'axios';
import API_CONFIG from '../config/api.js';

const API_BASE_URL = API_CONFIG.BASE_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const modernSystem = {
  // Learning methods
  learning: {
    async getCourseDetails(courseId) {
      try {
        const response = await api.get(`/courses/${courseId}`);
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    async checkEnrollment(courseId) {
      try {
        const response = await api.get(`/learning/courses/${courseId}`);
        return { enrolled: response.status === 200 };
      } catch (error) {
        return { enrolled: false };
      }
    },

    async enrollInCourse(courseId) {
      try {
        const response = await api.post(`/learning/courses/${courseId}/enroll`);
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    }
  },

  // Progress tracking methods
  progress: {
    async getCourseProgress(courseId) {
      try {
        const response = await api.get(`/learning/courses/${courseId}`);
        return response.data;
      } catch (error) {
        // Return default progress structure
        return {
          data: {
            overallPercentage: 0,
            completedLectures: 0,
            totalLectures: 0,
            lectureProgress: []
          }
        };
      }
    },

    async trackView(courseId, lectureIndex) {
      try {
        // This would typically track that a user viewed a lecture
        console.log(`Tracking view for course ${courseId}, lecture ${lectureIndex}`);
        return { success: true };
      } catch (error) {
        console.error('Error tracking view:', error);
        return { success: false };
      }
    },

    async trackCompletion(courseId, lectureIndex, progressData) {
      try {
        // This would typically update lecture completion progress
        console.log(`Tracking completion for course ${courseId}, lecture ${lectureIndex}`, progressData);
        return { success: true };
      } catch (error) {
        console.error('Error tracking completion:', error);
        return { success: false };
      }
    }
  },

  // Quiz methods
  quiz: {
    async getQuiz(quizId) {
      try {
        // For now, return a mock quiz structure
        return {
          data: {
            quiz: {
              _id: quizId,
              title: 'Sample Quiz',
              questions: [],
              timeLimit: 30,
              passingScore: 70
            }
          }
        };
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    async getUserAttempts(quizId) {
      try {
        // Return empty attempts for now
        return {
          data: {
            attempts: []
          }
        };
      } catch (error) {
        return {
          data: {
            attempts: []
          }
        };
      }
    },

    async submitAttempt(quizId, answers) {
      try {
        // Mock quiz submission
        const totalQuestions = answers.length;
        const correctAnswers = Math.floor(totalQuestions * 0.8); // Mock 80% correct
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        
        return {
          data: {
            attempt: {
              _id: 'mock-attempt-id',
              quizId,
              answers,
              score,
              correctAnswers,
              totalQuestions,
              passed: score >= 70,
              submittedAt: new Date().toISOString()
            }
          }
        };
      } catch (error) {
        throw error.response?.data || error;
      }
    }
  }
};

export default modernSystem;