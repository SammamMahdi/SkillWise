const mongoose = require('mongoose');
require('dotenv').config();

async function fixPublishedScores() {
  try {
    // Connect to MongoDB
    const mongoUri = "mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/SkillWise?retryWrites=true&w=majority&appName=sammam";
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const attemptsCollection = db.collection('examattempts');
    const examsCollection = db.collection('exams');

    // Get all published attempts that don't have final scores
    const publishedAttempts = await attemptsCollection.find({ 
      scorePublished: true,
      finalScore: { $exists: false }
    }).toArray();
    
    console.log(`\n=== FIXING ${publishedAttempts.length} PUBLISHED SCORES ===`);
    
    for (const attempt of publishedAttempts) {
      console.log(`\n--- Fixing Attempt ${attempt._id} ---`);
      console.log('Original Score:', attempt.totalScore);
      
      // Get exam details to calculate percentage
      const exam = await examsCollection.findOne({ _id: attempt.exam });
      if (!exam) {
        console.log('❌ Exam not found, skipping...');
        continue;
      }
      
      console.log('Exam Total Points:', exam.totalPoints);
      console.log('Exam Passing Score:', exam.passingScore || 60);
      
      // Use the original totalScore as the final score (since it was already published)
      const finalScore = attempt.totalScore || 0;
      const finalPercentage = Math.round((finalScore / exam.totalPoints) * 100);
      const finalPassed = finalPercentage >= (exam.passingScore || 60);
      
      console.log('Calculated Final Score:', finalScore);
      console.log('Calculated Final Percentage:', finalPercentage);
      console.log('Calculated Final Passed:', finalPassed);
      
      // Update the attempt with final scores
      const result = await attemptsCollection.updateOne(
        { _id: attempt._id },
        {
          $set: {
            finalScore: finalScore,
            finalPercentage: finalPercentage,
            finalPassed: finalPassed
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log('✅ Updated successfully');
      } else {
        console.log('❌ Update failed');
      }
    }

    console.log('\n=== VERIFICATION ===');
    const fixedAttempts = await attemptsCollection.find({ 
      scorePublished: true,
      finalScore: { $exists: true }
    }).toArray();
    
    console.log(`Fixed ${fixedAttempts.length} published attempts`);
    
    fixedAttempts.forEach((attempt, index) => {
      console.log(`\n--- Fixed Attempt ${index + 1} ---`);
      console.log('ID:', attempt._id);
      console.log('Original Score:', attempt.totalScore);
      console.log('Final Score:', attempt.finalScore);
      console.log('Final Percentage:', attempt.finalPercentage);
      console.log('Final Passed:', attempt.finalPassed);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixPublishedScores();
