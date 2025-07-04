const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

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

// POST /api/v1/shares/:postId - Share a post
router.post('/:postId', 
  authenticate, 
  [
    body('message')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Share message must be less than 500 characters'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be a boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { postId } = req.params;
      const { message, isPublic = true } = req.body;
      const userId = req.user._id;

      // Check if original post exists and is public
      const originalPost = await Post.findById(postId)
        .populate('author', 'username firstName lastName avatar isVerified');

      if (!originalPost) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'POST_NOT_FOUND',
            message: 'Original post not found'
          }
        });
      }

      if (!originalPost.isPublic) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'POST_PRIVATE',
            message: 'Cannot share private post'
          }
        });
      }

      // Create shared post
      const sharedPost = new Post({
        author: userId,
        content: message || `Shared: ${originalPost.content}`,
        originalPost: postId,
        isShared: true,
        isPublic,
        media: originalPost.media, // Include original media
        hashtags: originalPost.hashtags,
        mentions: originalPost.mentions
      });

      await sharedPost.save();

      // Update original post share count
      await Post.findByIdAndUpdate(postId, {
        $inc: { 'stats.sharesCount': 1 }
      });

      // Update user's post count
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.postsCount': 1 }
      });

      // Populate author info for response
      await sharedPost.populate('author', 'username firstName lastName avatar isVerified');

      res.status(201).json({
        success: true,
        data: { 
          sharedPost,
          originalPost: {
            _id: originalPost._id,
            content: originalPost.content,
            author: originalPost.author
          }
        },
        message: 'Post shared successfully'
      });

    } catch (error) {
      console.error('Post share error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'POST_SHARE_ERROR',
          message: 'Failed to share post'
        }
      });
    }
  }
);

// GET /api/v1/shares/:postId - Get shares of a post
router.get('/:postId', 
  authenticate, 
  async (req, res) => {
    try {
      const { postId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Check if original post exists
      const originalPost = await Post.findById(postId);
      if (!originalPost) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'POST_NOT_FOUND',
            message: 'Original post not found'
          }
        });
      }

      // Get shared posts
      const sharedPosts = await Post.find({
        originalPost: postId,
        isShared: true,
        isPublic: true
      })
      .populate('author', 'username firstName lastName avatar isVerified')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

      const total = await Post.countDocuments({
        originalPost: postId,
        isShared: true,
        isPublic: true
      });

      res.json({
        success: true,
        data: {
          originalPost: {
            _id: originalPost._id,
            content: originalPost.content,
            author: originalPost.author,
            sharesCount: originalPost.stats.sharesCount
          },
          sharedPosts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
            hasNext: parseInt(page) * parseInt(limit) < total,
            hasPrev: parseInt(page) > 1
          }
        },
        message: 'Post shares retrieved successfully'
      });

    } catch (error) {
      console.error('Get shares error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_SHARES_ERROR',
          message: 'Failed to retrieve post shares'
        }
      });
    }
  }
);

// DELETE /api/v1/shares/:postId - Unshare a post (delete shared post)
router.delete('/:postId', 
  authenticate, 
  async (req, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      // Find the shared post
      const sharedPost = await Post.findOne({
        _id: postId,
        author: userId,
        isShared: true
      });

      if (!sharedPost) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SHARED_POST_NOT_FOUND',
            message: 'Shared post not found or not authorized'
          }
        });
      }

      // Update original post share count
      if (sharedPost.originalPost) {
        await Post.findByIdAndUpdate(sharedPost.originalPost, {
          $inc: { 'stats.sharesCount': -1 }
        });
      }

      // Update user's post count
      await User.findByIdAndUpdate(userId, {
        $inc: { 'stats.postsCount': -1 }
      });

      // Delete the shared post
      await Post.findByIdAndDelete(postId);

      res.json({
        success: true,
        message: 'Post unshared successfully'
      });

    } catch (error) {
      console.error('Unshare post error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UNSHARE_POST_ERROR',
          message: 'Failed to unshare post'
        }
      });
    }
  }
);

// GET /api/v1/shares/user/:userId - Get user's shared posts
router.get('/user/:userId', 
  authenticate, 
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const currentUserId = req.user._id;
      const skip = (parseInt(page) - 1) * parseInt(limit);

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
      let query = { 
        author: userId, 
        isShared: true 
      };
      
      if (userId !== currentUserId) {
        query.isPublic = true;
      }

      const sharedPosts = await Post.find(query)
        .populate('author', 'username firstName lastName avatar isVerified')
        .populate('originalPost', 'content author createdAt')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await Post.countDocuments(query);

      res.json({
        success: true,
        data: {
          sharedPosts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
            hasNext: parseInt(page) * parseInt(limit) < total,
            hasPrev: parseInt(page) > 1
          }
        },
        message: 'User shared posts retrieved successfully'
      });

    } catch (error) {
      console.error('User shared posts error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'USER_SHARED_POSTS_ERROR',
          message: 'Failed to retrieve user shared posts'
        }
      });
    }
  }
);

module.exports = router; 