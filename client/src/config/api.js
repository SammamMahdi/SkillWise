// API Configuration - centralized place for all API settings
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api',
  SERVER_URL: import.meta.env.VITE_SERVER_URL || 'http://localhost:5001',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
}

export default API_CONFIG
