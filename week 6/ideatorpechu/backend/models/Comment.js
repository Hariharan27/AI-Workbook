const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post', 
    required: true, 
    index: true 
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  content: { 
    type: String, 
    required: true, 
    maxLength: 1000 
  },
  parentComment: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Comment' 
  }, // for nested comments
  mentions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  likes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  likesCount: { 
    type: Number, 
    default: 0 
  },
  isEdited: { 
    type: Boolean, 
    default: false 
  },
  editHistory: [{
    content: String,
    editedAt: { 
      type: Date, 
      default: Date.now 
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });

// Instance method to extract mentions from content
commentSchema.methods.extractMentions = function() {
  const mentionRegex = /@[\w\u0B80-\u0BFF]+/g; // Supports Tamil characters
  const mentions = this.content.match(mentionRegex);
  return mentions ? mentions.map(mention => mention.slice(1)) : [];
};

// Pre-save middleware to extract mentions
commentSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Mentions will be resolved to user IDs in the service layer
  }
  next();
});

// Instance method to add like
commentSchema.methods.addLike = function(userId) {
  if (!this.likes.includes(userId)) {
    this.likes.push(userId);
  }
  return this.save();
};

// Instance method to remove like
commentSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.toString() !== userId.toString());
  return this.save();
};

// Instance method to check if user liked
commentSchema.methods.isLikedBy = function(userId) {
  return this.likes.some(like => like.toString() === userId.toString());
};

// Static method to get comments with pagination
commentSchema.statics.getCommentsWithPagination = async function(postId, options = {}) {
  const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * limit;
  
  const comments = await this.find({ post: postId, parentComment: null }) // Only top-level comments
    .populate('author', 'username firstName lastName avatar isVerified')
    .populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'username firstName lastName avatar isVerified'
      }
    })
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .lean();
    
  const total = await this.countDocuments({ post: postId, parentComment: null });
  
  return {
    comments,
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

// Virtual for replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment'
});

// Ensure virtuals are included when converting to JSON
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema); 