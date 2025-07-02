# Social Media Platform - Architecture Design

## Overview
Scalable social media platform with real-time features, content management, and AI-powered recommendations.

## Technical Stack
- **Backend**: Node.js with Express.js and TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis for caching and session management
- **Real-time**: Socket.io for real-time features
- **Storage**: AWS S3 for media storage
- **API**: GraphQL for flexible data fetching

---

## 1. MongoDB Schema Design with Relationships

### User Schema
```javascript
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  avatar: { type: String, default: null },
  bio: { type: String, maxLength: 500 },
  location: { type: String },
  website: { type: String },
  isVerified: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
      allowMessages: { type: String, enum: ['everyone', 'friends', 'none'], default: 'friends' }
    }
  },
  stats: {
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});
```

### Post Schema
```javascript
const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true, maxLength: 5000 },
  media: [{
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    thumbnail: { type: String },
    metadata: {
      size: { type: Number },
      duration: { type: Number }, // for videos
      dimensions: { width: Number, height: Number }
    }
  }],
  hashtags: [{ type: String, index: true }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  isPublic: { type: Boolean, default: true },
  isEdited: { type: Boolean, default: false },
  editHistory: [{
    content: String,
    editedAt: { type: Date, default: Date.now }
  }],
  stats: {
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 }
  },
  moderation: {
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    flagged: { type: Boolean, default: false },
    flaggedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }
}, {
  timestamps: true
});
```

### Relationship Schema (Friends/Followers)
```javascript
const relationshipSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'blocked'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});
```

### Comment Schema
```javascript
const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxLength: 1000 },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }, // for nested comments
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isEdited: { type: Boolean, default: false },
  editHistory: [{
    content: String,
    editedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});
```

### Message Schema
```javascript
const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'video', 'file'], default: 'text' },
  media: {
    url: String,
    thumbnail: String,
    metadata: {
      size: Number,
      duration: Number,
      dimensions: { width: Number, height: Number }
    }
  },
  readBy: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  deliveredTo: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveredAt: { type: Date, default: Date.now }
  }],
  isEdited: { type: Boolean, default: false },
  editHistory: [{
    content: String,
    editedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});
```

### Conversation Schema
```javascript
const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  type: { type: String, enum: ['direct', 'group'], default: 'direct' },
  name: { type: String }, // for group chats
  avatar: { type: String }, // for group chats
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});
```

### Notification Schema
```javascript
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: ['like', 'comment', 'follow', 'mention', 'message', 'friend_request'],
    required: true 
  },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  isRead: { type: Boolean, default: false },
  isSeen: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});
```

---

## 2. Express.js Route Structure

### API Routes Organization
```
/api/v1/
├── auth/
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   ├── POST /refresh-token
│   ├── POST /forgot-password
│   └── POST /reset-password
├── users/
│   ├── GET /profile/:userId
│   ├── PUT /profile
│   ├── POST /avatar
│   ├── GET /search
│   ├── GET /:userId/posts
│   ├── GET /:userId/followers
│   ├── GET /:userId/following
│   ├── POST /:userId/follow
│   ├── DELETE /:userId/follow
│   ├── POST /:userId/block
│   └── DELETE /:userId/block
├── posts/
│   ├── GET /feed
│   ├── POST /
│   ├── GET /:postId
│   ├── PUT /:postId
│   ├── DELETE /:postId
│   ├── POST /:postId/like
│   ├── DELETE /:postId/like
│   ├── POST /:postId/share
│   ├── GET /:postId/comments
│   ├── POST /:postId/comments
│   └── GET /trending
├── comments/
│   ├── GET /:commentId
│   ├── PUT /:commentId
│   ├── DELETE /:commentId
│   ├── POST /:commentId/like
│   └── DELETE /:commentId/like
├── messages/
│   ├── GET /conversations
│   ├── POST /conversations
│   ├── GET /conversations/:conversationId
│   ├── GET /conversations/:conversationId/messages
│   ├── POST /conversations/:conversationId/messages
│   └── PUT /conversations/:conversationId/read
├── notifications/
│   ├── GET /
│   ├── PUT /:notificationId/read
│   ├── PUT /read-all
│   └── GET /unread-count
├── search/
│   ├── GET /posts
│   ├── GET /users
│   └── GET /hashtags
├── media/
│   ├── POST /upload
│   ├── POST /upload-avatar
│   └── DELETE /:mediaId
└── admin/
    ├── GET /moderation/posts
    ├── PUT /moderation/posts/:postId
    ├── GET /moderation/users
    └── PUT /moderation/users/:userId
```

