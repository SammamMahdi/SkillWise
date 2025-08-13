const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Exam = require('./models/Exam');
const User = require('./models/User');
const Course = require('./models/Course');
const Notification = require('./models/Notification');

async function testTeacherExamWorkflow() {
  try {
    // Connect to MongoDB with timeout
    console.log('🔄 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/SkillWise?retryWrites=true&w=majority&appName=sammam";

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
      socketTimeoutMS: 45000, // 45 second socket timeout
    });
    console.log('✅ Connected to MongoDB');

    console.log('=== TESTING TEACHER EXAM WORKFLOW ===\n');

    // 1. Find a teacher
    console.log('🔍 Step 1: Looking for teachers...');
    const teacher = await User.findOne({ role: 'Teacher' });
    if (!teacher) {
      console.log('❌ No teachers found in the system');
      return;
    }
    console.log('✅ Step 1: Found teacher:', teacher.name, '(', teacher._id, ')');

    // 2. Find a course created by this teacher
    console.log('🔍 Step 2: Looking for courses...');
    const course = await Course.findOne({ teacher: teacher._id });
    if (!course) {
      console.log('❌ No courses found for this teacher');
      return;
    }
    console.log('✅ Step 2: Found course:', course.title, '(', course._id, ')');

    // 3. Check existing exams for this course
    console.log('🔍 Step 3: Checking existing exams...');
    const existingExams = await Exam.find({ course: course._id })
      .populate('teacher', 'name role');

    console.log('✅ Step 3: Found', existingExams.length, 'existing exams for this course');
    existingExams.forEach((exam, index) => {
      console.log(`   ${index + 1}. "${exam.title}" - Status: ${exam.status} - Teacher: ${exam.teacher.name}`);
    });

    // 4. Create a test draft exam if none exist
    let draftExam = existingExams.find(exam => exam.status === 'draft');
    
    if (!draftExam) {
      console.log('4. Creating a test draft exam...');
      draftExam = new Exam({
        title: 'Test Exam for Admin Review',
        description: 'This is a test exam created to test the admin review workflow',
        course: course._id,
        teacher: teacher._id,
        questions: [
          {
            type: 'mcq',
            question: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: 1,
            points: 10
          },
          {
            type: 'text',
            question: 'Explain the concept of variables in programming.',
            points: 15
          }
        ],
        timeLimit: 60,
        maxAttempts: 1,
        passingScore: 60,
        status: 'draft' // This is key - must be draft for teachers
      });

      await draftExam.save();
      console.log('   ✅ Draft exam created:', draftExam._id);
    } else {
      console.log('4. Found existing draft exam:', draftExam.title, '(', draftExam._id, ')');
    }

    // 5. Submit the draft exam for review
    console.log('5. Submitting exam for admin review...');
    console.log('   Current exam status:', draftExam.status);
    console.log('   Exam has timeLimit:', draftExam.timeLimit);

    // Add missing required fields if needed
    if (!draftExam.timeLimit) {
      draftExam.timeLimit = 60; // Add default time limit
    }
    if (!draftExam.maxAttempts) {
      draftExam.maxAttempts = 1;
    }
    if (!draftExam.passingScore) {
      draftExam.passingScore = 60;
    }

    // Update exam status
    draftExam.status = 'pending_review';
    draftExam.submittedForReviewAt = new Date();
    await draftExam.save();
    console.log('   ✅ Exam status updated to pending_review');

    // 6. Create notifications for admins
    const admins = await User.find({ 
      role: 'Admin',
      _id: { $ne: teacher._id } // Exclude the teacher (though they're not admin anyway)
    });
    
    console.log('6. Found admins to notify:', admins.length);
    admins.forEach(admin => {
      console.log(`   - ${admin.name} (${admin._id})`);
    });

    if (admins.length > 0) {
      const notifications = admins.map(admin => ({
        recipient: admin._id,
        sender: teacher._id,
        type: 'exam_review_request',
        title: 'Exam Review Request',
        message: `${teacher.name} submitted "${draftExam.title}" for ${course.title} - needs review`,
        isActionRequired: true,
        actionUrl: `/admin/exams/${draftExam._id}/review`,
        data: {
          examId: draftExam._id,
          courseId: course._id
        }
      }));

      await Notification.insertMany(notifications);
      console.log('   ✅ Notifications sent to', admins.length, 'admins');
    }

    // 7. Verify the exam is now visible to admins
    console.log('7. Verifying admin can see the exam...');
    
    if (admins.length > 0) {
      const admin = admins[0];
      
      // Simulate the getPendingReviewExams query
      const pendingExams = await Exam.find({
        status: 'pending_review',
        teacher: { $ne: admin._id } // Exclude admin's own exams
      })
      .populate('course', 'title')
      .populate('teacher', 'name email role')
      .sort({ createdAt: -1 });

      console.log(`   Admin ${admin.name} should see ${pendingExams.length} pending exams:`);
      pendingExams.forEach((exam, index) => {
        console.log(`   ${index + 1}. "${exam.title}" by ${exam.teacher.name} (${exam.teacher.role})`);
        console.log(`      Course: ${exam.course.title}`);
        console.log(`      Status: ${exam.status}`);
        console.log(`      Submitted: ${exam.submittedForReviewAt}`);
      });

      if (pendingExams.length === 0) {
        console.log('   ❌ PROBLEM: Admin cannot see any pending exams!');
      } else {
        console.log('   ✅ SUCCESS: Admin can see pending exams!');
      }
    }

    console.log('\n=== WORKFLOW TEST COMPLETE ===');

  } catch (error) {
    console.error('❌ Error testing teacher exam workflow:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed');
    } catch (closeError) {
      console.error('❌ Error closing MongoDB connection:', closeError.message);
    }
    process.exit(0); // Ensure the process exits
  }
}

// Add a timeout to prevent hanging
const timeoutId = setTimeout(() => {
  console.error('❌ Script timeout after 30 seconds');
  process.exit(1);
}, 30000);

testTeacherExamWorkflow()
  .then(() => {
    clearTimeout(timeoutId);
  })
  .catch((error) => {
    clearTimeout(timeoutId);
    console.error('❌ Unhandled error:', error.message);
    process.exit(1);
  });
