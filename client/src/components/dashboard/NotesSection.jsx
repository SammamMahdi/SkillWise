import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { notesService } from '../../services/notesService';

const NotesSection = () => {
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchRecentNotes();
    fetchStats();
  }, []);

  const fetchRecentNotes = async () => {
    try {
      const data = await notesService.getNotes({ sortBy: 'updatedAt', sortOrder: 'desc' });
      if (data.success) setNotes(data.notes.slice(0, 3));
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await notesService.getStats();
      if (data.success) setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const data = await notesService.deleteNote(id);
      if (data.success) {
        setNotes(notes.filter(n => n._id !== id));
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const togglePin = async (id) => {
    try {
      const data = await notesService.togglePin(id);
      if (data.success) {
        setNotes(notes.map(n => n._id === id ? data.note : n));
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">My Notes</h2>
        <Link 
          to="/notes" 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          View All Notes →
        </Link>
      </div>

      {/* Stats Summary */}
      {stats.totalNotes > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Notes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalNotes}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pinned</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pinnedNotes}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
              <p className="text-2xl font-bold text-green-600">{stats.categories?.length || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Note */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <Link 
          to="/notes" 
          className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 py-2"
        >
          <span className="text-xl">+</span>
          <span>Quick Add Note</span>
        </Link>
      </div>

      {/* Recent Notes */}
      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.slice(0, 3).map(note => (
            <div key={note._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {note.isPinned && <span className="text-yellow-500">📌</span>}
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {note.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePin(note._id)}
                    className="text-gray-400 hover:text-yellow-500 text-sm"
                    title={note.isPinned ? 'Unpin' : 'Pin'}
                  >
                    📌
                  </button>
                  <button
                    onClick={() => deleteNote(note._id)}
                    className="text-red-400 hover:text-red-600 text-sm"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                {note.content.replace(/[#*`]/g, '').substring(0, 120)}...
              </p>
              
              {note.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {note.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 2 && (
                    <span className="text-xs text-gray-500">+{note.tags.length - 2} more</span>
                  )}
                </div>
              )}
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{note.category}</span>
                <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-2">📝</div>
          <p>No notes yet</p>
          <Link 
            to="/notes" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block"
          >
            Create your first note
          </Link>
        </div>
      )}
    </section>
  );
};

export default NotesSection;