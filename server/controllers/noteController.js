const Note = require('../models/Note');

exports.createNote = async (req, res) => {
  try {
    const note = new Note({
      userId: req.userId,
      title: req.body.title,
      content: req.body.content,
      tags: req.body.tags || [],
      keywords: req.body.keywords || [],
      category: req.body.category || 'General',
      isPinned: req.body.isPinned || false,
      isPublic: req.body.isPublic || false
    });
    await note.save();
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating note' });
  }
};

exports.getUserNotes = async (req, res) => {
  try {
    const { category, tag, keyword, search, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
    
    let query = { userId: req.userId };
    
    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Filter by tag
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    // Filter by keyword
    if (keyword) {
      query.keywords = { $in: [keyword] };
    }
    
    // Search in title and content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Always sort pinned notes first
    if (sortBy === 'updatedAt') {
      sortOptions.isPinned = -1;
    }
    
    const notes = await Note.find(query).sort(sortOptions);
    
    // Get unique categories and tags for filtering
    const categories = await Note.distinct('category', { userId: req.userId });
    const tags = await Note.distinct('tags', { userId: req.userId });
    const keywords = await Note.distinct('keywords', { userId: req.userId });
    
    res.json({ 
      success: true, 
      notes,
      filters: { categories, tags, keywords }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching notes' });
  }
};

exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching note' });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { title, content, tags, keywords, category, isPinned, isPublic } = req.body;
    
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { 
        title, 
        content, 
        tags, 
        keywords, 
        category, 
        isPinned, 
        isPublic,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating note' });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const result = await Note.deleteOne({ _id: req.params.id, userId: req.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    res.json({ success: true, message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting note' });
  }
};

exports.togglePin = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.userId });
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }
    
    note.isPinned = !note.isPinned;
    note.updatedAt = new Date();
    await note.save();
    
    res.json({ success: true, note });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error toggling pin' });
  }
};

exports.getNoteStats = async (req, res) => {
  try {
    const stats = await Note.aggregate([
      { $match: { userId: req.userId } },
      {
        $group: {
          _id: null,
          totalNotes: { $sum: 1 },
          pinnedNotes: { $sum: { $cond: ['$isPinned', 1, 0] } },
          categories: { $addToSet: '$category' },
          totalTags: { $addToSet: '$tags' },
          totalKeywords: { $addToSet: '$keywords' }
        }
      }
    ]);
    
    if (stats.length === 0) {
      return res.json({ 
        success: true, 
        stats: { 
          totalNotes: 0, 
          pinnedNotes: 0, 
          categories: [], 
          totalTags: [], 
          totalKeywords: [] 
        } 
      });
    }
    
    // Flatten arrays
    const flatStats = stats[0];
    flatStats.totalTags = flatStats.totalTags.flat();
    flatStats.totalKeywords = flatStats.totalKeywords.flat();
    
    res.json({ success: true, stats: flatStats });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching note stats' });
  }
};