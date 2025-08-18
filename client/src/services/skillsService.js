const API_URL = '/api/skills';

export const skillsService = {
  // Get all skill posts with filtering
  getSkillPosts: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`${API_URL}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch skill posts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching skill posts:', error);
      throw error;
    }
  },

  // Get user's skill posts
  getMySkillPosts: async () => {
    try {
      const response = await fetch(`${API_URL}/my-posts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch your skill posts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user skill posts:', error);
      throw error;
    }
  },

  // Create new skill post
  createSkillPost: async (formData) => {
    try {
      console.log('Creating skill post...');
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData // FormData for file uploads
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Server responded with error:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        
        // Provide specific error messages based on server response
        let errorMessage = responseData.message || 'Failed to create skill post';
        
        if (response.status === 400) {
          if (responseData.errors && Array.isArray(responseData.errors)) {
            const errorDetails = responseData.errors.map(err => `${err.field}: ${err.message}`).join(', ');
            errorMessage = `Validation failed: ${errorDetails}`;
          } else if (responseData.details) {
            errorMessage = responseData.details;
          }
        } else if (response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
          // Optionally clear token and redirect to login
          localStorage.removeItem('token');
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      console.log('Skill post created successfully:', responseData);
      return responseData;
    } catch (error) {
      console.error('Error creating skill post:', error);
      // Re-throw the error with additional context if needed
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  },

  // Update skill post
  updateSkillPost: async (id, data) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update skill post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating skill post:', error);
      throw error;
    }
  },

  // Delete skill post
  deleteSkillPost: async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete skill post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting skill post:', error);
      throw error;
    }
  },

  // Add review to skill post
  addReview: async (id, reviewData) => {
    try {
      const response = await fetch(`${API_URL}/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reviewData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add review');
      }

      return await response.json();
    } catch (error) {
      console.error('Error adding review:', error);
      throw error;
    }
  },

  // Get skill of the month for a user
  getSkillOfMonth: async (userId) => {
    try {
      const response = await fetch(`${API_URL}/skill-of-month/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch skill of month');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching skill of month:', error);
      throw error;
    }
  }
};

export default skillsService;
