# Caching Strategy with Redis

## Cache Keys Structure

### User Cache Keys
```javascript
const userCacheKeys = {
  // User profile cache
  profile: (userId) => `user:profile:${userId}`,
  
  // User statistics cache
  stats: (userId) => `user:stats:${userId}`,
  
  // User followers cache
  followers: (userId) => `user:followers:${userId}`,
  
  // User following cache
  following: (userId) => `user:following:${userId}`,
  
  // User online status cache
  online: (userId) => `user:online:${userId}`,
  
  // User session cache
  session: (sessionId) => `session:${sessionId}`,
  
  // User search cache
  search: (query) => `user:search:${query}`,
  
  // User recommendations cache
  recommendations: (userId) => `user:recommendations:${userId}`
};
```

### Post Cache Keys
```javascript
const postCacheKeys = {
  // Individual post cache
  post: (postId) => `post:${postId}`,
  
  // User feed cache
  feed: (userId) => `feed:${userId}`,
  
  // Trending posts cache
  trending: () => 'posts:trending',
  
  // Hashtag posts cache
  hashtag: (hashtag) => `hashtag:${hashtag}`,
  
  // User posts cache
  userPosts: (userId) => `user:posts:${userId}`,
  
  // Post likes cache
  likes: (postId) => `post:likes:${postId}`,
  
  // Post comments cache
  comments: (postId) => `post:comments:${postId}`,
  
  // Post search cache
  search: (query) => `post:search:${query}`,
  
  // Post recommendations cache
  recommendations: (userId) => `post:recommendations:${userId}`
};
```

### Message Cache Keys
```javascript
const messageCacheKeys = {
  // Conversation cache
  conversation: (conversationId) => `conversation:${conversationId}`,
  
  // Conversation messages cache
  messages: (conversationId) => `messages:${conversationId}`,
  
  // Unread messages cache
  unread: (userId) => `unread:${userId}`,
  
  // User conversations cache
  userConversations: (userId) => `user:conversations:${userId}`,
  
  // Conversation participants cache
  participants: (conversationId) => `conversation:participants:${conversationId}`
};
```

### Notification Cache Keys
```javascript
const notificationCacheKeys = {
  // User notifications cache
  notifications: (userId) => `notifications:${userId}`,
  
  // Unread notifications count cache
  unreadCount: (userId) => `unread:count:${userId}`,
  
  // Notification settings cache
  settings: (userId) => `notification:settings:${userId}`
};
```

## Caching Implementation Strategy

### 1. User Data Caching

#### User Profile Caching
```javascript
// Cache user profile for 1 hour
const getUserProfile = async (userId) => {
  const cacheKey = userCacheKeys.profile(userId);
  let user = await redis.get(cacheKey);
  
  if (!user) {
    // Fetch from database
    user = await User.findById(userId)
      .select('-password')
      .lean();
    
    if (user) {
      // Cache for 1 hour
      await redis.setex(cacheKey, 3600, JSON.stringify(user));
    }
  } else {
    user = JSON.parse(user);
  }
  
  return user;
};

// Update user profile cache
const updateUserProfileCache = async (userId, userData) => {
  const cacheKey = userCacheKeys.profile(userId);
  await redis.setex(cacheKey, 3600, JSON.stringify(userData));
};

// Invalidate user profile cache
const invalidateUserProfileCache = async (userId) => {
  const cacheKey = userCacheKeys.profile(userId);
  await redis.del(cacheKey);
};
```

#### User Statistics Caching
```javascript
// Cache user statistics for 30 minutes
const getUserStats = async (userId) => {
  const cacheKey = userCacheKeys.stats(userId);
  let stats = await redis.get(cacheKey);
  
  if (!stats) {
    // Calculate stats from database
    const [followersCount, followingCount, postsCount] = await Promise.all([
      Relationship.countDocuments({ following: userId, status: 'accepted' }),
      Relationship.countDocuments({ follower: userId, status: 'accepted' }),
      Post.countDocuments({ author: userId, isPublic: true })
    ]);
    
    stats = { followersCount, followingCount, postsCount };
    await redis.setex(cacheKey, 1800, JSON.stringify(stats));
  } else {
    stats = JSON.parse(stats);
  }
  
  return stats;
};

// Update user stats cache
const updateUserStatsCache = async (userId, stats) => {
  const cacheKey = userCacheKeys.stats(userId);
  await redis.setex(cacheKey, 1800, JSON.stringify(stats));
};
```

