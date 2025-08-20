import api from '../config/api';

class ChildService {
  // Convert user to child role (for users 25+)
  async convertToChildRole(childLockPassword, phoneNumber) {
    try {
      const response = await api.post('/child/convert', {
        childLockPassword,
        phoneNumber
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to convert to child account' };
    }
  }

  // Verify child lock password
  async verifyChildLock(childLockPassword) {
    try {
      const response = await api.post('/child/verify-lock', {
        childLockPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Invalid child lock password' };
    }
  }

  // Update child lock password
  async updateChildLock(currentPassword, newPassword) {
    try {
      const response = await api.put('/child/update-lock', {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update child lock password' };
    }
  }

  // Convert using auth endpoint (alternative method)
  async convertToChildRoleAlt(childLockPassword, phoneNumber) {
    try {
      const response = await api.post('/auth/convert-to-child', {
        childLockPassword,
        phoneNumber
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to convert to child account' };
    }
  }
}

export default new ChildService();
