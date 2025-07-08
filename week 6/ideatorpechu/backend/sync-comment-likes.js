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
    let migratedCount = 0;

    for (const comment of comments) {
      // Count actual likes for this comment from Like model
      const actualLikeCount = await Like.countDocuments({ 
        comment: comment._id, 
        type: 'comment' 
      });
      
      // Check if we need to migrate old likes array to new system
      if (comment.likes && comment.likes.length > 0 && actualLikeCount === 0) {
        console.log(`🔄 Migrating ${comment.likes.length} likes for comment ${comment._id}`);
        
        // Create Like records for each user in the old likes array
        const likePromises = comment.likes.map(userId => 
          Like.create({
            user: userId,
            comment: comment._id,
            type: 'comment'
          })
        );
        
        await Promise.all(likePromises);
        migratedCount += comment.likes.length;
        
        // Clear the old likes array
        await Comment.findByIdAndUpdate(comment._id, { 
          $unset: { likes: 1 },
          likesCount: comment.likes.length
        });
        
        console.log(`✅ Migrated ${comment.likes.length} likes for comment ${comment._id}`);
      }
      
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
    console.log(`📊 Likes migrated: ${migratedCount}`);

    // Show some examples
    const sampleComments = await Comment.find({}).limit(5);
    console.log('\n📋 Sample comments with like counts:');
    sampleComments.forEach(comment => {
      console.log(`  - Comment ${comment._id}: ${comment.likesCount} likes`);
    });

    // Verify the sync worked
    const totalLikesInLikeModel = await Like.countDocuments({ type: 'comment' });
    const totalLikesInComments = await Comment.aggregate([
      { $group: { _id: null, total: { $sum: '$likesCount' } } }
    ]);
    
    console.log('\n🔍 Verification:');
    console.log(`  - Total likes in Like model: ${totalLikesInLikeModel}`);
    console.log(`  - Total likes in Comment model: ${totalLikesInComments[0]?.total || 0}`);

    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error syncing comment likes:', error);
    await mongoose.connection.close();
  }
}

// Run the sync if this file is executed directly
if (require.main === module) {
  syncCommentLikes();
}

module.exports = syncCommentLikes; 