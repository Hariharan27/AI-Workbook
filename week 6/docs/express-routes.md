# Express.js Route Structure

## API Routes Organization

### Base Structure
```
/api/v1/
├── auth/
├── users/
├── posts/
├── comments/
├── messages/
├── notifications/
├── search/
├── media/
└── admin/
```

### Authentication Routes (/api/v1/auth)
```javascript
// POST /api/v1/auth/register
// Register new user
{
  "username": "string",
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string"
}

// POST /api/v1/auth/login
// Login user
{
  "email": "string",
  "password": "string"
}

// POST /api/v1/auth/logout
// Logout user (requires authentication)

// POST /api/v1/auth/refresh-token
// Refresh JWT token
{
  "refreshToken": "string"
}

// POST /api/v1/auth/forgot-password
// Request password reset
{
  "email": "string"
}

// POST /api/v1/auth/reset-password
// Reset password with token
{
  "token": "string",
  "newPassword": "string"
}
```

### User Routes (/api/v1/users)
```javascript
// GET /api/v1/users/profile/:userId
// Get user profile (public)

// PUT /api/v1/users/profile
// Update own profile (requires authentication)
{
  "firstName": "string",
  "lastName": "string",
  "bio": "string",
  "location": "string",
  "website": "string",
  "isPrivate": "boolean"
}

// POST /api/v1/users/avatar
// Upload avatar (requires authentication)
// Multipart form data

// GET /api/v1/users/search
// Search users
// Query params: q, limit, offset

// GET /api/v1/users/:userId/posts
// Get user's posts
// Query params: limit, offset

// GET /api/v1/users/:userId/followers
// Get user's followers
// Query params: limit, offset

// GET /api/v1/users/:userId/following
// Get users that this user follows
// Query params: limit, offset

// POST /api/v1/users/:userId/follow
// Follow user (requires authentication)

// DELETE /api/v1/users/:userId/follow
// Unfollow user (requires authentication)

// POST /api/v1/users/:userId/block
// Block user (requires authentication)

// DELETE /api/v1/users/:userId/block
// Unblock user (requires authentication)
```

### Post Routes (/api/v1/posts)
```javascript
// GET /api/v1/posts/feed
// Get user's feed (requires authentication)
// Query params: limit, offset

// POST /api/v1/posts
// Create new post (requires authentication)
{
  "content": "string",
  "hashtags": ["string"],
  "mentions": ["userId"],
  "location": {
    "latitude": "number",
    "longitude": "number"
  },
  "isPublic": "boolean"
}
// Multipart form data for media files

// GET /api/v1/posts/:postId
// Get specific post

// PUT /api/v1/posts/:postId
// Update post (requires authentication, author only)
{
  "content": "string",
  "hashtags": ["string"],
  "mentions": ["userId"]
}

// DELETE /api/v1/posts/:postId
// Delete post (requires authentication, author only)

// POST /api/v1/posts/:postId/like
// Like post (requires authentication)

// DELETE /api/v1/posts/:postId/like
// Unlike post (requires authentication)

// POST /api/v1/posts/:postId/share
// Share post (requires authentication)

// GET /api/v1/posts/:postId/comments
// Get post comments
// Query params: limit, offset

// POST /api/v1/posts/:postId/comments
// Add comment to post (requires authentication)
{
  "content": "string",
  "parentCommentId": "string",
  "mentions": ["userId"]
}

// GET /api/v1/posts/trending
// Get trending posts
// Query params: limit, offset
```

### Comment Routes (/api/v1/comments)
```javascript
// GET /api/v1/comments/:commentId
// Get specific comment

// PUT /api/v1/comments/:commentId
// Update comment (requires authentication, author only)
{
  "content": "string"
}

// DELETE /api/v1/comments/:commentId
// Delete comment (requires authentication, author only)

// POST /api/v1/comments/:commentId/like
// Like comment (requires authentication)

// DELETE /api/v1/comments/:commentId/like
// Unlike comment (requires authentication)
```

### Message Routes (/api/v1/messages)
```javascript
// GET /api/v1/messages/conversations
// Get user's conversations (requires authentication)
// Query params: limit, offset

// POST /api/v1/messages/conversations
// Create new conversation (requires authentication)
{
  "participantIds": ["userId"],
  "type": "direct|group",
  "name": "string" // for group chats
}

// GET /api/v1/messages/conversations/:conversationId
// Get specific conversation (requires authentication)

// GET /api/v1/messages/conversations/:conversationId/messages
// Get conversation messages (requires authentication)
// Query params: limit, offset

// POST /api/v1/messages/conversations/:conversationId/messages
// Send message (requires authentication)
{
  "content": "string",
  "messageType": "text|image|video|file"
}
// Multipart form data for media files

// PUT /api/v1/messages/conversations/:conversationId/read
// Mark conversation as read (requires authentication)
```

