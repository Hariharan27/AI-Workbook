require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');

// Import configurations and services
const connectDB = require('./config/database');
const redisClient = require('./config/redis');
const socketService = require('./services/socketService');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const likeRoutes = require('./routes/likes');
const postLikeRoutes = require('./routes/post-likes');
const commentLikeRoutes = require('./routes/comment-likes');
const hashtagRoutes = require('./routes/hashtags');
const searchRoutes = require('./routes/search');
const shareRoutes = require('./routes/shares');
const moderationRoutes = require('./routes/moderation');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const monitoringRoutes = require('./routes/monitoring');

// Import GraphQL setup
const { setupGraphQL } = require('./graphql/server');

// Import monitoring service
const monitoringService = require('./services/monitoringService');

// Import middleware
const { authenticate } = require('./middleware/authenticate');

// Import models for feed functionality
const Post = require('./models/Post');
const Like = require('./models/Like');
const Relationship = require('./models/Relationship');

const app = express();
const server = http.createServer(app);
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
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
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

// Global rate limiting - Only enabled in production
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

// Only apply rate limiting in production
if (process.env.NODE_ENV === 'production') {
  app.use(globalRateLimit);
  console.log('Rate limiting enabled for production');
} else {
  console.log('Rate limiting disabled for development');
}

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
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/likes', likeRoutes);
app.use('/api/v1/post-likes', postLikeRoutes);
app.use('/api/v1/comment-likes', commentLikeRoutes);
app.use('/api/v1/hashtags', hashtagRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/shares', shareRoutes);
app.use('/api/v1/moderation', moderationRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/monitoring', monitoringRoutes);

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
    const postsWithLikes = posts.map(post => ({ ...post, isLiked: likedPostIds.includes(post._id.toString()) }));
    
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

// Serve uploads directory as static files
const path = require('path');
const fs = require('fs');

// Custom route handler for uploads to handle URL-encoded filenames
app.get('/uploads/*', (req, res) => {
  // Set CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3001');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Get the file path from the URL
  const filePath = req.params[0];
  console.log('Uploads route - Requested file:', filePath);
  
  // Decode the URL-encoded filename
  const decodedPath = decodeURIComponent(filePath);
  console.log('Uploads route - Decoded path:', decodedPath);
  
  // Construct the full file path
  const fullPath = path.join(__dirname, '../uploads', decodedPath);
  console.log('Uploads route - Full path:', fullPath);
  
  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.log('Uploads route - File not found:', fullPath);
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Get file stats
  const stats = fs.statSync(fullPath);
  
  // Set appropriate headers
  res.setHeader('Content-Type', getMimeType(decodedPath));
  res.setHeader('Content-Length', stats.size);
  res.setHeader('Cache-Control', 'public, max-age=0');
  
  // Stream the file
  const fileStream = fs.createReadStream(fullPath);
  fileStream.pipe(res);
});

// OPTIONS handler for uploads route (CORS preflight)
app.options('/uploads/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3001');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).end();
});

// Helper function to get MIME type
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Protected routes
app.use('/api/v1/messages', authenticate, messageRoutes);
app.use('/api/v1/notifications', authenticate, notificationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to IdeatorPechu API',
    version: '1.0.0',
    phase: '2C - Real-Time Communication',
    endpoints: {
      auth: '/api/v1/auth',
      posts: '/api/v1/posts',
      comments: '/api/v1/comments',
      likes: '/api/v1/likes',
      hashtags: '/api/v1/hashtags',
      search: '/api/v1/search',
      shares: '/api/v1/shares',
      moderation: '/api/v1/moderation',
      messages: '/api/v1/messages',
      notifications: '/api/v1/notifications',
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
    // Stop monitoring service
    monitoringService.stop();
    console.log('Monitoring service stopped');
    
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
  
  // Start monitoring service
  monitoringService.start();
  
  // Initialize Socket.io
  socketService.initialize(server);
  
  // Setup GraphQL
  await setupGraphQL(app, server);
  
  server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    IDEATORPECHU API                          ║
╠══════════════════════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}                           ║
║  🌍 Environment: ${process.env.NODE_ENV || 'development'}     ║
║  📊 Phase: 3 - GraphQL & Performance Monitoring             ║
║  🔗 Health Check: http://localhost:${PORT}/health            ║
║  📚 API Base: http://localhost:${PORT}/api/v1               ║
║  🔌 Socket.io: ws://localhost:${PORT}                       ║
║  🎯 GraphQL: http://localhost:${PORT}/graphql               ║
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