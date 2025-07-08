const mongoose = require('mongoose');
require('dotenv').config();

// Import the Like model
require('./models/Like');

async function fixLikeIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ideatorpechu');
    console.log('Connected to MongoDB');

    // Get the Like collection
    const Like = mongoose.model('Like');
    const collection = Like.collection;

    // Drop all existing indexes except _id
    console.log('Dropping existing indexes...');
    const indexes = await collection.indexes();
    for (const index of indexes) {
      if (index.name !== '_id_') {
        console.log(`Dropping index: ${index.name}`);
        await collection.dropIndex(index.name);
      }
    }

    // Recreate the proper indexes
    console.log('Creating new indexes...');
    await collection.createIndex({ user: 1, type: 1, post: 1 }, { unique: true, sparse: true });
    await collection.createIndex({ user: 1, type: 1, comment: 1 }, { unique: true, sparse: true });
    await collection.createIndex({ post: 1, createdAt: -1 });
    await collection.createIndex({ comment: 1, createdAt: -1 });

    console.log('Indexes recreated successfully!');
    
    // Show the new indexes
    const newIndexes = await collection.indexes();
    console.log('Current indexes:', newIndexes.map(idx => idx.name));

    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
}

fixLikeIndexes(); 