#### User Online Status Caching
```javascript
// Set user online status (5 minutes TTL)
const setUserOnline = async (userId) => {
  const cacheKey = userCacheKeys.online(userId);
  await redis.setex(cacheKey, 300, 'online');
};

// Check if user is online
const isUserOnline = async (userId) => {
  const cacheKey = userCacheKeys.online(userId);
  return await redis.exists(cacheKey);
};

// Get online users from a list
const getOnlineUsers = async (userIds) => {
  const onlineUsers = [];
  
  for (const userId of userIds) {
    const isOnline = await isUserOnline(userId);
    if (isOnline) {
      onlineUsers.push(userId);
    }
  }
  
  return onlineUsers;
};
```

### 2. Post Feed Caching

#### User Feed Caching
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
      isPublic: true,
      'moderation.status': 'approved'
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .populate('author', 'username avatar')
    .lean();
    
    // Cache posts individually
    for (const post of posts) {
      await redis.setex(postCacheKeys.post(post._id), 1800, JSON.stringify(post));
      await redis.zadd(cacheKey, post.createdAt.getTime(), post._id.toString());
    }
    
    // Set feed cache TTL
    await redis.expire(cacheKey, 900); // 15 minutes
    feed = posts.map(p => p._id.toString());
  }
  
  // Fetch cached posts
  const cachedPosts = await Promise.all(
    feed.map(id => redis.get(postCacheKeys.post(id)))
  );
  
  return cachedPosts.filter(Boolean).map(p => JSON.parse(p));
};

// Add post to user feeds
const addPostToFeeds = async (postId, authorId, createdAt) => {
  // Get author's followers
  const followers = await getFollowers(authorId);
  
  // Add post to each follower's feed
  for (const follower of followers) {
    const feedKey = userCacheKeys.feed(follower.id);
    await redis.zadd(feedKey, createdAt.getTime(), postId);
    
    // Keep only last 1000 posts in feed
    await redis.zremrangebyrank(feedKey, 0, -1001);
  }
};

