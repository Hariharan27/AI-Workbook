const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Hashtag = require('../models/Hashtag');
const User = require('../models/User');
const { authenticate } = require('../middleware/authenticate');
const mediaService = require('../services/mediaService');

const router = express.Router();

// Rate limiting for post creation
const postRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 posts per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many posts created, please try again later.'
    }
  }
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10 // Maximum 10 files per post
  }
});

// Validation middleware
const validatePost = [
  body('content')
    .isLength({ min: 1, max: 5000 })
    .withMessage('Post content must be between 1 and 5000 characters'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean'),
  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Location coordinates must be an array of 2 numbers')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }
  next();
};

// Helper function to resolve mentions to user IDs
const resolveMentions = async (content) => {
  const mentionRegex = /@[\w\u0B80-\u0BFF]+/g;
  const mentions = content.match(mentionRegex);
  
  if (!mentions) return [];
  
  const usernames = mentions.map(mention => mention.slice(1));
  const users = await User.find({ username: { $in: usernames } }).select('_id');
  
  return users.map(user => user._id);
};

// POST /api/v1/posts - Create new post
router.post('/', 
  authenticate, 
  postRateLimit, 
  upload.array('media', 10), 
  validatePost, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { content, isPublic = true, location } = req.body;
      const userId = req.user._id;

      // Upload media files if provided
      let media = [];
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map(file => 
          mediaService.uploadFile(file, { folder: 'ideatorpechu/posts' })
        );
        media = await Promise.all(uploadPromises);
      }

      // Resolve mentions to user IDs
      const mentions = await resolveMentions(content);

      // Create post
      const postData = {
        author: userId,
        content,
        media,
        mentions,
        isPublic
      };
      if (location && typeof location === 'object' && Array.isArray(location.coordinates) && location.coordinates.length === 2 &&
          typeof location.coordinates[0] === 'number' && typeof location.coordinates[1] === 'number') {
        postData.location = {
          type: 'Point',
          coordinates: location.coordinates
        };
        console.log('Including location in post:', postData.location);
      } else {
        console.log('No valid location provided, skipping location field.');
      }
      const post = new Post(postData);

      console.log('Creating post with author:', userId);
      console.log('Post data:', { author: userId, content, media, mentions, location, isPublic });

      await post.save();

      // Update hashtag statistics
      const hashtags = post.hashtags;
      if (hashtags.length > 0) {
        const updatePromises = hashtags.map(hashtag => 
          Hashtag.updateStats(hashtag, 1)
        );
        await Promise.all(updatePromises);
      }

      // Update user's post count
      try {
        await User.findByIdAndUpdate(userId, {
          $inc: { 'stats.postsCount': 1 }
        });
      } catch (error) {
        console.error('Error updating user stats:', error);
        // Continue even if stats update fails
      }

      // Populate author info
      await post.populate('author', 'username firstName lastName avatar isVerified');

      res.status(201).json({
        success: true,
        data: { post },
        message: 'Post created successfully'
      });

    } catch (error) {
      console.error('Post creation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'POST_CREATION_ERROR',
          message: 'Failed to create post',
          details: error.message
        }
      });
    }
  }
);

// GET /api/v1/posts/trending - Get trending posts (ONLY posts with engagement)
router.get('/trending', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    console.log(`[TRENDING] userId: ${userId}, page: ${page}, limit: ${limit}`);

    // Get ONLY posts with engagement (likes, comments, or shares)
    const posts = await Post.aggregate([
      {
        $match: {
          isPublic: true,
          'moderation.status': 'approved',
          $or: [
            { 'stats.likesCount': { $gt: 0 } },
            { 'stats.commentsCount': { $gt: 0 } },
            { 'stats.sharesCount': { $gt: 0 } }
          ]
        }
      },
      {
        $addFields: {
          // Calculate trending score based on engagement and recency
          trendingScore: {
            $add: [
              { $multiply: ['$stats.likesCount', 3] },
              { $multiply: ['$stats.commentsCount', 5] },
              { $multiply: ['$stats.sharesCount', 7] },
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
                  -1 // Penalty for older posts
                ]
              }
            ]
          }
        }
      },
      {
        $sort: { trendingScore: -1, createdAt: -1 }
      },
      {
        $limit: parseInt(limit) + (parseInt(page) - 1) * parseInt(limit)
      },
      {
        $skip: (parseInt(page) - 1) * parseInt(limit)
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
          _id: 1,
          content: 1,
          media: 1,
          hashtags: 1,
          mentions: 1,
          location: 1,
          isPublic: 1,
          isEdited: 1,
          editHistory: 1,
          stats: 1,
          moderation: 1,
          isShared: 1,
          originalPost: 1,
          createdAt: 1,
          updatedAt: 1,
          trendingScore: 1,
          author: {
            _id: 1,
            username: 1,
            firstName: 1,
            lastName: 1,
            avatar: 1,
            isVerified: 1
          }
        }
      }
    ]);

    console.log(`[TRENDING] Found ${posts.length} posts with engagement`);

    // Check which posts are liked by current user
    const postIds = posts.map(post => post._id);
    const userLikes = await Like.find({
      user: userId,
      post: { $in: postIds },
      type: 'post'
    });

    const likedPostIds = userLikes.map(like => like.post.toString());

    // Add isLiked property to posts
    const postsWithLikes = posts.map(post => ({
      ...post,
      isLiked: likedPostIds.includes(post._id.toString())
    }));

    res.json({
      success: true,
      data: { posts: postsWithLikes },
      message: 'Trending posts retrieved successfully'
    });

  } catch (error) {
    console.error('[TRENDING] Trending posts retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRENDING_POSTS_ERROR',
        message: 'Failed to retrieve trending posts',
        details: error.message
      }
    });
  }
});

