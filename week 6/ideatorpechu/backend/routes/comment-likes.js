const express = require('express');
const { body, validationResult } = require('express-validator');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

// POST /api/v1/comment-likes/:commentId/toggle - Toggle comment like/unlike
router.post('/:commentId/toggle', authenticate, async (req, res) => {
  try {
    const { commentId } = req.params;
    const currentUserId = req.user._id;
    
    console.log(`[COMMENT LIKE] Toggle like request - commentId: ${commentId}, userId: ${currentUserId}`);
    
    // Validate comment exists
    const comment = await Comment.findById(commentId);
    console.log(`[COMMENT LIKE] Comment found:`, comment ? comment._id : 'not found');
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: 'Comment not found'
        }
      });
    }
    
    // Use the toggle method specifically for comments
    console.log(`[COMMENT LIKE] Calling Like.toggleLike for comment...`);
    const result = await Like.toggleLike(currentUserId, commentId, 'comment');
    console.log(`[COMMENT LIKE] Toggle result:`, result);
    
    // Recalculate comment like count to ensure accuracy
    console.log(`[COMMENT LIKE] Recalculating comment like count...`);
    const actualLikeCount = await Like.countDocuments({ comment: commentId, type: 'comment' });
    await Comment.findByIdAndUpdate(commentId, { likesCount: actualLikeCount });
    console.log(`[COMMENT LIKE] Actual like count:`, actualLikeCount);
    
    res.json({
      success: true,
      data: {
        isLiked: result.isLiked,
        like: result.like,
        likesCount: actualLikeCount
      },
      message: result.isLiked ? 'Comment liked successfully' : 'Comment unliked successfully'
    });
    
  } catch (error) {
    console.error('[COMMENT LIKE] Like toggle error:', error);
    console.error('[COMMENT LIKE] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: {
        code: 'COMMENT_LIKE_TOGGLE_ERROR',
        message: 'Failed to toggle comment like'
      }
    });
  }
});

// GET /api/v1/comment-likes/:commentId - Get likes for a comment
router.get('/:commentId', authenticate, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Validate comment exists
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: 'Comment not found'
        }
      });
    }
    
    // Get comment likes
    const result = await Like.getLikes(commentId, 'comment', {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Comment likes retrieved successfully'
    });
    
  } catch (error) {
    console.error('Comment likes retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'COMMENT_LIKES_RETRIEVAL_ERROR',
        message: 'Failed to retrieve comment likes'
      }
    });
  }
});

// GET /api/v1/comment-likes/check/:commentId - Check if user liked a comment
router.get('/check/:commentId', authenticate, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;
    
    // Check if comment exists
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: 'Comment not found'
        }
      });
    }
    
    // Check if user liked the comment
    const isLiked = await Like.isLikedBy(userId, commentId, 'comment');
    
    res.json({
      success: true,
      data: {
        isLiked
      },
      message: 'Comment like status checked successfully'
    });
    
  } catch (error) {
    console.error('Comment like check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'COMMENT_LIKE_CHECK_ERROR',
        message: 'Failed to check comment like status'
      }
    });
  }
});

module.exports = router; 