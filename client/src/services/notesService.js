const API_BASE = '/api/notes';

export const notesService = {
  // Get all notes with optional filtering
  async getNotes(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE}?${queryParams}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.json();
  },

  // Get a specific note by ID
  async getNote(id) {
    const response = await fetch(`${API_BASE}/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.json();
  },

  // Create a new note
  async createNote(noteData) {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(noteData)
    });
    return response.json();
  },

  // Update an existing note
  async updateNote(id, noteData) {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(noteData)
    });
    return response.json();
  },

  // Delete a note
  async deleteNote(id) {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.json();
  },

  // Toggle pin status
  async togglePin(id) {
    const response = await fetch(`${API_BASE}/${id}/pin`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.json();
  },

  // Get note statistics
  async getStats() {
    const response = await fetch(`${API_BASE}/stats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.json();
  }
};
