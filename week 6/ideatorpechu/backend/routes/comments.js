const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Like = require('../models/Like');
const User = require('../models/User');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

// Rate limiting for comment creation
const commentRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 comments per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many comments created, please try again later.'
    }
  }
});

// Validation middleware
const validateComment = [
  body('content')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment content must be between 1 and 1000 characters'),
  body('parentComment')
    .optional()
    .isMongoId()
    .withMessage('Parent comment ID must be a valid MongoDB ID')
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

// POST /api/v1/comments - Create new comment
router.post('/', 
  authenticate, 
  commentRateLimit, 
  validateComment, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      // Accept both 'post' and 'postId' for compatibility
      const postId = req.body.postId || req.body.post;
      const { content, parentComment } = req.body;
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

      // Check if parent comment exists (for replies)
      if (parentComment) {
        const parentCommentDoc = await Comment.findById(parentComment);
        if (!parentCommentDoc) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'PARENT_COMMENT_NOT_FOUND',
              message: 'Parent comment not found'
            }
          });
        }
      }

      // Resolve mentions to user IDs
      const mentions = await resolveMentions(content);

      // Create comment
      const comment = new Comment({
        post: postId,
        author: userId,
        content,
        parentComment,
        mentions
      });

      await comment.save();

      // Update post's comment count
      await Post.findByIdAndUpdate(postId, {
        $inc: { 'stats.commentsCount': 1 }
      });

      // Populate author info
      await comment.populate('author', 'username firstName lastName avatar isVerified');

      res.status(201).json({
        success: true,
        data: { comment },
        message: 'Comment created successfully'
      });

    } catch (error) {
      console.error('Comment creation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'COMMENT_CREATION_ERROR',
          message: 'Failed to create comment'
        }
      });
    }
  }
);

// GET /api/v1/comments/post/:postId - Get comments for a post
router.get('/post/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    console.log(`[COMMENTS] Getting comments for postId: ${postId}, userId: ${userId}, page: ${page}, limit: ${limit}`);

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      console.log(`[COMMENTS] Post not found: ${postId}`);
      return res.status(404).json({
        success: false,
        error: {
          code: 'POST_NOT_FOUND',
          message: 'Post not found'
        }
      });
    }

    // Get comments with pagination
    const result = await Comment.getCommentsWithPagination(postId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    console.log(`[COMMENTS] Found ${result.comments.length} comments for post ${postId}`);

    // Check which comments are liked by current user
    const commentIds = result.comments.map(comment => comment._id);
    const userLikes = await Like.find({
      user: userId,
      comment: { $in: commentIds },
      type: 'comment'
    });

    const likedCommentIds = userLikes.map(like => like.comment.toString());

    // Add isLiked property to comments
    const commentsWithLikes = result.comments.map(comment => ({
      ...comment,
      isLiked: likedCommentIds.includes(comment._id.toString())
    }));

    console.log(`[COMMENTS] Returning ${commentsWithLikes.length} comments with likes`);

    res.json({
      success: true,
      data: { 
        comments: commentsWithLikes,
        pagination: result.pagination
      },
      message: 'Comments retrieved successfully'
    });

  } catch (error) {
    console.error('[COMMENTS] Comments retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'COMMENTS_RETRIEVAL_ERROR',
        message: 'Failed to retrieve comments'
      }
    });
  }
});

// GET /api/v1/comments/:commentId - Get single comment
router.get('/:commentId', authenticate, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId)
      .populate('author', 'username firstName lastName avatar isVerified')
      .populate('mentions', 'username firstName lastName avatar')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username firstName lastName avatar isVerified'
        }
      });

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
        comment: { ...comment.toObject(), isLiked }
      },
      message: 'Comment retrieved successfully'
    });

  } catch (error) {
    console.error('Comment retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'COMMENT_RETRIEVAL_ERROR',
        message: 'Failed to retrieve comment'
      }
    });
  }
});

