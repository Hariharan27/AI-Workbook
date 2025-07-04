const express = require('express');
const { query, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const Hashtag = require('../models/Hashtag');
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

// GET /api/v1/search/posts - Search posts
router.get('/posts', 
  authenticate, 
  [
    query('q')
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('type')
      .optional()
      .isIn(['all', 'text', 'media'])
      .withMessage('Type must be one of: all, text, media')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { q, limit = 20, page = 1, type = 'all' } = req.query;
      const userId = req.user._id;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build search query
      let searchQuery = {
        isPublic: true,
        'moderation.status': 'approved',
        $text: { $search: q }
      };

      // Filter by type if specified
      if (type === 'media') {
        searchQuery['media.0'] = { $exists: true };
      } else if (type === 'text') {
        searchQuery['media.0'] = { $exists: false };
      }

      // Get posts with text search
      const posts = await Post.find(searchQuery)
        .populate('author', 'username firstName lastName avatar isVerified')
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await Post.countDocuments(searchQuery);

      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
            hasNext: parseInt(page) * parseInt(limit) < total,
            hasPrev: parseInt(page) > 1
          }
        },
        message: 'Post search completed successfully'
      });

    } catch (error) {
      console.error('Post search error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'POST_SEARCH_ERROR',
          message: 'Failed to search posts'
        }
      });
    }
  }
);

// GET /api/v1/search/users - Search users
router.get('/users', 
  authenticate, 
  [
    query('q')
      .isLength({ min: 1, max: 50 })
      .withMessage('Search query must be between 1 and 50 characters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { q, limit = 20, page = 1 } = req.query;
      const currentUserId = req.user._id;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build search query
      const searchQuery = {
        isActive: true,
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { firstName: { $regex: q, $options: 'i' } },
          { lastName: { $regex: q, $options: 'i' } },
          { bio: { $regex: q, $options: 'i' } }
        ]
      };

      // Get users with search
      const users = await User.find(searchQuery)
        .select('-password -email')
        .sort({ 'stats.followersCount': -1, createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await User.countDocuments(searchQuery);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
            hasNext: parseInt(page) * parseInt(limit) < total,
            hasPrev: parseInt(page) > 1
          }
        },
        message: 'User search completed successfully'
      });

    } catch (error) {
      console.error('User search error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'USER_SEARCH_ERROR',
          message: 'Failed to search users'
        }
      });
    }
  }
);

// GET /api/v1/search/hashtags - Search hashtags
router.get('/hashtags', 
  authenticate, 
  [
    query('q')
      .isLength({ min: 1, max: 50 })
      .withMessage('Search query must be between 1 and 50 characters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { q, limit = 20 } = req.query;

      const hashtags = await Hashtag.search(q, parseInt(limit));

      res.json({
        success: true,
        data: { hashtags },
        message: 'Hashtag search completed successfully'
      });

    } catch (error) {
      console.error('Hashtag search error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HASHTAG_SEARCH_ERROR',
          message: 'Failed to search hashtags'
        }
      });
    }
  }
);

// GET /api/v1/search/global - Global search across all types
router.get('/global', 
  authenticate, 
  [
    query('q')
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { q, limit = 10 } = req.query;

      // Search across all types concurrently
      const [posts, users, hashtags] = await Promise.all([
        Post.find({
          isPublic: true,
          'moderation.status': 'approved',
          $text: { $search: q }
        })
        .populate('author', 'username firstName lastName avatar isVerified')
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .lean(),

        User.find({
          isActive: true,
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { firstName: { $regex: q, $options: 'i' } },
            { lastName: { $regex: q, $options: 'i' } }
          ]
        })
        .select('-password -email')
        .sort({ 'stats.followersCount': -1 })
        .limit(limit)
        .lean(),

        Hashtag.search(q, limit)
      ]);

      res.json({
        success: true,
        data: {
          posts,
          users,
          hashtags
        },
        message: 'Global search completed successfully'
      });

    } catch (error) {
      console.error('Global search error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GLOBAL_SEARCH_ERROR',
          message: 'Failed to perform global search'
        }
      });
    }
  }
);

module.exports = router; 