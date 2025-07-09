const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const User = require('../models/User');
const Post = require('../models/Post');
const Relationship = require('../models/Relationship');
const Like = require('../models/Like');
const Notification = require('../models/Notification');
const socketService = require('../services/socketService');

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?._id; // Optional authentication

    // Get user profile
    const user = await User.findById(userId)
      .select('-password -email -resetPasswordToken -resetPasswordExpires')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Check if current user is following this user (only if authenticated)
    let relationship = null;
    let isFollowing = false;
    
    if (currentUserId) {
      relationship = await Relationship.findOne({
        follower: currentUserId,
        following: userId,
        status: 'accepted'
      });
      isFollowing = !!relationship;
    }

    // Get user stats
    const postsCount = await Post.countDocuments({ author: userId, isPublic: true });
    const followersCount = await Relationship.countDocuments({ following: userId, status: 'accepted' });
    const followingCount = await Relationship.countDocuments({ follower: userId, status: 'accepted' });

    const userProfile = {
      ...user,
      stats: {
        postsCount,
        followersCount,
        followingCount,
        profileViews: 0 // TODO: Implement profile views tracking
      },
      isFollowing
    };

    res.json({
      success: true,
      data: { user: userProfile },
      message: 'User profile retrieved successfully'
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROFILE_ERROR',
        message: 'Failed to retrieve user profile'
      }
    });
  }
});

// Get user posts
router.get('/:userId/posts', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Check if current user can view posts (public posts or own posts)
    const canViewPosts = userId === currentUserId.toString() || user.isPublic;

    if (!canViewPosts) {
      // Check if current user is following this user
      const relationship = await Relationship.findOne({
        follower: currentUserId,
        following: userId,
        status: 'accepted'
      });

      if (!relationship) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'Cannot view private user posts'
          }
        });
      }
    }

    // Get user posts
    const posts = await Post.find({ author: userId })
      .populate('author', 'username firstName lastName avatar isVerified')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Check which posts are liked by current user
    const postIds = posts.map(post => post._id);
    const userLikes = await Like.find({
      user: currentUserId,
      post: { $in: postIds },
      type: 'post'
    });
    const likedPostIds = userLikes.map(like => like.post.toString());

    // Add isLiked property to posts
    const postsWithLikes = posts.map(post => ({
      ...post,
      isLiked: likedPostIds.includes(post._id.toString())
    }));

    const total = await Post.countDocuments({ author: userId });
    const hasMore = total > page * limit;

    res.json({
      success: true,
      data: {
        posts: postsWithLikes,
        total,
        hasMore
      },
      message: 'User posts retrieved successfully'
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'POSTS_ERROR',
        message: 'Failed to retrieve user posts'
      }
    });
  }
});

// Follow user
router.post('/:userId/follow', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Check if trying to follow self
    if (userId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: 'Cannot follow yourself'
        }
      });
    }

    // Check if user exists
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Check if already following
    const existingRelationship = await Relationship.findOne({
      follower: currentUserId,
      following: userId
    });

    if (existingRelationship) {
      if (existingRelationship.status === 'accepted') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ALREADY_FOLLOWING',
            message: 'Already following this user'
          }
        });
      } else if (existingRelationship.status === 'pending') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'REQUEST_PENDING',
            message: 'Follow request already pending'
          }
        });
      }
    }

    // Create follow relationship
    const relationship = new Relationship({
      follower: currentUserId,
      following: userId,
      status: userToFollow.isPrivate ? 'pending' : 'accepted'
    });

    await relationship.save();

    // Send notification if public user
    if (!userToFollow.isPrivate) {
      try {
        // Create notification
        const notification = await Notification.create({
          recipient: userId,
          sender: currentUserId,
          type: 'follow',
          title: `${req.user.firstName || req.user.username} started following you`,
          message: 'started following you'
        });

        // Populate sender info for socket emission
        await notification.populate('sender', 'username firstName lastName avatar');

        // Emit real-time notification
        socketService.emitToUser(userId, 'notification:new', {
          type: 'follow',
          sender: notification.sender,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt
        });

        console.log(`User ${currentUserId} followed user ${userId} - notification sent`);
      } catch (notificationError) {
        console.error('Failed to create follow notification:', notificationError);
        // Don't fail the follow operation if notification fails
      }
    }

    res.json({
      success: true,
      message: userToFollow.isPrivate ? 'Follow request sent' : 'Successfully followed user'
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FOLLOW_ERROR',
        message: 'Failed to follow user'
      }
    });
  }
});

// Unfollow user
router.delete('/:userId/follow', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    // Check if trying to unfollow self
    if (userId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ACTION',
          message: 'Cannot unfollow yourself'
        }
      });
    }

    // Check if user exists
    const userToUnfollow = await User.findById(userId);
    if (!userToUnfollow) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Remove follow relationship
    const result = await Relationship.findOneAndDelete({
      follower: currentUserId,
      following: userId
    });

    if (!result) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NOT_FOLLOWING',
          message: 'Not following this user'
        }
      });
    }

    // Send unfollow notification
    try {
      // Create notification
      const notification = await Notification.create({
        recipient: userId,
        sender: currentUserId,
        type: 'unfollow',
        title: `${req.user.firstName || req.user.username} unfollowed you`,
        message: 'unfollowed you'
      });

      // Populate sender info for socket emission
      await notification.populate('sender', 'username firstName lastName avatar');

      // Emit real-time notification
      socketService.emitToUser(userId, 'notification:new', {
        type: 'unfollow',
        sender: notification.sender,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt
      });

      console.log(`User ${currentUserId} unfollowed user ${userId} - notification sent`);
    } catch (notificationError) {
      console.error('Failed to create unfollow notification:', notificationError);
      // Don't fail the unfollow operation if notification fails
    }

    res.json({
      success: true,
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UNFOLLOW_ERROR',
        message: 'Failed to unfollow user'
      }
    });
  }
});

