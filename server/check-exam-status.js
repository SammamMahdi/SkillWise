const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Exam = require('./models/Exam');
const User = require('./models/User');
const Course = require('./models/Course');

async function checkExamStatus() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/SkillWise?retryWrites=true&w=majority&appName=sammam";
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    console.log('=== CHECKING EXAM STATUS ===\n');

    // Check the specific exam from the notification
    const examId = '689ba02fe011bcf53204cf8e';
    
    const exam = await Exam.findById(examId)
      .populate('teacher', 'name role')
      .populate('course', 'title');

    if (exam) {
      console.log('Found exam:', exam.title);
      console.log('Current status:', exam.status);
      console.log('Teacher:', exam.teacher.name, '(', exam.teacher.role, ')');
      console.log('Course:', exam.course.title);
      console.log('Created at:', exam.createdAt);
      console.log('Submitted for review at:', exam.submittedForReviewAt);
      console.log('Is published:', exam.isPublished);
      console.log('');
    } else {
      console.log('❌ Exam not found with ID:', examId);
    }

    // Check all exams by status
    console.log('=== ALL EXAMS BY STATUS ===');
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

    // Check all exams by teacher1 (the one in notifications)
    console.log('\n=== EXAMS BY TEACHER1 ===');
    const teacher1 = await User.findOne({ name: 'teacher1' });
    if (teacher1) {
      const teacher1Exams = await Exam.find({ teacher: teacher1._id })
        .populate('course', 'title')
        .sort({ createdAt: -1 });

      console.log(`Found ${teacher1Exams.length} exams by teacher1:`);
      teacher1Exams.forEach((exam, index) => {
        console.log(`${index + 1}. "${exam.title}"`);
        console.log(`   Status: ${exam.status}`);
        console.log(`   Course: ${exam.course.title}`);
        console.log(`   Created: ${exam.createdAt}`);
        console.log(`   Submitted for review: ${exam.submittedForReviewAt || 'Not set'}`);
        console.log(`   Published: ${exam.isPublished}`);
        console.log('');
      });

      // Check which ones should be visible to admin
      const pendingForAdmin = teacher1Exams.filter(exam => exam.status === 'pending_review');
      console.log(`Exams that should be visible to admin: ${pendingForAdmin.length}`);
      pendingForAdmin.forEach((exam, index) => {
        console.log(`${index + 1}. "${exam.title}" - Status: ${exam.status}`);
      });
    }

    // Create a test exam to verify the new workflow
    console.log('\n=== CREATING TEST EXAM ===');
    if (teacher1) {
      const course = await Course.findOne({ teacher: teacher1._id });
      if (course) {
        console.log('Creating test exam with new workflow...');
        
        const testExam = new Exam({
          title: 'Test Workflow Exam - ' + new Date().toISOString(),
          description: 'Testing the new automatic submission workflow',
          course: course._id,
          teacher: teacher1._id,
          questions: [
            {
              questionText: 'What is 1 + 1?',
              type: 'mcq',
              options: [
                { text: '1', isCorrect: false },
                { text: '2', isCorrect: true },
                { text: '3', isCorrect: false }
              ],
              points: 10
            }
          ],
          timeLimit: 30,
          maxAttempts: 1,
          passingScore: 60,
          // New workflow: automatically set to pending_review
          status: 'pending_review',
          submittedForReviewAt: new Date()
        });

        await testExam.save();
        console.log('✅ Test exam created:', testExam._id);
        console.log('   Status:', testExam.status);
        console.log('   Title:', testExam.title);

        // Verify it shows up in admin query
        const adminQuery = await Exam.find({
          status: 'pending_review',
          teacher: { $ne: teacher1._id } // This should NOT exclude teacher1's exams for admin
        });

        console.log('Admin query result:', adminQuery.length, 'exams');
        
        // The issue might be here - let's check what admin IDs we're comparing against
        const admins = await User.find({ role: 'Admin' });
        console.log('\nAdmin IDs in system:');
        admins.forEach(admin => {
          console.log(`- ${admin.name}: ${admin._id}`);
          
          // Test the query for this specific admin
          const adminSpecificQuery = Exam.find({
            status: 'pending_review',
            teacher: { $ne: admin._id }
          });
          
          console.log(`  Query for ${admin.name}: teacher != ${admin._id}`);
        });

      }
    }

  } catch (error) {
    console.error('❌ Error checking exam status:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkExamStatus();
