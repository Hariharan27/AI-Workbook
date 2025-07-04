require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import configurations and services
const connectDB = require('./config/database');
const redisClient = require('./config/redis');

// Import routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const likeRoutes = require('./routes/likes');
const hashtagRoutes = require('./routes/hashtags');
const searchRoutes = require('./routes/search');
const shareRoutes = require('./routes/shares');
const moderationRoutes = require('./routes/moderation');

// Import middleware
const { authenticate } = require('./middleware/authenticate');

// Import models for feed functionality
const Post = require('./models/Post');
const Like = require('./models/Like');
const Relationship = require('./models/Relationship');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to databases
const initializeApp = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis
    await redisClient.connect();
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ 
  limit: process.env.MAX_FILE_SIZE || '10mb' 
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_FILE_SIZE || '10mb' 
}));

// Global rate limiting
const globalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(globalRateLimit);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'IdeatorPechu API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/likes', likeRoutes);
app.use('/api/v1/hashtags', hashtagRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/shares', shareRoutes);
app.use('/api/v1/moderation', moderationRoutes);

// Feed route
app.get('/api/v1/feed', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    
    // Get user's following list
    const following = await Relationship.find({
      follower: userId,
      status: 'accepted'
    }).select('following');
    const followingIds = following.map(r => r.following);
    
    // Get feed posts
    const posts = await Post.getFeedPosts(userId, followingIds, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
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
      ...post.toObject(),
      isLiked: likedPostIds.includes(post._id.toString())
    }));
    
    res.json({
      success: true,
      data: { posts: postsWithLikes },
      message: 'Feed retrieved successfully'
    });
  } catch (error) {
    console.error('Feed retrieval error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FEED_ERROR',
        message: 'Failed to retrieve feed'
      }
    });
  }
});

// Protected routes (will be added in future phases)
// app.use('/api/v1/users', authenticate, userRoutes);
// app.use('/api/v1/messages', authenticate, messageRoutes);
// app.use('/api/v1/notifications', authenticate, notificationRoutes);
// app.use('/api/v1/search', authenticate, searchRoutes);
// app.use('/api/v1/media', authenticate, mediaRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to IdeatorPechu API',
    version: '1.0.0',
    phase: '2B - Content Management System',
    endpoints: {
      auth: '/api/v1/auth',
      posts: '/api/v1/posts',
      comments: '/api/v1/comments',
      likes: '/api/v1/likes',
      hashtags: '/api/v1/hashtags',
      search: '/api/v1/search',
      shares: '/api/v1/shares',
      moderation: '/api/v1/moderation',
      health: '/health'
    },
    documentation: 'Coming soon...'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors
      }
    });
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `${field} already exists`,
        field
      }
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      }
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token expired'
      }
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message
    }
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  try {
    // Close Redis connection
    await redisClient.disconnect();
    console.log('Redis connection closed');
    
    // Close MongoDB connection
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    console.log('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server
const startServer = async () => {
  await initializeApp();
  
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    IDEATORPECHU API                          ║
╠══════════════════════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}                           ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}     ║
║  📊 Phase: 2A - User Management & Authentication             ║
║  🔗 Health Check: http://localhost:${PORT}/health            ║
║  📚 API Base: http://localhost:${PORT}/api/v1               ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
};

// Start the application
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

module.exports = app; 