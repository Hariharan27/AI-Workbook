const mongoose = require('mongoose');
const Post = require('./models/Post');
const User = require('./models/User');

async function testShareFunctionality() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ideatorpechu');
    console.log('🔗 Connected to MongoDB');

    // Create test users with unique usernames
    const timestamp = Date.now();
    const user1 = new User({
      username: `testuser1_${timestamp}`,
      firstName: 'Test',
      lastName: 'User1',
      email: `test1_${timestamp}@example.com`,
      password: 'password123'
    });
    await user1.save();
    console.log('✅ Created test user 1');

    const user2 = new User({
      username: `testuser2_${timestamp}`,
      firstName: 'Test',
      lastName: 'User2',
      email: `test2_${timestamp}@example.com`,
      password: 'password123'
    });
    await user2.save();
    console.log('✅ Created test user 2');

    // Create original post
    const originalPost = new Post({
      author: user1._id,
      content: 'This is an original post to test sharing functionality! #test #sharing',
      hashtags: ['test', 'sharing'],
      isPublic: true
    });
    await originalPost.save();
    console.log('✅ Created original post');

    // Create shared post
    const sharedPost = new Post({
      author: user2._id,
      content: 'Check out this amazing post!',
      originalPost: originalPost._id,
      isShared: true,
      isPublic: true,
      hashtags: originalPost.hashtags
    });
    await sharedPost.save();
    console.log('✅ Created shared post');

    // Update original post share count
    await Post.findByIdAndUpdate(originalPost._id, {
      $inc: { 'stats.sharesCount': 1 }
    });
    console.log('✅ Updated original post share count');

    // Verify the data
    const updatedOriginalPost = await Post.findById(originalPost._id);
    const updatedSharedPost = await Post.findById(sharedPost._id);
    
    console.log('\n📊 Test Results:');
    console.log('Original Post:', {
      id: updatedOriginalPost._id,
      content: updatedOriginalPost.content,
      sharesCount: updatedOriginalPost.stats.sharesCount,
      isShared: updatedOriginalPost.isShared
    });
    
    console.log('Shared Post:', {
      id: updatedSharedPost._id,
      content: updatedSharedPost.content,
      originalPost: updatedSharedPost.originalPost,
      isShared: updatedSharedPost.isShared
    });

    // Test getting shares
    const shares = await Post.find({
      originalPost: originalPost._id,
      isShared: true
    }).populate('author', 'username firstName lastName');
    
    console.log('\n📋 Shares of original post:');
    shares.forEach(share => {
      console.log(`- Shared by: ${share.author.firstName} ${share.author.lastName} (@${share.author.username})`);
    });

    console.log('\n🎉 Share functionality test completed successfully!');

    // Cleanup
    await Post.findByIdAndDelete(originalPost._id);
    await Post.findByIdAndDelete(sharedPost._id);
    await User.findByIdAndDelete(user1._id);
    await User.findByIdAndDelete(user2._id);
    console.log('🧹 Cleanup completed');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error testing share functionality:', error);
    await mongoose.connection.close();
  }
}

testShareFunctionality(); 