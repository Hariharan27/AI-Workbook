const redis = require('../config/redis');

// Cache TTL settings
const CACHE_TTL = {
  USER_PROFILE: 3600,      // 1 hour
  USER_STATS: 1800,        // 30 minutes
  POST: 1800,              // 30 minutes
  FEED: 900,               // 15 minutes
  TRENDING: 300,           // 5 minutes
  SESSION: 86400,          // 24 hours
  ONLINE: 300              // 5 minutes
};

// Cache key generators
const cacheKeys = {
  // User cache keys
  userProfile: (userId) => `user:profile:${userId}`,
  userStats: (userId) => `user:stats:${userId}`,
  userFollowers: (userId) => `user:followers:${userId}`,
  userFollowing: (userId) => `user:following:${userId}`,
  userOnline: (userId) => `user:online:${userId}`,
  userSession: (sessionId) => `session:${sessionId}`,
  userSearch: (query) => `user:search:${query}`,
  userRecommendations: (userId) => `user:recommendations:${userId}`,

  // Post cache keys
  post: (postId) => `post:${postId}`,
  feed: (userId) => `feed:${userId}`,
  trending: () => 'posts:trending',
  hashtag: (hashtag) => `hashtag:${hashtag}`,
  userPosts: (userId) => `user:posts:${userId}`,
  postLikes: (postId) => `post:likes:${postId}`,
  postComments: (postId) => `post:comments:${postId}`,
  postSearch: (query) => `post:search:${query}`,
  postRecommendations: (userId) => `post:recommendations:${userId}`,

  // Message cache keys
  conversation: (conversationId) => `conversation:${conversationId}`,
  messages: (conversationId) => `messages:${conversationId}`,
  unread: (userId) => `unread:${userId}`,

  // Notification cache keys
  notifications: (userId) => `notifications:${userId}`,
  unreadCount: (userId) => `unread:count:${userId}`
};

