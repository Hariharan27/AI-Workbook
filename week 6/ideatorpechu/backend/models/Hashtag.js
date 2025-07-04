const mongoose = require('mongoose');

const hashtagSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true
  },
  postsCount: { 
    type: Number, 
    default: 0 
  },
  followersCount: { 
    type: Number, 
    default: 0 
  },
  isTrending: { 
    type: Boolean, 
    default: false 
  },
  lastUsed: { 
    type: Date, 
    default: Date.now 
  },
  // Track hashtag usage over time for trending calculation
  usageHistory: [{
    date: { type: Date, default: Date.now },
    postsCount: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

// Indexes for performance
hashtagSchema.index({ name: 1 }, { unique: true });
hashtagSchema.index({ postsCount: -1 });
hashtagSchema.index({ isTrending: 1 });
hashtagSchema.index({ lastUsed: -1 });

// Static method to find or create hashtag
hashtagSchema.statics.findOrCreate = async function(hashtagName) {
  const name = hashtagName.toLowerCase().trim();
  let hashtag = await this.findOne({ name });
  
  if (!hashtag) {
    hashtag = await this.create({
      name,
      postsCount: 1,
      lastUsed: new Date()
    });
  } else {
    hashtag.postsCount += 1;
    hashtag.lastUsed = new Date();
    await hashtag.save();
  }
  
  return hashtag;
};

// Static method to get trending hashtags
hashtagSchema.statics.getTrending = async function(limit = 10) {
  // Calculate trending based on recent usage and growth
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const trending = await this.aggregate([
    {
      $match: {
        lastUsed: { $gte: oneWeekAgo },
        postsCount: { $gte: 5 } // Minimum posts to be considered trending
      }
    },
    {
      $addFields: {
        // Calculate trending score based on recent activity and growth
        trendingScore: {
          $add: [
            { $multiply: ['$postsCount', 0.4] },
            { $multiply: ['$followersCount', 0.3] },
            {
              $multiply: [
                { $divide: [{ $subtract: [new Date(), '$lastUsed'] }, 1000 * 60 * 60] },
                -0.1 // Penalty for older usage
              ]
            }
          ]
        }
      }
    },
    {
      $sort: { trendingScore: -1 }
    },
    {
      $limit: limit
    }
  ]);
  
  return trending;
};

// Static method to search hashtags
hashtagSchema.statics.search = async function(query, limit = 20) {
  const regex = new RegExp(query, 'i');
  
  const hashtags = await this.find({ name: regex })
    .sort({ postsCount: -1 })
    .limit(limit)
    .lean();
    
  return hashtags;
};

// Static method to update hashtag statistics
hashtagSchema.statics.updateStats = async function(hashtagName, increment = 1) {
  const name = hashtagName.toLowerCase().trim();
  
  const hashtag = await this.findOneAndUpdate(
    { name },
    {
      $inc: { postsCount: increment },
      $set: { lastUsed: new Date() },
      $push: {
        usageHistory: {
          date: new Date(),
          postsCount: increment
        }
      }
    },
    { new: true, upsert: true }
  );
  
  return hashtag;
};

// Static method to clean up old usage history
hashtagSchema.statics.cleanupHistory = async function() {
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  await this.updateMany(
    {},
    {
      $pull: {
        usageHistory: {
          date: { $lt: oneMonthAgo }
        }
      }
    }
  );
};

// Instance method to check if hashtag is trending
hashtagSchema.methods.checkTrendingStatus = function() {
  // Simple trending logic: if posts count > 50 and used in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const isRecentlyUsed = this.lastUsed >= oneDayAgo;
  
  this.isTrending = this.postsCount >= 50 && isRecentlyUsed;
  return this.save();
};

// Pre-save middleware to validate hashtag name
hashtagSchema.pre('save', function(next) {
  // Ensure hashtag name starts with # and contains valid characters
  if (!this.name.startsWith('#')) {
    this.name = '#' + this.name;
  }
  
  // Remove any invalid characters (keep alphanumeric, underscore, and Tamil characters)
  this.name = this.name.replace(/[^#\w\u0B80-\u0BFF]/g, '');
  
  next();
});

module.exports = mongoose.model('Hashtag', hashtagSchema); 