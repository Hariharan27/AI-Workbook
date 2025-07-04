const express = require('express');
const { query, validationResult } = require('express-validator');
const Hashtag = require('../models/Hashtag');
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

// GET /api/v1/hashtags/trending - Get trending hashtags
router.get('/trending', 
  authenticate, 
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      const trending = await Hashtag.getTrending(parseInt(limit));

      res.json({
        success: true,
        data: { hashtags: trending },
        message: 'Trending hashtags retrieved successfully'
      });

    } catch (error) {
      console.error('Trending hashtags error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TRENDING_HASHTAGS_ERROR',
          message: 'Failed to retrieve trending hashtags'
        }
      });
    }
  }
);

// GET /api/v1/hashtags/search - Search hashtags
router.get('/search', 
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

// GET /api/v1/hashtags/:hashtag - Get hashtag details and posts
router.get('/:hashtag', 
  authenticate, 
  async (req, res) => {
    try {
      const { hashtag } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // Normalize hashtag name
      const hashtagName = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;

      // Get hashtag details
      const hashtagDoc = await Hashtag.findOne({ name: hashtagName.toLowerCase() });
      
      if (!hashtagDoc) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'HASHTAG_NOT_FOUND',
            message: 'Hashtag not found'
          }
        });
      }

      // Get posts with this hashtag
      const result = await Post.getPostsWithPagination(
        { 
          hashtags: hashtagName.toLowerCase(),
          isPublic: true,
          'moderation.status': 'approved'
        },
        {
          page: parseInt(page),
          limit: parseInt(limit),
          sort: { createdAt: -1 }
        }
      );

      res.json({
        success: true,
        data: {
          hashtag: hashtagDoc,
          posts: result.posts,
          pagination: result.pagination
        },
        message: 'Hashtag details retrieved successfully'
      });

    } catch (error) {
      console.error('Hashtag details error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HASHTAG_DETAILS_ERROR',
          message: 'Failed to retrieve hashtag details'
        }
      });
    }
  }
);

// GET /api/v1/hashtags/:hashtag/posts - Get posts by hashtag
router.get('/:hashtag/posts', 
  authenticate, 
  async (req, res) => {
    try {
      const { hashtag } = req.params;
      const { page = 1, limit = 20, sort = 'recent' } = req.query;

      // Normalize hashtag name
      const hashtagName = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;

      // Check if hashtag exists
      const hashtagDoc = await Hashtag.findOne({ name: hashtagName.toLowerCase() });
      
      if (!hashtagDoc) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'HASHTAG_NOT_FOUND',
            message: 'Hashtag not found'
          }
        });
      }

      // Determine sort order
      let sortOrder = { createdAt: -1 };
      if (sort === 'popular') {
        sortOrder = { 'stats.likesCount': -1, 'stats.commentsCount': -1 };
      } else if (sort === 'trending') {
        // Hybrid sorting for trending
        sortOrder = {
          $expr: {
            $add: [
              { $multiply: ['$stats.likesCount', 2] },
              { $multiply: ['$stats.commentsCount', 3] },
              { $multiply: ['$stats.sharesCount', 4] },
              { $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60] }
            ]
          }
        };
      }

      // Get posts with this hashtag
      const result = await Post.getPostsWithPagination(
        { 
          hashtags: hashtagName.toLowerCase(),
          isPublic: true,
          'moderation.status': 'approved'
        },
        {
          page: parseInt(page),
          limit: parseInt(limit),
          sort: sortOrder
        }
      );

      res.json({
        success: true,
        data: {
          hashtag: hashtagDoc,
          posts: result.posts,
          pagination: result.pagination
        },
        message: 'Hashtag posts retrieved successfully'
      });

    } catch (error) {
      console.error('Hashtag posts error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HASHTAG_POSTS_ERROR',
          message: 'Failed to retrieve hashtag posts'
        }
      });
    }
  }
);

// GET /api/v1/hashtags - Get all hashtags with pagination
router.get('/', 
  authenticate, 
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('sort')
      .optional()
      .isIn(['name', 'postsCount', 'lastUsed'])
      .withMessage('Sort must be one of: name, postsCount, lastUsed')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, sort = 'postsCount' } = req.query;

      // Determine sort order
      let sortOrder = { postsCount: -1 };
      if (sort === 'name') {
        sortOrder = { name: 1 };
      } else if (sort === 'lastUsed') {
        sortOrder = { lastUsed: -1 };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get hashtags
      const hashtags = await Hashtag.find()
        .sort(sortOrder)
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

      const total = await Hashtag.countDocuments();

      res.json({
        success: true,
        data: {
          hashtags,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit)),
            hasNext: parseInt(page) * parseInt(limit) < total,
            hasPrev: parseInt(page) > 1
          }
        },
        message: 'Hashtags retrieved successfully'
      });

    } catch (error) {
      console.error('Hashtags retrieval error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HASHTAGS_RETRIEVAL_ERROR',
          message: 'Failed to retrieve hashtags'
        }
      });
    }
  }
);

// POST /api/v1/hashtags/cleanup - Clean up old hashtag history (admin only)
router.post('/cleanup', 
  authenticate, 
  async (req, res) => {
    try {
      // Check if user is admin (you can implement admin check here)
      // For now, we'll allow any authenticated user
      
      await Hashtag.cleanupHistory();

      res.json({
        success: true,
        message: 'Hashtag cleanup completed successfully'
      });

    } catch (error) {
      console.error('Hashtag cleanup error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HASHTAG_CLEANUP_ERROR',
          message: 'Failed to cleanup hashtags'
        }
      });
    }
  }
);

// GET /api/v1/hashtags/stats/overview - Get hashtag statistics overview
router.get('/stats/overview', 
  authenticate, 
  async (req, res) => {
    try {
      const totalHashtags = await Hashtag.countDocuments();
      const trendingHashtags = await Hashtag.countDocuments({ isTrending: true });
      const totalPosts = await Post.countDocuments();
      
      // Get top hashtags by usage
      const topHashtags = await Hashtag.find()
        .sort({ postsCount: -1 })
        .limit(10)
        .select('name postsCount')
        .lean();

      // Get recently used hashtags
      const recentHashtags = await Hashtag.find()
        .sort({ lastUsed: -1 })
        .limit(10)
        .select('name lastUsed')
        .lean();

      res.json({
        success: true,
        data: {
          overview: {
            totalHashtags,
            trendingHashtags,
            totalPosts
          },
          topHashtags,
          recentHashtags
        },
        message: 'Hashtag statistics retrieved successfully'
      });

    } catch (error) {
      console.error('Hashtag stats error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HASHTAG_STATS_ERROR',
          message: 'Failed to retrieve hashtag statistics'
        }
      });
    }
  }
);

module.exports = router; 