// Get user followers
router.get('/:userId/followers', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Check if current user can view followers
    const canViewFollowers = userId === currentUserId.toString() || user.isPublic;

    if (!canViewFollowers) {
      // Check if current user is following this user
      const relationship = await Relationship.findOne({
        follower: currentUserId,
        following: userId,
        status: 'accepted'
      });

      if (!relationship) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'Cannot view private user followers'
          }
        });
      }
    }

    // Get followers
    const relationships = await Relationship.find({
      following: userId,
      status: 'accepted'
    })
    .populate('follower', 'username firstName lastName avatar bio location isVerified isPrivate createdAt lastSeen')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

    // Get user IDs for batch stats calculation
    const userIds = relationships.map(rel => rel.follower._id);

    // Calculate stats in batch using aggregation
    const statsAggregation = await Post.aggregate([
      {
        $match: {
          author: { $in: userIds },
          isPublic: true
        }
      },
      {
        $group: {
          _id: '$author',
          postsCount: { $sum: 1 }
        }
      }
    ]);

    const followersAggregation = await Relationship.aggregate([
      {
        $match: {
          following: { $in: userIds },
          status: 'accepted'
        }
      },
      {
        $group: {
          _id: '$following',
          followersCount: { $sum: 1 }
        }
      }
    ]);

    const followingAggregation = await Relationship.aggregate([
      {
        $match: {
          follower: { $in: userIds },
          status: 'accepted'
        }
      },
      {
        $group: {
          _id: '$follower',
          followingCount: { $sum: 1 }
        }
      }
    ]);

    // Create lookup maps for quick access
    const postsMap = new Map(statsAggregation.map(item => [item._id.toString(), item.postsCount]));
    const followersMap = new Map(followersAggregation.map(item => [item._id.toString(), item.followersCount]));
    const followingMap = new Map(followingAggregation.map(item => [item._id.toString(), item.followingCount]));

    // Add stats to users
    const followersWithStats = relationships.map(rel => {
      const user = rel.follower;
      return {
        ...user,
        followedAt: rel.createdAt,
        stats: {
          postsCount: postsMap.get(user._id.toString()) || 0,
          followersCount: followersMap.get(user._id.toString()) || 0,
          followingCount: followingMap.get(user._id.toString()) || 0,
          profileViews: 0 // TODO: Implement profile views tracking
        }
      };
    });

    const total = await Relationship.countDocuments({
      following: userId,
      status: 'accepted'
    });
    const hasMore = total > page * limit;

    res.json({
      success: true,
      data: {
        users: followersWithStats,
        total,
        hasMore
      },
      message: 'User followers retrieved successfully'
    });
  } catch (error) {
    console.error('Get user followers error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FOLLOWERS_ERROR',
        message: 'Failed to retrieve user followers'
      }
    });
  }
});

// Get user following
router.get('/:userId/following', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Check if current user can view following
    const canViewFollowing = userId === currentUserId.toString() || user.isPublic;

    if (!canViewFollowing) {
      // Check if current user is following this user
      const relationship = await Relationship.findOne({
        follower: currentUserId,
        following: userId,
        status: 'accepted'
      });

      if (!relationship) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'Cannot view private user following'
          }
        });
      }
    }

    // Get following
    const relationships = await Relationship.find({
      follower: userId,
      status: 'accepted'
    })
    .populate('following', 'username firstName lastName avatar bio location isVerified isPrivate createdAt lastSeen')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

    // Get user IDs for batch stats calculation
    const userIds = relationships.map(rel => rel.following._id);

    // Calculate stats in batch using aggregation
    const statsAggregation = await Post.aggregate([
      {
        $match: {
          author: { $in: userIds },
          isPublic: true
        }
      },
      {
        $group: {
          _id: '$author',
          postsCount: { $sum: 1 }
        }
      }
    ]);

    const followersAggregation = await Relationship.aggregate([
      {
        $match: {
          following: { $in: userIds },
          status: 'accepted'
        }
      },
      {
        $group: {
          _id: '$following',
          followersCount: { $sum: 1 }
        }
      }
    ]);

    const followingAggregation = await Relationship.aggregate([
      {
        $match: {
          follower: { $in: userIds },
          status: 'accepted'
        }
      },
      {
        $group: {
          _id: '$follower',
          followingCount: { $sum: 1 }
        }
      }
    ]);

    // Create lookup maps for quick access
    const postsMap = new Map(statsAggregation.map(item => [item._id.toString(), item.postsCount]));
    const followersMap = new Map(followersAggregation.map(item => [item._id.toString(), item.followersCount]));
    const followingMap = new Map(followingAggregation.map(item => [item._id.toString(), item.followingCount]));

    // Add stats to users
    const followingWithStats = relationships.map(rel => {
      const user = rel.following;
      return {
        ...user,
        followedAt: rel.createdAt,
        stats: {
          postsCount: postsMap.get(user._id.toString()) || 0,
          followersCount: followersMap.get(user._id.toString()) || 0,
          followingCount: followingMap.get(user._id.toString()) || 0,
          profileViews: 0 // TODO: Implement profile views tracking
        }
      };
    });

    const total = await Relationship.countDocuments({
      follower: userId,
      status: 'accepted'
    });
    const hasMore = total > page * limit;

    res.json({
      success: true,
      data: {
        users: followingWithStats,
        total,
        hasMore
      },
      message: 'User following retrieved successfully'
    });
  } catch (error) {
    console.error('Get user following error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FOLLOWING_ERROR',
        message: 'Failed to retrieve user following'
      }
    });
  }
});

module.exports = router; 