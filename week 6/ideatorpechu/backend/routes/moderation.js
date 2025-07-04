const express = require('express');
const { body, query, validationResult } = require('express-validator');
const moderationService = require('../services/moderationService');
const Post = require('../models/Post');
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

// POST /api/v1/moderation/report - Report a post
router.post('/report', 
  authenticate, 
  [
    body('postId')
      .isMongoId()
      .withMessage('Invalid post ID'),
    body('reason')
      .isLength({ min: 1, max: 100 })
      .withMessage('Reason must be between 1 and 100 characters'),
    body('details')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Details must be less than 500 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { postId, reason, details } = req.body;
      const reporterId = req.user._id;

      const result = await moderationService.reportPost(postId, reporterId, reason, details);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'REPORT_ERROR',
            message: result.error
          }
        });
      }

      res.json({
        success: true,
        data: result,
        message: 'Post reported successfully'
      });

    } catch (error) {
      console.error('Report post error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'REPORT_ERROR',
          message: 'Failed to report post'
        }
      });
    }
  }
);

// GET /api/v1/moderation/pending - Get posts pending moderation (Admin only)
router.get('/pending', 
  authenticate, 
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // TODO: Add admin role check
      const { limit = 20, offset = 0 } = req.query;

      const result = await moderationService.getPendingModeration(parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: result,
        message: 'Pending moderation posts retrieved successfully'
      });

    } catch (error) {
      console.error('Get pending moderation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PENDING_MODERATION_ERROR',
          message: 'Failed to retrieve pending moderation posts'
        }
      });
    }
  }
);

// GET /api/v1/moderation/reported - Get reported posts (Admin only)
router.get('/reported', 
  authenticate, 
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // TODO: Add admin role check
      const { limit = 20, offset = 0 } = req.query;

      const result = await moderationService.getReportedPosts(parseInt(limit), parseInt(offset));

      res.json({
        success: true,
        data: result,
        message: 'Reported posts retrieved successfully'
      });

    } catch (error) {
      console.error('Get reported posts error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'REPORTED_POSTS_ERROR',
          message: 'Failed to retrieve reported posts'
        }
      });
    }
  }
);

// POST /api/v1/moderation/:postId - Moderate a post (Admin only)
router.post('/:postId', 
  authenticate, 
  [
    body('action')
      .isIn(['approved', 'rejected', 'pending'])
      .withMessage('Action must be one of: approved, rejected, pending'),
    body('reason')
      .optional()
      .isLength({ max: 200 })
      .withMessage('Reason must be less than 200 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // TODO: Add admin role check
      const { postId } = req.params;
      const { action, reason } = req.body;
      const adminId = req.user._id;

      const result = await moderationService.manualModerate(postId, adminId, action, reason);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MODERATION_ERROR',
            message: result.error
          }
        });
      }

      res.json({
        success: true,
        data: result,
        message: `Post ${action} successfully`
      });

    } catch (error) {
      console.error('Manual moderation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MODERATION_ERROR',
          message: 'Failed to moderate post'
        }
      });
    }
  }
);

// GET /api/v1/moderation/stats - Get moderation statistics (Admin only)
router.get('/stats', 
  authenticate, 
  async (req, res) => {
    try {
      // TODO: Add admin role check
      const stats = await moderationService.getModerationStats();

      res.json({
        success: true,
        data: stats,
        message: 'Moderation statistics retrieved successfully'
      });

    } catch (error) {
      console.error('Get moderation stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MODERATION_STATS_ERROR',
          message: 'Failed to retrieve moderation statistics'
        }
      });
    }
  }
);

// POST /api/v1/moderation/check - Check content for violations
router.post('/check', 
  authenticate, 
  [
    body('content')
      .isLength({ min: 1, max: 5000 })
      .withMessage('Content must be between 1 and 5000 characters')
  ],
  (req, res, next) => {
    console.log('Moderation check request body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Moderation check validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Content is required and must be 1-5000 characters.',
          details: errors.array()
        }
      });
    }
    next();
  },
  async (req, res) => {
    try {
      const { content } = req.body;
      const authorId = req.user._id;

      const result = await moderationService.checkContent(content, authorId);

      res.json({
        success: true,
        data: result,
        message: 'Content check completed successfully'
      });

    } catch (error) {
      console.error('Content check error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CONTENT_CHECK_ERROR',
          message: 'Failed to check content'
        }
      });
    }
  }
);

// POST /api/v1/moderation/auto-moderate/:postId - Auto-moderate a post
router.post('/auto-moderate/:postId', 
  authenticate, 
  async (req, res) => {
    try {
      // TODO: Add admin role check
      const { postId } = req.params;

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

      const result = await moderationService.moderatePost(postId, post.content, post.author);

      res.json({
        success: true,
        data: result,
        message: 'Post auto-moderated successfully'
      });

    } catch (error) {
      console.error('Auto-moderate error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTO_MODERATION_ERROR',
          message: 'Failed to auto-moderate post'
        }
      });
    }
  }
);

// DELETE /api/v1/moderation/cleanup - Clean up old moderation data (Admin only)
router.delete('/cleanup', 
  authenticate, 
  [
    query('daysOld')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Days old must be between 1 and 365')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // TODO: Add admin role check
      const { daysOld = 30 } = req.query;

      const result = await moderationService.cleanupModerationData(parseInt(daysOld));

      res.json({
        success: true,
        data: { daysOld: parseInt(daysOld) },
        message: 'Moderation data cleanup completed successfully'
      });

    } catch (error) {
      console.error('Moderation cleanup error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'MODERATION_CLEANUP_ERROR',
          message: 'Failed to cleanup moderation data'
        }
      });
    }
  }
);

module.exports = router; 