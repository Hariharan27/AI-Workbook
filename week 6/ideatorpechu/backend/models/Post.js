const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  content: { 
    type: String, 
    required: true, 
    maxLength: 5000 
  },
  media: [{
    type: { 
      type: String, 
      enum: ['image', 'video'], 
      required: true 
    },
    url: { 
      type: String, 
      required: true 
    },
    thumbnail: { 
      type: String 
    },
    metadata: {
      size: { type: Number },
      duration: { type: Number }, // for videos
      dimensions: { width: Number, height: Number }
    }
  }],
  hashtags: [{ 
    type: String, 
    index: true 
  }],
  mentions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: false
    },
    coordinates: {
      type: [Number],
      required: false
    }
  },
  isPublic: { 
    type: Boolean, 
    default: true 
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
  }],
  stats: {
    likesCount: { 
      type: Number, 
      default: 0 
    },
    commentsCount: { 
      type: Number, 
      default: 0 
    },
    sharesCount: { 
      type: Number, 
      default: 0 
    },
    viewsCount: { 
      type: Number, 
      default: 0 
    }
  },
  moderation: {
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    flagged: { 
      type: Boolean, 
      default: false 
    },
    flaggedBy: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }]
  },
  // Sharing functionality
  isShared: { 
    type: Boolean, 
    default: false 
  },
  originalPost: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Post' 
  }
}, {
  timestamps: true
});

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'moderation.status': 1 });
postSchema.index({ location: '2dsphere' });
postSchema.index({ createdAt: -1 });
postSchema.index({ isShared: 1, originalPost: 1 });
postSchema.index({ isPublic: 1, 'moderation.status': 1 });

// Text search index for content
postSchema.index({ content: 'text' });

// Instance method to extract hashtags from content
postSchema.methods.extractHashtags = function() {
  const hashtagRegex = /#[\w\u0B80-\u0BFF]+/g; // Supports Tamil characters
  const hashtags = this.content.match(hashtagRegex);
  return hashtags ? hashtags.map(tag => tag.toLowerCase()) : [];
};

// Instance method to extract mentions from content
postSchema.methods.extractMentions = function() {
  const mentionRegex = /@[\w\u0B80-\u0BFF]+/g; // Supports Tamil characters
  const mentions = this.content.match(mentionRegex);
  return mentions ? mentions.map(mention => mention.slice(1)) : [];
};

// Pre-save middleware to extract hashtags and mentions
postSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    try {
      this.hashtags = this.extractHashtags();
      // Mentions will be resolved to user IDs in the service layer
    } catch (error) {
      console.error('Error extracting hashtags:', error);
      this.hashtags = [];
    }
  }
  next();
});

// Static method to get posts with pagination
postSchema.statics.getPostsWithPagination = async function(query = {}, options = {}) {
  const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * limit;
  
  const posts = await this.find(query)
    .populate('author', 'username firstName lastName avatar isVerified')
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .lean();
    
  const total = await this.countDocuments(query);
  
  return {
    posts,
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

// Static method to get feed posts with engagement-based algorithm
postSchema.statics.getFeedPosts = async function(userId, followingIds, options = {}) {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  
  // Include user's own posts and posts from followed users
  const authorIds = [...followingIds, userId];
  
  // Enhanced feed algorithm with engagement scoring
  const posts = await this.aggregate([
    {
      $match: {
    author: { $in: authorIds },
    isPublic: true,
    'moderation.status': 'approved'
      }
    },
    {
      $addFields: {
        // Calculate engagement score
        engagementScore: {
          $add: [
            { $multiply: ['$stats.likesCount', 2] },
            { $multiply: ['$stats.commentsCount', 3] },
            { $multiply: ['$stats.sharesCount', 4] },
            { $multiply: ['$stats.viewsCount', 0.1] },
            // Time decay factor (newer posts get higher score)
            {
              $multiply: [
                {
                  $divide: [
                    { $subtract: [new Date(), '$createdAt'] },
                    1000 * 60 * 60 * 24 // Convert to days
                  ]
                },
                -0.5 // Penalty for older posts
              ]
            }
          ]
        }
      }
    },
    {
      $sort: { engagementScore: -1, createdAt: -1 }
    },
    {
      $limit: limit + skip
    },
    {
      $skip: skip
    },
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'author'
      }
    },
    {
      $unwind: '$author'
    },
    {
      $project: {
        'author.password': 0,
        'author.email': 0
      }
    }
  ]);
  
  return posts;
};

module.exports = mongoose.model('Post', postSchema); 