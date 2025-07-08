require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('./models/Post');
const Like = require('./models/Like');
const Comment = require('./models/Comment');

// Connect to MongoDB
const connectDB = require('./config/database');

async function fixLikeCounts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    console.log('🔍 Starting like count recalculation...');
    
    // Get all posts
    const posts = await Post.find({});
    console.log(`📊 Found ${posts.length} posts to process`);

    let fixedCount = 0;
    let totalLikes = 0;

    for (const post of posts) {
      // Count actual likes for this post
      const actualLikeCount = await Like.countDocuments({ 
        post: post._id, 
        type: 'post' 
      });
      
      // Count actual comments for this post
      const actualCommentCount = await Comment.countDocuments({ 
        post: post._id 
      });

      // Update post stats if they don't match
      if (post.stats.likesCount !== actualLikeCount || post.stats.commentsCount !== actualCommentCount) {
        await Post.findByIdAndUpdate(post._id, {
          'stats.likesCount': actualLikeCount,
          'stats.commentsCount': actualCommentCount
        });
        
        console.log(`✅ Fixed post ${post._id}: likes ${post.stats.likesCount} → ${actualLikeCount}, comments ${post.stats.commentsCount} → ${actualCommentCount}`);
        fixedCount++;
      } else {
        console.log(`✅ Post ${post._id}: counts are correct (likes: ${actualLikeCount}, comments: ${actualCommentCount})`);
      }
      
      totalLikes += actualLikeCount;
    }

    console.log('\n🎉 Like count recalculation completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Posts processed: ${posts.length}`);
    console.log(`   - Posts fixed: ${fixedCount}`);
    console.log(`   - Total likes across all posts: ${totalLikes}`);

    // Verify the fix by checking a few random posts
    console.log('\n🔍 Verification - checking random posts:');
    const randomPosts = await Post.aggregate([
      { $sample: { size: 3 } }
    ]);

    for (const post of randomPosts) {
      const actualLikeCount = await Like.countDocuments({ 
        post: post._id, 
        type: 'post' 
      });
      const actualCommentCount = await Comment.countDocuments({ 
        post: post._id 
      });
      
      console.log(`   Post ${post._id}:`);
      console.log(`     - Stored likes: ${post.stats.likesCount}, Actual likes: ${actualLikeCount}`);
      console.log(`     - Stored comments: ${post.stats.commentsCount}, Actual comments: ${actualCommentCount}`);
      console.log(`     - Status: ${post.stats.likesCount === actualLikeCount ? '✅ Correct' : '❌ Mismatch'}`);
    }

  } catch (error) {
    console.error('❌ Error during like count fix:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the fix
fixLikeCounts(); 