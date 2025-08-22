import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate, useParams } from 'react-router-dom';
import { notesService } from '../../services/notesService';

const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filters, setFilters] = useState({});
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [category, setCategory] = useState('General');
  const [isPinned, setIsPinned] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  
  const [tagInput, setTagInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      fetchNote(id);
    } else {
      fetchNotes();
      fetchStats();
    }
  }, [id, searchTerm, sortBy, sortOrder]);

  const fetchNotes = async () => {
    try {
      const queryParams = {
        search: searchTerm,
        sortBy,
        sortOrder,
        ...filters
      };
      
      const data = await notesService.getNotes(queryParams);
      if (data.success) {
        setNotes(data.notes);
        setFilters(data.filters || {});
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchNote = async (noteId) => {
    try {
      const data = await notesService.getNote(noteId);
      if (data.success) {
        setCurrentNote(data.note);
        setTitle(data.note.title);
        setContent(data.note.content);
        setTags(data.note.tags || []);
        setKeywords(data.note.keywords || []);
        setCategory(data.note.category || 'General');
        setIsPinned(data.note.isPinned || false);
        setIsPublic(data.note.isPublic || false);
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await notesService.getStats();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const saveNote = async () => {
    try {
      const noteData = {
        title,
        content,
        tags,
        keywords,
        category,
        isPinned,
        isPublic
      };

      let data;
      if (currentNote) {
        data = await notesService.updateNote(currentNote._id, noteData);
      } else {
        data = await notesService.createNote(noteData);
      }
      if (data.success) {
        if (currentNote) {
          setCurrentNote(data.note);
          setNotes(notes.map(n => n._id === currentNote._id ? data.note : n));
        } else {
          setNotes([data.note, ...notes]);
        }
        resetForm();
        setIsEditing(false);
        if (!currentNote) {
          navigate(`/notes/${data.note._id}`);
        }
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const deleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const data = await notesService.deleteNote(noteId);
      if (data.success) {
        setNotes(notes.filter(n => n._id !== noteId));
        if (currentNote && currentNote._id === noteId) {
          navigate('/notes');
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const togglePin = async (noteId) => {
    try {
      const data = await notesService.togglePin(noteId);
      if (data.success) {
        setNotes(notes.map(n => n._id === noteId ? data.note : n));
        if (currentNote && currentNote._id === noteId) {
          setCurrentNote(data.note);
          setIsPinned(data.note.isPinned);
        }
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setKeywords([]);
    setCategory('General');
    setIsPinned(false);
    setIsPublic(false);
    setCurrentNote(null);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keywordToRemove) => {
    setKeywords(keywords.filter(keyword => keyword !== keywordToRemove));
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value === 'all' ? undefined : value
    }));
  };

  const createNewNote = () => {
    resetForm();
    setIsEditing(true);
    navigate('/notes');
  };

  const editNote = () => {
    setIsEditing(true);
  };

  const cancelEdit = () => {
    if (currentNote) {
      fetchNote(currentNote._id);
      setIsEditing(false);
    } else {
      resetForm();
      setIsEditing(false);
    }
  };

  if (id && !currentNote) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {currentNote ? currentNote.title : 'My Notes'}
          </h1>
          {stats.totalNotes && (
            <p className="text-foreground/60 mt-2">
              {stats.totalNotes} notes • {stats.pinnedNotes} pinned
            </p>
          )}
        </div>
        <div className="flex gap-3">
          {currentNote && !isEditing && (
            <>
              <button
                onClick={editNote}
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
              >
                Edit
              </button>
              <button
                onClick={() => togglePin(currentNote._id)}
                className={`px-4 py-2 rounded-lg border ${
                  currentNote.isPinned
                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                    : 'bg-card text-foreground/80 border-border'
                }`}
              >
                {currentNote.isPinned ? '📌 Pinned' : '📌 Pin'}
              </button>
            </>
          )}
          {!currentNote && (
            <button
              onClick={createNewNote}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              New Note
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar - Notes List */}
        <div className="lg:col-span-1">
          {/* Search and Filters */}
          <div className="bg-card border border-border rounded-lg p-4 mb-6 shadow-sm">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg mb-4 bg-background text-foreground"
            />
            
            <div className="space-y-3">
              <select
                value={filters.category || 'all'}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="all">All Categories</option>
                {filters.categories?.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <select
                value={filters.tag || 'all'}
                onChange={(e) => handleFilterChange('tag', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Tags</option>
                {filters.tags?.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="updatedAt">Last Updated</option>
                <option value="createdAt">Created Date</option>
                <option value="title">Title</option>
                <option value="category">Category</option>
              </select>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-3">
            {notes.map(note => (
              <div
                key={note._id}
                onClick={() => navigate(`/notes/${note._id}`)}
                className={`bg-card border border-border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  currentNote?._id === note._id ? 'ring-2 ring-primary' : ''
                } ${note.isPinned ? 'border-l-4 border-l-yellow-400' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-foreground truncate">
                    {note.isPinned && '📌 '}{note.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(note._id);
                    }}
                    className="text-foreground/40 hover:text-yellow-500"
                  >
                    📌
                  </button>
                </div>
                <p className="text-sm text-foreground/60 line-clamp-2">
                  {note.content.replace(/[#*`]/g, '').substring(0, 100)}...
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {note.tags?.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-foreground/40 mt-2">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Note Editor/Viewer */}
        <div className="lg:col-span-2">
          {isEditing ? (
            /* Note Editor */
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Note title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-2xl font-bold border-b border-border pb-2 focus:outline-none focus:border-primary bg-transparent text-foreground"
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                      placeholder="General"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center text-foreground">
                      <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        className="mr-2"
                      />
                      Pin Note
                    </label>
                    <label className="flex items-center text-foreground">
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="mr-2"
                      />
                      Public
                    </label>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      placeholder="Add tag..."
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    />
                    <button
                      onClick={addTag}
                      className="px-4 py-2 bg-card text-foreground rounded-lg hover:bg-card/80 border border-border"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Keywords
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                      placeholder="Add keyword..."
                      className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    />
                    <button
                      onClick={addKeyword}
                      className="px-4 py-2 bg-card text-foreground rounded-lg hover:bg-card/80 border border-border"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map(keyword => (
                      <span
                        key={keyword}
                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Markdown Editor */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Content (Markdown)
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your note in Markdown..."
                    className="w-full h-96 px-3 py-2 border border-border rounded-lg font-mono text-sm resize-none bg-background text-foreground"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={saveNote}
                    disabled={!title.trim() || !content.trim()}
                    className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentNote ? 'Update' : 'Save'} Note
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-6 py-2 border border-border rounded-lg hover:bg-card bg-background text-foreground"
                  >
                    Cancel
                  </button>
                  {currentNote && (
                    <button
                      onClick={() => deleteNote(currentNote._id)}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : currentNote ? (
            /* Note Viewer */
            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {currentNote.isPinned && <span className="text-2xl">📌</span>}
                  <h2 className="text-2xl font-bold text-foreground">
                    {currentNote.title}
                  </h2>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-foreground/60 mb-4">
                  <span>Category: {currentNote.category}</span>
                  <span>Updated: {new Date(currentNote.updatedAt).toLocaleString()}</span>
                  {currentNote.isPublic && <span className="text-green-600">Public</span>}
                </div>

                {currentNote.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentNote.tags.map(tag => (
                      <span key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {currentNote.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {currentNote.keywords.map(keyword => (
                      <span key={keyword} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="prose max-w-none">
                <ReactMarkdown>{currentNote.content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            /* Welcome Message */
            <div className="bg-card border border-border rounded-lg p-12 text-center shadow-sm">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Welcome to Your Notes
              </h2>
              <p className="text-foreground/60 mb-6">
                Create your first note to get started. Use Markdown for rich formatting, add tags and keywords for easy organization.
              </p>
              <button
                onClick={createNewNote}
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 text-lg"
              >
                Create Your First Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesPage;