// GET /api/v1/posts/following - Get posts from people you follow (EXCLUDING your own posts)
router.get('/following', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    console.log(`[FOLLOWING] userId: ${userId}, page: ${page}, limit: ${limit}`);

    // Get user's following list
    const following = await require('../models/Relationship').find({
      follower: userId,
      status: 'accepted'
    }).select('following');

    const followingIds = following.map(r => r.following);
    console.log(`[FOLLOWING] followingIds:`, followingIds);

    // Get posts from people you follow (EXCLUDING your own posts)
    const posts = await Post.aggregate([
      {
        $match: {
          author: { $in: followingIds },
          author: { $ne: userId }, // Exclude user's own posts
          isPublic: true,
          'moderation.status': 'approved'
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: parseInt(limit) + (parseInt(page) - 1) * parseInt(limit)
      },
      {
        $skip: (parseInt(page) - 1) * parseInt(limit)
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
          _id: 1,
          content: 1,
          media: 1,
          hashtags: 1,
          mentions: 1,
          location: 1,
          isPublic: 1,
          isEdited: 1,
          editHistory: 1,
          stats: 1,
          moderation: 1,
          isShared: 1,
          originalPost: 1,
          createdAt: 1,
          updatedAt: 1,
          author: {
            _id: 1,
            username: 1,
            firstName: 1,
            lastName: 1,
            avatar: 1,
            isVerified: 1
          }
        }
      }
    ]);

    console.log(`[FOLLOWING] Found ${posts.length} following posts`);

    // Check which posts are liked by current user
    const postIds = posts.map(post => post._id);
    const userLikes = await Like.find({
      user: userId,
      post: { $in: postIds },
      type: 'post'
    });

    const likedPostIds = userLikes.map(like => like.post.toString());

    // Add isLiked property to posts
    const postsWithLikes = posts.map(post => ({
      ...post,
      isLiked: likedPostIds.includes(post._id.toString())
    }));

    res.json({
      success: true,
      data: { posts: postsWithLikes },
      message: 'Following posts retrieved successfully'
    });

  } catch (error) {
    console.error('[FOLLOWING] Following posts retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FOLLOWING_POSTS_ERROR',
        message: 'Failed to retrieve following posts',
        details: error.message
      }
    });
  }
});

// GET /api/v1/posts/:postId - Get single post
router.get('/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId)
      .populate('author', 'username firstName lastName avatar isVerified')
      .populate('mentions', 'username firstName lastName avatar');

    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: 'Post not found'
        }
      });
    }

    // Check if user can view the post
    if (!post.isPublic && post.author._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'POST_PRIVATE',
          message: 'This post is private'
        }
      });
    }

    // Check if user liked the post
    const isLiked = await Like.isLikedBy(userId, postId, 'post');

    // Increment view count
    await Post.findByIdAndUpdate(postId, {
      $inc: { 'stats.viewsCount': 1 }
    });

    res.json({
      success: true,
      data: { 
        post: { ...post, isLiked }
      },
      message: 'Post retrieved successfully'
    });

  } catch (error) {
    console.error('Post retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'POST_RETRIEVAL_ERROR',
        message: 'Failed to retrieve post'
      }
    });
  }
});

