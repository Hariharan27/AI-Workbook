const express = require('express');
const { body, validationResult } = require('express-validator');
const Like = require('../models/Like');
const Post = require('../models/Post');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

// POST /api/v1/post-likes/:postId/toggle - Toggle post like/unlike
router.post('/:postId/toggle', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.user._id;
    
    console.log(`[POST LIKE] Toggle like request - postId: ${postId}, userId: ${currentUserId}`);
    
    // Validate post exists
    const post = await Post.findById(postId);
    console.log(`[POST LIKE] Post found:`, post ? post._id : 'not found');
    
    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: 'Post not found'
        }
      });
    }
    
    // Use the toggle method specifically for posts
    console.log(`[POST LIKE] Calling Like.toggleLike for post...`);
    const result = await Like.toggleLike(currentUserId, postId, 'post');
    console.log(`[POST LIKE] Toggle result:`, result);
    
    // Recalculate post like count to ensure accuracy
    console.log(`[POST LIKE] Recalculating post like count...`);
    const actualLikeCount = await Post.recalculateLikeCount(postId);
    console.log(`[POST LIKE] Actual like count:`, actualLikeCount);
    
    res.json({
      success: true,
      data: {
        isLiked: result.isLiked,
        like: result.like,
        likesCount: actualLikeCount
      },
      message: result.isLiked ? 'Post liked successfully' : 'Post unliked successfully'
    });
    
  } catch (error) {
    console.error('[POST LIKE] Like toggle error:', error);
    console.error('[POST LIKE] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: {
        code: 'POST_LIKE_TOGGLE_ERROR',
        message: 'Failed to toggle post like'
      }
    });
  }
});

// GET /api/v1/post-likes/:postId - Get likes for a post
router.get('/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    // Validate post exists
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
    
    // Get post likes
    const result = await Like.getLikes(postId, 'post', {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Post likes retrieved successfully'
    });
    
  } catch (error) {
    console.error('Post likes retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'POST_LIKES_RETRIEVAL_ERROR',
        message: 'Failed to retrieve post likes'
      }
    });
  }
});

// GET /api/v1/post-likes/check/:postId - Check if user liked a post
router.get('/check/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;
    
    // Check if post exists
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
    
    // Check if user liked the post
    const isLiked = await Like.isLikedBy(userId, postId, 'post');
    
    res.json({
      success: true,
      data: {
        isLiked
      },
      message: 'Post like status checked successfully'
    });
    
  } catch (error) {
    console.error('Post like check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'POST_LIKE_CHECK_ERROR',
        message: 'Failed to check post like status'
      }
    });
  }
});

module.exports = router; 