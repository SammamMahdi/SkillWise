const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Exam = require('./models/Exam');
const User = require('./models/User');
const Course = require('./models/Course');

async function testAdminQuery() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/SkillWise?retryWrites=true&w=majority&appName=sammam";
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get teacher and admin
    const teacher = await User.findOne({ role: 'Teacher' });
    const admin = await User.findOne({ role: 'Admin' });
    const course = await Course.findOne({ teacher: teacher._id });

    console.log('👨‍🏫 Teacher:', teacher.name, '(', teacher._id, ')');
    console.log('👨‍💼 Admin:', admin.name, '(', admin._id, ')');
    console.log('📚 Course:', course.title, '(', course._id, ')');

    // Create a test exam
    console.log('\n📝 Creating test exam...');
    const testExam = new Exam({
      title: 'ADMIN QUERY TEST - ' + Date.now(),
      description: 'Testing admin query functionality',
      course: course._id,
      teacher: teacher._id, // Created by teacher
      questions: [
        {
          questionText: 'Test question?',
          type: 'mcq',
          options: [
            { text: 'Option A', isCorrect: true },
            { text: 'Option B', isCorrect: false }
          ],
          points: 10
        }
      ],
      timeLimit: 30,
      maxAttempts: 1,
      passingScore: 60,
      status: 'pending_review',
      submittedForReviewAt: new Date()
    });

    await testExam.save();
    console.log('✅ Test exam created:', testExam._id);

    // Test the admin query
    console.log('\n🔍 Testing admin query...');
    console.log('Query: { status: "pending_review", teacher: { $ne:', admin._id, '} }');

    const adminQuery = await Exam.find({
      status: 'pending_review',
      teacher: { $ne: admin._id }
    })
    .populate('course', 'title')
    .populate('teacher', 'name email role')
    .sort({ createdAt: -1 });

    console.log('📊 Admin query result:', adminQuery.length, 'exams');

    if (adminQuery.length > 0) {
      console.log('✅ SUCCESS! Admin can see pending exams:');
      adminQuery.forEach((exam, index) => {
        console.log(`  ${index + 1}. "${exam.title}"`);
        console.log(`     Teacher: ${exam.teacher.name} (${exam.teacher._id})`);
        console.log(`     Course: ${exam.course.title}`);
        console.log(`     Status: ${exam.status}`);
      });
    } else {
      console.log('❌ PROBLEM! Admin cannot see any pending exams');
      
      // Debug: Check all pending exams
      const allPending = await Exam.find({ status: 'pending_review' })
        .populate('teacher', 'name role');
      
      console.log('\n🔍 All pending exams in database:', allPending.length);
      allPending.forEach((exam, index) => {
        console.log(`  ${index + 1}. "${exam.title}"`);
        console.log(`     Teacher: ${exam.teacher.name} (ID: ${exam.teacher._id})`);
        console.log(`     Teacher ID === Admin ID? ${exam.teacher._id.toString() === admin._id.toString()}`);
        console.log(`     Should admin see? ${exam.teacher._id.toString() !== admin._id.toString()}`);
      });
    }

    // Clean up - remove test exam
    await Exam.findByIdAndDelete(testExam._id);
    console.log('\n🧹 Test exam cleaned up');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testAdminQuery();