// PUT /api/v1/posts/:postId - Update post
router.put('/:postId', 
  authenticate, 
  upload.array('media', 10), 
  validatePost, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { postId } = req.params;
      const { content, isPublic } = req.body;
      const userId = req.user._id;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'POST_NOT_FOUND',
            message: 'Post not found'
          }
        });
      }

      // Check ownership
      console.log(`[DEBUG] Update Post - User ID: ${userId}, Post Author: ${post.author}, Types: ${typeof userId} vs ${typeof post.author}`);
      if (post.author.toString() !== userId.toString()) {
        console.warn(`[403] User ${userId} tried to modify post ${postId} owned by ${post.author}`);
        return res.status(403).json({
          success: false,
          error: {
            code: 'NOT_AUTHORIZED',
            message: 'Not authorized to edit this post'
          }
        });
      }

      // Handle media updates
      let media = post.media;
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map(file => 
          mediaService.uploadFile(file, { folder: 'ideatorpechu/posts' })
        );
        const newMedia = await Promise.all(uploadPromises);
        media = [...media, ...newMedia];
      }

      // Resolve mentions
      const mentions = await resolveMentions(content);

      // Save old content for edit history
      const editHistory = [...post.editHistory, {
        content: post.content,
        editedAt: new Date()
      }];

      // Update post
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        {
          content,
          media,
          mentions,
          isPublic,
          isEdited: true,
          editHistory
        },
        { new: true }
      ).populate('author', 'username firstName lastName avatar isVerified');

      res.json({
        success: true,
        data: { post: updatedPost },
        message: 'Post updated successfully'
      });

    } catch (error) {
      console.error('Post update error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'POST_UPDATE_ERROR',
          message: 'Failed to update post'
        }
      });
    }
  }
);

// DELETE /api/v1/posts/:postId - Delete post
router.delete('/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: 'Post not found'
        }
      });
    }

    // Check ownership
    console.log(`[DEBUG] Delete Post - User ID: ${userId}, Post Author: ${post.author}, Types: ${typeof userId} vs ${typeof post.author}`);
    if (post.author.toString() !== userId.toString()) {
      console.warn(`[403] User ${userId} tried to delete post ${postId} owned by ${post.author}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_AUTHORIZED',
          message: 'Not authorized to delete this post'
        }
      });
    }

    // Delete media files from Cloudinary
    if (post.media && post.media.length > 0) {
      const deletePromises = post.media.map(media => 
        mediaService.deleteFile(media.publicId, media.type)
      );
      await Promise.all(deletePromises);
    }

    // Update hashtag statistics
    if (post.hashtags.length > 0) {
      const updatePromises = post.hashtags.map(hashtag => 
        Hashtag.updateStats(hashtag, -1)
      );
      await Promise.all(updatePromises);
    }

    // Delete related data
    await Comment.deleteMany({ post: postId });
    await Like.deleteMany({ post: postId, type: 'post' });

    // Delete the post
    await Post.findByIdAndDelete(postId);

    // Update user's post count
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.postsCount': -1 }
    });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Post deletion error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'POST_DELETION_ERROR',
        message: 'Failed to delete post'
      }
    });
  }
});

// GET /api/v1/posts/user/:userId - Get user posts
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const currentUserId = req.user._id;

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

    // Build query based on privacy settings
    let query = { author: userId };
    if (userId !== currentUserId) {
      query.isPublic = true;
    }

    const result = await Post.getPostsWithPagination(query, {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    });

    res.json({
      success: true,
      data: result,
      message: 'User posts retrieved successfully'
    });

  } catch (error) {
    console.error('User posts retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'USER_POSTS_ERROR',
        message: 'Failed to retrieve user posts'
      }
    });
  }
});

// GET /api/v1/feed - Get personalized feed (Latest: own posts + followed users)
router.get('/feed', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    console.log(`[FEED] userId: ${userId}, page: ${page}, limit: ${limit}`);

    // Get user's following list
    const following = await require('../models/Relationship').find({
      follower: userId,
      status: 'accepted'
    }).select('following');
    const followingIds = following.map(r => r.following);
    console.log(`[FEED] followingIds:`, followingIds);

    // Get feed posts (own posts + posts from followed users)
    let posts;
    try {
      posts = await Post.getFeedPosts(userId, followingIds, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      console.log(`[FEED] getFeedPosts returned ${posts.length} posts`);
    } catch (err) {
      console.error('[FEED] Error in getFeedPosts:', err);
      throw err;
    }

    // Check which posts are liked by current user
    const postIds = posts.map(post => post._id);
    console.log(`[FEED] postIds:`, postIds);
    let userLikes = [];
    try {
      userLikes = await Like.find({
        user: userId,
        post: { $in: postIds },
        type: 'post'
      });
      console.log(`[FEED] userLikes found: ${userLikes.length}`);
    } catch (err) {
      console.error('[FEED] Error in Like.find:', err);
      throw err;
    }

    const likedPostIds = userLikes.map(like => like.post.toString());
    // Add isLiked property to posts
    const postsWithLikes = posts.map(post => ({
      ...post,
      isLiked: likedPostIds.includes(post._id.toString())
    }));
    console.log(`[FEED] postsWithLikes length: ${postsWithLikes.length}`);

    res.json({
      success: true,
      data: { posts: postsWithLikes },
      message: 'Feed retrieved successfully'
    });

  } catch (error) {
    console.error('[FEED] Feed retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FEED_ERROR',
        message: 'Failed to retrieve feed',
        details: error.message
      }
    });
  }
});

module.exports = router; 