class CacheService {
  // Generic cache operations
  async get(key) {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 1800) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  }

  async exists(key) {
    try {
      return await redis.exists(key);
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // User cache operations
  async getUserProfile(userId) {
    const key = cacheKeys.userProfile(userId);
    return await this.get(key);
  }

  async setUserProfile(userId, profile) {
    const key = cacheKeys.userProfile(userId);
    return await this.set(key, profile, CACHE_TTL.USER_PROFILE);
  }

  async getUserStats(userId) {
    const key = cacheKeys.userStats(userId);
    return await this.get(key);
  }

  async setUserStats(userId, stats) {
    const key = cacheKeys.userStats(userId);
    return await this.set(key, stats, CACHE_TTL.USER_STATS);
  }

  async invalidateUserCache(userId) {
    const keys = [
      cacheKeys.userProfile(userId),
      cacheKeys.userStats(userId),
      cacheKeys.userFollowers(userId),
      cacheKeys.userFollowing(userId)
    ];
    
    for (const key of keys) {
      await this.del(key);
    }
  }

  // Post cache operations
  async getPost(postId) {
    const key = cacheKeys.post(postId);
    return await this.get(key);
  }

  async setPost(postId, post) {
    const key = cacheKeys.post(postId);
    return await this.set(key, post, CACHE_TTL.POST);
  }

  async getUserFeed(userId, limit = 20, offset = 0) {
    const key = cacheKeys.feed(userId);
    try {
      const feed = await redis.zrange(key, offset, offset + limit - 1);
      
      if (feed.length === 0) {
        return null; // Cache miss
      }
      
      // Fetch cached posts
      const cachedPosts = await Promise.all(
        feed.map(id => this.getPost(id))
      );
      
      return cachedPosts.filter(Boolean);
    } catch (error) {
      console.error('Get user feed cache error:', error);
      return null;
    }
  }

  async setUserFeed(userId, posts) {
    const key = cacheKeys.feed(userId);
    try {
      // Cache posts individually
      for (const post of posts) {
        await this.setPost(post._id, post);
        await redis.zadd(key, post.createdAt.getTime(), post._id.toString());
      }
      
      // Set feed cache TTL
      await redis.expire(key, CACHE_TTL.FEED);
      return true;
    } catch (error) {
      console.error('Set user feed cache error:', error);
      return false;
    }
  }

  async addPostToFeeds(postId, authorId, createdAt) {
    try {
      // Get author's followers (this would need to be implemented)
      // For now, we'll just add to trending
      const trendingKey = cacheKeys.trending();
      await redis.zadd(trendingKey, createdAt.getTime(), postId);
      
      // Keep only last 1000 posts in trending
      await redis.zremrangebyrank(trendingKey, 0, -1001);
      
      return true;
    } catch (error) {
      console.error('Add post to feeds cache error:', error);
      return false;
    }
  }

  async removePostFromFeeds(postId) {
    try {
      // Remove from trending
      const trendingKey = cacheKeys.trending();
      await redis.zrem(trendingKey, postId);
      
      // Remove from all user feeds
      const feedKeys = await redis.keys('feed:*');
      for (const key of feedKeys) {
        await redis.zrem(key, postId);
      }
      
      return true;
    } catch (error) {
      console.error('Remove post from feeds cache error:', error);
      return false;
    }
  }

  async invalidateUserFeed(userId) {
    try {
      // Delete all feed cache keys for this user
      const feedKeys = await redis.keys(`feed:${userId}:*`);
      for (const key of feedKeys) {
        await redis.del(key);
      }
      return true;
    } catch (error) {
      console.error('Invalidate user feed cache error:', error);
      return false;
    }
  }

  async invalidateAllFeeds() {
    try {
      // Delete all feed cache keys
      const feedKeys = await redis.keys('feed:*');
      for (const key of feedKeys) {
        await redis.del(key);
      }
      return true;
    } catch (error) {
      console.error('Invalidate all feeds cache error:', error);
      return false;
    }
  }

  async invalidatePostCache(postId) {
    const keys = [
      cacheKeys.post(postId),
      cacheKeys.postLikes(postId),
      cacheKeys.postComments(postId)
    ];
    
    for (const key of keys) {
      await this.del(key);
    }
  }

  // Session cache operations
  async setUserSession(sessionId, userData) {
    const key = cacheKeys.userSession(sessionId);
    return await this.set(key, userData, CACHE_TTL.SESSION);
  }

  async getUserSession(sessionId) {
    const key = cacheKeys.userSession(sessionId);
    return await this.get(key);
  }

  async invalidateSession(sessionId) {
    const key = cacheKeys.userSession(sessionId);
    return await this.del(key);
  }

  // Online status operations
  async setUserOnline(userId) {
    const key = cacheKeys.userOnline(userId);
    return await this.set(key, 'online', CACHE_TTL.ONLINE);
  }

  async isUserOnline(userId) {
    const key = cacheKeys.userOnline(userId);
    return await this.exists(key);
  }

  async getOnlineUsers(userIds) {
    const onlineUsers = [];
    
    for (const userId of userIds) {
      const isOnline = await this.isUserOnline(userId);
      if (isOnline) {
        onlineUsers.push(userId);
      }
    }
    
    return onlineUsers;
  }

  // Search cache operations
  async getSearchResults(query, type) {
    const key = type === 'posts' ? cacheKeys.postSearch(query) : cacheKeys.userSearch(query);
    return await this.get(key);
  }

  async setSearchResults(query, results, type) {
    const key = type === 'posts' ? cacheKeys.postSearch(query) : cacheKeys.userSearch(query);
    return await this.set(key, results, 1800); // 30 minutes for search results
  }

  // Trending posts cache
  async getTrendingPosts() {
    const key = cacheKeys.trending();
    try {
      const postIds = await redis.zrevrange(key, 0, 9); // Get top 10
      const posts = await Promise.all(
        postIds.map(id => this.getPost(id))
      );
      return posts.filter(Boolean);
    } catch (error) {
      console.error('Get trending posts cache error:', error);
      return null;
    }
  }

  async setTrendingPosts(posts) {
    const key = cacheKeys.trending();
    try {
      for (const post of posts) {
        await this.setPost(post._id, post);
        await redis.zadd(key, post.createdAt.getTime(), post._id.toString());
      }
      await redis.expire(key, CACHE_TTL.TRENDING);
      return true;
    } catch (error) {
      console.error('Set trending posts cache error:', error);
      return false;
    }
  }

  // Cache warming utilities
  async warmUserCache(userId) {
    try {
      // This would be called when a user logs in
      // Pre-load their profile, stats, and feed
      console.log(`Warming cache for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Cache warming error:', error);
      return false;
    }
  }

  async warmPostCache(postId) {
    try {
      // This would be called when a post is created
      // Pre-load post data and add to relevant feeds
      console.log(`Warming cache for post: ${postId}`);
      return true;
    } catch (error) {
      console.error('Cache warming error:', error);
      return false;
    }
  }

  // Cache statistics
  async getCacheStats() {
    try {
      const info = await redis.info();
      const keys = await redis.dbsize();
      
      return {
        info,
        totalKeys: keys,
        memory: await redis.memory('usage')
      };
    } catch (error) {
      console.error('Get cache stats error:', error);
      return null;
    }
  }

  // Cache cleanup
  async cleanup() {
    try {
      // Remove expired keys
      // This is handled automatically by Redis
      console.log('Cache cleanup completed');
      return true;
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return false;
    }
  }
}

module.exports = new CacheService(); 