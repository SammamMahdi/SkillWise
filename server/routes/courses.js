const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Exam = require('../models/Exam');
const User = require('../models/User');
const { verifyToken } = require('../config/auth'); // sets req.userId
const { getAllCourses, getCourseById } = require('../controllers/courseController');

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
  console.log('Course creation route hit');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User ID from token:', req.userId);
  
  try {
    const me = await User.findById(req.userId).select('role');
    console.log('User found:', me ? { id: me._id, role: me.role } : 'Not found');
    
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

    // First, create the course without exam references
    const courseData = {
      title,
      description,
      price,
      tags,
      teacher: req.userId,
      courseCode,
      lectures: lectures.map(lecture => ({
        lectureCode: lecture.lectureCode,
        title: lecture.title,
        content: lecture.content || [],
        quiz: lecture.quiz || [],
        isLocked: lecture.isLocked !== false,
        isExam: lecture.isExam || false,
        timeLimit: lecture.timeLimit,
        shuffleQuestions: lecture.shuffleQuestions || false,
        exam: null, // Will be updated after exam creation
        examRequired: lecture.examRequired || false,
        passingScore: lecture.passingScore || 60,
        estimatedDuration: lecture.estimatedDuration,
        difficulty: lecture.difficulty || 'beginner'
      }))
    };

    console.log('Creating course with data:', JSON.stringify(courseData, null, 2));
    
    const doc = await Course.create(courseData);
    console.log('Course created successfully:', doc._id);

    console.log('Exam data from request:', JSON.stringify(req.body.examData, null, 2));
    console.log('Lectures with embedded exams:', lectures.filter(l => l.exam && typeof l.exam === 'object').map(l => ({ title: l.title, examTitle: l.exam.title })));

    // Now handle exam creation for lectures that have exam data
    const examData = req.body.examData || [];
    const examUpdates = [];

    // Process examData from the separate array
    for (const examInfo of examData) {
      const { lectureIndex, examData: examDetails } = examInfo;
      
      if (lectureIndex >= 0 && lectureIndex < doc.lectures.length && examDetails) {
        try {
          // Validate exam data
          if (!examDetails.title || !examDetails.questions || examDetails.questions.length === 0) {
            throw new Error('Exam must have a title and at least one question');
          }

          // Validate questions
          for (let i = 0; i < examDetails.questions.length; i++) {
            const q = examDetails.questions[i];
            if (!q.questionText || !q.type) {
              throw new Error(`Question ${i + 1} must have text and type`);
            }
            if (q.type === 'mcq') {
              if (!q.options || q.options.length < 2) {
                throw new Error(`Question ${i + 1} must have at least 2 options`);
              }
              if (!q.options.some(opt => opt.isCorrect)) {
                throw new Error(`Question ${i + 1} must have at least one correct answer`);
              }
            }
            if (q.type === 'short_answer' && !q.correctAnswer) {
              throw new Error(`Question ${i + 1} must have a correct answer`);
            }
          }

          // Create the exam document
          const examDoc = await Exam.create({
            title: examDetails.title,
            description: examDetails.description || '',
            course: doc._id,
            teacher: req.userId,
            questions: examDetails.questions.map(q => ({
              questionText: q.questionText,
              type: q.type,
              options: q.type === 'mcq' ? (q.options || []).map(opt => ({
                text: opt.text || '',
                isCorrect: !!opt.isCorrect
              })) : [],
              correctAnswer: q.type === 'short_answer' ? (q.correctAnswer || '') : '',
              maxWords: q.type === 'essay' ? (q.maxWords || 100) : undefined,
              points: q.points || 1,
              explanation: q.explanation || '',
              difficulty: q.difficulty || 'medium'
            })),
            timeLimit: examDetails.timeLimit || 60,
            totalPoints: examDetails.questions.reduce((sum, q) => sum + (q.points || 1), 0),
            passingScore: examDetails.passingScore || 60,
            shuffleQuestions: examDetails.shuffleQuestions !== false,
            randomizeOptions: examDetails.randomizeOptions !== false,
            maxAttempts: examDetails.maxAttempts || 1,
            status: 'draft'
          });

          console.log('Exam created successfully:', examDoc._id);

          // Update the lecture to reference the exam
          examUpdates.push({
            lectureIndex,
            examId: examDoc._id
          });

        } catch (examError) {
          console.error('Failed to create exam for lecture', lectureIndex, ':', examError);
          // Return error response instead of continuing
          return res.status(400).json({ 
            error: 'exam_creation_failed', 
            message: examError.message,
            lectureIndex 
          });
        }
      }
    }

    // Also process exams that are embedded directly in lectures
    for (let i = 0; i < lectures.length; i++) {
      const lecture = lectures[i];
      if (lecture.exam && typeof lecture.exam === 'object' && lecture.exam.questions) {
        try {
          // Validate exam data
          if (!lecture.exam.title || !lecture.exam.questions || lecture.exam.questions.length === 0) {
            throw new Error('Exam must have a title and at least one question');
          }

          // Validate questions
          for (let i = 0; i < lecture.exam.questions.length; i++) {
            const q = lecture.exam.questions[i];
            if (!q.questionText || !q.type) {
              throw new Error(`Question ${i + 1} must have text and type`);
            }
            if (q.type === 'mcq') {
              if (!q.options || q.options.length < 2) {
                throw new Error(`Question ${i + 1} must have at least 2 options`);
              }
              if (!q.options.some(opt => opt.isCorrect)) {
                throw new Error(`Question ${i + 1} must have at least one correct answer`);
              }
            }
            if (q.type === 'short_answer' && !q.correctAnswer) {
              throw new Error(`Question ${i + 1} must have a correct answer`);
            }
          }

          // Create the exam document
          const examDoc = await Exam.create({
            title: lecture.exam.title,
            description: lecture.exam.description || '',
            course: doc._id,
            teacher: req.userId,
            questions: lecture.exam.questions.map(q => ({
              questionText: q.questionText,
              type: q.type,
              options: q.type === 'mcq' ? (q.options || []).map(opt => ({
                text: opt.text || '',
                isCorrect: !!opt.isCorrect
              })) : [],
              correctAnswer: q.type === 'short_answer' ? (q.correctAnswer || '') : '',
              maxWords: q.type === 'essay' ? (q.maxWords || 100) : undefined,
              points: q.points || 1,
              explanation: q.explanation || '',
              difficulty: q.difficulty || 'medium'
            })),
            timeLimit: lecture.exam.timeLimit || 60,
            totalPoints: lecture.exam.questions.reduce((sum, q) => sum + (q.points || 1), 0),
            passingScore: lecture.exam.passingScore || 60,
            shuffleQuestions: lecture.exam.shuffleQuestions !== false,
            randomizeOptions: lecture.exam.randomizeOptions !== false,
            maxAttempts: lecture.exam.maxAttempts || 1,
            status: 'draft'
          });

          console.log('Exam created successfully for embedded exam:', examDoc._id);

          // Update the lecture to reference the exam
          examUpdates.push({
            lectureIndex: i,
            examId: examDoc._id
          });

        } catch (examError) {
          console.error('Failed to create embedded exam for lecture', i, ':', examError);
          // Return error response instead of continuing
          return res.status(400).json({ 
            error: 'exam_creation_failed', 
            message: examError.message,
            lectureIndex: i 
          });
        }
      }
    }

    // Update the course with exam references
    if (examUpdates.length > 0) {
      const updateData = {};
      examUpdates.forEach(({ lectureIndex, examId }) => {
        updateData[`lectures.${lectureIndex}.exam`] = examId;
      });

      await Course.findByIdAndUpdate(doc._id, updateData);
      console.log('Course updated with exam references');
    }

    return res.status(201).json({
      ok: true,
      course: sanitizeCourseForUser(doc, me.role),
    });
  } catch (e) {
    console.error('Create course error:', e);
    // Provide more detailed error information
    if (e.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'validation_error', 
        message: 'Course validation failed',
        details: Object.values(e.errors).map(err => err.message)
      });
    }
    return res.status(500).json({ error: 'server_error', message: e.message });
  }
});