### Notification Routes (/api/v1/notifications)
```javascript
// GET /api/v1/notifications
// Get user's notifications (requires authentication)
// Query params: limit, offset

// PUT /api/v1/notifications/:notificationId/read
// Mark notification as read (requires authentication)

// PUT /api/v1/notifications/read-all
// Mark all notifications as read (requires authentication)

// GET /api/v1/notifications/unread-count
// Get unread notifications count (requires authentication)
```

### Search Routes (/api/v1/search)
```javascript
// GET /api/v1/search/posts
// Search posts
// Query params: q, limit, offset

// GET /api/v1/search/users
// Search users
// Query params: q, limit, offset

// GET /api/v1/search/hashtags
// Search hashtags
// Query params: q, limit
```

### Media Routes (/api/v1/media)
```javascript
// POST /api/v1/media/upload
// Upload media file (requires authentication)
// Multipart form data

// POST /api/v1/media/upload-avatar
// Upload avatar (requires authentication)
// Multipart form data

// DELETE /api/v1/media/:mediaId
// Delete media file (requires authentication, owner only)
```

### Admin Routes (/api/v1/admin)
```javascript
// GET /api/v1/admin/moderation/posts
// Get posts for moderation (requires admin authentication)
// Query params: status, limit, offset

// PUT /api/v1/admin/moderation/posts/:postId
// Moderate post (requires admin authentication)
{
  "status": "pending|approved|rejected",
  "reason": "string"
}

// GET /api/v1/admin/moderation/users
// Get users for moderation (requires admin authentication)
// Query params: status, limit, offset

// PUT /api/v1/admin/moderation/users/:userId
// Moderate user (requires admin authentication)
{
  "action": "warn|suspend|ban",
  "reason": "string",
  "duration": "number" // in days
}
```

## Route Implementation Structure

### Middleware Stack
```javascript
// Global middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Authentication middleware
const authenticate = require('./middleware/authenticate');
const adminAuth = require('./middleware/adminAuth');
const rateLimit = require('./middleware/rateLimit');

// Route registration
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authenticate, userRoutes);
app.use('/api/v1/posts', authenticate, postRoutes);
app.use('/api/v1/comments', authenticate, commentRoutes);
app.use('/api/v1/messages', authenticate, messageRoutes);
app.use('/api/v1/notifications', authenticate, notificationRoutes);
app.use('/api/v1/search', authenticate, searchRoutes);
app.use('/api/v1/media', authenticate, mediaRoutes);
app.use('/api/v1/admin', authenticate, adminAuth, adminRoutes);

// Error handling middleware
app.use(errorHandler);
app.use(notFoundHandler);
```

### Route Handler Structure
```javascript
// Example route handler structure
const userController = {
  // Get user profile
  getProfile: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const user = await userService.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  // Update profile
  updateProfile: async (req, res, next) => {
    try {
      const { userId } = req.user;
      const updateData = req.body;
      
      const updatedUser = await userService.updateProfile(userId, updateData);
      res.json(updatedUser);
    } catch (error) {
      next(error);
    }
  },

  // Follow user
  followUser: async (req, res, next) => {
    try {
      const { userId } = req.user;
      const { userId: targetUserId } = req.params;
      
      await userService.followUser(userId, targetUserId);
      res.json({ message: 'User followed successfully' });
    } catch (error) {
      next(error);
    }
  }
};
```

### Response Format
```javascript
// Success response format
{
  "success": true,
  "data": { /* response data */ },
  "message": "string",
  "timestamp": "ISO date string"
}

// Error response format
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": { /* additional error details */ }
  },
  "timestamp": "ISO date string"
}

// Paginated response format
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "pages": "number",
    "hasNext": "boolean",
    "hasPrev": "boolean"
  },
  "timestamp": "ISO date string"
}
```

### Rate Limiting
```javascript
// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
};

// Specific rate limits for different endpoints
const authRateLimit = {
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.'
};

const uploadRateLimit = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Upload limit exceeded, please try again later.'
};
``` 