const express = require('express');
const router = express.Router();
const User = require('../models/User');
// use whichever you already use; this supports either
const { verifyToken } = require('../config/auth'); // sets req.userId
// const { protect } = require('../middleware/authMiddleware'); // sets req.user.id

const USERNAME_REGEX = /^[a-z0-9_.]{3,20}$/;
const normalize = (u) => (u || '').toString().trim().toLowerCase();

// Public: check availability
router.get('/public/username-available', async (req, res) => {
  try {
    const u = normalize(req.query.u || '');
    if (!USERNAME_REGEX.test(u)) {
      return res.json({ available: false, reason: 'invalid' });
    }
    const existing = await User.findOne({ username: u })
      .collation({ locale: 'en', strength: 2 })
      .select('_id')
      .lean();
    return res.json({ available: !existing, reason: existing ? 'taken' : 'ok' });
  } catch (e) {
    return res.status(500).json({ available: false, reason: 'server_error' });
  }
});

// Auth: set username for current user
router.patch('/username', verifyToken, express.json(), async (req, res) => {
  try {
    const desired = normalize(req.body.username || '');
    if (!USERNAME_REGEX.test(desired)) {
      return res.status(400).json({ error: 'invalid_username' });
    }
    const taken = await User.findOne({ username: desired })
      .collation({ locale: 'en', strength: 2 })
      .select('_id')
      .lean();
    if (taken) return res.status(409).json({ error: 'username_taken' });

    // support both styles
    const uid = req.userId || req.user?.id;
    if (!uid) return res.status(401).json({ error: 'unauthorized' });

    const user = await User.findByIdAndUpdate(
      uid,
      { username: desired },
      { new: true, runValidators: true, context: 'query' }
    ).select('name handle username email');

    if (!user) return res.status(404).json({ error: 'not_found' });

    return res.json({
      ok: true,
      user,
      displayHandle: user.username || user.handle
    });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
