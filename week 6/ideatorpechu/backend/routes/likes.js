const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const Like = require('../models/Like');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

// Rate limiting for likes
const likeRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 likes per minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many likes, please try again later.'
    }
  }
});

// Validation middleware
const validateLike = [
  body('targetId')
    .isMongoId()
    .withMessage('Target ID must be a valid MongoDB ID'),
  body('type')
    .isIn(['post', 'comment'])
    .withMessage('Type must be either "post" or "comment"')
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

// POST /api/v1/likes - Like a post or comment
router.post('/', 
  authenticate, 
  likeRateLimit, 
  validateLike, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { targetId, type } = req.body;
      const userId = req.user._id;

      // Check if target exists
      let target;
      if (type === 'post') {
        target = await Post.findById(targetId);
      } else if (type === 'comment') {
        target = await Comment.findById(targetId);
      }

      if (!target) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TARGET_NOT_FOUND',
            message: `${type} not found`
          }
        });
      }

      // Check if already liked
      const existingLike = await Like.findOne({
        user: userId,
        [type]: targetId,
        type
      });

      if (existingLike) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ALREADY_LIKED',
            message: `Already liked this ${type}`
          }
        });
      }

      // Add like
      const like = await Like.addLike(userId, targetId, type);

      res.status(201).json({
        success: true,
        data: { like },
        message: `${type} liked successfully`
      });

    } catch (error) {
      console.error('Like creation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'LIKE_CREATION_ERROR',
          message: 'Failed to like'
        }
      });
    }
  }
);

// DELETE /api/v1/likes/:targetId - Unlike a post or comment
router.delete('/:targetId', 
  authenticate, 
  validateLike, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { targetId } = req.params;
      const { type } = req.query;
      const userId = req.user._id;

      // Validate type
      if (!type || !['post', 'comment'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TYPE',
            message: 'Type must be either "post" or "comment"'
          }
        });
      }

      // Check if target exists
      let target;
      if (type === 'post') {
        target = await Post.findById(targetId);
      } else if (type === 'comment') {
        target = await Comment.findById(targetId);
      }

      if (!target) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TARGET_NOT_FOUND',
            message: `${type} not found`
          }
        });
      }

      // Remove like
      const like = await Like.removeLike(userId, targetId, type);

      if (!like) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'LIKE_NOT_FOUND',
            message: `Like not found for this ${type}`
          }
        });
      }

      res.json({
        success: true,
        message: `${type} unliked successfully`
      });

    } catch (error) {
      console.error('Unlike error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UNLIKE_ERROR',
          message: 'Failed to unlike'
        }
      });
    }
  }
);

// GET /api/v1/likes/:targetId - Get likes for a post or comment
router.get('/:targetId', authenticate, async (req, res) => {
  try {
    const { targetId } = req.params;
    const { type, page = 1, limit = 20 } = req.query;

    // Validate type
    if (!type || !['post', 'comment'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Type must be either "post" or "comment"'
        }
      });
    }

    // Check if target exists
    let target;
    if (type === 'post') {
      target = await Post.findById(targetId);
    } else if (type === 'comment') {
      target = await Comment.findById(targetId);
    }

    if (!target) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TARGET_NOT_FOUND',
          message: `${type} not found`
        }
      });
    }

    // Get likes
    const result = await Like.getLikes(targetId, type, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result,
      message: 'Likes retrieved successfully'
    });

  } catch (error) {
    console.error('Likes retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LIKES_RETRIEVAL_ERROR',
        message: 'Failed to retrieve likes'
      }
    });
  }
});

// GET /api/v1/likes/check/:targetId - Check if user liked a post or comment
router.get('/check/:targetId', authenticate, async (req, res) => {
  try {
    const { targetId } = req.params;
    const { type } = req.query;
    const userId = req.user._id;

    // Validate type
    if (!type || !['post', 'comment'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Type must be either "post" or "comment"'
        }
      });
    }

    // Check if target exists
    let target;
    if (type === 'post') {
      target = await Post.findById(targetId);
    } else if (type === 'comment') {
      target = await Comment.findById(targetId);
    }

    if (!target) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TARGET_NOT_FOUND',
          message: `${type} not found`
        }
      });
    }

    // Check if liked
    const isLiked = await Like.isLikedBy(userId, targetId, type);

    res.json({
      success: true,
      data: { isLiked },
      message: 'Like status retrieved successfully'
    });

  } catch (error) {
    console.error('Like check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LIKE_CHECK_ERROR',
        message: 'Failed to check like status'
      }
    });
  }
});

// GET /api/v1/likes/user/:userId - Get user's likes
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, page = 1, limit = 20 } = req.query;
    const currentUserId = req.user._id;

    // Build query
    let query = { user: userId };
    if (type && ['post', 'comment'].includes(type)) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get likes
    const likes = await Like.find(query)
      .populate('post', 'content author createdAt')
      .populate('comment', 'content author createdAt')
      .populate('user', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Like.countDocuments(query);

    res.json({
      success: true,
      data: {
        likes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
          hasNext: parseInt(page) * parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      },
      message: 'User likes retrieved successfully'
    });

  } catch (error) {
    console.error('User likes retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'USER_LIKES_ERROR',
        message: 'Failed to retrieve user likes'
      }
    });
  }
});

// Alias: POST /api/v1/likes/:targetId
router.post('/:targetId', authenticate, likeRateLimit, async (req, res) => {
  try {
    const { targetId } = req.params;
    const { type } = req.body;
    const currentUserId = req.user._id;
    if (!type || !['post', 'comment'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Type must be either "post" or "comment"'
        }
      });
    }
    let target;
    if (type === 'post') {
      target = await Post.findById(targetId);
    } else if (type === 'comment') {
      target = await Comment.findById(targetId);
    }
    if (!target) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TARGET_NOT_FOUND',
          message: `${type} not found`
        }
      });
    }
    const existingLike = await Like.findOne({
      user: currentUserId,
      [type]: targetId,
      type
    });
    if (existingLike) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_LIKED',
          message: `Already liked this ${type}`
        }
      });
    }
    const like = await Like.addLike(currentUserId, targetId, type);
    res.status(201).json({
      success: true,
      data: { like },
      message: `${type} liked successfully`
    });
  } catch (error) {
    console.error('Like creation error (alias route):', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LIKE_CREATION_ERROR',
        message: 'Failed to like (alias route)'
      }
    });
  }
});

module.exports = router; 