// Remove post from feeds
const removePostFromFeeds = async (postId) => {
  // Get all feed keys
  const feedKeys = await redis.keys('feed:*');
  
  // Remove post from all feeds
  for (const key of feedKeys) {
    await redis.zrem(key, postId);
  }
};
```

#### Trending Posts Caching
```javascript
// Cache trending posts for 5 minutes
const getTrendingPosts = async (limit = 10) => {
  const cacheKey = postCacheKeys.trending();
  let trending = await redis.get(cacheKey);
  
  if (!trending) {
    // Calculate trending posts
    const posts = await Post.aggregate([
      { $match: { isPublic: true, 'moderation.status': 'approved' } },
      { $addFields: { 
        score: { 
          $add: [
            { $multiply: ['$stats.likesCount', 2] },
            { $multiply: ['$stats.commentsCount', 3] },
            { $multiply: ['$stats.sharesCount', 4] },
            { $divide: [{ $subtract: [new Date(), '$createdAt'] }, 1000 * 60 * 60] } // hours since creation
          ]
        }
      }},
      { $sort: { score: -1 } },
      { $limit: limit },
      { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
      { $unwind: '$author' },
      { $project: { author: { password: 0 } } }
    ]);
    
    await redis.setex(cacheKey, 300, JSON.stringify(posts));
    trending = posts;
  } else {
    trending = JSON.parse(trending);
  }
  
  return trending;
};
```

### 3. Session Management

#### Session Storage
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

// Update session
const updateSession = async (sessionId, userData) => {
  const cacheKey = userCacheKeys.session(sessionId);
  await redis.setex(cacheKey, 86400, JSON.stringify(userData));
};

// Invalidate session
const invalidateSession = async (sessionId) => {
  const cacheKey = userCacheKeys.session(sessionId);
  await redis.del(cacheKey);
};

// Extend session
const extendSession = async (sessionId) => {
  const session = await getSession(sessionId);
  if (session) {
    await storeSession(sessionId, session);
  }
};
```

### 4. Message Caching

#### Conversation Messages Caching
```javascript
// Cache conversation messages
const getConversationMessages = async (conversationId, limit = 50, offset = 0) => {
  const cacheKey = messageCacheKeys.messages(conversationId);
  let messages = await redis.lrange(cacheKey, offset, offset + limit - 1);
  
  if (messages.length === 0) {
    // Fetch from database
    messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('sender', 'username avatar')
      .lean();
    
    // Cache messages
    for (const message of messages.reverse()) {
      await redis.lpush(cacheKey, JSON.stringify(message));
    }
    
    // Set TTL and limit list size
    await redis.expire(cacheKey, 1800); // 30 minutes
    await redis.ltrim(cacheKey, 0, 999); // Keep only last 1000 messages
  } else {
    messages = messages.map(m => JSON.parse(m));
  }
  
  return messages;
};

// Add message to conversation cache
const addMessageToCache = async (conversationId, message) => {
  const cacheKey = messageCacheKeys.messages(conversationId);
  await redis.lpush(cacheKey, JSON.stringify(message));
  
  // Keep only last 1000 messages
  await redis.ltrim(cacheKey, 0, 999);
};
```

#### Unread Messages Caching
```javascript
// Cache unread messages count
const getUnreadMessagesCount = async (userId) => {
  const cacheKey = messageCacheKeys.unread(userId);
  let count = await redis.get(cacheKey);
  
  if (count === null) {
    // Calculate from database
    count = await Message.countDocuments({
      'readBy.user': { $ne: userId },
      conversation: { $in: await getConversationIds(userId) }
    });
    
    await redis.setex(cacheKey, 300, count.toString()); // 5 minutes
  }
  
  return parseInt(count);
};

// Update unread count
const updateUnreadCount = async (userId, increment = 1) => {
  const cacheKey = messageCacheKeys.unread(userId);
  await redis.incrby(cacheKey, increment);
  await redis.expire(cacheKey, 300);
};
```

### 5. Cache Invalidation Strategy

#### User Cache Invalidation
```javascript
// Invalidate all user-related cache
const invalidateUserCache = async (userId) => {
  const keys = [
    userCacheKeys.profile(userId),
    userCacheKeys.stats(userId),
    userCacheKeys.followers(userId),
    userCacheKeys.following(userId),
    userCacheKeys.recommendations(userId)
  ];
  
  await redis.del(...keys);
  
  // Invalidate user search cache
  const searchKeys = await redis.keys('user:search:*');
  for (const key of searchKeys) {
    await redis.del(key);
  }
};

// Invalidate user feed cache
const invalidateUserFeedCache = async (userId) => {
  const feedKey = userCacheKeys.feed(userId);
  await redis.del(feedKey);
};
```

#### Post Cache Invalidation
```javascript
// Invalidate post-related cache
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
  
  // Invalidate trending posts
  await redis.del(postCacheKeys.trending());
  
  // Invalidate hashtag caches
  const post = await Post.findById(postId);
  if (post && post.hashtags) {
    for (const hashtag of post.hashtags) {
      await redis.del(postCacheKeys.hashtag(hashtag));
    }
  }
};

// Invalidate post search cache
const invalidatePostSearchCache = async () => {
  const searchKeys = await redis.keys('post:search:*');
  for (const key of searchKeys) {
    await redis.del(key);
  }
};
```

### 6. Cache Configuration

#### Redis Configuration
```javascript
// Redis client configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableOfflineQueue: false
};

// Redis cluster configuration (for production)
const redisClusterConfig = {
  clusterRetryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableOfflineQueue: false,
  maxRetriesPerRequest: 3
};
```

#### Cache TTL Settings
```javascript
// Cache TTL configuration
const cacheTTL = {
  // User cache TTLs
  userProfile: 3600,      // 1 hour
  userStats: 1800,        // 30 minutes
  userOnline: 300,        // 5 minutes
  userSession: 86400,     // 24 hours
  userSearch: 1800,       // 30 minutes
  userRecommendations: 3600, // 1 hour
  
  // Post cache TTLs
  post: 1800,            // 30 minutes
  postFeed: 900,         // 15 minutes
  postTrending: 300,     // 5 minutes
  postHashtag: 1800,     // 30 minutes
  postSearch: 1800,      // 30 minutes
  postRecommendations: 3600, // 1 hour
  
  // Message cache TTLs
  conversation: 1800,    // 30 minutes
  messages: 1800,        // 30 minutes
  unreadMessages: 300,   // 5 minutes
  
  // Notification cache TTLs
  notifications: 900,    // 15 minutes
  unreadNotifications: 300, // 5 minutes
  notificationSettings: 3600 // 1 hour
};
```

#### Cache Performance Monitoring
```javascript
// Cache hit/miss monitoring
const cacheMetrics = {
  hits: 0,
  misses: 0,
  
  recordHit: () => {
    cacheMetrics.hits++;
  },
  
  recordMiss: () => {
    cacheMetrics.misses++;
  },
  
  getHitRate: () => {
    const total = cacheMetrics.hits + cacheMetrics.misses;
    return total > 0 ? (cacheMetrics.hits / total) * 100 : 0;
  },
  
  reset: () => {
    cacheMetrics.hits = 0;
    cacheMetrics.misses = 0;
  }
};

// Cache performance middleware
const cachePerformanceMiddleware = async (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`Cache hit rate: ${cacheMetrics.getHitRate().toFixed(2)}%`);
    console.log(`Request duration: ${duration}ms`);
  });
  
  next();
};
```

This comprehensive Redis caching strategy provides efficient data access, reduces database load, and improves application performance for the social media platform. 