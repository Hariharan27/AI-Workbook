const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI);

const User = require('./models/User');

const testUsers = [
  {
    username: 'testuser1',
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser1@example.com',
    password: 'password123',
    isActive: true,
    isVerified: true
  },
  {
    username: 'testuser2',
    firstName: 'Another',
    lastName: 'User',
    email: 'testuser2@example.com',
    password: 'password123',
    isActive: true,
    isVerified: true
  },
  {
    username: 'john_doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    isActive: true,
    isVerified: true
  },
  {
    username: 'jane_smith',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    isActive: true,
    isVerified: true
  }
];

const createTestUsers = async () => {
  console.log('🚀 Creating test users...');
  
  try {
    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });
      
      if (existingUser) {
        console.log(`⚠️  User ${userData.username} already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      
      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      
      await user.save();
      console.log(`✅ Created user: ${userData.username} (${userData.email})`);
    }
    
    console.log('\n✅ Test users creation completed!');
    
    // List all users
    const allUsers = await User.find({}, 'username firstName lastName email isActive');
    console.log('\n📋 All users in database:');
    allUsers.forEach(user => {
      console.log(`- ${user.username} (${user.firstName} ${user.lastName}) - ${user.email} - Active: ${user.isActive}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🏁 Script completed');
    process.exit(0);
  }
};

createTestUsers(); 