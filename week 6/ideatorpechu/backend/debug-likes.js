const mongoose = require('mongoose');
const Like = require('./models/Like');

async function debugLikes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ideatorpechu');
    
    const userId = '686cda1b9f008e01e65cd177';
    console.log('🔍 Debugging likes for user:', userId);
    
    // Get all likes for this user
    const userLikes = await Like.find({ user: userId });
    console.log('📊 Total likes for user:', userLikes.length);
    
    console.log('\n📋 All likes for this user:');
    userLikes.forEach((like, index) => {
      console.log(`${index + 1}. ID: ${like._id}`);
      console.log(`   Type: ${like.type}`);
      console.log(`   Post: ${like.post || 'null'}`);
      console.log(`   Comment: ${like.comment || 'null'}`);
      console.log(`   Created: ${like.createdAt}`);
      console.log('');
    });
    
    // Check for problematic records
    const problematicLikes = userLikes.filter(like => 
      like.type === 'comment' && !like.comment
    );
    
    if (problematicLikes.length > 0) {
      console.log('⚠️  Found problematic likes (comment type but no comment ID):');
      problematicLikes.forEach(like => {
        console.log(`   - ID: ${like._id}, Type: ${like.type}, Post: ${like.post}, Comment: ${like.comment}`);
      });
      
      console.log('\n🧹 Cleaning up problematic likes...');
      const deleteResult = await Like.deleteMany({
        _id: { $in: problematicLikes.map(l => l._id) }
      });
      console.log(`✅ Deleted ${deleteResult.deletedCount} problematic likes`);
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

debugLikes(); 