// PUT /api/v1/comments/:commentId - Update comment
router.put('/:commentId', 
  authenticate, 
  validateComment, 
  handleValidationErrors, 
  async (req, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user._id;

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

      // Check ownership
      console.log(`[DEBUG] Update Comment - User ID: ${userId}, Comment Author: ${comment.author}, Types: ${typeof userId} vs ${typeof comment.author}`);
      if (comment.author.toString() !== userId.toString()) {
        console.warn(`[403] User ${userId} tried to modify comment ${commentId} owned by ${comment.author}`);
        return res.status(403).json({
          success: false,
          error: {
            code: 'NOT_AUTHORIZED',
            message: 'Not authorized to edit this comment'
          }
        });
      }

      // Resolve mentions
      const mentions = await resolveMentions(content);

      // Save old content for edit history
      const editHistory = [...comment.editHistory, {
        content: comment.content,
        editedAt: new Date()
      }];

      // Update comment
      const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
          content,
          mentions,
          isEdited: true,
          editHistory
        },
        { new: true }
      ).populate('author', 'username firstName lastName avatar isVerified');

      res.json({
        success: true,
        data: { comment: updatedComment },
        message: 'Comment updated successfully'
      });

    } catch (error) {
      console.error('Comment update error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'COMMENT_UPDATE_ERROR',
          message: 'Failed to update comment'
        }
      });
    }
  }
);

// DELETE /api/v1/comments/:commentId - Delete comment
router.delete('/:commentId', authenticate, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

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

    // Check ownership
    console.log(`[DEBUG] Delete Comment - User ID: ${userId}, Comment Author: ${comment.author}, Types: ${typeof userId} vs ${typeof comment.author}`);
    if (comment.author.toString() !== userId.toString()) {
      console.warn(`[403] User ${userId} tried to delete comment ${commentId} owned by ${comment.author}`);
      return res.status(403).json({
        success: false,
        error: {
          code: 'NOT_AUTHORIZED',
          message: 'Not authorized to delete this comment'
        }
      });
    }

    // Delete all replies to this comment
    await Comment.deleteMany({ parentComment: commentId });

    // Delete likes for this comment and its replies
    const replyIds = await Comment.find({ parentComment: commentId }).select('_id');
    const allCommentIds = [commentId, ...replyIds.map(r => r._id)];
    await Like.deleteMany({ 
      comment: { $in: allCommentIds }, 
      type: 'comment' 
    });

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    // Update post's comment count
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { 'stats.commentsCount': -(1 + replyIds.length) }
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Comment deletion error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'COMMENT_DELETION_ERROR',
        message: 'Failed to delete comment'
      }
    });
  }
});

// GET /api/v1/comments/user/:userId - Get user comments
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
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

    const result = await Comment.getCommentsWithPagination(
      { author: userId },
      {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 }
      }
    );

    res.json({
      success: true,
      data: result,
      message: 'User comments retrieved successfully'
    });

  } catch (error) {
    console.error('User comments retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'USER_COMMENTS_ERROR',
        message: 'Failed to retrieve user comments'
      }
    });
  }
});

// Alias: GET /api/v1/comments?post=... -> /api/v1/comments/post/:postId
router.get('/', authenticate, async (req, res, next) => {
  if (req.query.post) {
    // Call the handler function directly
    const postId = req.query.post;
    // Reuse the logic from the /post/:postId route
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user._id;
    try {
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
      const result = await Comment.getCommentsWithPagination(postId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      const commentIds = result.comments.map(comment => comment._id);
      const userLikes = await Like.find({
        user: userId,
        comment: { $in: commentIds },
        type: 'comment'
      });
      const likedCommentIds = userLikes.map(like => like.comment.toString());
      const commentsWithLikes = result.comments.map(comment => ({
        ...comment,
        isLiked: likedCommentIds.includes(comment._id.toString())
      }));
      res.json({
        success: true,
        data: {
          comments: commentsWithLikes,
          pagination: result.pagination
        },
        message: 'Comments retrieved successfully'
      });
    } catch (error) {
      console.error('Comments retrieval error (alias):', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'COMMENTS_RETRIEVAL_ERROR',
          message: 'Failed to retrieve comments (alias)'
        }
      });
    }
    return;
  }
  // If no 'post' query, return 400
  res.status(400).json({
    success: false,
    error: {
      code: 'MISSING_POST_ID',
      message: 'Missing post ID in query string.'
    }
  });
});

module.exports = router; 