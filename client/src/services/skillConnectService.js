const API_BASE_URL = '/api/skill-connect';

export const skillConnectService = {
  // Get all available skills grouped by category
  getAllSkills: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/skills`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching skills:', error);
      throw error;
    }
  },

  // Get user's current skill preferences
  getUserSkillPreferences: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/preferences`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user skill preferences:', error);
      throw error;
    }
  },

  // Save user's skill preferences
  saveUserSkillPreferences: async (selectedSkills, isOnboarding = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          selectedSkills,
          isOnboarding
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving skill preferences:', error);
      throw error;
    }
  },

  // Get skill-based connections for the user
  getSkillConnections: async (page = 1, limit = 10) => {
    try {
      const response = await fetch(`${API_BASE_URL}/connections?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching skill connections:', error);
      throw error;
    }
  },

  // Alias for getSkillConnections for compatibility
  getConnections: async (params = {}) => {
    const { page = 1, limit = 10, skills = [] } = params;
    return skillConnectService.getSkillConnections(page, limit);
  },

  // Initialize skills data (admin only)
  initializeSkills: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error initializing skills:', error);
      throw error;
    }
  }
};
