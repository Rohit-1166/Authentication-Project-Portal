const mongoose = require('mongoose');
const { User, RefreshToken, Submission } = require('./models');
require('dotenv').config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/auth-project');
    console.log('Connected to DB');
    
    const users = await User.find();
    console.log('USERS IN DB:', users.map(u => ({ id: u._id, username: u.username, email: u.email })));
    
    const submissions = await Submission.find();
    console.log('SUBMISSIONS IN DB:', submissions);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error checking DB:', err);
  }
}

check();
