const mongoose = require('mongoose');
const Comment = require('./models/Comment');
const Like = require('./models/Like');

async function syncCommentLikes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ideatorpechu');
    console.log('🔗 Connected to MongoDB');

    // Get all comments
    const comments = await Comment.find({});
    console.log(`📊 Found ${comments.length} comments to process`);

    let updatedCount = 0;
    for (const comment of comments) {
      // Count actual likes for this comment
      const actualLikeCount = await Like.countDocuments({ 
        comment: comment._id, 
        type: 'comment' 
      });
      
      // Update comment if count is different
      if (comment.likesCount !== actualLikeCount) {
        await Comment.findByIdAndUpdate(comment._id, { 
          likesCount: actualLikeCount 
        });
        console.log(`✅ Comment ${comment._id}: ${comment.likesCount} → ${actualLikeCount}`);
        updatedCount++;
      }
    }

    console.log(`\n🎉 Comment like sync completed!`);
    console.log(`📊 Comments processed: ${comments.length}`);
    console.log(`📊 Comments updated: ${updatedCount}`);

    // Show some examples
    const sampleComments = await Comment.find({}).limit(5);
    console.log('\n📋 Sample comments with like counts:');
    sampleComments.forEach(comment => {
      console.log(`  - Comment ${comment._id}: ${comment.likesCount} likes`);
    });

    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error syncing comment likes:', error);
    await mongoose.connection.close();
  }
}

syncCommentLikes(); 