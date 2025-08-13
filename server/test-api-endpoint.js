const mongoose = require('mongoose');
require('dotenv').config();

// Import the controller function directly
const { getPendingReviewExams } = require('./controllers/examController');
const User = require('./models/User');

async function testApiEndpoint() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://sammam:1234@sammam.e58qn.mongodb.net/SkillWise?retryWrites=true&w=majority&appName=sammam";
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get an admin user
    const admin = await User.findOne({ role: 'Admin' });
    console.log('👨‍💼 Testing with admin:', admin.name, '(', admin._id, ')');

    // Mock request and response objects
    const mockReq = {
      userId: admin._id.toString() // This is how it comes from auth middleware
    };

    const mockRes = {
      json: function(data) {
        console.log('📤 API Response:');
        console.log('Success:', data.success);
        console.log('Exams count:', data.data?.exams?.length || 0);
        
        if (data.data?.exams?.length > 0) {
          console.log('✅ SUCCESS! API returned exams:');
          data.data.exams.forEach((exam, index) => {
            console.log(`  ${index + 1}. "${exam.title}"`);
            console.log(`     Teacher: ${exam.teacher.name} (${exam.teacher.role})`);
            console.log(`     Course: ${exam.course.title}`);
            console.log(`     Status: ${exam.status}`);
          });
        } else {
          console.log('❌ PROBLEM! API returned no exams');
        }
        
        return this;
      },
      status: function(code) {
        console.log('📊 Status code:', code);
        return this;
      }
    };

    // Call the controller function directly
    console.log('\n🔍 Calling getPendingReviewExams...');
    await getPendingReviewExams(mockReq, mockRes);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testApiEndpoint();
