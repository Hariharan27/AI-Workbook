const mongoose = require('mongoose');

const relationshipSchema = new mongoose.Schema({
  follower: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  following: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'blocked'], 
    default: 'pending' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Indexes for performance
relationshipSchema.index({ follower: 1, following: 1 }, { unique: true });
relationshipSchema.index({ following: 1, status: 1 });
relationshipSchema.index({ follower: 1, status: 1 });
relationshipSchema.index({ createdAt: -1 });

// Pre-save middleware to prevent self-following
relationshipSchema.pre('save', function(next) {
  if (this.follower.toString() === this.following.toString()) {
    const error = new Error('Users cannot follow themselves');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Static method to check if user A follows user B
relationshipSchema.statics.isFollowing = function(followerId, followingId) {
  return this.findOne({
    follower: followerId,
    following: followingId,
    status: 'accepted'
  });
};

// Static method to check if user A is followed by user B
relationshipSchema.statics.isFollowedBy = function(userId, followerId) {
  return this.findOne({
    follower: followerId,
    following: userId,
    status: 'accepted'
  });
};

// Static method to get followers count
relationshipSchema.statics.getFollowersCount = function(userId) {
  return this.countDocuments({
    following: userId,
    status: 'accepted'
  });
};

// Static method to get following count
relationshipSchema.statics.getFollowingCount = function(userId) {
  return this.countDocuments({
    follower: userId,
    status: 'accepted'
  });
};

// Static method to get mutual followers
relationshipSchema.statics.getMutualFollowers = function(userId1, userId2) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { follower: userId1, status: 'accepted' },
          { follower: userId2, status: 'accepted' }
        ]
      }
    },
    {
      $group: {
        _id: '$following',
        followers: { $push: '$follower' }
      }
    },
    {
      $match: {
        followers: { $all: [userId1, userId2] }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        _id: '$user._id',
        username: '$user.username',
        firstName: '$user.firstName',
        lastName: '$user.lastName',
        avatar: '$user.avatar',
        isVerified: '$user.isVerified'
      }
    }
  ]);
};

// Static method to check if users are blocked
relationshipSchema.statics.isBlocked = function(userId1, userId2) {
  return this.findOne({
    $or: [
      { follower: userId1, following: userId2, status: 'blocked' },
      { follower: userId2, following: userId1, status: 'blocked' }
    ]
  });
};

// Static method to block user
relationshipSchema.statics.blockUser = function(blockerId, blockedId) {
  return this.findOneAndUpdate(
    { follower: blockerId, following: blockedId },
    { status: 'blocked' },
    { upsert: true, new: true }
  );
};

// Static method to unblock user
relationshipSchema.statics.unblockUser = function(blockerId, blockedId) {
  return this.findOneAndDelete({
    follower: blockerId,
    following: blockedId,
    status: 'blocked'
  });
};

// Static method to get blocked users
relationshipSchema.statics.getBlockedUsers = function(userId) {
  return this.find({
    follower: userId,
    status: 'blocked'
  }).populate('following', 'username firstName lastName avatar');
};

// Instance method to accept follow request
relationshipSchema.methods.accept = function() {
  this.status = 'accepted';
  return this.save();
};

// Instance method to reject follow request
relationshipSchema.methods.reject = function() {
  return this.remove();
};

module.exports = mongoose.model('Relationship', relationshipSchema); 