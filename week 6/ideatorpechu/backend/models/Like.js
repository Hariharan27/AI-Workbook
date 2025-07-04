const mongoose = require('mongoose');

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

// Static method to add like
likeSchema.statics.addLike = async function(userId, targetId, type) {
  const likeData = {
    user: userId,
    type
  };
  
  if (type === 'post') {
    likeData.post = targetId;
  } else if (type === 'comment') {
    likeData.comment = targetId;
  }
  
  try {
    const like = await this.create(likeData);
    
    // Update the target's like count
    if (type === 'post') {
      await mongoose.model('Post').findByIdAndUpdate(targetId, {
        $inc: { 'stats.likesCount': 1 }
      });
    } else if (type === 'comment') {
      await mongoose.model('Comment').findByIdAndUpdate(targetId, {
        $inc: { likesCount: 1 }
      });
    }
    
    return like;
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Already liked');
    }
    throw error;
  }
};

// Static method to remove like
likeSchema.statics.removeLike = async function(userId, targetId, type) {
  const query = {
    user: userId,
    type
  };
  
  if (type === 'post') {
    query.post = targetId;
  } else if (type === 'comment') {
    query.comment = targetId;
  }
  
  const like = await this.findOneAndDelete(query);
  
  if (like) {
    // Update the target's like count
    if (type === 'post') {
      await mongoose.model('Post').findByIdAndUpdate(targetId, {
        $inc: { 'stats.likesCount': -1 }
      });
    } else if (type === 'comment') {
      await mongoose.model('Comment').findByIdAndUpdate(targetId, {
        $inc: { likesCount: -1 }
      });
    }
  }
  
  return like;
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

module.exports = mongoose.model('Like', likeSchema); 