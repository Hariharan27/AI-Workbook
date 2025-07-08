const mongoose = require('mongoose');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const Like = require('./models/Like');
const User = require('./models/User');

async function completeCleanup() {
  try {
    console.log('🔧 Starting complete cleanup...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ideatorpechu');
    console.log('✅ Connected to database');
    
    // 1. Delete all posts
    const postsResult = await Post.deleteMany({});
    console.log(`🗑️  Deleted ${postsResult.deletedCount} posts`);
    
    // 2. Delete all comments
    const commentsResult = await Comment.deleteMany({});
    console.log(`🗑️  Deleted ${commentsResult.deletedCount} comments`);
    
    // 3. Delete all likes
    const likesResult = await Like.deleteMany({});
    console.log(`🗑️  Deleted ${likesResult.deletedCount} likes`);
    
    // 4. Drop all indexes from collections
    console.log('📉 Dropping indexes...');
    
    // Drop Post indexes
    await Post.collection.dropIndexes();
    console.log('✅ Dropped Post indexes');
    
    // Drop Comment indexes
    await Comment.collection.dropIndexes();
    console.log('✅ Dropped Comment indexes');
    
    // Drop Like indexes
    await Like.collection.dropIndexes();
    console.log('✅ Dropped Like indexes');
    
    // Recreate only the correct Like indexes
    await Like.collection.createIndex({ user: 1, type: 1, post: 1 }, { unique: true, sparse: true });
    await Like.collection.createIndex({ user: 1, type: 1, comment: 1 }, { unique: true, sparse: true });
    console.log('✅ Recreated only correct Like indexes');
    
    // Drop User indexes (except _id)
    await User.collection.dropIndexes();
    console.log('✅ Dropped User indexes');
    
    // 5. Recreate proper indexes
    console.log('🔨 Recreating proper indexes...');
    
    // Post indexes
    await Post.collection.createIndex({ author: 1 });
    await Post.collection.createIndex({ createdAt: -1 });
    await Post.collection.createIndex({ hashtags: 1 });
    console.log('✅ Recreated Post indexes');
    
    // Comment indexes
    await Comment.collection.createIndex({ post: 1 });
    await Comment.collection.createIndex({ author: 1 });
    await Comment.collection.createIndex({ createdAt: -1 });
    console.log('✅ Recreated Comment indexes');
    
    // Like indexes - Simple unique indexes
    // We'll handle the logic in the application layer
    await Like.collection.createIndex({ user: 1, post: 1 }, { unique: true, sparse: true });
    await Like.collection.createIndex({ user: 1, comment: 1 }, { unique: true, sparse: true });
    console.log('✅ Recreated Like indexes with sparse unique constraints');
    
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });
    console.log('✅ Recreated User indexes');
    
    // 6. Verify cleanup
    const postCount = await Post.countDocuments();
    const commentCount = await Comment.countDocuments();
    const likeCount = await Like.countDocuments();
    
    console.log('\n📊 Cleanup Results:');
    console.log(`Posts: ${postCount}`);
    console.log(`Comments: ${commentCount}`);
    console.log(`Likes: ${likeCount}`);
    
    console.log('\n✅ Complete cleanup finished successfully!');
    console.log('🚀 You can now start fresh with like functionality');
    console.log('💡 The sparse indexes will only apply to documents where the fields exist');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the cleanup
completeCleanup(); 