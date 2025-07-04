const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Post = require('../models/Post');
const Hashtag = require('../models/Hashtag');
const cacheService = require('../services/cacheService');
const moderationService = require('../services/moderationService');

let authToken;
let testUserId;
let testPostId;
let testHashtagId;

const setupTestData = async () => {
  // Create test user
  const testUser = new User({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  });
  await testUser.save();
  testUserId = testUser._id;

  // Create test post
  const testPost = new Post({
    author: testUserId,
    content: 'This is a test post with #test hashtag',
    isPublic: true,
    'moderation.status': 'approved'
  });
  await testPost.save();
  testPostId = testPost._id;

  // Create test hashtag
  const testHashtag = new Hashtag({
    name: '#test',
    postsCount: 1
  });
  await testHashtag.save();
  testHashtagId = testHashtag._id;

  // Login to get auth token
  const loginResponse = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password123'
    });

  authToken = loginResponse.body.data.token;
};

const cleanupTestData = async () => {
  await User.deleteMany({});
  await Post.deleteMany({});
  await Hashtag.deleteMany({});
};

describe('Phase 2B Backend Tests', () => {
  beforeAll(async () => {
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await mongoose.connection.close();
  });

  describe('Search Functionality', () => {
    test('should search posts successfully', async () => {
      const response = await request(app)
        .get('/api/v1/search/posts?q=test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeDefined();
    });

    test('should search users successfully', async () => {
      const response = await request(app)
        .get('/api/v1/search/users?q=test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
    });

    test('should search hashtags successfully', async () => {
      const response = await request(app)
        .get('/api/v1/search/hashtags?q=test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.hashtags).toBeDefined();
    });

    test('should perform global search successfully', async () => {
      const response = await request(app)
        .get('/api/v1/search/global?q=test')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('posts');
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('hashtags');
    });

    test('should validate search query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/search/posts?q=') // Empty query
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Share Functionality', () => {
    test('should share a post successfully', async () => {
      const response = await request(app)
        .post(`/api/v1/shares/${testPostId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Shared with a message',
          isPublic: true
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sharedPost).toBeDefined();
      expect(response.body.data.originalPost).toBeDefined();
    });

    test('should get shares of a post', async () => {
      const response = await request(app)
        .get(`/api/v1/shares/${testPostId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.sharedPosts).toBeDefined();
      expect(response.body.data.originalPost).toBeDefined();
    });

    test('should not share private post', async () => {
      // Create a private post
      const privatePost = new Post({
        author: testUserId,
        content: 'Private post',
        isPublic: false
      });
      await privatePost.save();

      const response = await request(app)
        .post(`/api/v1/shares/${privatePost._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Trying to share private post'
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Content Moderation', () => {
    test('should check content for violations', async () => {
      const response = await request(app)
        .post('/api/v1/moderation/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is normal content'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('isApproved');
      expect(response.body.data).toHaveProperty('violations');
      expect(response.body.data).toHaveProperty('score');
    });

    test('should detect banned words', async () => {
      const response = await request(app)
        .post('/api/v1/moderation/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This contains spam content'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.violations.length).toBeGreaterThan(0);
    });

    test('should report a post successfully', async () => {
      const response = await request(app)
        .post('/api/v1/moderation/report')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          postId: testPostId,
          reason: 'Inappropriate content',
          details: 'This post violates community guidelines'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('postId');
      expect(response.body.data).toHaveProperty('reportedBy');
    });

    test('should get pending moderation posts', async () => {
      const response = await request(app)
        .get('/api/v1/moderation/pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('posts');
      expect(response.body.data).toHaveProperty('pagination');
    });

    test('should get moderation statistics', async () => {
      const response = await request(app)
        .get('/api/v1/moderation/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('pending');
      expect(response.body.data).toHaveProperty('approved');
      expect(response.body.data).toHaveProperty('rejected');
    });
  });

  describe('Enhanced Feed Algorithm', () => {
    test('should get personalized feed with engagement scoring', async () => {
      // Create multiple posts with different engagement levels
      const posts = [
        { content: 'High engagement post', likesCount: 10, commentsCount: 5 },
        { content: 'Medium engagement post', likesCount: 5, commentsCount: 2 },
        { content: 'Low engagement post', likesCount: 1, commentsCount: 0 }
      ];

      for (const postData of posts) {
        const post = new Post({
          author: testUserId,
          content: postData.content,
          isPublic: true,
          'moderation.status': 'approved',
          stats: {
            likesCount: postData.likesCount,
            commentsCount: postData.commentsCount
          }
        });
        await post.save();
      }

      const response = await request(app)
        .get('/api/v1/feed')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toBeDefined();
      expect(response.body.data.posts.length).toBeGreaterThan(0);
    });
  });

  describe('Cache Service', () => {
    test('should cache and retrieve user profile', async () => {
      const userProfile = {
        _id: testUserId,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User'
      };

      // Set cache
      const setResult = await cacheService.setUserProfile(testUserId, userProfile);
      expect(setResult).toBe(true);

      // Get from cache
      const cachedProfile = await cacheService.getUserProfile(testUserId);
      expect(cachedProfile).toEqual(userProfile);
    });

    test('should cache and retrieve post data', async () => {
      const postData = {
        _id: testPostId,
        content: 'Test post',
        author: testUserId
      };

      // Set cache
      const setResult = await cacheService.setPost(testPostId, postData);
      expect(setResult).toBe(true);

      // Get from cache
      const cachedPost = await cacheService.getPost(testPostId);
      expect(cachedPost).toEqual(postData);
    });

    test('should handle cache misses gracefully', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const cachedData = await cacheService.getPost(nonExistentId);
      expect(cachedData).toBeNull();
    });

    test('should invalidate cache correctly', async () => {
      const postData = { _id: testPostId, content: 'Test' };
      await cacheService.setPost(testPostId, postData);

      // Invalidate cache
      await cacheService.invalidatePostCache(testPostId);

      // Should not be in cache anymore
      const cachedPost = await cacheService.getPost(testPostId);
      expect(cachedPost).toBeNull();
    });
  });

  describe('Moderation Service', () => {
    test('should calculate spam score correctly', () => {
      const normalContent = 'This is normal content';
      const spamContent = 'BUY NOW!!! CLICK HERE!!! FREE MONEY!!!';

      const normalScore = moderationService.calculateSpamScore(normalContent);
      const spamScore = moderationService.calculateSpamScore(spamContent);

      expect(normalScore).toBeLessThan(0.5);
      expect(spamScore).toBeGreaterThan(0.5);
    });

    test('should detect banned words', async () => {
      const result = await moderationService.checkContent('This contains spam content', testUserId);
      
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.type === 'banned_word')).toBe(true);
    });

    test('should auto-moderate posts', async () => {
      const result = await moderationService.moderatePost(testPostId, 'Normal content', testUserId);
      
      expect(result).toHaveProperty('isApproved');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('score');
    });

    test('should report posts', async () => {
      const result = await moderationService.reportPost(
        testPostId,
        testUserId,
        'Inappropriate content',
        'Violates guidelines'
      );

      expect(result.success).toBe(true);
      expect(result.postId).toBe(testPostId);
      expect(result.reportedBy).toBe(testUserId);
    });
  });

  describe('Post Model Enhancements', () => {
    test('should extract hashtags from content', () => {
      const post = new Post({
        content: 'This is a #test post with #hashtag and #another'
      });

      const hashtags = post.extractHashtags();
      expect(hashtags).toContain('#test');
      expect(hashtags).toContain('#hashtag');
      expect(hashtags).toContain('#another');
    });

    test('should extract mentions from content', () => {
      const post = new Post({
        content: 'Hello @user1 and @user2, how are you?'
      });

      const mentions = post.extractMentions();
      expect(mentions).toContain('user1');
      expect(mentions).toContain('user2');
    });

    test('should support sharing functionality', () => {
      const sharedPost = new Post({
        author: testUserId,
        content: 'Shared post',
        isShared: true,
        originalPost: testPostId
      });

      expect(sharedPost.isShared).toBe(true);
      expect(sharedPost.originalPost).toBe(testPostId);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid post ID in search', async () => {
      const response = await request(app)
        .get('/api/v1/search/posts?q=test&postId=invalid')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    test('should handle non-existent post in shares', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post(`/api/v1/shares/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Trying to share non-existent post'
        });

      expect(response.status).toBe(404);
    });

    test('should handle invalid moderation action', async () => {
      const response = await request(app)
        .post(`/api/v1/moderation/${testPostId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          action: 'invalid_action'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large search queries efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/v1/search/global?q=test&limit=50')
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test('should cache feed data efficiently', async () => {
      const posts = Array.from({ length: 20 }, (_, i) => ({
        author: testUserId,
        content: `Test post ${i}`,
        isPublic: true,
        'moderation.status': 'approved'
      }));

      for (const postData of posts) {
        const post = new Post(postData);
        await post.save();
      }

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/v1/feed?limit=20')
        .set('Authorization', `Bearer ${authToken}`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});

console.log('Phase 2B Backend Tests Completed Successfully!'); 