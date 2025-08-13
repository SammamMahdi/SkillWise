const mongoose = require('mongoose');
require('dotenv').config();

async function createSampleDraftExam() {
  try {
    // Connect to MongoDB
    const mongoUri = "mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/SkillWise?retryWrites=true&w=majority&appName=sammam";
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const examsCollection = db.collection('exams');
    const usersCollection = db.collection('users');
    const coursesCollection = db.collection('courses');

    console.log('\n=== CREATING SAMPLE DRAFT EXAM FOR TESTING ===');

    // Get a teacher
    const teacher = await usersCollection.findOne({ role: 'Teacher' });
    if (!teacher) {
      console.log('❌ No teachers found!');
      return;
    }
    console.log(`Found teacher: ${teacher.name}`);

    // Get a course for this teacher
    const course = await coursesCollection.findOne({ teacher: teacher._id });
    if (!course) {
      console.log('❌ No courses found for this teacher!');
      return;
    }
    console.log(`Found course: ${course.title}`);

    // Create a comprehensive sample exam
    const sampleExam = {
      title: 'Sample Mathematics Quiz - Ready for Review',
      description: 'A comprehensive mathematics quiz covering basic arithmetic and algebra. This exam is ready for admin review and publication.',
      course: course._id,
      teacher: teacher._id,
      questions: [
        {
          questionText: 'What is the result of 15 + 27?',
          type: 'mcq',
          options: [
            { text: '40', isCorrect: false },
            { text: '42', isCorrect: true },
            { text: '44', isCorrect: false },
            { text: '46', isCorrect: false }
          ],
          correctAnswer: '42',
          points: 2,
          explanation: 'Simple addition: 15 + 27 = 42'
        },
        {
          questionText: 'Solve for x: 2x + 5 = 13',
          type: 'mcq',
          options: [
            { text: 'x = 3', isCorrect: false },
            { text: 'x = 4', isCorrect: true },
            { text: 'x = 5', isCorrect: false },
            { text: 'x = 6', isCorrect: false }
          ],
          correctAnswer: 'x = 4',
          points: 3,
          explanation: '2x + 5 = 13, so 2x = 8, therefore x = 4'
        },
        {
          questionText: 'Explain the concept of prime numbers and give three examples.',
          type: 'essay',
          correctAnswer: 'Prime numbers are natural numbers greater than 1 that have no positive divisors other than 1 and themselves. Examples: 2, 3, 5, 7, 11, 13, etc.',
          points: 5,
          explanation: 'This tests understanding of prime number definition and ability to provide examples.'
        }
      ],
      totalPoints: 10,
      duration: 45, // 45 minutes
      passingScore: 60,
      maxAttempts: 2,
      shuffleQuestions: true,
      showResultsImmediately: false,
      allowReview: true,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert the exam
    const result = await examsCollection.insertOne(sampleExam);
    console.log(`✅ Created sample draft exam with ID: ${result.insertedId}`);
    console.log(`   Title: ${sampleExam.title}`);
    console.log(`   Course: ${course.title}`);
    console.log(`   Teacher: ${teacher.name}`);
    console.log(`   Questions: ${sampleExam.questions.length}`);
    console.log(`   Total Points: ${sampleExam.totalPoints}`);
    console.log(`   Duration: ${sampleExam.duration} minutes`);
    console.log(`   Status: ${sampleExam.status}`);

    console.log('\n=== INSTRUCTIONS FOR TEACHER ===');
    console.log('1. Login as teacher1');
    console.log('2. Go to /exams (My Exams page)');
    console.log('3. Find the exam "Sample Mathematics Quiz - Ready for Review"');
    console.log('4. Click "Submit for Review" button');
    console.log('5. Admin will receive notification and can review the exam');

    console.log('\n=== INSTRUCTIONS FOR ADMIN ===');
    console.log('1. Login as admin');
    console.log('2. Go to /admin/exams/review');
    console.log('3. You should see the submitted exam in the review queue');
    console.log('4. Click "Review" to approve or reject the exam');
    console.log('5. If approved, exam will be automatically published for students');

    // Check current exam counts
    const examCounts = await examsCollection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();

    console.log('\n=== CURRENT EXAM STATUS SUMMARY ===');
    examCounts.forEach(group => {
      console.log(`${group._id}: ${group.count} exams`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createSampleDraftExam();
