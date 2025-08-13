const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Exam = require('./models/Exam');
const User = require('./models/User');

async function checkSpecificExam() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/SkillWise?retryWrites=true&w=majority&appName=sammam";
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('=== CHECKING SPECIFIC EXAM STATUS ===\n');

    // The exam ID from the notification
    const examId = '689ba02fe011bcf53204cf8e';
    
    const exam = await Exam.findById(examId)
      .populate('teacher', 'name role')
      .populate('course', 'title');

    if (!exam) {
      console.log('❌ Exam not found with ID:', examId);
      return;
    }

    console.log('Found exam:', exam.title);
    console.log('Current status:', exam.status);
    console.log('Teacher:', exam.teacher.name, '(', exam.teacher.role, ')');
    console.log('Course:', exam.course.title);
    console.log('Created at:', exam.createdAt);
    console.log('Submitted for review at:', exam.submittedForReviewAt);
    console.log('Is published:', exam.isPublished);

    // Check all exams by this teacher
    console.log('\n=== ALL EXAMS BY THIS TEACHER ===');
    const teacherExams = await Exam.find({ teacher: exam.teacher._id })
      .populate('course', 'title')
      .sort({ createdAt: -1 });

    teacherExams.forEach((teacherExam, index) => {
      console.log(`${index + 1}. "${teacherExam.title}"`);
      console.log(`   Status: ${teacherExam.status}`);
      console.log(`   Course: ${teacherExam.course.title}`);
      console.log(`   Created: ${teacherExam.createdAt}`);
      console.log(`   Submitted for review: ${teacherExam.submittedForReviewAt || 'Not submitted'}`);
      console.log('');
    });

    // Check all exams with different statuses
    console.log('=== EXAM STATUS SUMMARY ===');
    const statusCounts = await Exam.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    statusCounts.forEach(status => {
      console.log(`${status._id}: ${status.count} exams`);
    });

  } catch (error) {
    console.error('❌ Error checking specific exam:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkSpecificExam();