### Route Implementation Structure
```typescript
// Route middleware structure
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authenticate, userRoutes);
app.use('/api/v1/posts', authenticate, postRoutes);
app.use('/api/v1/comments', authenticate, commentRoutes);
app.use('/api/v1/messages', authenticate, messageRoutes);
app.use('/api/v1/notifications', authenticate, notificationRoutes);
app.use('/api/v1/search', authenticate, searchRoutes);
app.use('/api/v1/media', authenticate, mediaRoutes);
app.use('/api/v1/admin', authenticate, adminAuth, adminRoutes);
```

---

## 3. Socket.io Event Architecture

### Namespace Structure
```
/social - Main social events
/messaging - Private messaging
/notifications - Real-time notifications
/admin - Admin events
```

### Event Definitions

#### Social Events (/social)
```javascript
// Connection events
'socket:connect' - User connects
'socket:disconnect' - User disconnects
'socket:typing' - User starts typing in post comments

// Post events
'post:create' - New post created
'post:update' - Post updated
'post:delete' - Post deleted
'post:like' - Post liked/unliked
'post:comment' - New comment on post
'post:share' - Post shared

// User events
'user:follow' - User followed/unfollowed
'user:online' - User comes online
'user:offline' - User goes offline
'user:typing' - User typing in comments
```

#### Messaging Events (/messaging)
```javascript
// Connection events
'message:join' - Join conversation room
'message:leave' - Leave conversation room
'message:typing' - User typing in conversation
'message:stop-typing' - User stopped typing

// Message events
'message:send' - Send new message
'message:delivered' - Message delivered
'message:read' - Message read
'message:edit' - Edit message
'message:delete' - Delete message

// Conversation events
'conversation:create' - New conversation created
'conversation:update' - Conversation updated
'conversation:delete' - Conversation deleted
```

#### Notification Events (/notifications)
```javascript
// Real-time notifications
'notification:new' - New notification
'notification:read' - Notification read
'notification:read-all' - All notifications read
'notification:delete' - Notification deleted
```

### Socket.io Implementation Structure
```typescript
// Socket connection management
interface SocketUser {
  userId: string;
  socketId: string;
  isOnline: boolean;
  lastSeen: Date;
  activeConversations: string[];
}

// Room management
const rooms = {
  user: (userId: string) => `user:${userId}`,
  conversation: (conversationId: string) => `conversation:${conversationId}`,
  post: (postId: string) => `post:${postId}`,
  admin: 'admin'
};
```

---

## 4. GraphQL Schema and Resolvers

