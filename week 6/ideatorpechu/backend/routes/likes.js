const express = require('express');
const { body, validationResult } = require('express-validator');
const Like = require('../models/Like');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

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
  const errors = [];
  
  if (!req.body.type || !['post', 'comment'].includes(req.body.type)) {
    errors.push('Type must be either "post" or "comment"');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errors.join(', ')
      }
    });
  }
  
  next();
};

// POST /api/v1/likes/:targetId/toggle - Toggle like/unlike (Primary endpoint)
router.post('/:targetId/toggle', authenticate, handleValidationErrors, async (req, res) => {
  try {
    const { targetId } = req.params;
    const { type } = req.body;
    const currentUserId = req.user._id;
    
    console.log(`[LIKE ROUTE] Toggle like request - targetId: ${targetId}, type: ${type}, userId: ${currentUserId}`);
    
    // Validate target exists
    let target;
    if (type === 'post') {
      target = await Post.findById(targetId);
    } else if (type === 'comment') {
      target = await Comment.findById(targetId);
    }
    
    console.log(`[LIKE ROUTE] Target found:`, target ? target._id : 'not found');
    
    if (!target) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TARGET_NOT_FOUND',
          message: `${type} not found`
        }
      });
    }
    
    // Use the new toggle method
    console.log(`[LIKE ROUTE] Calling Like.toggleLike...`);
    const result = await Like.toggleLike(currentUserId, targetId, type);
    console.log(`[LIKE ROUTE] Toggle result:`, result);
    
    // Recalculate like count to ensure accuracy
    let actualLikeCount;
    if (type === 'post') {
      console.log(`[LIKE ROUTE] Recalculating post like count...`);
      actualLikeCount = await Post.recalculateLikeCount(targetId);
      console.log(`[LIKE ROUTE] Actual like count:`, actualLikeCount);
    } else if (type === 'comment') {
      actualLikeCount = await Like.countDocuments({ comment: targetId, type: 'comment' });
      await Comment.findByIdAndUpdate(targetId, { likesCount: actualLikeCount });
    }
    
    res.json({
      success: true,
      data: {
        isLiked: result.isLiked,
        like: result.like,
        likesCount: actualLikeCount
      },
      message: result.isLiked ? `${type} liked successfully` : `${type} unliked successfully`
    });
    
  } catch (error) {
    console.error('[LIKE ROUTE] Like toggle error:', error);
    console.error('[LIKE ROUTE] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: {
        code: 'LIKE_TOGGLE_ERROR',
        message: 'Failed to toggle like'
      }
    });
  }
});

// GET /api/v1/likes/:targetId - Get likes for a target
router.get('/:targetId', authenticate, async (req, res) => {
  try {
    const { targetId } = req.params;
    const { type, page = 1, limit = 20 } = req.query;
    
    if (!type || !['post', 'comment'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: 'Type must be either "post" or "comment"'
        }
      });
    }
    
    // Validate target exists
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

// Legacy endpoints for backward compatibility
// POST /api/v1/likes/:targetId - Add like (legacy)
router.post('/:targetId', authenticate, handleValidationErrors, async (req, res) => {
  try {
    const { targetId } = req.params;
    const { type } = req.body;
    const currentUserId = req.user._id;
    
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
    
    const result = await Like.toggleLike(currentUserId, targetId, type);
    
    if (!result.isLiked) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'ALREADY_LIKED',
          message: 'Already liked this item'
        }
      });
    }
    
    res.status(201).json({
      success: true,
      data: { like: result.like },
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
});

// DELETE /api/v1/likes/:targetId - Remove like (legacy)
router.delete('/:targetId', authenticate, handleValidationErrors, async (req, res) => {
  try {
    const { targetId } = req.params;
    const { type } = req.body;
    const currentUserId = req.user._id;
    
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
    
    const result = await Like.toggleLike(currentUserId, targetId, type);
    
    if (result.isLiked) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'NOT_LIKED',
          message: 'Item is not liked'
        }
      });
    }
    
    res.json({
      success: true,
      data: { like: result.like },
      message: `${type} unliked successfully`
    });
  } catch (error) {
    console.error('Like removal error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LIKE_REMOVAL_ERROR',
        message: 'Failed to unlike'
      }
    });
  }
});

module.exports = router; 