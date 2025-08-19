import axios from 'axios';
import API_CONFIG from '../config/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const teacherApplicationService = {
  // Submit teacher application
  async submitApplication(applicationData, files) {
    const formData = new FormData();
    
    // Add application data
    Object.keys(applicationData).forEach(key => {
      if (typeof applicationData[key] === 'object' && applicationData[key] !== null) {
        formData.append(key, JSON.stringify(applicationData[key]));
      } else {
        formData.append(key, applicationData[key]);
      }
    });
    
    // Add files
    if (files.resume) {
      formData.append('resume', files.resume);
    }
    
    if (files.certificates && files.certificates.length > 0) {
      files.certificates.forEach(file => {
        formData.append('certificates', file);
      });
    }
    
    if (files.identityDocument) {
      formData.append('identityDocument', files.identityDocument);
    }
    
    const response = await api.post('/teacher-applications/apply', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Get user's application status
  async getMyApplication() {
    const response = await api.get('/teacher-applications/my-application');
    return response.data;
  },

  // Get all applications (Admin only)
  async getAllApplications(page = 1, limit = 10, status = 'all', search = '') {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      status,
      ...(search && { search })
    });
    
    const response = await api.get(`/teacher-applications/all?${params}`);
    return response.data;
  },

  // Get application by ID (Admin only)
  async getApplicationById(applicationId) {
    const response = await api.get(`/teacher-applications/${applicationId}`);
    return response.data;
  },

  // Review application (Admin only)
  async reviewApplication(applicationId, action, reviewNotes = '', rating = null) {
    const response = await api.put(`/teacher-applications/${applicationId}/review`, {
      action,
      reviewNotes,
      rating
    });
    return response.data;
  },

  // Delete application (Admin only)
  async deleteApplication(applicationId) {
    const response = await api.delete(`/teacher-applications/${applicationId}`);
    return response.data;
  },

  // Get file URL for viewing
  getFileUrl(filename) {
    return `${API_CONFIG.BASE_URL}/teacher-applications/files/${filename}`;
  },

  // Check if user can apply (helper function)
  async canApply() {
    try {
      const response = await this.getMyApplication();
      // If we get an application, check its status
      return response.data.applicationStatus === 'rejected';
    } catch (error) {
      // If no application found (404), user can apply
      return error.response?.status === 404;
    }
  }
};

export default teacherApplicationService;
