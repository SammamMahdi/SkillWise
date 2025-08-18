import axios from 'axios';
import API_CONFIG from '../config/api.js';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

class ExamService {
  // Teacher methods
  async createExam(examData) {
    try {
      const response = await api.post('/exams', examData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create exam' };
    }
  }

  async getTeacherExams(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/exams/my-exams?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch exams' };
    }
  }



  async publishExam(examId) {
    try {
      const response = await api.put(`/exams/${examId}/publish`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to publish exam' };
    }
  }



  // Student methods
  async getAvailableExams() {
    try {
      const response = await api.get('/exams/available');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch available exams' };
    }
  }

  async getCourseExams(courseId) {
    try {
      const response = await api.get(`/exams/course/${courseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch course exams' };
    }
  }

  async startExamAttempt(examId, browserInfo) {
    try {
      const response = await api.post(`/exams/${examId}/start`, {
        browserInfo
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to start exam attempt' };
    }
  }

  async submitExamAttempt(attemptId, answers) {
    try {
      const response = await api.put(`/exams/attempts/${attemptId}/submit`, {
        answers
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to submit exam' };
    }
  }

  async recordViolation(attemptId, type, details) {
    try {
      const response = await api.post(`/exams/attempts/${attemptId}/violation`, {
        type,
        details
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to record violation' };
    }
  }

  // Get pending review attempts (for admin/teacher)
  async getPendingReviewAttempts() {
    try {
      const response = await api.get('/exams/attempts/pending-review');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch pending reviews' };
    }
  }

  // Get attempt details for review (for admin/teacher)
  async getAttemptForReview(attemptId) {
    try {
      const response = await api.get(`/exams/attempts/${attemptId}/review`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch attempt details' };
    }
  }

  // Publish exam score (for admin/teacher)
  async publishExamScore(attemptId, scoreData) {
    try {
      const response = await api.put(`/exams/attempts/${attemptId}/publish-score`, scoreData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to publish score' };
    }
  }

  // Get exam results (for student)
  async getExamResults(attemptId) {
    try {
      const response = await api.get(`/exams/attempts/${attemptId}/results`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch exam results' };
    }
  }

  // Get attempt details (for exam interface)
  async getAttemptDetails(attemptId) {
    try {
      const response = await api.get(`/exams/attempts/${attemptId}/details`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch attempt details' };
    }
  }

  // Debug attempt data (for troubleshooting)
  async debugAttemptData(attemptId) {
    try {
      const response = await api.get(`/exams/debug/attempt/${attemptId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to debug attempt data' };
    }
  }

  // Utility methods
  getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  calculateTimeRemaining(startTime, timeLimit) {
    const now = new Date();
    const elapsed = Math.floor((now - new Date(startTime)) / 1000);
    const remaining = (timeLimit * 60) - elapsed;
    return Math.max(0, remaining);
  }
}

export default new ExamService();