/**
 * List courses (public) - with search and filters
 */
router.get('/', getAllCourses);

/**
 * Get single course (public)
 */
router.get('/:id', getCourseById);

/**
 * Update course (Teacher/Admin only - course owner)
 */
router.put('/:id', verifyToken, express.json(), async (req, res) => {
  console.log('Course update route hit');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('User ID from token:', req.userId);
  
  try {
    const me = await User.findById(req.userId).select('role');
    console.log('User found:', me ? { id: me._id, role: me.role } : 'Not found');
    
    if (!me) return res.status(401).json({ error: 'unauthorized' });
    if (!['Teacher', 'Admin'].includes(me.role)) {
      return res.status(403).json({ error: 'only_teachers_or_admins_can_update' });
    }

    const courseId = req.params.id;
    const existingCourse = await Course.findById(courseId);
    
    if (!existingCourse) {
      return res.status(404).json({ error: 'course_not_found' });
    }

    // Check if user owns the course or is admin
    if (existingCourse.teacher.toString() !== req.userId && me.role !== 'Admin') {
      return res.status(403).json({ error: 'not_course_owner' });
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

    // Update the course
    const updateData = {
      title,
      description,
      price,
      tags,
      courseCode,
      lectures: lectures.map(lecture => ({
        _id: lecture._id, // Keep existing ID for updates
        lectureCode: lecture.lectureCode,
        title: lecture.title,
        content: lecture.content || [],
        quiz: lecture.quiz || [],
        isLocked: lecture.isLocked !== false,
        isExam: lecture.isExam || false,
        timeLimit: lecture.timeLimit,
        shuffleQuestions: lecture.shuffleQuestions || false,
        exam: lecture.exam || null,
        examRequired: lecture.examRequired || false,
        passingScore: lecture.passingScore || 60,
        estimatedDuration: lecture.estimatedDuration,
        difficulty: lecture.difficulty || 'beginner'
      }))
    };

    console.log('Updating course with data:', JSON.stringify(updateData, null, 2));
    
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    console.log('Course updated successfully:', updatedCourse._id);

    // Handle exam creation for new exams
    const examData = req.body.examData || [];
    const examUpdates = [];

    // Process examData from the separate array
    for (const examInfo of examData) {
      const { lectureIndex, examData: examDetails } = examInfo;
      
      if (lectureIndex >= 0 && lectureIndex < updatedCourse.lectures.length && examDetails) {
        try {
          // Validate exam data
          if (!examDetails.title || !examDetails.questions || examDetails.questions.length === 0) {
            throw new Error('Exam must have a title and at least one question');
          }

          // Validate questions
          for (let i = 0; i < examDetails.questions.length; i++) {
            const q = examDetails.questions[i];
            if (!q.questionText || !q.type) {
              throw new Error(`Question ${i + 1} must have text and type`);
            }
            if (q.type === 'mcq') {
              if (!q.options || q.options.length < 2) {
                throw new Error(`Question ${i + 1} must have at least 2 options`);
              }
              if (!q.options.some(opt => opt.isCorrect)) {
                throw new Error(`Question ${i + 1} must have at least one correct answer`);
              }
            }
            if (q.type === 'short_answer' && !q.correctAnswer) {
              throw new Error(`Question ${i + 1} must have a correct answer`);
            }
          }

          // Create the exam document
          const examDoc = await Exam.create({
            title: examDetails.title,
            description: examDetails.description || '',
            course: updatedCourse._id,
            teacher: req.userId,
            questions: examDetails.questions.map(q => ({
              questionText: q.questionText,
              type: q.type,
              options: q.type === 'mcq' ? (q.options || []).map(opt => ({
                text: opt.text || '',
                isCorrect: !!opt.isCorrect
              })) : [],
              correctAnswer: q.type === 'short_answer' ? (q.correctAnswer || '') : '',
              maxWords: q.type === 'essay' ? (q.maxWords || 100) : undefined,
              points: q.points || 1,
              explanation: q.explanation || '',
              difficulty: q.difficulty || 'medium'
            })),
            timeLimit: examDetails.timeLimit || 60,
            totalPoints: examDetails.questions.reduce((sum, q) => sum + (q.points || 1), 0),
            passingScore: examDetails.passingScore || 60,
            shuffleQuestions: examDetails.shuffleQuestions !== false,
            randomizeOptions: examDetails.randomizeOptions !== false,
            maxAttempts: examDetails.maxAttempts || 1,
            status: 'draft'
          });

          console.log('Exam created successfully:', examDoc._id);

          // Update the lecture to reference the exam
          examUpdates.push({
            lectureIndex,
            examId: examDoc._id
          });

        } catch (examError) {
          console.error('Failed to create exam for lecture', lectureIndex, ':', examError);
          return res.status(400).json({ 
            error: 'exam_creation_failed', 
            message: examError.message,
            lectureIndex 
          });
        }
      }
    }

    // Update the course with exam references
    if (examUpdates.length > 0) {
      const updateData = {};
      examUpdates.forEach(({ lectureIndex, examId }) => {
        updateData[`lectures.${lectureIndex}.exam`] = examId;
      });

      await Course.findByIdAndUpdate(updatedCourse._id, updateData);
      console.log('Course updated with exam references');
    }

    return res.status(200).json({
      ok: true,
      course: sanitizeCourseForUser(updatedCourse, me.role),
    });
  } catch (e) {
    console.error('Update course error:', e);
    if (e.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'validation_error', 
        message: 'Course validation failed',
        details: Object.values(e.errors).map(err => err.message)
      });
    }
    return res.status(500).json({ error: 'server_error', message: e.message });
  }
});

