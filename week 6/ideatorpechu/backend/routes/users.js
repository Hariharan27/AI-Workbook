const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const User = require('../models/User');
const Post = require('../models/Post');
const Relationship = require('../models/Relationship');
const Like = require('../models/Like');

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
      // TODO: Send notification
      console.log(`User ${currentUserId} followed user ${userId}`);
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
    .populate('follower', 'username firstName lastName avatar isVerified')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

    const followers = relationships.map(rel => ({
      ...rel.follower,
      followedAt: rel.createdAt
    }));

    const total = await Relationship.countDocuments({
      following: userId,
      status: 'accepted'
    });
    const hasMore = total > page * limit;

    res.json({
      success: true,
      data: {
        users: followers,
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
    .populate('following', 'username firstName lastName avatar isVerified')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

    const following = relationships.map(rel => ({
      ...rel.following,
      followedAt: rel.createdAt
    }));

    const total = await Relationship.countDocuments({
      follower: userId,
      status: 'accepted'
    });
    const hasMore = total > page * limit;

    res.json({
      success: true,
      data: {
        users: following,
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