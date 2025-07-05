const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  timeout: 10000
};

// Test data
const testUser = {
  username: 'testuser_' + Date.now(),
  email: `test${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

const testPost = {
  content: 'This is a test post with #test hashtag and @testuser mention',
  isPublic: true
};

let authToken;
let userId;
let postId;
let commentId;
let hashtagId;
let conversationId;
let groupConversationId;
let messageId;

// Helper function to log test results
const logTest = (testName, success, details = '') => {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${testName}`);
  if (details) console.log(`   Details: ${details}`);
  return success;
};

// Helper function to make authenticated requests
const authenticatedRequest = (method, endpoint, data = null) => {
  const req = request(app)[method.toLowerCase()](endpoint);
  if (authToken) {
    req.set('Authorization', `Bearer ${authToken}`);
  }
  if (data) {
    req.send(data);
  }
  return req;
};

// Main test flow
const runAPIFlowTest = async () => {
  console.log('🚀 Starting Comprehensive API Flow Test');
  console.log('==========================================\n');

  let allTestsPassed = true;

  // 1. HEALTH CHECK
  console.log('📋 1. Health Check');
  console.log('-------------------');
  
  try {
    const healthResponse = await request(app).get('/health');
    const healthSuccess = logTest(
      'Health Check',
      healthResponse.status === 200 && healthResponse.body.success,
      `Status: ${healthResponse.status}`
    );
    allTestsPassed = allTestsPassed && healthSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Health Check', false, `Error: ${error.message}`);
  }

  // 2. USER REGISTRATION
  console.log('\n📋 2. User Registration');
  console.log('------------------------');
  
  try {
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    const registerSuccess = logTest(
      'User Registration',
      registerResponse.status === 201 && registerResponse.body.success,
      `Status: ${registerResponse.status}, User: ${testUser.username}`
    );
    allTestsPassed = allTestsPassed && registerSuccess;

    if (registerSuccess && registerResponse.body.data.user) {
      userId = registerResponse.body.data.user._id;
      console.log(`   User ID: ${userId}`);
    }
  } catch (error) {
    allTestsPassed = false;
    logTest('User Registration', false, `Error: ${error.message}`);
  }

  // 3. USER LOGIN
  console.log('\n📋 3. User Login');
  console.log('-----------------');
  
  try {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    const loginSuccess = logTest(
      'User Login',
      loginResponse.status === 200 && loginResponse.body.success,
      `Status: ${loginResponse.status}`
    );
    allTestsPassed = allTestsPassed && loginSuccess;

    if (loginSuccess && loginResponse.body.data.tokens && loginResponse.body.data.tokens.accessToken) {
      authToken = loginResponse.body.data.tokens.accessToken;
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
    }
  } catch (error) {
    allTestsPassed = false;
    logTest('User Login', false, `Error: ${error.message}`);
  }

  // 4. GET USER PROFILE
  console.log('\n📋 4. Get User Profile');
  console.log('----------------------');
  
  try {
    const profileResponse = await authenticatedRequest('GET', `/api/v1/auth/profile`);
    
    const profileSuccess = logTest(
      'Get User Profile',
      profileResponse.status === 200 && profileResponse.body.success,
      `Status: ${profileResponse.status}`
    );
    allTestsPassed = allTestsPassed && profileSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Get User Profile', false, `Error: ${error.message}`);
  }

  // 5. CREATE POST
  console.log('\n📋 5. Create Post');
  console.log('-----------------');
  
  try {
    const postResponse = await authenticatedRequest('POST', '/api/v1/posts', testPost);
    
    const postSuccess = logTest(
      'Create Post',
      postResponse.status === 201 && postResponse.body.success,
      `Status: ${postResponse.status}`
    );
    allTestsPassed = allTestsPassed && postSuccess;

    if (postSuccess && postResponse.body.data.post) {
      postId = postResponse.body.data.post._id;
      console.log(`   Post ID: ${postId}`);
      console.log(`   Content: ${testPost.content}`);
    }
  } catch (error) {
    allTestsPassed = false;
    logTest('Create Post', false, `Error: ${error.message}`);
  }

  // 6. GET SINGLE POST
  console.log('\n📋 6. Get Single Post');
  console.log('---------------------');
  
  try {
    const singlePostResponse = await authenticatedRequest('GET', `/api/v1/posts/${postId}`);
    
    const singlePostSuccess = logTest(
      'Get Single Post',
      singlePostResponse.status === 200 && singlePostResponse.body.success,
      `Status: ${singlePostResponse.status}`
    );
    allTestsPassed = allTestsPassed && singlePostSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Get Single Post', false, `Error: ${error.message}`);
  }

  // 7. GET USER POSTS
  console.log('\n📋 7. Get User Posts');
  console.log('--------------------');
  
  try {
    const userPostsResponse = await authenticatedRequest('GET', `/api/v1/posts/user/${userId}`);
    
    const userPostsSuccess = logTest(
      'Get User Posts',
      userPostsResponse.status === 200 && userPostsResponse.body.success,
      `Status: ${userPostsResponse.status}`
    );
    allTestsPassed = allTestsPassed && userPostsSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Get User Posts', false, `Error: ${error.message}`);
  }

  // 8. GET FEED
  console.log('\n📋 8. Get Feed');
  console.log('--------------');
  
  try {
    const feedResponse = await authenticatedRequest('GET', '/api/v1/feed');
    
    const feedSuccess = logTest(
      'Get Feed',
      feedResponse.status === 200 && feedResponse.body.success,
      `Status: ${feedResponse.status}`
    );
    allTestsPassed = allTestsPassed && feedSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Get Feed', false, `Error: ${error.message}`);
  }

  // 9. LIKE POST
  console.log('\n📋 9. Like Post');
  console.log('---------------');
  
  try {
    const likeResponse = await authenticatedRequest('POST', `/api/v1/likes/${postId}`, {
      type: 'post'
    });
    
    const likeSuccess = logTest(
      'Like Post',
      (likeResponse.status === 200 || likeResponse.status === 201) && likeResponse.body.success,
      `Status: ${likeResponse.status}`
    );
    allTestsPassed = allTestsPassed && likeSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Like Post', false, `Error: ${error.message}`);
  }

  // 10. GET POST LIKES
  console.log('\n📋 10. Get Post Likes');
  console.log('---------------------');
  
  try {
    const likesResponse = await authenticatedRequest('GET', `/api/v1/likes/${postId}?type=post`);
    
    const likesSuccess = logTest(
      'Get Post Likes',
      likesResponse.status === 200 && likesResponse.body.success,
      `Status: ${likesResponse.status}`
    );
    allTestsPassed = allTestsPassed && likesSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Get Post Likes', false, `Error: ${error.message}`);
  }

  // 11. CREATE COMMENT
  console.log('\n📋 11. Create Comment');
  console.log('--------------------');
  
  try {
    const commentResponse = await authenticatedRequest('POST', `/api/v1/comments`, {
      post: postId,
      content: 'This is a test comment!'
    });
    
    const commentSuccess = logTest(
      'Create Comment',
      commentResponse.status === 201 && commentResponse.body.success,
      `Status: ${commentResponse.status}`
    );
    allTestsPassed = allTestsPassed && commentSuccess;

    if (commentSuccess && commentResponse.body.data.comment) {
      commentId = commentResponse.body.data.comment._id;
      console.log(`   Comment ID: ${commentId}`);
    }
  } catch (error) {
    allTestsPassed = false;
    logTest('Create Comment', false, `Error: ${error.message}`);
  }

  // 12. GET POST COMMENTS
  console.log('\n📋 12. Get Post Comments');
  console.log('------------------------');
  
  try {
    const commentsResponse = await authenticatedRequest('GET', `/api/v1/comments?post=${postId}`);
    
    const commentsSuccess = logTest(
      'Get Post Comments',
      commentsResponse.status === 200 && commentsResponse.body.success,
      `Status: ${commentsResponse.status}`
    );
    allTestsPassed = allTestsPassed && commentsSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Get Post Comments', false, `Error: ${error.message}`);
  }

  // 13. SEARCH POSTS
  console.log('\n📋 13. Search Posts');
  console.log('-------------------');
  
  try {
    const searchResponse = await authenticatedRequest('GET', '/api/v1/search/posts?q=test');
    
    const searchSuccess = logTest(
      'Search Posts',
      searchResponse.status === 200 && searchResponse.body.success,
      `Status: ${searchResponse.status}`
    );
    allTestsPassed = allTestsPassed && searchSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Search Posts', false, `Error: ${error.message}`);
  }

  // 14. SEARCH USERS
  console.log('\n📋 14. Search Users');
  console.log('-------------------');
  
  try {
    const userSearchResponse = await authenticatedRequest('GET', '/api/v1/search/users?q=test');
    
    const userSearchSuccess = logTest(
      'Search Users',
      userSearchResponse.status === 200 && userSearchResponse.body.success,
      `Status: ${userSearchResponse.status}`
    );
    allTestsPassed = allTestsPassed && userSearchSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Search Users', false, `Error: ${error.message}`);
  }

  // 15. SEARCH HASHTAGS
  console.log('\n📋 15. Search Hashtags');
  console.log('----------------------');
  
  try {
    const hashtagSearchResponse = await authenticatedRequest('GET', '/api/v1/search/hashtags?q=test');
    
    const hashtagSearchSuccess = logTest(
      'Search Hashtags',
      hashtagSearchResponse.status === 200 && hashtagSearchResponse.body.success,
      `Status: ${hashtagSearchResponse.status}`
    );
    allTestsPassed = allTestsPassed && hashtagSearchSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Search Hashtags', false, `Error: ${error.message}`);
  }

  // 16. GET TRENDING HASHTAGS
  console.log('\n📋 16. Get Trending Hashtags');
  console.log('----------------------------');
  
  try {
    const trendingResponse = await authenticatedRequest('GET', '/api/v1/hashtags/trending');
    
    const trendingSuccess = logTest(
      'Get Trending Hashtags',
      trendingResponse.status === 200 && trendingResponse.body.success,
      `Status: ${trendingResponse.status}`
    );
    allTestsPassed = allTestsPassed && trendingSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Get Trending Hashtags', false, `Error: ${error.message}`);
  }

  // 17. SHARE POST
  console.log('\n📋 17. Share Post');
  console.log('-----------------');
  
  try {
    const shareResponse = await authenticatedRequest('POST', `/api/v1/shares/${postId}`, {
      message: 'Shared with a test message',
      isPublic: true
    });
    
    const shareSuccess = logTest(
      'Share Post',
      shareResponse.status === 201 && shareResponse.body.success,
      `Status: ${shareResponse.status}`
    );
    allTestsPassed = allTestsPassed && shareSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Share Post', false, `Error: ${error.message}`);
  }

  // 18. GET POST SHARES
  console.log('\n📋 18. Get Post Shares');
  console.log('----------------------');
  
  try {
    const sharesResponse = await authenticatedRequest('GET', `/api/v1/shares/${postId}`);
    
    const sharesSuccess = logTest(
      'Get Post Shares',
      sharesResponse.status === 200 && sharesResponse.body.success,
      `Status: ${sharesResponse.status}`
    );
    allTestsPassed = allTestsPassed && sharesSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Get Post Shares', false, `Error: ${error.message}`);
  }

  // 19. CONTENT MODERATION CHECK
  console.log('\n📋 19. Content Moderation Check');
  console.log('-----------------------------');
  
  try {
    const moderationResponse = await authenticatedRequest('POST', '/api/v1/moderation/check', {
      content: 'This is normal content for testing moderation functionality'
    });
    
    const moderationSuccess = logTest(
      'Content Moderation Check',
      moderationResponse.status === 200 && moderationResponse.body.success,
      `Status: ${moderationResponse.status}`
    );
    allTestsPassed = allTestsPassed && moderationSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Content Moderation Check', false, `Error: ${error.message}`);
  }

  // 20. REPORT POST
  console.log('\n📋 20. Report Post');
  console.log('------------------');
  
  try {
    const reportResponse = await authenticatedRequest('POST', '/api/v1/moderation/report', {
      postId: postId,
      reason: 'Test reporting functionality',
      details: 'This is a test report for API testing'
    });
    
    const reportSuccess = logTest(
      'Report Post',
      reportResponse.status === 200 && reportResponse.body.success,
      `Status: ${reportResponse.status}`
    );
    allTestsPassed = allTestsPassed && reportSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Report Post', false, `Error: ${error.message}`);
  }

  // 21. UPDATE POST
  console.log('\n📋 21. Update Post');
  console.log('------------------');
  
  try {
    const updateResponse = await authenticatedRequest('PUT', `/api/v1/posts/${postId}`, {
      content: 'This is an updated test post with #updated hashtag',
      isPublic: true
    });
    
    const updateSuccess = logTest(
      'Update Post',
      updateResponse.status === 200 && updateResponse.body.success,
      `Status: ${updateResponse.status}`
    );
    allTestsPassed = allTestsPassed && updateSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Update Post', false, `Error: ${error.message}`);
  }

  // 22. UPDATE COMMENT
  console.log('\n📋 22. Update Comment');
  console.log('--------------------');
  
  try {
    const commentUpdateResponse = await authenticatedRequest('PUT', `/api/v1/comments/${commentId}`, {
      content: 'This is an updated test comment!'
    });
    
    const commentUpdateSuccess = logTest(
      'Update Comment',
      commentUpdateResponse.status === 200 && commentUpdateResponse.body.success,
      `Status: ${commentUpdateResponse.status}`
    );
    allTestsPassed = allTestsPassed && commentUpdateSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Update Comment', false, `Error: ${error.message}`);
  }

  // 23. LIKE COMMENT
  console.log('\n📋 23. Like Comment');
  console.log('-------------------');
  
  try {
    const commentLikeResponse = await authenticatedRequest('POST', `/api/v1/likes/${commentId}`, {
      type: 'comment'
    });
    
    const commentLikeSuccess = logTest(
      'Like Comment',
      (commentLikeResponse.status === 200 || commentLikeResponse.status === 201) && commentLikeResponse.body.success,
      `Status: ${commentLikeResponse.status}`
    );
    allTestsPassed = allTestsPassed && commentLikeSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Like Comment', false, `Error: ${error.message}`);
  }

  // 24. GET USER LIKES
  console.log('\n📋 24. Get User Likes');
  console.log('--------------------');
  
  try {
    const userLikesResponse = await authenticatedRequest('GET', `/api/v1/likes/user/${userId}`);
    
    const userLikesSuccess = logTest(
      'Get User Likes',
      userLikesResponse.status === 200 && userLikesResponse.body.success,
      `Status: ${userLikesResponse.status}`
    );
    allTestsPassed = allTestsPassed && userLikesSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Get User Likes', false, `Error: ${error.message}`);
  }

  // 25. GLOBAL SEARCH
  console.log('\n📋 25. Global Search');
  console.log('-------------------');
  
  try {
    const globalSearchResponse = await authenticatedRequest('GET', '/api/v1/search/global?q=test');
    
    const globalSearchSuccess = logTest(
      'Global Search',
      globalSearchResponse.status === 200 && globalSearchResponse.body.success,
      `Status: ${globalSearchResponse.status}`
    );
    allTestsPassed = allTestsPassed && globalSearchSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Global Search', false, `Error: ${error.message}`);
  }

  // 26. GET MODERATION STATS
  console.log('\n📋 26. Get Moderation Stats');
  console.log('---------------------------');
  
  try {
    const modStatsResponse = await authenticatedRequest('GET', '/api/v1/moderation/stats');
    
    const modStatsSuccess = logTest(
      'Get Moderation Stats',
      modStatsResponse.status === 200 && modStatsResponse.body.success,
      `Status: ${modStatsResponse.status}`
    );
    allTestsPassed = allTestsPassed && modStatsSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Get Moderation Stats', false, `Error: ${error.message}`);
  }

  // 27. DELETE COMMENT
  console.log('\n📋 27. Delete Comment');
  console.log('--------------------');
  
  try {
    const deleteCommentResponse = await authenticatedRequest('DELETE', `/api/v1/comments/${commentId}`);
    
    const deleteCommentSuccess = logTest(
      'Delete Comment',
      deleteCommentResponse.status === 200 && deleteCommentResponse.body.success,
      `Status: ${deleteCommentResponse.status}`
    );
    allTestsPassed = allTestsPassed && deleteCommentSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Delete Comment', false, `Error: ${error.message}`);
  }

  // 28. DELETE POST
  console.log('\n📋 28. Delete Post');
  console.log('------------------');
  
  try {
    const deletePostResponse = await authenticatedRequest('DELETE', `/api/v1/posts/${postId}`);
    
    const deletePostSuccess = logTest(
      'Delete Post',
      deletePostResponse.status === 200 && deletePostResponse.body.success,
      `Status: ${deletePostResponse.status}`
    );
    allTestsPassed = allTestsPassed && deletePostSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Delete Post', false, `Error: ${error.message}`);
  }

  // 29. GET CONVERSATIONS
  console.log('\n📋 29. Get Conversations');
  console.log('------------------------');
  
  try {
    const conversationsResponse = await authenticatedRequest('GET', '/api/v1/messages/conversations');
    
    const conversationsSuccess = logTest(
      'Get Conversations',
      conversationsResponse.status === 200 && conversationsResponse.body.success,
      `Status: ${conversationsResponse.status}`
    );
    allTestsPassed = allTestsPassed && conversationsSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('Get Conversations', false, `Error: ${error.message}`);
  }

  // 30. CREATE DIRECT CONVERSATION
  console.log('\n📋 30. Create Direct Conversation');
  console.log('----------------------------------');
  
  try {
    // First, we need another user to create a conversation with
    // For testing, we'll create a second user
    const secondUser = {
      username: 'testuser2_' + Date.now(),
      email: `test2${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test2',
      lastName: 'User2'
    };

    // Register second user
    const secondUserRegisterResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(secondUser);

    let secondUserId;
    if (secondUserRegisterResponse.status === 201) {
      secondUserId = secondUserRegisterResponse.body.data.user._id;
    } else {
      // If registration fails (e.g., user exists), try to get user ID from database
      const User = require('../models/User');
      const existingUser = await User.findOne({ email: secondUser.email });
      secondUserId = existingUser?._id;
    }

    if (secondUserId) {
      const directConversationResponse = await authenticatedRequest('POST', '/api/v1/messages/conversations/direct', {
        participantId: secondUserId
      });
      
      const directConversationSuccess = logTest(
        'Create Direct Conversation',
        directConversationResponse.status === 200 && directConversationResponse.body.success,
        `Status: ${directConversationResponse.status}`
      );
      allTestsPassed = allTestsPassed && directConversationSuccess;

      if (directConversationSuccess && directConversationResponse.body.data.conversation) {
        conversationId = directConversationResponse.body.data.conversation._id;
        console.log(`   Conversation ID: ${conversationId}`);
      }
    } else {
      logTest('Create Direct Conversation', false, 'Could not create or find second user');
      allTestsPassed = false;
    }
  } catch (error) {
    allTestsPassed = false;
    logTest('Create Direct Conversation', false, `Error: ${error.message}`);
  }

  // 31. CREATE GROUP CONVERSATION
  console.log('\n📋 31. Create Group Conversation');
  console.log('--------------------------------');
  
  try {
    // Get a few users for group conversation
    const User = require('../models/User');
    const users = await User.find({}).limit(3);
    
    if (users.length >= 2) {
      const participantIds = users.map(u => u._id.toString()).filter(id => id !== userId);
      
      const groupConversationResponse = await authenticatedRequest('POST', '/api/v1/messages/conversations/group', {
        participants: participantIds,
        name: 'Test Group Chat',
        description: 'A test group conversation'
      });
      
      const groupConversationSuccess = logTest(
        'Create Group Conversation',
        groupConversationResponse.status === 201 && groupConversationResponse.body.success,
        `Status: ${groupConversationResponse.status}`
      );
      allTestsPassed = allTestsPassed && groupConversationSuccess;

      if (groupConversationSuccess && groupConversationResponse.body.data.conversation) {
        groupConversationId = groupConversationResponse.body.data.conversation._id;
        console.log(`   Group Conversation ID: ${groupConversationId}`);
      }
    } else {
      logTest('Create Group Conversation', false, 'Not enough users for group conversation');
      allTestsPassed = false;
    }
  } catch (error) {
    allTestsPassed = false;
    logTest('Create Group Conversation', false, `Error: ${error.message}`);
  }

  // 32. GET CONVERSATION WITH MESSAGES
  console.log('\n📋 32. Get Conversation with Messages');
  console.log('-------------------------------------');
  
  try {
    if (conversationId) {
      const conversationResponse = await authenticatedRequest('GET', `/api/v1/messages/conversations/${conversationId}`);
      
      const conversationSuccess = logTest(
        'Get Conversation with Messages',
        conversationResponse.status === 200 && conversationResponse.body.success,
        `Status: ${conversationResponse.status}`
      );
      allTestsPassed = allTestsPassed && conversationSuccess;
    } else {
      logTest('Get Conversation with Messages', false, 'No conversation ID available');
      allTestsPassed = false;
    }
  } catch (error) {
    allTestsPassed = false;
    logTest('Get Conversation with Messages', false, `Error: ${error.message}`);
  }

  // 33. SEND MESSAGE
  console.log('\n📋 33. Send Message');
  console.log('-------------------');
  
  try {
    if (conversationId) {
      const sendMessageResponse = await authenticatedRequest('POST', `/api/v1/messages/conversations/${conversationId}/messages`, {
        content: 'Hello! This is a test message from the API flow test.',
        messageType: 'text'
      });
      
      const sendMessageSuccess = logTest(
        'Send Message',
        sendMessageResponse.status === 201 && sendMessageResponse.body.success,
        `Status: ${sendMessageResponse.status}`
      );
      allTestsPassed = allTestsPassed && sendMessageSuccess;

      if (sendMessageSuccess && sendMessageResponse.body.data.message) {
        messageId = sendMessageResponse.body.data.message._id;
        console.log(`   Message ID: ${messageId}`);
      }
    } else {
      logTest('Send Message', false, 'No conversation ID available');
      allTestsPassed = false;
    }
  } catch (error) {
    allTestsPassed = false;
    logTest('Send Message', false, `Error: ${error.message}`);
  }

  // 34. SEND GROUP MESSAGE
  console.log('\n📋 34. Send Group Message');
  console.log('-------------------------');
  
  try {
    if (groupConversationId) {
      const groupMessageResponse = await authenticatedRequest('POST', `/api/v1/messages/conversations/${groupConversationId}/messages`, {
        content: 'Hello everyone! This is a test group message.',
        messageType: 'text'
      });
      
      const groupMessageSuccess = logTest(
        'Send Group Message',
        groupMessageResponse.status === 201 && groupMessageResponse.body.success,
        `Status: ${groupMessageResponse.status}`
      );
      allTestsPassed = allTestsPassed && groupMessageSuccess;
    } else {
      logTest('Send Group Message', false, 'No group conversation ID available');
      allTestsPassed = false;
    }
  } catch (error) {
    allTestsPassed = false;
    logTest('Send Group Message', false, `Error: ${error.message}`);
  }

  // 35. MARK MESSAGES AS READ
  console.log('\n📋 35. Mark Messages as Read');
  console.log('----------------------------');
  
  try {
    if (conversationId && messageId) {
      const markReadResponse = await authenticatedRequest('PUT', `/api/v1/messages/conversations/${conversationId}/messages/read`, {
        messageIds: [messageId]
      });
      
      const markReadSuccess = logTest(
        'Mark Messages as Read',
        markReadResponse.status === 200 && markReadResponse.body.success,
        `Status: ${markReadResponse.status}`
      );
      allTestsPassed = allTestsPassed && markReadSuccess;
    } else {
      logTest('Mark Messages as Read', false, 'No conversation or message ID available');
      allTestsPassed = false;
    }
  } catch (error) {
    allTestsPassed = false;
    logTest('Mark Messages as Read', false, `Error: ${error.message}`);
  }

  // 36. TOGGLE CONVERSATION MUTE
  console.log('\n📋 36. Toggle Conversation Mute');
  console.log('-------------------------------');
  
  try {
    if (conversationId) {
      const muteResponse = await authenticatedRequest('PUT', `/api/v1/messages/conversations/${conversationId}/mute`);
      
      const muteSuccess = logTest(
        'Toggle Conversation Mute',
        muteResponse.status === 200 && muteResponse.body.success,
        `Status: ${muteResponse.status}`
      );
      allTestsPassed = allTestsPassed && muteSuccess;
    } else {
      logTest('Toggle Conversation Mute', false, 'No conversation ID available');
      allTestsPassed = false;
    }
  } catch (error) {
    allTestsPassed = false;
    logTest('Toggle Conversation Mute', false, `Error: ${error.message}`);
  }

  // 37. ARCHIVE CONVERSATION
  console.log('\n📋 37. Archive Conversation');
  console.log('----------------------------');
  
  try {
    if (conversationId) {
      const archiveResponse = await authenticatedRequest('PUT', `/api/v1/messages/conversations/${conversationId}/archive`);
      
      const archiveSuccess = logTest(
        'Archive Conversation',
        archiveResponse.status === 200 && archiveResponse.body.success,
        `Status: ${archiveResponse.status}`
      );
      allTestsPassed = allTestsPassed && archiveSuccess;
    } else {
      logTest('Archive Conversation', false, 'No conversation ID available');
      allTestsPassed = false;
    }
  } catch (error) {
    allTestsPassed = false;
    logTest('Archive Conversation', false, `Error: ${error.message}`);
  }

  // 38. DELETE MESSAGE
  console.log('\n📋 38. Delete Message');
  console.log('--------------------');
  
  try {
    if (messageId) {
      const deleteMessageResponse = await authenticatedRequest('DELETE', `/api/v1/messages/${messageId}`);
      
      const deleteMessageSuccess = logTest(
        'Delete Message',
        deleteMessageResponse.status === 200 && deleteMessageResponse.body.success,
        `Status: ${deleteMessageResponse.status}`
      );
      allTestsPassed = allTestsPassed && deleteMessageSuccess;
    } else {
      logTest('Delete Message', false, 'No message ID available');
      allTestsPassed = false;
    }
  } catch (error) {
    allTestsPassed = false;
    logTest('Delete Message', false, `Error: ${error.message}`);
  }

  // 39. USER LOGOUT
  console.log('\n📋 39. User Logout');
  console.log('-------------------');
  
  try {
    const logoutResponse = await authenticatedRequest('POST', '/api/v1/auth/logout');
    
    const logoutSuccess = logTest(
      'User Logout',
      logoutResponse.status === 200 && logoutResponse.body.success,
      `Status: ${logoutResponse.status}`
    );
    allTestsPassed = allTestsPassed && logoutSuccess;
  } catch (error) {
    allTestsPassed = false;
    logTest('User Logout', false, `Error: ${error.message}`);
  }

  // Final Results
  console.log('\n==========================================');
  console.log('🎯 FINAL TEST RESULTS');
  console.log('==========================================');
  
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('🎉 API Flow Test Completed Successfully');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('🔧 Please check the failed tests above');
  }

  console.log('\n📊 Test Summary:');
  console.log(`   - Total API Endpoints Tested: 39`);
  console.log(`   - Test User: ${testUser.username}`);
  console.log(`   - Test Email: ${testUser.email}`);
  console.log(`   - Authentication: ${authToken ? '✅ Working' : '❌ Failed'}`);
  console.log(`   - Post Creation: ${postId ? '✅ Working' : '❌ Failed'}`);
  console.log(`   - Comment System: ${commentId ? '✅ Working' : '❌ Failed'}`);
  console.log(`   - Messaging System: ${conversationId ? '✅ Working' : '❌ Failed'}`);

  return allTestsPassed;
};

// Run the test if this file is executed directly
if (require.main === module) {
  runAPIFlowTest()
    .then((success) => {
      if (success) {
        console.log('\n🚀 All APIs are working correctly!');
        process.exit(0);
      } else {
        console.log('\n⚠️ Some APIs need attention.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runAPIFlowTest }; 