const mongoose = require('mongoose');
require('dotenv').config();

async function updateSuperUserFlag() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('../models/User');
    
    // Update the user's isSuperUser flag
    const result = await User.updateOne(
      { email: 'husnainfarhan@gmail.com' },
      { $set: { isSuperUser: true } }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const user = await User.findOne({ email: 'husnainfarhan@gmail.com' });
    console.log('Updated user isSuperUser flag:', user?.isSuperUser);
    console.log('User name:', user?.name);
    console.log('User role:', user?.role);
    
    if (user?.isSuperUser) {
      console.log('✅ SuperUser flag successfully updated!');
    } else {
      console.log('❌ Failed to update SuperUser flag');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

updateSuperUserFlag();