### GraphQL Schema
```graphql
# User Type
type User {
  id: ID!
  username: String!
  email: String!
  firstName: String!
  lastName: String!
  avatar: String
  bio: String
  location: String
  website: String
  isVerified: Boolean!
  isPrivate: Boolean!
  isActive: Boolean!
  lastSeen: DateTime!
  preferences: UserPreferences!
  stats: UserStats!
  posts: [Post!]!
  followers: [User!]!
  following: [User!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type UserPreferences {
  notifications: NotificationPreferences!
  privacy: PrivacyPreferences!
}

type UserStats {
  followersCount: Int!
  followingCount: Int!
  postsCount: Int!
}

# Post Type
type Post {
  id: ID!
  author: User!
  content: String!
  media: [Media!]!
  hashtags: [String!]!
  mentions: [User!]!
  location: Location
  isPublic: Boolean!
  isEdited: Boolean!
  stats: PostStats!
  comments: [Comment!]!
  likes: [User!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Media {
  id: ID!
  type: MediaType!
  url: String!
  thumbnail: String
  metadata: MediaMetadata
}

type PostStats {
  likesCount: Int!
  commentsCount: Int!
  sharesCount: Int!
  viewsCount: Int!
}

# Comment Type
type Comment {
  id: ID!
  post: Post!
  author: User!
  content: String!
  parentComment: Comment
  mentions: [User!]!
  likes: [User!]!
  isEdited: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# Message Type
type Message {
  id: ID!
  conversation: Conversation!
  sender: User!
  content: String!
  messageType: MessageType!
  media: Media
  readBy: [MessageRead!]!
  deliveredTo: [MessageDelivered!]!
  isEdited: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Conversation {
  id: ID!
  participants: [User!]!
  type: ConversationType!
  name: String
  avatar: String
  lastMessage: Message
  lastActivity: DateTime!
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# Notification Type
type Notification {
  id: ID!
  recipient: User!
  sender: User
  type: NotificationType!
  post: Post
  comment: Comment
  message: Message
  conversation: Conversation
  isRead: Boolean!
  isSeen: Boolean!
  createdAt: DateTime!
}

# Queries
type Query {
  # User queries
  me: User
  user(id: ID!): User
  users(search: String, limit: Int, offset: Int): [User!]!
  
  # Post queries
  post(id: ID!): Post
  posts(authorId: ID, hashtag: String, limit: Int, offset: Int): [Post!]!
  feed(limit: Int, offset: Int): [Post!]!
  trendingPosts(limit: Int): [Post!]!
  
  # Comment queries
  comments(postId: ID!, limit: Int, offset: Int): [Comment!]!
  
  # Message queries
  conversations: [Conversation!]!
  conversation(id: ID!): Conversation
  messages(conversationId: ID!, limit: Int, offset: Int): [Message!]!
  
  # Notification queries
  notifications(limit: Int, offset: Int): [Notification!]!
  unreadNotificationsCount: Int!
  
  # Search queries
  searchPosts(query: String!, limit: Int, offset: Int): [Post!]!
  searchUsers(query: String!, limit: Int, offset: Int): [User!]!
  searchHashtags(query: String!, limit: Int): [String!]!
}

# Mutations
type Mutation {
  # Auth mutations
  register(input: RegisterInput!): AuthResponse!
  login(input: LoginInput!): AuthResponse!
  logout: Boolean!
  
  # User mutations
  updateProfile(input: UpdateProfileInput!): User!
  uploadAvatar(file: Upload!): User!
  followUser(userId: ID!): Boolean!
  unfollowUser(userId: ID!): Boolean!
  blockUser(userId: ID!): Boolean!
  unblockUser(userId: ID!): Boolean!
  
  # Post mutations
  createPost(input: CreatePostInput!): Post!
  updatePost(id: ID!, input: UpdatePostInput!): Post!
  deletePost(id: ID!): Boolean!
  likePost(id: ID!): Boolean!
  unlikePost(id: ID!): Boolean!
  sharePost(id: ID!): Boolean!
  
  # Comment mutations
  createComment(input: CreateCommentInput!): Comment!
  updateComment(id: ID!, input: UpdateCommentInput!): Comment!
  deleteComment(id: ID!): Boolean!
  likeComment(id: ID!): Boolean!
  unlikeComment(id: ID!): Boolean!
  
  # Message mutations
  createConversation(input: CreateConversationInput!): Conversation!
  sendMessage(input: SendMessageInput!): Message!
  markConversationAsRead(conversationId: ID!): Boolean!
  
  # Notification mutations
  markNotificationAsRead(id: ID!): Notification!
  markAllNotificationsAsRead: Boolean!
  deleteNotification(id: ID!): Boolean!
}

# Subscriptions
type Subscription {
  # Real-time updates
  postCreated: Post!
  postUpdated: Post!
  postDeleted: ID!
  commentCreated: Comment!
  messageReceived: Message!
  notificationReceived: Notification!
  userOnline: User!
  userOffline: User!
}

# Input Types
input RegisterInput {
  username: String!
  email: String!
  password: String!
  firstName: String!
  lastName: String!
}

input LoginInput {
  email: String!
  password: String!
}

input UpdateProfileInput {
  firstName: String
  lastName: String
  bio: String
  location: String
  website: String
  isPrivate: Boolean
}

input CreatePostInput {
  content: String!
  media: [Upload!]
  hashtags: [String!]
  mentions: [ID!]
  location: LocationInput
  isPublic: Boolean
}

input CreateCommentInput {
  postId: ID!
  content: String!
  parentCommentId: ID
  mentions: [ID!]
}

input CreateConversationInput {
  participantIds: [ID!]!
  type: ConversationType!
  name: String
}

input SendMessageInput {
  conversationId: ID!
  content: String!
  messageType: MessageType
  media: Upload
}

input LocationInput {
  latitude: Float!
  longitude: Float!
}

# Enums
enum MediaType {
  IMAGE
  VIDEO
  FILE
}

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  FILE
}

enum ConversationType {
  DIRECT
  GROUP
}

enum NotificationType {
  LIKE
  COMMENT
  FOLLOW
  MENTION
  MESSAGE
  FRIEND_REQUEST
}

# Scalars
scalar DateTime
scalar Upload
```

