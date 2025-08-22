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

class ConsultationService {
  // Create a new consultation request
  async createConsultationRequest(requestData) {
    try {
      const response = await api.post('/consultations', requestData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create consultation request' };
    }
  }

  // Get consultation requests for a teacher
  async getTeacherConsultationRequests() {
    try {
      const response = await api.get('/consultations/teacher');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch consultation requests' };
    }
  }

  // Update consultation request status
  async updateConsultationRequestStatus(requestId, status) {
    try {
      const response = await api.put(`/consultations/${requestId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update consultation request status' };
    }
  }

  // Get consultation requests for a student
  async getStudentConsultationRequests() {
    try {
      const response = await api.get('/consultations/student');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch consultation requests' };
    }
  }
}

export default new ConsultationService();
