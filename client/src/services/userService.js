import axios from 'axios';
import API_CONFIG from '../config/api.js';

const API = API_CONFIG.BASE_URL;

export async function updateUserStatus(status) {
  // Assumes backend PATCH /api/auth/user/status { status }
  const token = localStorage.getItem('token');
  console.log('Making status update request with token:', token ? 'present' : 'missing');
  console.log('Token value:', token);
  console.log('Status to update:', status);

  try {
    const response = await axios.patch(`${API}/auth/user/status`, { status }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Status update response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Status update error:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error headers:', error.response?.headers);
    throw error;
  }
}