### GraphQL Resolvers Structure
```typescript
// Resolver organization
const resolvers = {
  Query: {
    me: (_, __, { user }) => userService.getUserById(user.id),
    user: (_, { id }) => userService.getUserById(id),
    users: (_, { search, limit, offset }) => userService.searchUsers(search, limit, offset),
    post: (_, { id }) => postService.getPostById(id),
    posts: (_, { authorId, hashtag, limit, offset }) => postService.getPosts(authorId, hashtag, limit, offset),
    feed: (_, { limit, offset }, { user }) => postService.getFeed(user.id, limit, offset),
    trendingPosts: (_, { limit }) => postService.getTrendingPosts(limit),
    conversations: (_, __, { user }) => messageService.getConversations(user.id),
    notifications: (_, { limit, offset }, { user }) => notificationService.getNotifications(user.id, limit, offset),
    unreadNotificationsCount: (_, __, { user }) => notificationService.getUnreadCount(user.id)
  },
  
  Mutation: {
    register: (_, { input }) => authService.register(input),
    login: (_, { input }) => authService.login(input),
    logout: (_, __, { user }) => authService.logout(user.id),
    updateProfile: (_, { input }, { user }) => userService.updateProfile(user.id, input),
    createPost: (_, { input }, { user }) => postService.createPost(user.id, input),
    likePost: (_, { id }, { user }) => postService.likePost(user.id, id),
    createComment: (_, { input }, { user }) => commentService.createComment(user.id, input),
    sendMessage: (_, { input }, { user }) => messageService.sendMessage(user.id, input)
  },
  
  Subscription: {
    postCreated: {
      subscribe: () => pubsub.asyncIterator(['POST_CREATED'])
    },
    messageReceived: {
      subscribe: (_, __, { user }) => pubsub.asyncIterator([`MESSAGE_RECEIVED_${user.id}`])
    }
  },
  
  User: {
    posts: (parent) => postService.getPostsByUser(parent.id),
    followers: (parent) => userService.getFollowers(parent.id),
    following: (parent) => userService.getFollowing(parent.id)
  },
  
  Post: {
    author: (parent) => userService.getUserById(parent.author),
    comments: (parent) => commentService.getCommentsByPost(parent.id),
    likes: (parent) => userService.getLikedUsers(parent.id)
  }
};
```

---

## 5. Caching Strategy with Redis

### Cache Keys Structure
```javascript
// User cache keys
const userCacheKeys = {
  profile: (userId) => `user:profile:${userId}`,
  stats: (userId) => `user:stats:${userId}`,
  followers: (userId) => `user:followers:${userId}`,
  following: (userId) => `user:following:${userId}`,
  online: (userId) => `user:online:${userId}`,
  session: (sessionId) => `session:${sessionId}`
};

// Post cache keys
const postCacheKeys = {
  post: (postId) => `post:${postId}`,
  feed: (userId) => `feed:${userId}`,
  trending: () => 'posts:trending',
  hashtag: (hashtag) => `hashtag:${hashtag}`,
  userPosts: (userId) => `user:posts:${userId}`,
  likes: (postId) => `post:likes:${postId}`,
  comments: (postId) => `post:comments:${postId}`
};

// Message cache keys
const messageCacheKeys = {
  conversation: (conversationId) => `conversation:${conversationId}`,
  messages: (conversationId) => `messages:${conversationId}`,
  unread: (userId) => `unread:${userId}`
};

// Notification cache keys
const notificationCacheKeys = {
  notifications: (userId) => `notifications:${userId}`,
  unreadCount: (userId) => `unread:count:${userId}`
};
```

### Caching Implementation Strategy

