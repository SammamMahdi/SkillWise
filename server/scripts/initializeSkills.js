const mongoose = require('mongoose');
const { initializeSkills } = require('../controllers/skillConnectController');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Skills Initialization');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Initialize skills data
const initializeSkillsData = async () => {
  try {
    console.log('🚀 Starting SkillConnect Skills Initialization...');
    
    const result = await initializeSkills();
    
    if (result.success) {
      console.log('✅ Skills initialization completed successfully!');
      console.log(`📊 Summary: ${result.message}`);
      if (result.data) {
        console.log(`📈 Skills created: ${result.data.skillsCreated || 0}`);
        console.log(`👥 Age groups created: ${result.data.ageGroupsCreated || 0}`);
      }
    } else {
      console.log('⚠️ Skills initialization result:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Error during skills initialization:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the initialization
const run = async () => {
  await connectDB();
  await initializeSkillsData();
};

run();
