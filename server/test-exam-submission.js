const mongoose = require('mongoose');
require('dotenv').config();

async function testExamSubmission() {
  try {
    // Connect to MongoDB
    const mongoUri = "mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/SkillWise?retryWrites=true&w=majority&appName=sammam";
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const examsCollection = db.collection('exams');
    const usersCollection = db.collection('users');

    // Find the draft exam
    const draftExams = await examsCollection.find({ status: 'draft' }).toArray();
    console.log(`\n=== DRAFT EXAMS ===`);
    console.log(`Found ${draftExams.length} draft exams`);
    
    if (draftExams.length > 0) {
      const draftExam = draftExams[0];
      console.log('Draft Exam ID:', draftExam._id);
      console.log('Draft Exam Title:', draftExam.title);
      console.log('Draft Exam Teacher:', draftExam.teacher);
      
      // Get teacher info
      const teacher = await usersCollection.findOne({ _id: draftExam.teacher });
      console.log('Teacher:', teacher ? `${teacher.name} (${teacher.role})` : 'Not found');
      
      // Submit this exam for review
      console.log('\n=== SUBMITTING EXAM FOR REVIEW ===');
      const result = await examsCollection.updateOne(
        { _id: draftExam._id },
        { 
          $set: { 
            status: 'pending_review',
            submittedForReviewAt: new Date()
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log('✅ Successfully submitted exam for review');
        
        // Verify the change
        const updatedExam = await examsCollection.findOne({ _id: draftExam._id });
        console.log('Updated status:', updatedExam.status);
        console.log('Submitted at:', updatedExam.submittedForReviewAt);
      } else {
        console.log('❌ Failed to submit exam for review');
      }
    } else {
      console.log('No draft exams found to submit');
    }

    // Check pending review exams again
    const pendingExams = await examsCollection.find({ status: 'pending_review' }).toArray();
    console.log(`\n=== PENDING REVIEW EXAMS (AFTER SUBMISSION) ===`);
    console.log(`Found ${pendingExams.length} exams pending review`);
    
    pendingExams.forEach((exam, index) => {
      console.log(`\n--- Pending Exam ${index + 1} ---`);
      console.log('ID:', exam._id);
      console.log('Title:', exam.title);
      console.log('Status:', exam.status);
      console.log('Teacher ID:', exam.teacher);
      console.log('Submitted At:', exam.submittedForReviewAt);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testExamSubmission();
