const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

async function testTeacherAPIs() {
  try {
    // Connect to MongoDB
    const mongoUri = "mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/SkillWise?retryWrites=true&w=majority&appName=sammam";
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get a teacher user
    const teacher = await usersCollection.findOne({ role: 'Teacher' });
    if (!teacher) {
      console.log('❌ No teacher found in database');
      return;
    }

    console.log(`\n=== TESTING TEACHER APIs FOR: ${teacher.name} ===`);
    console.log('Teacher ID:', teacher._id);

    // Generate a JWT token for the teacher (using the same format as the app)
    const { generateToken } = require('./config/auth');
    const token = generateToken(teacher._id.toString());

    console.log('Generated JWT token for testing');

    // Test 1: Get Teacher Exams API
    console.log('\n1. TESTING GET TEACHER EXAMS API');
    try {
      const response = await fetch('http://localhost:5000/api/exams/my-exams', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));

      if (data.success) {
        console.log(`✅ Found ${data.data.exams.length} exams for teacher`);
      } else {
        console.log('❌ API returned error:', data.message);
      }
    } catch (error) {
      console.log('❌ API call failed:', error.message);
    }

    // Test 2: Get Pending Review Attempts API
    console.log('\n2. TESTING GET PENDING REVIEW ATTEMPTS API');
    try {
      const response = await fetch('http://localhost:5000/api/exams/attempts/pending-review', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));

      if (data.success) {
        console.log(`✅ Found ${data.data.attempts.length} pending submissions for teacher`);
      } else {
        console.log('❌ API returned error:', data.message);
      }
    } catch (error) {
      console.log('❌ API call failed:', error.message);
    }

    // Test 3: Check server connectivity
    console.log('\n3. TESTING SERVER CONNECTIVITY');
    try {
      const response = await fetch('http://localhost:5000/api/health', {
        method: 'GET'
      });

      if (response.ok) {
        console.log('✅ Server is responding');
      } else {
        console.log('⚠️ Server responded with status:', response.status);
      }
    } catch (error) {
      console.log('❌ Server connectivity failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

testTeacherAPIs();
