const mongoose = require('mongoose');

async function cleanDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ideatorpechu');
    console.log('🔗 Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Collections to clean (delete all documents)
    const collectionsToClean = [
      'posts',
      'comments', 
      'likes',
      'shares',
      'notifications',
      'messages',
      'conversations',
      'hashtags',
      'relationships'
    ];

    console.log('🧹 Cleaning all collections except users...');
    
    for (const collectionName of collectionsToClean) {
      try {
        const collection = db.collection(collectionName);
        const result = await collection.deleteMany({});
        console.log(`✅ Cleaned ${collectionName}: ${result.deletedCount} documents deleted`);
      } catch (error) {
        console.log(`ℹ️  Collection ${collectionName} not found or already empty`);
      }
    }

    // Clean users collection - keep only shgracevicky@gmail.com
    console.log('\n👤 Cleaning users collection...');
    const usersCollection = db.collection('users');
    
    // Find the user to keep
    const userToKeep = await usersCollection.findOne({ email: 'shgracevicky@gmail.com' });
    
    if (userToKeep) {
      console.log(`✅ Found user to keep: ${userToKeep.email} (${userToKeep.username})`);
      
      // Delete all users except the one to keep
      const deleteResult = await usersCollection.deleteMany({ 
        email: { $ne: 'shgracevicky@gmail.com' } 
      });
      console.log(`✅ Deleted ${deleteResult.deletedCount} other users`);
      
      // Verify the user still exists
      const remainingUsers = await usersCollection.countDocuments();
      console.log(`📊 Remaining users: ${remainingUsers}`);
      
      if (remainingUsers === 1) {
        console.log('✅ Database cleaned successfully! Only shgracevicky@gmail.com remains.');
      } else {
        console.log('⚠️  Warning: Unexpected number of users remaining');
      }
    } else {
      console.log('❌ User shgracevicky@gmail.com not found in database');
      console.log('📋 Available users:');
      const allUsers = await usersCollection.find({}, { email: 1, username: 1 }).toArray();
      allUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.username})`);
      });
    }

    // Show final database state
    console.log('\n📊 Final database state:');
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   - ${collection.name}: ${count} documents`);
    }

    console.log('\n🎉 Database cleanup completed!');
    console.log('💡 You can now start fresh with only shgracevicky@gmail.com user');

    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    await mongoose.connection.close();
  }
}

// Run the cleanup if this file is executed directly
if (require.main === module) {
  cleanDatabase();
}

module.exports = cleanDatabase; 