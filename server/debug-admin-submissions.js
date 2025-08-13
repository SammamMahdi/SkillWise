const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillwise', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const ExamAttempt = require('./models/ExamAttempt');
const Exam = require('./models/Exam');
const Course = require('./models/Course');
const User = require('./models/User');

async function debugAdminSubmissions() {
  try {
    console.log('=== DEBUGGING ADMIN SUBMISSION REVIEW ISSUE ===\n');

    // Find all admins
    const admins = await User.find({ role: 'Admin' }).select('_id name email');
    console.log('Found admins:', admins.length);
    
    for (const admin of admins) {
      console.log(`\n--- Admin: ${admin.name} (${admin._id}) ---`);
      
      // Find courses created by this admin
      const courses = await Course.find({ teacher: admin._id }).select('_id title');
      console.log(`Courses created by ${admin.name}:`, courses.length);
      
      if (courses.length === 0) {
        console.log('No courses found for this admin');
        continue;
      }
      
      courses.forEach(course => {
        console.log(`  - ${course.title} (${course._id})`);
      });
      
      // Find exams for these courses
      const courseIds = courses.map(c => c._id);
      const exams = await Exam.find({ course: { $in: courseIds } }).select('_id title course');
      console.log(`Exams for these courses:`, exams.length);
      
      if (exams.length === 0) {
        console.log('No exams found for these courses');
        continue;
      }
      
      // Find all submitted attempts for these exams
      const examIds = exams.map(e => e._id);
      const allAttempts = await ExamAttempt.find({
        exam: { $in: examIds },
        status: 'submitted'
      })
      .populate('student', 'name email')
      .populate('exam', 'title')
      .sort({ submittedAt: -1 });
      
      console.log(`All submitted attempts for ${admin.name}'s exams:`, allAttempts.length);
      
      allAttempts.forEach((attempt, index) => {
        console.log(`  ${index + 1}. ${attempt.student.name} - ${attempt.exam.title}`);
        console.log(`     Status: ${attempt.status}`);
        console.log(`     Submission Method: ${attempt.submissionMethod || 'manual'}`);
        console.log(`     Terminated Due to Violation: ${attempt.terminatedDueToViolation || false}`);
        console.log(`     Score Published: ${attempt.scorePublished || false}`);
        console.log(`     Grading Status: ${attempt.gradingStatus || 'pending'}`);
        console.log(`     Submitted At: ${attempt.submittedAt}`);
        console.log(`     Violation Count: ${attempt.violationCount || 0}`);
        console.log('');
      });
      
      // Find pending review attempts (what should show in admin dashboard)
      const pendingAttempts = await ExamAttempt.find({
        exam: { $in: examIds },
        status: 'submitted',
        scorePublished: { $ne: true }
      })
      .populate('student', 'name email')
      .populate('exam', 'title')
      .sort({ submittedAt: -1 });
      
      console.log(`Pending review attempts for ${admin.name}:`, pendingAttempts.length);
      
      pendingAttempts.forEach((attempt, index) => {
        console.log(`  PENDING ${index + 1}. ${attempt.student.name} - ${attempt.exam.title}`);
        console.log(`     Submission Method: ${attempt.submissionMethod || 'manual'}`);
        console.log(`     Terminated Due to Violation: ${attempt.terminatedDueToViolation || false}`);
        console.log(`     Violation Count: ${attempt.violationCount || 0}`);
        console.log('');
      });
      
      // Check for auto-submitted attempts specifically
      const autoSubmittedAttempts = await ExamAttempt.find({
        exam: { $in: examIds },
        status: 'submitted',
        submissionMethod: 'auto_violation'
      })
      .populate('student', 'name email')
      .populate('exam', 'title');
      
      console.log(`Auto-submitted (violation) attempts for ${admin.name}:`, autoSubmittedAttempts.length);
      
      autoSubmittedAttempts.forEach((attempt, index) => {
        console.log(`  AUTO ${index + 1}. ${attempt.student.name} - ${attempt.exam.title}`);
        console.log(`     Score Published: ${attempt.scorePublished || false}`);
        console.log(`     Grading Status: ${attempt.gradingStatus || 'pending'}`);
        console.log(`     Should appear in pending? ${!attempt.scorePublished ? 'YES' : 'NO'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error debugging admin submissions:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugAdminSubmissions();
