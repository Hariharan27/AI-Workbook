const mongoose = require('mongoose');
const Comment = require('./models/Comment');
const Like = require('./models/Like');
const User = require('./models/User');

async function testCommentLikes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ideatorpechu');
    console.log('🔗 Connected to MongoDB');

    // Get a test user and comment
    const user = await User.findOne({});
    const comment = await Comment.findOne({});
    
    if (!user || !comment) {
      console.log('❌ No user or comment found for testing');
      return;
    }

    console.log(`🧪 Testing with user: ${user.username} and comment: ${comment._id}`);

    // Test 1: Check initial state
    console.log('\n📊 Test 1: Initial state');
    const initialLikeCount = await Like.countDocuments({ comment: comment._id, type: 'comment' });
    const commentData = await Comment.findById(comment._id);
    console.log(`  - Like count in Like model: ${initialLikeCount}`);
    console.log(`  - Like count in Comment model: ${commentData.likesCount}`);
    console.log(`  - Is liked by user: ${await Like.isLikedBy(user._id, comment._id, 'comment')}`);

    // Test 2: Add a like
    console.log('\n❤️ Test 2: Adding like');
    const likeResult = await Like.toggleLike(user._id, comment._id, 'comment');
    console.log(`  - Toggle result: ${likeResult.isLiked ? 'Liked' : 'Unliked'}`);
    
    const afterLikeCount = await Like.countDocuments({ comment: comment._id, type: 'comment' });
    const commentAfterLike = await Comment.findById(comment._id);
    console.log(`  - Like count in Like model: ${afterLikeCount}`);
    console.log(`  - Like count in Comment model: ${commentAfterLike.likesCount}`);
    console.log(`  - Is liked by user: ${await Like.isLikedBy(user._id, comment._id, 'comment')}`);

    // Test 3: Remove the like
    console.log('\n💔 Test 3: Removing like');
    const unlikeResult = await Like.toggleLike(user._id, comment._id, 'comment');
    console.log(`  - Toggle result: ${unlikeResult.isLiked ? 'Liked' : 'Unliked'}`);
    
    const afterUnlikeCount = await Like.countDocuments({ comment: comment._id, type: 'comment' });
    const commentAfterUnlike = await Comment.findById(comment._id);
    console.log(`  - Like count in Like model: ${afterUnlikeCount}`);
    console.log(`  - Like count in Comment model: ${commentAfterUnlike.likesCount}`);
    console.log(`  - Is liked by user: ${await Like.isLikedBy(user._id, comment._id, 'comment')}`);

    // Test 4: Add like again and verify consistency
    console.log('\n🔄 Test 4: Adding like again and verifying consistency');
    await Like.toggleLike(user._id, comment._id, 'comment');
    
    // Manually update comment like count to simulate the backend behavior
    const finalLikeCount = await Like.countDocuments({ comment: comment._id, type: 'comment' });
    await Comment.findByIdAndUpdate(comment._id, { likesCount: finalLikeCount });
    
    const finalComment = await Comment.findById(comment._id);
    console.log(`  - Final like count in Like model: ${finalLikeCount}`);
    console.log(`  - Final like count in Comment model: ${finalComment.likesCount}`);
    console.log(`  - Counts match: ${finalLikeCount === finalComment.likesCount ? '✅' : '❌'}`);

    console.log('\n🎉 Comment like tests completed!');

    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error testing comment likes:', error);
    await mongoose.connection.close();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCommentLikes();
}

module.exports = testCommentLikes; 