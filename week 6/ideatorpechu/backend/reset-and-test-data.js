const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const Like = require('./models/Like');
const Comment = require('./models/Comment');
const Relationship = require('./models/Relationship');

async function resetAndCreateTestData() {
  try {
    console.log('🔄 Starting data reset and test data creation...');
    
    // Connect to MongoDB with shorter timeouts
    await mongoose.connect('mongodb://localhost:27017/ideatorpechu', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    console.log('✅ Connected to MongoDB');
    
    // Clear all existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Like.deleteMany({});
    await Comment.deleteMany({});
    await Relationship.deleteMany({});
    console.log('✅ All data cleared successfully');

    // Create test users
    const user1 = await User.create({
      username: 'testuser1',
      email: 'testuser1@example.com',
      password: '$2b$10$QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm123456', // bcrypt hash for 'password123'
      firstName: 'Test',
      lastName: 'User1',
      isVerified: true,
      isActive: true
    });
    const user2 = await User.create({
      username: 'testuser2',
      email: 'testuser2@example.com',
      password: '$2b$10$QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm123456',
      firstName: 'Test',
      lastName: 'User2',
      isVerified: true,
      isActive: true
    });
    console.log('👤 Created users:', user1.username, user2.username);

    // Create test posts (approved by default)
    const post1 = await Post.create({
      author: user1._id,
      content: 'Hello from user1!',
      isPublic: true,
      moderation: { status: 'approved' }
    });
    const post2 = await Post.create({
      author: user2._id,
      content: 'Hello from user2!',
      isPublic: true,
      moderation: { status: 'approved' }
    });
    console.log('📝 Created posts:', post1.content, post2.content);

    // Create a like from user1 to user2's post
    await Like.create({ user: user1._id, post: post2._id, type: 'post' });
    // Create a like from user2 to user1's post
    await Like.create({ user: user2._id, post: post1._id, type: 'post' });
    console.log('👍 Created likes between users');

    // Create a comment from user1 on user2's post
    await Comment.create({
      author: user1._id,
      post: post2._id,
      content: 'Nice post!',
      likesCount: 0
    });
    console.log('💬 Created comment');

    console.log('✅ Test data created successfully!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during reset and test data creation:', err);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

resetAndCreateTestData(); 