/**
 * Add exam to lecture (Teacher/Admin only)
 */
router.post('/:courseId/lectures/:lectureIndex/exam', verifyToken, express.json(), async (req, res) => {
  try {
    const { courseId, lectureIndex } = req.params;
    const { examId } = req.body;

    // Check if user is teacher/admin
    const me = await User.findById(req.userId).select('role');
    if (!me || !['Teacher', 'Admin'].includes(me.role)) {
      return res.status(403).json({ error: 'only_teachers_or_admins_can_modify' });
    }

    // Check if course exists and user owns it
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'course_not_found' });
    }
    if (course.teacher.toString() !== req.userId && me.role !== 'Admin') {
      return res.status(403).json({ error: 'not_course_owner' });
    }

    // Validate lecture index
    const lectureIdx = parseInt(lectureIndex);
    if (isNaN(lectureIdx) || lectureIdx < 0 || lectureIdx >= course.lectures.length) {
      return res.status(400).json({ error: 'invalid_lecture_index' });
    }

    // Check if exam exists
    const Exam = require('../models/Exam');
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'exam_not_found' });
    }

    // Update lecture with exam
    course.lectures[lectureIdx].exam = examId;
    course.lectures[lectureIdx].examRequired = true;
    course.lectures[lectureIdx].passingScore = req.body.passingScore || 60;

    await course.save();

    res.json({
      ok: true,
      message: 'Exam added to lecture successfully',
      lecture: course.lectures[lectureIdx]
    });

  } catch (e) {
    console.error('Add exam to lecture error:', e);
    return res.status(500).json({ error: 'server_error', message: e.message });
  }
});

