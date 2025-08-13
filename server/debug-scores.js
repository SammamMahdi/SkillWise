const mongoose = require('mongoose');
require('dotenv').config();

async function debugScores() {
  try {
    // Connect to MongoDB
    const mongoUri = "mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/SkillWise?retryWrites=true&w=majority&appName=sammam";
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('examattempts');

    // Get all exam attempts
    const attempts = await collection.find({}).toArray();
    
    console.log('\n=== EXAM ATTEMPTS DEBUG ===');
    console.log(`Found ${attempts.length} exam attempts`);
    
    attempts.forEach((attempt, index) => {
      console.log(`\n--- Attempt ${index + 1} ---`);
      console.log('ID:', attempt._id);
      console.log('Student:', attempt.student);
      console.log('Exam:', attempt.exam);
      console.log('Original Score:', attempt.totalScore);
      console.log('Final Score:', attempt.finalScore);
      console.log('Original Percentage:', attempt.percentage);
      console.log('Final Percentage:', attempt.finalPercentage);
      console.log('Original Passed:', attempt.passed);
      console.log('Final Passed:', attempt.finalPassed);
      console.log('Score Published:', attempt.scorePublished);
      console.log('Published At:', attempt.publishedAt);
      console.log('Instructor Feedback:', attempt.instructorFeedback);
      console.log('Grading Status:', attempt.gradingStatus);
    });

    // Check if there are any published scores
    const publishedAttempts = await collection.find({ scorePublished: true }).toArray();
    console.log(`\n=== PUBLISHED SCORES ===`);
    console.log(`Found ${publishedAttempts.length} published attempts`);
    
    publishedAttempts.forEach((attempt, index) => {
      console.log(`\n--- Published Attempt ${index + 1} ---`);
      console.log('ID:', attempt._id);
      console.log('Final Score:', attempt.finalScore);
      console.log('Final Percentage:', attempt.finalPercentage);
      console.log('Final Passed:', attempt.finalPassed);
      console.log('Published At:', attempt.publishedAt);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugScores();
