const mongoose = require('mongoose');
const Post = require('./models/Post');
const Like = require('./models/Like');
const Comment = require('./models/Comment');
const User = require('./models/User');

async function createTestEngagement() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ideatorpechu');
    console.log('Connected to MongoDB');

    // Get some posts and users
    const posts = await Post.find({}).limit(5);
    const users = await User.find({}).limit(3);
    
    if (posts.length === 0 || users.length === 0) {
      console.log('No posts or users found');
      return;
    }

    console.log(`Found ${posts.length} posts and ${users.length} users`);

    // Add likes to different posts
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const user = users[i % users.length];
      
      // Add multiple likes to make some posts more popular
      const likeCount = i + 1; // Post 0 gets 1 like, Post 1 gets 2 likes, etc.
      
      for (let j = 0; j < likeCount; j++) {
        const likeUser = users[j % users.length];
        
        // Check if like already exists
        const existingLike = await Like.findOne({
          user: likeUser._id,
          post: post._id,
          type: 'post'
        });
        
        if (!existingLike) {
          const like = new Like({
            user: likeUser._id,
            post: post._id,
            type: 'post'
          });
          await like.save();
          
          // Update post stats
          await Post.findByIdAndUpdate(post._id, {
            $inc: { 'stats.likesCount': 1 }
          });
          
          console.log(`Added like from ${likeUser.username} to post ${post._id}`);
        }
      }
    }

    // Add some comments
    for (let i = 0; i < Math.min(posts.length, 3); i++) {
      const post = posts[i];
      const user = users[i % users.length];
      
      const comment = new Comment({
        post: post._id,
        author: user._id,
        content: `This is test comment ${i + 1} on post ${i + 1}!`
      });
      await comment.save();
      
      // Update post stats
      await Post.findByIdAndUpdate(post._id, {
        $inc: { 'stats.commentsCount': 1 }
      });
      
      console.log(`Added comment from ${user.username} to post ${post._id}`);
    }

    // Show final stats
    const updatedPosts = await Post.find({}).select('stats');
    console.log('\nFinal post engagement:');
    updatedPosts.forEach((post, index) => {
      console.log(`Post ${index + 1}: likes=${post.stats.likesCount}, comments=${post.stats.commentsCount}, shares=${post.stats.sharesCount}`);
    });

    await mongoose.connection.close();
    console.log('\nTest engagement created successfully!');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
  }
}

createTestEngagement(); 