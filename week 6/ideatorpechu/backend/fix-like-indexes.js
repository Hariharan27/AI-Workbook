const mongoose = require('mongoose');
const Like = require('./models/Like');

async function fixLikeIndexes() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ideatorpechu');
    console.log('🔗 Connected to MongoDB');

    // Drop existing indexes
    console.log('🗑️  Dropping existing indexes...');
    await Like.collection.dropIndexes();
    console.log('✅ Existing indexes dropped');

    // Recreate indexes with proper configuration
    console.log('🔧 Recreating indexes...');
    await Like.collection.createIndex(
      { user: 1, type: 1, post: 1 }, 
      { unique: true, sparse: true }
    );
    console.log('✅ Index created: { user: 1, type: 1, post: 1 }');

    await Like.collection.createIndex(
      { user: 1, type: 1, comment: 1 }, 
      { unique: true, sparse: true }
    );
    console.log('✅ Index created: { user: 1, type: 1, comment: 1 }');

    await Like.collection.createIndex({ post: 1, createdAt: -1 });
    console.log('✅ Index created: { post: 1, createdAt: -1 }');

    await Like.collection.createIndex({ comment: 1, createdAt: -1 });
    console.log('✅ Index created: { comment: 1, createdAt: -1 }');

    // List all indexes to verify
    const indexes = await Like.collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${JSON.stringify(index.key)}`);
    });

    console.log('\n🎉 Like indexes fixed successfully!');
    
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    await mongoose.connection.close();
  }
}

fixLikeIndexes(); 