const mongoose = require('mongoose');
const Comment = require('./models/Comment');
const Like = require('./models/Like');

async function debugComment() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ideatorpechu');
    
    const commentId = '686ceb40358e10b3dbc3e69f';
    console.log('🔍 Debugging comment:', commentId);
    
    // Check if comment exists
    const comment = await Comment.findById(commentId);
    console.log('📝 Comment exists:', !!comment);
    if (comment) {
      console.log('📝 Comment data:', {
        _id: comment._id,
        content: comment.content?.substring(0, 50) + '...',
        author: comment.author,
        post: comment.post,
        likesCount: comment.likesCount,
        hasLikesArray: !!comment.likes,
        likesArrayLength: comment.likes?.length || 0
      });
    }
    
    // Check existing likes for this comment
    const existingLikes = await Like.find({ comment: commentId, type: 'comment' });
    console.log('❤️ Existing likes count:', existingLikes.length);
    console.log('❤️ Existing likes:', existingLikes.map(l => ({ user: l.user, type: l.type })));
    
    // Test the toggle operation manually
    console.log('\n🧪 Testing toggle operation...');
    try {
      const testUserId = '686cda1b9f008e01e65cd177'; // Same user as working comment
      const result = await Like.toggleLike(testUserId, commentId, 'comment');
      console.log('✅ Toggle result:', result);
    } catch (toggleError) {
      console.error('❌ Toggle error:', toggleError);
      console.error('❌ Error stack:', toggleError.stack);
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

debugComment(); 