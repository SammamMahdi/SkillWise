const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Course = require('./models/Course');
const Exam = require('./models/Exam');
const ExamAttempt = require('./models/ExamAttempt');
const ExamReAttemptRequest = require('./models/ExamReAttemptRequest');

async function testTeacherReAttemptWorkflow() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/SkillWise?retryWrites=true&w=majority&appName=sammam";
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('=== TESTING TEACHER RE-ATTEMPT WORKFLOW ===\n');

    // 1. Find a teacher and student
    const teacher = await User.findOne({ role: 'Teacher' });
    const student = await User.findOne({ role: 'Student' });
    
    if (!teacher || !student) {
      console.log('❌ Need both teacher and student in the system');
      return;
    }

    console.log('👨‍🏫 Teacher:', teacher.name, '(', teacher._id, ')');
    console.log('👨‍🎓 Student:', student.name, '(', student._id, ')');

    // 2. Find a course and exam created by the teacher
    const course = await Course.findOne({ teacher: teacher._id });
    if (!course) {
      console.log('❌ No courses found for this teacher');
      return;
    }

    const exam = await Exam.findOne({ teacher: teacher._id, course: course._id });
    if (!exam) {
      console.log('❌ No exams found for this teacher');
      return;
    }

    console.log('📚 Course:', course.title, '(', course._id, ')');
    console.log('📝 Exam:', exam.title, '(', exam._id, ')');

    // 3. Create a mock exam attempt (if needed)
    let examAttempt = await ExamAttempt.findOne({ 
      student: student._id, 
      exam: exam._id 
    });

    if (!examAttempt) {
      console.log('📝 Creating mock exam attempt...');
      examAttempt = new ExamAttempt({
        student: student._id,
        exam: exam._id,
        course: course._id,
        answers: [],
        submittedAt: new Date(),
        violationCount: 3,
        terminatedDueToViolation: true,
        violations: [
          { type: 'tab_switching', timestamp: new Date(), details: 'Student switched tabs' },
          { type: 'copy_paste', timestamp: new Date(), details: 'Copy paste detected' },
          { type: 'fullscreen_exit', timestamp: new Date(), details: 'Exited fullscreen' }
        ]
      });
      await examAttempt.save();
      console.log('✅ Mock exam attempt created:', examAttempt._id);
    } else {
      console.log('📝 Found existing exam attempt:', examAttempt._id);
    }

    // 4. Create a re-attempt request
    console.log('\n📨 Creating re-attempt request...');
    
    // Check if request already exists
    let reAttemptRequest = await ExamReAttemptRequest.findOne({
      student: student._id,
      exam: exam._id,
      examCreator: teacher._id
    });

    if (!reAttemptRequest) {
      reAttemptRequest = new ExamReAttemptRequest({
        student: student._id,
        exam: exam._id,
        course: course._id,
        examCreator: teacher._id,
        originalAttempt: examAttempt._id,
        violationType: 'multiple_violations',
        violationDetails: 'Student had multiple violations during the exam: tab switching, copy/paste, and fullscreen exit',
        studentMessage: 'I apologize for the violations. My computer had some issues and I accidentally triggered these violations. I would like to request a re-attempt to demonstrate my actual knowledge of the subject.',
        status: 'pending'
      });

      await reAttemptRequest.save();
      console.log('✅ Re-attempt request created:', reAttemptRequest._id);
    } else {
      console.log('📨 Found existing re-attempt request:', reAttemptRequest._id);
      console.log('   Status:', reAttemptRequest.status);
    }

    // 5. Test teacher can see the request
    console.log('\n🔍 Testing teacher can see re-attempt requests...');
    
    const teacherRequests = await ExamReAttemptRequest.find({
      examCreator: teacher._id,
      status: 'pending'
    })
    .populate('student', 'name email')
    .populate('exam', 'title')
    .populate('course', 'title');

    console.log(`📊 Teacher should see ${teacherRequests.length} pending requests:`);
    teacherRequests.forEach((request, index) => {
      console.log(`  ${index + 1}. From ${request.student.name} for "${request.exam.title}"`);
      console.log(`     Course: ${request.course.title}`);
      console.log(`     Violation: ${request.violationType}`);
      console.log(`     Message: ${request.studentMessage.substring(0, 50)}...`);
    });

    // 6. Test the API endpoint simulation
    console.log('\n🔗 Testing API endpoint logic...');
    
    // Simulate the getReAttemptRequests function
    const query = { examCreator: teacher._id };
    const apiRequests = await ExamReAttemptRequest.find(query)
      .populate('student', 'name email')
      .populate('exam', 'title')
      .populate('course', 'title')
      .populate('originalAttempt', 'submittedAt violationCount terminatedDueToViolation')
      .sort({ createdAt: -1 });

    console.log(`📡 API would return ${apiRequests.length} requests for teacher`);

    if (apiRequests.length > 0) {
      console.log('✅ SUCCESS! Teacher re-attempt requests workflow is working');
      console.log('\n📋 Summary:');
      console.log(`   - Teacher: ${teacher.name}`);
      console.log(`   - Student: ${student.name}`);
      console.log(`   - Course: ${course.title}`);
      console.log(`   - Exam: ${exam.title}`);
      console.log(`   - Re-attempt requests: ${apiRequests.length}`);
      console.log(`   - Request status: ${reAttemptRequest.status}`);
    } else {
      console.log('❌ PROBLEM! Teacher cannot see re-attempt requests');
    }

  } catch (error) {
    console.error('❌ Error testing teacher re-attempt workflow:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testTeacherReAttemptWorkflow();