/**
 * Remove exam from lecture (Teacher/Admin only)
 */
router.delete('/:courseId/lectures/:lectureIndex/exam', verifyToken, async (req, res) => {
  try {
    const { courseId, lectureIndex } = req.params;

    // Check if user is teacher/admin
    const me = await User.findById(req.userId).select('role');
    if (!me || !['Teacher', 'Admin'].includes(me.role)) {
      return res.status(403).json({ error: 'only_teachers_or_admins_can_modify' });
    }

    // Check if course exists and user owns it
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'course_not_found' });
    }
    if (course.teacher.toString() !== req.userId && me.role !== 'Admin') {
      return res.status(403).json({ error: 'not_course_owner' });
    }

    // Validate lecture index
    const lectureIdx = parseInt(lectureIndex);
    if (isNaN(lectureIdx) || lectureIdx < 0 || lectureIdx >= course.lectures.length) {
      return res.status(400).json({ error: 'invalid_lecture_index' });
    }

    // Remove exam from lecture
    course.lectures[lectureIdx].exam = undefined;
    course.lectures[lectureIdx].examRequired = false;
    course.lectures[lectureIdx].passingScore = 60;

    await course.save();

    res.json({
      ok: true,
      message: 'Exam removed from lecture successfully',
      lecture: course.lectures[lectureIdx]
    });

  } catch (e) {
    console.error('Remove exam from lecture error:', e);
    return res.status(500).json({ error: 'server_error', message: e.message });
  }
});

module.exports = router;
