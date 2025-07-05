const mongoose = require('mongoose');
const Post = require('./Post');
const Comment = require('./Comment');

const likeSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  post: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post' 
  },
  comment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment' 
  },
  type: { 
    type: String, 
    enum: ['post', 'comment'], 
    required: true 
  }
}, {
  timestamps: true
});

// Compound indexes for performance and uniqueness
likeSchema.index({ user: 1, post: 1 }, { unique: true, sparse: true });
likeSchema.index({ user: 1, comment: 1 }, { unique: true, sparse: true });
likeSchema.index({ post: 1, createdAt: -1 });
likeSchema.index({ comment: 1, createdAt: -1 });

// Validation to ensure either post or comment is provided, but not both
likeSchema.pre('save', function(next) {
  if (!this.post && !this.comment) {
    return next(new Error('Either post or comment must be provided'));
  }
  if (this.post && this.comment) {
    return next(new Error('Cannot like both post and comment simultaneously'));
  }
  next();
});

// Main toggle method - works without transactions
likeSchema.statics.toggleLike = async function(userId, targetId, type) {
  try {
    // Build query
    const query = { user: userId, type };
    if (type === 'post') {
      query.post = targetId;
    } else if (type === 'comment') {
      query.comment = targetId;
    }
    
    // Check if like exists
    const existingLike = await this.findOne(query);
    
    if (existingLike) {
      // Unlike: Remove the like
      await this.findByIdAndDelete(existingLike._id);
      
      // Decrement count
      if (type === 'post') {
        await Post.findByIdAndUpdate(targetId, {
          $inc: { 'stats.likesCount': -1 }
        });
      } else if (type === 'comment') {
        await Comment.findByIdAndUpdate(targetId, {
          $inc: { likesCount: -1 }
        });
      }
      
      return { isLiked: false, like: null };
    } else {
      // Like: Create new like
      const likeData = { user: userId, type };
      if (type === 'post') {
        likeData.post = targetId;
      } else if (type === 'comment') {
        likeData.comment = targetId;
      }
      
      const newLike = await this.create(likeData);
      
      // Increment count
      if (type === 'post') {
        await Post.findByIdAndUpdate(targetId, {
          $inc: { 'stats.likesCount': 1 }
        });
      } else if (type === 'comment') {
        await Comment.findByIdAndUpdate(targetId, {
          $inc: { likesCount: 1 }
        });
      }
      
      return { isLiked: true, like: newLike };
    }
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - handle race condition
      // Try to remove the like instead
      const query = { user: userId, type };
      if (type === 'post') {
        query.post = targetId;
      } else if (type === 'comment') {
        query.comment = targetId;
      }
      
      const existingLike = await this.findOne(query);
      if (existingLike) {
        await this.findByIdAndDelete(existingLike._id);
        
        // Decrement count
        if (type === 'post') {
          await Post.findByIdAndUpdate(targetId, {
            $inc: { 'stats.likesCount': -1 }
          });
        } else if (type === 'comment') {
          await Comment.findByIdAndUpdate(targetId, {
            $inc: { likesCount: -1 }
          });
        }
        
        return { isLiked: false, like: null };
      }
    }
    throw error;
  }
};

// Legacy methods for backward compatibility
likeSchema.statics.addLike = async function(userId, targetId, type) {
  const result = await this.toggleLike(userId, targetId, type);
  if (!result.isLiked) {
    throw new Error('Like operation failed');
  }
  return result.like;
};

likeSchema.statics.removeLike = async function(userId, targetId, type) {
  const result = await this.toggleLike(userId, targetId, type);
  if (result.isLiked) {
    throw new Error('Unlike operation failed');
  }
  return result.like;
};

// Static method to check if user liked
likeSchema.statics.isLikedBy = async function(userId, targetId, type) {
  const query = {
    user: userId,
    type
  };
  
  if (type === 'post') {
    query.post = targetId;
  } else if (type === 'comment') {
    query.comment = targetId;
  }
  
  const like = await this.findOne(query);
  return !!like;
};

// Static method to get likes for a target
likeSchema.statics.getLikes = async function(targetId, type, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  
  const query = { type };
  if (type === 'post') {
    query.post = targetId;
  } else if (type === 'comment') {
    query.comment = targetId;
  }
  
  const likes = await this.find(query)
    .populate('user', 'username firstName lastName avatar')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
    
  const total = await this.countDocuments(query);
  
  return {
    likes,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

// Method to sync like counts (useful for fixing data inconsistencies)
likeSchema.statics.syncLikeCounts = async function() {
  try {
    // Sync post like counts
    const posts = await Post.find({}, '_id');
    for (const post of posts) {
      const actualCount = await this.countDocuments({ post: post._id, type: 'post' });
      await Post.findByIdAndUpdate(
        post._id, 
        { 'stats.likesCount': actualCount }
      );
    }
    
    // Sync comment like counts
    const comments = await Comment.find({}, '_id');
    for (const comment of comments) {
      const actualCount = await this.countDocuments({ comment: comment._id, type: 'comment' });
      await Comment.findByIdAndUpdate(
        comment._id, 
        { likesCount: actualCount }
      );
    }
    
    console.log('Like counts synced successfully');
  } catch (error) {
    throw error;
  }
};

module.exports = mongoose.model('Like', likeSchema); 