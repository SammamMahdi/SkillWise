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

const API_BASE_URL = '/lecture-content';

export const lectureContentService = {
  // Upload lecture content files
  async uploadContent(courseId, lectureIndex, files, contentType, title, description) {
    try {
      const formData = new FormData();
      
      // Add files to form data
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      
      // Add metadata
      if (contentType) formData.append('contentType', contentType);
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);

      const response = await api.post(`${API_BASE_URL}/upload/${courseId}/${lectureIndex}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload Progress: ${percentCompleted}%`);
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error uploading lecture content:', error);
      throw error;
    }
  },

  // Get file URL for display
  getFileUrl(filename) {
    return `${import.meta.env.VITE_SERVER_URL || 'http://localhost:5001'}${API_BASE_URL}/file/${filename}`;
  },

  // Get file blob for display (for images and PDFs)
  async getFileBlob(filename) {
    try {
      const response = await api.get(`${API_BASE_URL}/file/${filename}`, {
        responseType: 'blob'
      });
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Error fetching file blob:', error);
      throw error;
    }
  },

  // Delete lecture content
  async deleteContent(courseId, lectureIndex, contentIndex) {
    try {
      const response = await api.delete(`${API_BASE_URL}/${courseId}/${lectureIndex}/${contentIndex}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting lecture content:', error);
      throw error;
    }
  },

  // Download file
  async downloadFile(filename, originalName) {
    try {
      const response = await api.get(`${API_BASE_URL}/file/${filename}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName || filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  },

  // Validate file type and size
  validateFile(file, maxSize = 100 * 1024 * 1024) { // 100MB default
    const allowedTypes = [
      // Video files
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
      // Document files
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      // Image files
      'image/jpeg', 'image/png', 'image/gif', 'image/webp'
    ];

    const allowedExtensions = [
      '.mp4', '.webm', '.ogg', '.mov', '.avi',
      '.pdf', '.doc', '.docx', '.txt',
      '.jpg', '.jpeg', '.png', '.gif', '.webp'
    ];

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }

    // Check file type
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'File type not supported. Allowed types: MP4, WebM, PDF, DOC, DOCX, TXT, JPG, PNG, GIF, WebP'
      };
    }

    return { valid: true };
  },

  // Get content type from file
  getContentType(file) {
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (['.mp4', '.webm', '.ogg', '.mov', '.avi'].includes(extension)) {
      return 'video';
    } else if (extension === '.pdf') {
      return 'pdf';
    } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
      return 'image';
    } else if (['.doc', '.docx', '.txt'].includes(extension)) {
      return 'document';
    }
    
    return 'other';
  },

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get file icon based on type
  getFileIcon(filename, contentType) {
    const extension = '.' + filename.split('.').pop().toLowerCase();
    
    if (contentType === 'video' || ['.mp4', '.webm', '.ogg', '.mov', '.avi'].includes(extension)) {
      return 'video';
    } else if (contentType === 'pdf' || extension === '.pdf') {
      return 'pdf';
    } else if (contentType === 'image' || ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
      return 'image';
    } else {
      return 'document';
    }
  },

  // Check if file can be previewed inline
  canPreviewInline(filename, contentType) {
    const extension = '.' + filename.split('.').pop().toLowerCase();
    
    // Videos and PDFs can be previewed inline
    if (contentType === 'video' || contentType === 'pdf') {
      return true;
    }
    
    // Images can be previewed inline
    if (contentType === 'image' || ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
      return true;
    }
    
    return false;
  }
};

export default lectureContentService;
