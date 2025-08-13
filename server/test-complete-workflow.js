const mongoose = require('mongoose');
require('dotenv').config();

async function testCompleteWorkflow() {
  try {
    // Connect to MongoDB
    const mongoUri = "mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/SkillWise?retryWrites=true&w=majority&appName=sammam";
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const examsCollection = db.collection('exams');
    const usersCollection = db.collection('users');
    const attemptsCollection = db.collection('examattempts');

    console.log('\n=== COMPLETE EXAM WORKFLOW TEST ===');

    // Step 1: Check pending review exams
    const pendingExams = await examsCollection.find({ status: 'pending_review' }).toArray();
    console.log(`\n1. PENDING REVIEW EXAMS: ${pendingExams.length}`);
    
    if (pendingExams.length > 0) {
      const exam = pendingExams[0];
      console.log('   - Exam ID:', exam._id);
      console.log('   - Title:', exam.title);
      console.log('   - Status:', exam.status);
      console.log('   - Published:', exam.isPublished);

      // Step 2: Simulate admin approval (this would normally be done via API)
      console.log('\n2. SIMULATING ADMIN APPROVAL...');
      const adminId = new mongoose.Types.ObjectId('6751b5b4c4c919d7b8a2b123'); // Use a valid admin ID
      
      const approvalResult = await examsCollection.updateOne(
        { _id: exam._id },
        {
          $set: {
            status: 'approved',
            reviewedBy: adminId,
            reviewedAt: new Date(),
            reviewComments: 'Approved for publication',
            isPublished: true,
            publishedAt: new Date(),
            publishedBy: adminId
          }
        }
      );

      if (approvalResult.modifiedCount > 0) {
        console.log('   ✅ Exam approved and published successfully');
        
        // Verify the changes
        const updatedExam = await examsCollection.findOne({ _id: exam._id });
        console.log('   - New Status:', updatedExam.status);
        console.log('   - Published:', updatedExam.isPublished);
        console.log('   - Published At:', updatedExam.publishedAt);
      } else {
        console.log('   ❌ Failed to approve exam');
      }
    }

    // Step 3: Check published exams available to students
    const publishedExams = await examsCollection.find({ 
      isPublished: true,
      status: 'approved'
    }).toArray();
    console.log(`\n3. PUBLISHED EXAMS AVAILABLE TO STUDENTS: ${publishedExams.length}`);
    
    publishedExams.forEach((exam, index) => {
      console.log(`   ${index + 1}. ${exam.title} (Published: ${exam.publishedAt})`);
    });

    // Step 4: Check student submissions for teacher review
    const submissions = await attemptsCollection.find({ 
      gradingStatus: { $in: ['pending', 'partially_graded'] }
    }).toArray();
    console.log(`\n4. STUDENT SUBMISSIONS PENDING TEACHER REVIEW: ${submissions.length}`);
    
    for (const submission of submissions) {
      const exam = await examsCollection.findOne({ _id: submission.exam });
      const student = await usersCollection.findOne({ _id: submission.student });
      
      console.log(`   - Student: ${student?.name || 'Unknown'}`);
      console.log(`   - Exam: ${exam?.title || 'Unknown'}`);
      console.log(`   - Score: ${submission.totalScore}/${exam?.totalPoints || 0}`);
      console.log(`   - Status: ${submission.gradingStatus}`);
      console.log(`   - Submitted: ${submission.submittedAt}`);
      console.log('   ---');
    }

    // Step 5: Check published scores (final results)
    const publishedScores = await attemptsCollection.find({ 
      scorePublished: true 
    }).toArray();
    console.log(`\n5. PUBLISHED SCORES (FINAL RESULTS): ${publishedScores.length}`);
    
    publishedScores.forEach((attempt, index) => {
      console.log(`   ${index + 1}. Final Score: ${attempt.finalScore || attempt.totalScore}`);
      console.log(`      - Percentage: ${attempt.finalPercentage || attempt.percentage}%`);
      console.log(`      - Passed: ${attempt.finalPassed || attempt.passed}`);
      console.log(`      - Published: ${attempt.publishedAt}`);
    });

    console.log('\n=== WORKFLOW SUMMARY ===');
    console.log(`✅ Pending Admin Review: ${pendingExams.length}`);
    console.log(`✅ Published & Available: ${publishedExams.length}`);
    console.log(`✅ Pending Teacher Review: ${submissions.length}`);
    console.log(`✅ Final Results Published: ${publishedScores.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testCompleteWorkflow();
