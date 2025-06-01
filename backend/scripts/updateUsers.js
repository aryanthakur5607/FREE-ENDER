const mongoose = require('mongoose');
const User = require('../models/User');

const updateUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/your_database_name', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Update all users to have credits field
    const result = await User.updateMany(
      { credits: { $exists: false } },
      { $set: { credits: 0 } }
    );

    console.log(`Updated ${result.modifiedCount} users with credits field`);
    
    // Close the connection
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error updating users:', error);
  }
};

updateUsers(); 