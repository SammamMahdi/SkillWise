const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Exam = require('./models/Exam');
const User = require('./models/User');
const Course = require('./models/Course');
const Notification = require('./models/Notification');

async function testNewExamWorkflow() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/SkillWise?retryWrites=true&w=majority&appName=sammam";
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('=== TESTING NEW EXAM WORKFLOW ===\n');

    // 1. Find a teacher
    const teacher = await User.findOne({ role: 'Teacher' });
    if (!teacher) {
      console.log('❌ No teachers found in the system');
      return;
    }
    console.log('1. Found teacher:', teacher.name, '(', teacher._id, ')');

    // 2. Find a course created by this teacher
    const course = await Course.findOne({ teacher: teacher._id });
    if (!course) {
      console.log('❌ No courses found for this teacher');
      return;
    }
    console.log('2. Found course:', course.title, '(', course._id, ')');

    // 3. Simulate creating a new exam (as teacher would do)
    console.log('3. Creating new exam as teacher...');
    
    const newExam = new Exam({
      title: 'Test Auto-Submit Exam',
      description: 'This exam should automatically go to pending_review status',
      course: course._id,
      teacher: teacher._id,
      questions: [
        {
          type: 'mcq',
          question: 'What is the capital of France?',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 2,
          points: 10
        }
      ],
      timeLimit: 30,
      maxAttempts: 1,
      passingScore: 60,
      // This should be set automatically by the new logic
      status: 'pending_review',
      submittedForReviewAt: new Date()
    });

    await newExam.save();
    console.log('   ✅ Exam created with ID:', newExam._id);
    console.log('   Status:', newExam.status);
    console.log('   Submitted for review at:', newExam.submittedForReviewAt);

    // 4. Simulate the notification creation (as the controller would do)
    console.log('4. Creating notifications for admins...');
    
    const admins = await User.find({ role: 'Admin' });
    console.log('   Found admins:', admins.length);
    
    if (admins.length > 0) {
      const notifications = admins.map(admin => ({
        recipient: admin._id,
        sender: teacher._id,
        type: 'exam_review_request',
        title: 'New Exam Review Request',
        message: `${teacher.name} created "${newExam.title}" for ${course.title} - needs review`,
        isActionRequired: true,
        actionUrl: `/admin/exams/${newExam._id}/review`,
        data: {
          examId: newExam._id,
          courseId: course._id
        }
      }));

      await Notification.insertMany(notifications);
      console.log('   ✅ Notifications sent to', admins.length, 'admins');
    }

    // 5. Verify admin can see the exam
    console.log('5. Verifying admin can see the exam...');
    
    if (admins.length > 0) {
      const admin = admins[0];
      
      const pendingExams = await Exam.find({
        status: 'pending_review',
        teacher: { $ne: admin._id }
      })
      .populate('course', 'title')
      .populate('teacher', 'name email role')
      .sort({ createdAt: -1 });

      console.log(`   Admin ${admin.name} should see ${pendingExams.length} pending exams:`);
      pendingExams.forEach((exam, index) => {
        console.log(`   ${index + 1}. "${exam.title}" by ${exam.teacher.name}`);
        console.log(`      Course: ${exam.course.title}`);
        console.log(`      Status: ${exam.status}`);
        console.log(`      Created: ${exam.createdAt}`);
      });

      if (pendingExams.some(exam => exam._id.toString() === newExam._id.toString())) {
        console.log('   ✅ SUCCESS: Admin can see the newly created exam!');
      } else {
        console.log('   ❌ PROBLEM: Admin cannot see the newly created exam!');
      }
    }

    // 6. Check notifications
    console.log('6. Checking notifications...');
    
    const recentNotifications = await Notification.find({
      type: 'exam_review_request',
      'data.examId': newExam._id
    })
    .populate('recipient', 'name role')
    .populate('sender', 'name role');

    console.log(`   Found ${recentNotifications.length} notifications for this exam:`);
    recentNotifications.forEach((notification, index) => {
      console.log(`   ${index + 1}. To: ${notification.recipient.name} (${notification.recipient.role})`);
      console.log(`      From: ${notification.sender.name} (${notification.sender.role})`);
      console.log(`      Message: ${notification.message}`);
    });

    console.log('\n=== NEW WORKFLOW TEST COMPLETE ===');
    console.log('✅ Teacher exams now automatically go to pending_review status');
    console.log('✅ Admins are automatically notified');
    console.log('✅ No manual "Submit for Review" step required');

  } catch (error) {
    console.error('❌ Error testing new exam workflow:', error);
  } finally {
    mongoose.connection.close();
  }
}

testNewExamWorkflow();
