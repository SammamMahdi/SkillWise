const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Exam = require('./models/Exam');
const User = require('./models/User');
const Notification = require('./models/Notification');

async function verifyAdminCanSeeExams() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/SkillWise?retryWrites=true&w=majority&appName=sammam";
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('=== VERIFYING ADMIN CAN SEE PENDING EXAMS ===\n');

    // 1. Find all admins
    const admins = await User.find({ role: 'Admin' });
    console.log('1. Found admins:', admins.length);
    
    for (const admin of admins) {
      console.log(`\n--- ADMIN: ${admin.name} (${admin._id}) ---`);
      
      // 2. Get all pending review exams
      const allPendingExams = await Exam.find({ status: 'pending_review' })
        .populate('course', 'title')
        .populate('teacher', 'name email role')
        .sort({ createdAt: -1 });

      console.log('All pending review exams:', allPendingExams.length);
      allPendingExams.forEach((exam, index) => {
        console.log(`  ${index + 1}. "${exam.title}" by ${exam.teacher.name} (${exam.teacher.role})`);
        console.log(`     Teacher ID: ${exam.teacher._id}`);
        console.log(`     Admin ID: ${admin._id}`);
        console.log(`     Should admin see this? ${exam.teacher._id.toString() !== admin._id.toString()}`);
      });

      // 3. Get exams this admin should see (excluding their own)
      const examsForAdmin = await Exam.find({
        status: 'pending_review',
        teacher: { $ne: admin._id }
      })
        .populate('course', 'title')
        .populate('teacher', 'name email role')
        .sort({ createdAt: -1 });

      console.log(`Exams ${admin.name} should see:`, examsForAdmin.length);
      examsForAdmin.forEach((exam, index) => {
        console.log(`  ${index + 1}. "${exam.title}" by ${exam.teacher.name}`);
        console.log(`     Course: ${exam.course.title}`);
        console.log(`     Status: ${exam.status}`);
        console.log(`     Submitted: ${exam.submittedForReviewAt || 'Not set'}`);
      });

      // 4. Check notifications for this admin
      const adminNotifications = await Notification.find({
        recipient: admin._id,
        type: 'exam_review_request'
      })
        .populate('sender', 'name role')
        .sort({ createdAt: -1 })
        .limit(5);

      console.log(`Recent exam review notifications for ${admin.name}:`, adminNotifications.length);
      adminNotifications.forEach((notification, index) => {
        console.log(`  ${index + 1}. From ${notification.sender.name}: ${notification.message}`);
        console.log(`     Read: ${notification.read}, Created: ${notification.createdAt}`);
        console.log(`     Action URL: ${notification.actionUrl}`);
      });

      if (examsForAdmin.length === 0) {
        console.log(`❌ ISSUE: ${admin.name} has no pending exams to review!`);
      } else {
        console.log(`✅ SUCCESS: ${admin.name} has ${examsForAdmin.length} exams to review!`);
      }
    }

    // 5. Summary
    console.log('\n=== SUMMARY ===');
    const totalPendingExams = await Exam.countDocuments({ status: 'pending_review' });
    const totalAdmins = await User.countDocuments({ role: 'Admin' });
    const totalNotifications = await Notification.countDocuments({ type: 'exam_review_request' });

    console.log(`Total pending review exams: ${totalPendingExams}`);
    console.log(`Total admins: ${totalAdmins}`);
    console.log(`Total exam review notifications: ${totalNotifications}`);

    if (totalPendingExams > 0 && totalAdmins > 0) {
      console.log('✅ System is ready - admins should be able to see pending exams!');
      console.log('📝 Next steps:');
      console.log('   1. Admin should refresh their dashboard');
      console.log('   2. Check /admin/exams/review page');
      console.log('   3. Look for notification badges');
    } else {
      console.log('❌ Issue: Either no pending exams or no admins in system');
    }

  } catch (error) {
    console.error('❌ Error verifying admin access:', error);
  } finally {
    mongoose.connection.close();
  }
}

verifyAdminCanSeeExams();
