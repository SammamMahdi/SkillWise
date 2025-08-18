const API_URL = '/api/messages';

export const messagesService = {
  // Send a message
  sendMessage: async (recipientId, skillPostId, content) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientId,
          skillPostId,
          content
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to send message');
      }

      return responseData;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get user's conversations
  getConversations: async (page = 1, limit = 20) => {
    try {
      const response = await fetch(`${API_URL}/conversations?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get messages in a conversation
  getMessages: async (otherUserId, skillPostId, page = 1, limit = 50) => {
    try {
      const response = await fetch(`${API_URL}/${otherUserId}/${skillPostId}?page=${page}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }
};
