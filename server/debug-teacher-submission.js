const mongoose = require('mongoose');
require('dotenv').config();

async function debugTeacherSubmission() {
  try {
    // Connect to MongoDB
    const mongoUri = "mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/SkillWise?retryWrites=true&w=majority&appName=sammam";
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const examsCollection = db.collection('exams');
    const usersCollection = db.collection('users');
    const notificationsCollection = db.collection('notifications');

    console.log('\n=== TEACHER EXAM SUBMISSION DEBUG ===');

    // Step 1: Check all exam statuses
    const examsByStatus = await examsCollection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          exams: { $push: { id: '$_id', title: '$title', teacher: '$teacher' } }
        }
      }
    ]).toArray();

    console.log('\n1. EXAM STATUS BREAKDOWN:');
    examsByStatus.forEach(group => {
      console.log(`   ${group._id}: ${group.count} exams`);
      if (group._id === 'draft') {
        group.exams.forEach(exam => {
          console.log(`      - ${exam.title} (ID: ${exam.id}, Teacher: ${exam.teacher})`);
        });
      }
    });

    // Step 2: Check if there are any draft exams
    const draftExams = await examsCollection.find({ status: 'draft' }).toArray();
    console.log(`\n2. DRAFT EXAMS AVAILABLE FOR SUBMISSION: ${draftExams.length}`);

    if (draftExams.length === 0) {
      console.log('   ❌ No draft exams found! Teachers need to create draft exams first.');
      
      // Let's create a test draft exam
      console.log('\n   Creating a test draft exam...');
      
      // Get a teacher
      const teacher = await usersCollection.findOne({ role: 'Teacher' });
      if (!teacher) {
        console.log('   ❌ No teachers found in database!');
        return;
      }
      
      // Get a course
      const coursesCollection = db.collection('courses');
      const course = await coursesCollection.findOne({ teacher: teacher._id });
      if (!course) {
        console.log('   ❌ No courses found for teacher!');
        return;
      }

      const testExam = {
        title: 'Test Exam for Admin Review',
        description: 'This is a test exam created to test the admin review process',
        course: course._id,
        teacher: teacher._id,
        questions: [
          {
            questionText: 'What is 2 + 2?',
            type: 'mcq',
            options: [
              { text: '3', isCorrect: false },
              { text: '4', isCorrect: true },
              { text: '5', isCorrect: false }
            ],
            correctAnswer: '4',
            points: 1
          }
        ],
        totalPoints: 1,
        duration: 30,
        passingScore: 60,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertResult = await examsCollection.insertOne(testExam);
      console.log(`   ✅ Created test draft exam: ${insertResult.insertedId}`);
      
      draftExams.push({ ...testExam, _id: insertResult.insertedId });
    }

    // Step 3: Test submission process for first draft exam
    if (draftExams.length > 0) {
      const draftExam = draftExams[0];
      console.log(`\n3. TESTING SUBMISSION FOR: ${draftExam.title}`);
      
      // Get teacher info
      const teacher = await usersCollection.findOne({ _id: draftExam.teacher });
      console.log(`   Teacher: ${teacher?.name || 'Unknown'} (${teacher?.role || 'Unknown'})`);
      
      // Submit for review
      console.log('   Submitting exam for review...');
      const updateResult = await examsCollection.updateOne(
        { _id: draftExam._id },
        { 
          $set: { 
            status: 'pending_review',
            submittedForReviewAt: new Date()
          } 
        }
      );
      
      if (updateResult.modifiedCount > 0) {
        console.log('   ✅ Exam status updated to pending_review');
        
        // Create notifications for admins
        const admins = await usersCollection.find({ role: 'Admin' }).toArray();
        console.log(`   Found ${admins.length} admins to notify`);
        
        if (admins.length > 0) {
          const notifications = admins.map(admin => ({
            recipient: admin._id,
            sender: teacher._id,
            type: 'exam_review_request',
            title: 'Exam Review Request',
            message: `${teacher.name} submitted "${draftExam.title}" - needs review`,
            isActionRequired: true,
            actionUrl: `/admin/exams/review`,
            data: {
              examId: draftExam._id,
              courseId: draftExam.course
            },
            createdAt: new Date(),
            read: false
          }));

          const notificationResult = await notificationsCollection.insertMany(notifications);
          console.log(`   ✅ Created ${notificationResult.insertedCount} admin notifications`);
          
          // Show notification details
          notifications.forEach((notif, index) => {
            console.log(`      Admin ${index + 1}: ${admins[index].name}`);
            console.log(`      Message: ${notif.message}`);
            console.log(`      Action URL: ${notif.actionUrl}`);
          });
        }
      } else {
        console.log('   ❌ Failed to update exam status');
      }
    }

    // Step 4: Verify pending review exams
    const pendingExams = await examsCollection.find({ status: 'pending_review' }).toArray();
    console.log(`\n4. PENDING REVIEW EXAMS (AFTER SUBMISSION): ${pendingExams.length}`);
    
    pendingExams.forEach((exam, index) => {
      console.log(`   ${index + 1}. ${exam.title}`);
      console.log(`      Status: ${exam.status}`);
      console.log(`      Submitted: ${exam.submittedForReviewAt}`);
    });

    // Step 5: Check admin notifications
    const adminNotifications = await notificationsCollection.find({ 
      type: 'exam_review_request',
      read: false 
    }).toArray();
    console.log(`\n5. UNREAD ADMIN NOTIFICATIONS: ${adminNotifications.length}`);
    
    adminNotifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title}`);
      console.log(`      Message: ${notif.message}`);
      console.log(`      Created: ${notif.createdAt}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugTeacherSubmission();
