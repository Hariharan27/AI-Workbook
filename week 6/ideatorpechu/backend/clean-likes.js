const mongoose = require('mongoose');
const Like = require('./models/Like');

async function cleanLikes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ideatorpechu');
    console.log('🔗 Connected to MongoDB');

    // Find and remove duplicate likes
    console.log('🔍 Finding duplicate likes...');
    
    // Find likes where both post and comment are null (invalid records)
    const invalidLikes = await Like.find({
      $or: [
        { post: null, comment: null },
        { type: 'post', comment: { $ne: null } },
        { type: 'comment', post: { $ne: null } }
      ]
    });
    
    console.log(`Found ${invalidLikes.length} invalid like records`);
    
    if (invalidLikes.length > 0) {
      await Like.deleteMany({
        $or: [
          { post: null, comment: null },
          { type: 'post', comment: { $ne: null } },
          { type: 'comment', post: { $ne: null } }
        ]
      });
      console.log('✅ Invalid like records removed');
    }

    // Find and remove duplicate likes for the same user-post combination
    const duplicates = await Like.aggregate([
      {
        $group: {
          _id: { user: '$user', type: '$type', post: '$post', comment: '$comment' },
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    console.log(`Found ${duplicates.length} duplicate groups`);
    
    for (const duplicate of duplicates) {
      // Keep the first one, remove the rest
      const idsToRemove = duplicate.ids.slice(1);
      await Like.deleteMany({ _id: { $in: idsToRemove } });
      console.log(`✅ Removed ${idsToRemove.length} duplicates for user ${duplicate._id.user}`);
    }

    // Count total likes
    const totalLikes = await Like.countDocuments();
    console.log(`📊 Total likes after cleanup: ${totalLikes}`);

    console.log('\n🎉 Like cleanup completed!');
    
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error cleaning likes:', error);
    await mongoose.connection.close();
  }
}

cleanLikes(); 