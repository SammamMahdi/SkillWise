const API_BASE_URL = 'https://localhost:5000/api/learning';

// Get learning dashboard data
export const getLearningDashboard = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/dashboard`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch learning dashboard');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching learning dashboard:', error);
    throw error;
  }
};

// Get enrolled course details
export const getEnrolledCourseDetails = async (courseId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch course details');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching course details:', error);
    throw error;
  }
};

// Update course progress
export const updateCourseProgress = async (courseId, progressData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/progress`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(progressData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update course progress');
    }

    return data.data;
  } catch (error) {
    console.error('Error updating course progress:', error);
    throw error;
  }
};

// Get user certificates
export const getUserCertificates = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/certificates`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch certificates');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching certificates:', error);
    throw error;
  }
};

// Get user skill posts
export const getUserSkillPosts = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/skill-posts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch skill posts');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching skill posts:', error);
    throw error;
  }
};