#### 1. User Data Caching
```javascript
// Cache user profile for 1 hour
const getUserProfile = async (userId) => {
  const cacheKey = userCacheKeys.profile(userId);
  let user = await redis.get(cacheKey);
  
  if (!user) {
    user = await User.findById(userId).select('-password');
    await redis.setex(cacheKey, 3600, JSON.stringify(user));
  } else {
    user = JSON.parse(user);
  }
  
  return user;
};

// Cache user stats for 30 minutes
const getUserStats = async (userId) => {
  const cacheKey = userCacheKeys.stats(userId);
  let stats = await redis.get(cacheKey);
  
  if (!stats) {
    stats = await User.aggregate([
      { $match: { _id: userId } },
      { $project: { stats: 1 } }
    ]);
    await redis.setex(cacheKey, 1800, JSON.stringify(stats));
  } else {
    stats = JSON.parse(stats);
  }
  
  return stats;
};
```

#### 2. Post Feed Caching
```javascript
// Cache user feed for 15 minutes
const getUserFeed = async (userId, limit = 20, offset = 0) => {
  const cacheKey = userCacheKeys.feed(userId);
  let feed = await redis.zrange(cacheKey, offset, offset + limit - 1);
  
  if (feed.length === 0) {
    // Generate feed from database
    const following = await getFollowing(userId);
    const posts = await Post.find({
      author: { $in: following },
      isPublic: true
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .populate('author', 'username avatar');
    
    // Cache posts individually
    for (const post of posts) {
      await redis.setex(postCacheKeys.post(post._id), 1800, JSON.stringify(post));
      await redis.zadd(cacheKey, post.createdAt.getTime(), post._id.toString());
    }
    
    await redis.expire(cacheKey, 900); // 15 minutes
    feed = posts.map(p => p._id.toString());
  }
  
  // Fetch cached posts
  const cachedPosts = await Promise.all(
    feed.map(id => redis.get(postCacheKeys.post(id)))
  );
  
  return cachedPosts.filter(Boolean).map(p => JSON.parse(p));
};
```

#### 3. Session Management
```javascript
// Store user session
const storeSession = async (sessionId, userData) => {
  const cacheKey = userCacheKeys.session(sessionId);
  await redis.setex(cacheKey, 86400, JSON.stringify(userData)); // 24 hours
};

// Get user session
const getSession = async (sessionId) => {
  const cacheKey = userCacheKeys.session(sessionId);
  const session = await redis.get(cacheKey);
  return session ? JSON.parse(session) : null;
};

// Invalidate session
const invalidateSession = async (sessionId) => {
  const cacheKey = userCacheKeys.session(sessionId);
  await redis.del(cacheKey);
};
```

#### 4. Real-time Data Caching
```javascript
// Cache online users
const setUserOnline = async (userId) => {
  const cacheKey = userCacheKeys.online(userId);
  await redis.setex(cacheKey, 300, 'online'); // 5 minutes
};

// Get online users
const getOnlineUsers = async (userIds) => {
  const onlineUsers = [];
  for (const userId of userIds) {
    const isOnline = await redis.exists(userCacheKeys.online(userId));
    if (isOnline) {
      onlineUsers.push(userId);
    }
  }
  return onlineUsers;
};
```

#### 5. Cache Invalidation Strategy
```javascript
// Invalidate user cache when profile updated
const invalidateUserCache = async (userId) => {
  const keys = [
    userCacheKeys.profile(userId),
    userCacheKeys.stats(userId),
    userCacheKeys.followers(userId),
    userCacheKeys.following(userId)
  ];
  await redis.del(...keys);
};

// Invalidate post cache when post updated
const invalidatePostCache = async (postId) => {
  const keys = [
    postCacheKeys.post(postId),
    postCacheKeys.likes(postId),
    postCacheKeys.comments(postId)
  ];
  await redis.del(...keys);
  
  // Invalidate feeds that might contain this post
  const feedKeys = await redis.keys('feed:*');
  for (const key of feedKeys) {
    await redis.zrem(key, postId);
  }
};
```

### Cache Configuration
```javascript
// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
};

// Cache TTL settings
const cacheTTL = {
  userProfile: 3600,      // 1 hour
  userStats: 1800,        // 30 minutes
  post: 1800,            // 30 minutes
  feed: 900,             // 15 minutes
  trending: 300,         // 5 minutes
  session: 86400,        // 24 hours
  online: 300            // 5 minutes
};
```

This comprehensive architecture design provides a solid foundation for building a scalable social media platform with all the required features and technical components. 