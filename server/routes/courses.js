const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const { verifyToken } = require('../config/auth'); // sets req.userId

const CODE5 = /^\d{5}$/;
const ROLE_SEES_INTERNAL = new Set(['Admin', 'Teacher']);

function sanitizeCourseForUser(courseDoc, role) {
  if (!courseDoc) return courseDoc;
  const c = courseDoc.toObject ? courseDoc.toObject() : { ...courseDoc };

  // Hide internal codes for non-privileged roles
  if (!ROLE_SEES_INTERNAL.has(role)) {
    delete c.courseCode;
    if (Array.isArray(c.lectures)) {
      c.lectures = c.lectures.map(l => {
        const { lectureCode, ...rest } = l;
        return rest;
      });
    }
  }
  return c;
}

// Resolve role from Authorization if present; else "Student"
async function resolveRole(req) {
  try {
    // If verifyToken already ran earlier and set req.userId
    if (req.userId) {
      const me = await User.findById(req.userId).select('role').lean();
      return me?.role || 'Student';
    }
    // Try to parse bearer quickly just for GET visibility
    const auth = req.headers.authorization || '';
    const hasBearer = /^Bearer\s+/.test(auth);
    if (!hasBearer) return 'Student';
    // If you want to decode token here, you can import jwt and your secret.
    return 'Student';
  } catch {
    return 'Student';
  }
}

/**
 * Create course (Teacher/Admin only)
 */
router.post('/', verifyToken, express.json(), async (req, res) => {
  try {
    const me = await User.findById(req.userId).select('role');
    if (!me) return res.status(401).json({ error: 'unauthorized' });
    if (!['Teacher', 'Admin'].includes(me.role)) {
      return res.status(403).json({ error: 'only_teachers_or_admins_can_create' });
    }

    const {
      title,
      description,
      price = 0,
      tags = [],
      courseCode,
      lectures = []
    } = req.body || {};

    if (!title || !description) {
      return res.status(400).json({ error: 'title_and_description_required' });
    }
    if (!CODE5.test(String(courseCode || ''))) {
      return res.status(400).json({ error: 'invalid_courseCode', hint: 'Must be 5 digits' });
    }

    const seen = new Set();
    for (let i = 0; i < lectures.length; i++) {
      const lc = String(lectures[i]?.lectureCode || '');
      if (!CODE5.test(lc)) {
        return res.status(400).json({ error: 'invalid_lectureCode', index: i, hint: 'Must be 5 digits' });
      }
      if (seen.has(lc)) {
        return res.status(400).json({ error: 'duplicate_lectureCode', lectureCode: lc });
      }
      seen.add(lc);
    }

    const doc = await Course.create({
      title,
      description,
      price,
      tags,
      teacher: req.userId, // derive from token, never trust client
      courseCode,
      lectures
    });

    return res.status(201).json({
      ok: true,
      course: sanitizeCourseForUser(doc, me.role),
    });
  } catch (e) {
    console.error('Create course error:', e);
    return res.status(500).json({ error: 'server_error', message: e.message });
  }
});

/**
 * List courses (public)
 */
router.get('/', async (req, res) => {
  try {
    const role = await resolveRole(req);
    const q = Course.find({})
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    const courses = await q.lean();
    const safe = courses.map(c => sanitizeCourseForUser(c, role));
    res.json({ ok: true, courses: safe });
  } catch (e) {
    console.error('List courses error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

/**
 * Get single course (public)
 */
router.get('/:id', async (req, res) => {
  try {
    const role = await resolveRole(req);
    const c = await Course.findById(req.params.id)
      .populate('teacher', 'name email')
      .exec();
    if (!c) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true, course: sanitizeCourseForUser(c, role) });
  } catch (e) {
    console.error('Get course error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
