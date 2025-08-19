const mongoose = require('mongoose');
const SuperUser = require('../models/SuperUser');
require('dotenv').config();

const addSuperUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Add the initial superuser
    const superUserEmail = 'husnainfarhan@gmail.com';
    
    const existingSuperUser = await SuperUser.findOne({ email: superUserEmail });
    
    if (existingSuperUser) {
      console.log('SuperUser already exists:', superUserEmail);
    } else {
      const newSuperUser = new SuperUser({
        email: superUserEmail,
        addedBy: 'Database Owner (Initial Setup)',
        isActive: true
      });
      
      await newSuperUser.save();
      console.log('SuperUser added successfully:', superUserEmail);
    }

  } catch (error) {
    console.error('Error adding superuser:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

addSuperUser();
