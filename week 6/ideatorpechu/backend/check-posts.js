const mongoose = require('mongoose');
const Post = require('./models/Post');
const User = require('./models/User');

async function checkAndFixPosts() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ideatorpechu');
    console.log('Connected to MongoDB');

    // Check all posts
    const posts = await Post.find({}).populate('author', 'username');
    console.log(`\nFound ${posts.length} posts:`);
    
    posts.forEach(post => {
      console.log(`ID: ${post._id}`);
      console.log(`Author: ${post.author?.username || 'Unknown'}`);
      console.log(`Content: ${post.content.substring(0, 50)}...`);
      console.log(`Status: ${post.moderation.status}`);
      console.log(`Created: ${post.createdAt}`);
      console.log('---');
    });

    // Update all posts to approved status
    const updateResult = await Post.updateMany(
      { 'moderation.status': 'pending' },
      { 'moderation.status': 'approved' }
    );
    
    console.log(`\nUpdated ${updateResult.modifiedCount} posts to approved status`);

    // Check feed posts for a specific user
    const testUser = await User.findOne({ username: 'testuser' });
    if (testUser) {
      console.log(`\nChecking feed for user: ${testUser.username}`);
      
      // Get following IDs
      const followingIds = testUser.following || [];
      console.log(`Following ${followingIds.length} users`);
      
      const feedPosts = await Post.getFeedPosts(testUser._id, followingIds);
      console.log(`Feed returned ${feedPosts.length} posts`);
      
      feedPosts.forEach(post => {
        console.log(`- ${post.author.username}: ${post.content.substring(0, 50)}...`);
      });
    }

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
  }
}

checkAndFixPosts(); 