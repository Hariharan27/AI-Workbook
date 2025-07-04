const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'test@ideatorpechu.com',
  password: 'TestPassword123!',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User'
};

let authToken = null;
let refreshToken = null;
let testUserId = null;
let testPostId = null;
let testCommentId = null;
let testHashtagId = null;

// Test utilities
const log = (message, data = null) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔍 ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log(`${'='.repeat(60)}`);
};

const testEndpoint = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
};

// Test categories
const authTests = async () => {
  log('🧪 TESTING AUTHENTICATION ENDPOINTS');

  // Test 1: Register new user
  log('1. Testing user registration');
  const registerResult = await testEndpoint('POST', '/api/v1/auth/register', TEST_USER);
  console.log('Register result:', registerResult.success ? '✅ PASS' : '❌ FAIL');
  if (!registerResult.success) {
    console.log('Error:', registerResult.error);
  }

  // Test 2: Login
  log('2. Testing user login');
  const loginResult = await testEndpoint('POST', '/api/v1/auth/login', {
    email: TEST_USER.email,
    password: TEST_USER.password
  });
  console.log('Login result:', loginResult.success ? '✅ PASS' : '❌ FAIL');
  if (loginResult.success) {
    authToken = loginResult.data.token;
    refreshToken = loginResult.data.refreshToken;
    testUserId = loginResult.data.user._id;
    console.log('✅ Auth tokens obtained');
  } else {
    console.log('Error:', loginResult.error);
  }

  // Test 3: Get profile
  log('3. Testing get profile');
  const profileResult = await testEndpoint('GET', '/api/v1/auth/profile', null, authToken);
  console.log('Profile result:', profileResult.success ? '✅ PASS' : '❌ FAIL');
  if (!profileResult.success) {
    console.log('Error:', profileResult.error);
  }

  // Test 4: Refresh token
  log('4. Testing token refresh');
  const refreshResult = await testEndpoint('POST', '/api/v1/auth/refresh-token', {
    refreshToken
  });
  console.log('Refresh result:', refreshResult.success ? '✅ PASS' : '❌ FAIL');
  if (refreshResult.success) {
    authToken = refreshResult.data.token;
    console.log('✅ Token refreshed');
  } else {
    console.log('Error:', refreshResult.error);
  }
};

const postTests = async () => {
  log('📝 TESTING POST ENDPOINTS');

  if (!authToken) {
    console.log('❌ No auth token available, skipping post tests');
    return;
  }

  // Test 1: Create post
  log('1. Testing create post');
  const createPostData = {
    content: 'Hello IdeatorPechu! This is a test post with #testing #socialmedia hashtags! 🚀',
    isPublic: true
  };
  const createPostResult = await testEndpoint('POST', '/api/v1/posts', createPostData, authToken);
  console.log('Create post result:', createPostResult.success ? '✅ PASS' : '❌ FAIL');
  if (createPostResult.success) {
    testPostId = createPostResult.data.post._id;
    console.log('✅ Post created with ID:', testPostId);
  } else {
    console.log('Error:', createPostResult.error);
  }

  // Test 2: Get all posts (feed)
  log('2. Testing get feed');
  const feedResult = await testEndpoint('GET', '/api/v1/posts', null, authToken);
  console.log('Feed result:', feedResult.success ? '✅ PASS' : '❌ FAIL');
  if (!feedResult.success) {
    console.log('Error:', feedResult.error);
  }

  // Test 3: Get post by ID
  if (testPostId) {
    log('3. Testing get post by ID');
    const getPostResult = await testEndpoint('GET', `/api/v1/posts/${testPostId}`, null, authToken);
    console.log('Get post result:', getPostResult.success ? '✅ PASS' : '❌ FAIL');
    if (!getPostResult.success) {
      console.log('Error:', getPostResult.error);
    }
  }

  // Test 4: Update post
  if (testPostId) {
    log('4. Testing update post');
    const updatePostData = {
      content: 'Updated test post content! #updated #testing'
    };
    const updatePostResult = await testEndpoint('PUT', `/api/v1/posts/${testPostId}`, updatePostData, authToken);
    console.log('Update post result:', updatePostResult.success ? '✅ PASS' : '❌ FAIL');
    if (!updatePostResult.success) {
      console.log('Error:', updatePostResult.error);
    }
  }

  // Test 5: Get user posts
  log('5. Testing get user posts');
  const userPostsResult = await testEndpoint('GET', `/api/v1/posts/user/${testUserId}`, null, authToken);
  console.log('User posts result:', userPostsResult.success ? '✅ PASS' : '❌ FAIL');
  if (!userPostsResult.success) {
    console.log('Error:', userPostsResult.error);
  }
};

const commentTests = async () => {
  log('💬 TESTING COMMENT ENDPOINTS');

  if (!authToken || !testPostId) {
    console.log('❌ No auth token or post ID available, skipping comment tests');
    return;
  }

  // Test 1: Create comment
  log('1. Testing create comment');
  const createCommentData = {
    content: 'This is a test comment! Great post! 👍',
    postId: testPostId
  };
  const createCommentResult = await testEndpoint('POST', '/comments', createCommentData, authToken);
  console.log('Create comment result:', createCommentResult.success ? '✅ PASS' : '❌ FAIL');
  if (createCommentResult.success) {
    testCommentId = createCommentResult.data.comment._id;
    console.log('✅ Comment created with ID:', testCommentId);
  } else {
    console.log('Error:', createCommentResult.error);
  }

  // Test 2: Get post comments
  log('2. Testing get post comments');
  const postCommentsResult = await testEndpoint('GET', `/comments/post/${testPostId}`, null, authToken);
  console.log('Post comments result:', postCommentsResult.success ? '✅ PASS' : '❌ FAIL');
  if (!postCommentsResult.success) {
    console.log('Error:', postCommentsResult.error);
  }

  // Test 3: Get comment by ID
  if (testCommentId) {
    log('3. Testing get comment by ID');
    const getCommentResult = await testEndpoint('GET', `/comments/${testCommentId}`, null, authToken);
    console.log('Get comment result:', getCommentResult.success ? '✅ PASS' : '❌ FAIL');
    if (!getCommentResult.success) {
      console.log('Error:', getCommentResult.error);
    }
  }

  // Test 4: Update comment
  if (testCommentId) {
    log('4. Testing update comment');
    const updateCommentData = {
      content: 'Updated test comment content!'
    };
    const updateCommentResult = await testEndpoint('PUT', `/comments/${testCommentId}`, updateCommentData, authToken);
    console.log('Update comment result:', updateCommentResult.success ? '✅ PASS' : '❌ FAIL');
    if (!updateCommentResult.success) {
      console.log('Error:', updateCommentResult.error);
    }
  }

  // Test 5: Get user comments
  log('5. Testing get user comments');
  const userCommentsResult = await testEndpoint('GET', `/comments/user/${testUserId}`, null, authToken);
  console.log('User comments result:', userCommentsResult.success ? '✅ PASS' : '❌ FAIL');
  if (!userCommentsResult.success) {
    console.log('Error:', userCommentsResult.error);
  }
};

const likeTests = async () => {
  log('❤️ TESTING LIKE ENDPOINTS');

  if (!authToken || !testPostId) {
    console.log('❌ No auth token or post ID available, skipping like tests');
    return;
  }

  // Test 1: Like post
  log('1. Testing like post');
  const likePostData = {
    postId: testPostId,
    type: 'post'
  };
  const likePostResult = await testEndpoint('POST', '/likes', likePostData, authToken);
  console.log('Like post result:', likePostResult.success ? '✅ PASS' : '❌ FAIL');
  if (!likePostResult.success) {
    console.log('Error:', likePostResult.error);
  }

  // Test 2: Get post likes
  log('2. Testing get post likes');
  const postLikesResult = await testEndpoint('GET', `/likes/post/${testPostId}`, null, authToken);
  console.log('Post likes result:', postLikesResult.success ? '✅ PASS' : '❌ FAIL');
  if (!postLikesResult.success) {
    console.log('Error:', postLikesResult.error);
  }

  // Test 3: Unlike post
  log('3. Testing unlike post');
  const unlikePostResult = await testEndpoint('DELETE', `/likes/post/${testPostId}`, null, authToken);
  console.log('Unlike post result:', unlikePostResult.success ? '✅ PASS' : '❌ FAIL');
  if (!unlikePostResult.success) {
    console.log('Error:', unlikePostResult.error);
  }

  // Test 4: Like comment (if comment exists)
  if (testCommentId) {
    log('4. Testing like comment');
    const likeCommentData = {
      commentId: testCommentId,
      type: 'comment'
    };
    const likeCommentResult = await testEndpoint('POST', '/likes', likeCommentData, authToken);
    console.log('Like comment result:', likeCommentResult.success ? '✅ PASS' : '❌ FAIL');
    if (!likeCommentResult.success) {
      console.log('Error:', likeCommentResult.error);
    }
  }

  // Test 5: Get user likes
  log('5. Testing get user likes');
  const userLikesResult = await testEndpoint('GET', `/likes/user/${testUserId}`, null, authToken);
  console.log('User likes result:', userLikesResult.success ? '✅ PASS' : '❌ FAIL');
  if (!userLikesResult.success) {
    console.log('Error:', userLikesResult.error);
  }
};

const hashtagTests = async () => {
  log('🏷️ TESTING HASHTAG ENDPOINTS');

  // Test 1: Get trending hashtags
  log('1. Testing get trending hashtags');
  const trendingResult = await testEndpoint('GET', '/hashtags/trending');
  console.log('Trending hashtags result:', trendingResult.success ? '✅ PASS' : '❌ FAIL');
  if (!trendingResult.success) {
    console.log('Error:', trendingResult.error);
  }

  // Test 2: Search hashtags
  log('2. Testing search hashtags');
  const searchResult = await testEndpoint('GET', '/hashtags/search?q=test');
  console.log('Search hashtags result:', searchResult.success ? '✅ PASS' : '❌ FAIL');
  if (!searchResult.success) {
    console.log('Error:', searchResult.error);
  }

  // Test 3: Get hashtag by name
  log('3. Testing get hashtag by name');
  const hashtagResult = await testEndpoint('GET', '/hashtags/name/testing');
  console.log('Get hashtag result:', hashtagResult.success ? '✅ PASS' : '❌ FAIL');
  if (hashtagResult.success) {
    testHashtagId = hashtagResult.data.hashtag._id;
    console.log('✅ Hashtag found with ID:', testHashtagId);
  } else {
    console.log('Error:', hashtagResult.error);
  }

  // Test 4: Get hashtag posts (if hashtag exists)
  if (testHashtagId) {
    log('4. Testing get hashtag posts');
    const hashtagPostsResult = await testEndpoint('GET', `/hashtags/${testHashtagId}/posts`, null, authToken);
    console.log('Hashtag posts result:', hashtagPostsResult.success ? '✅ PASS' : '❌ FAIL');
    if (!hashtagPostsResult.success) {
      console.log('Error:', hashtagPostsResult.error);
    }
  }

  // Test 5: Get hashtag stats
  if (testHashtagId) {
    log('5. Testing get hashtag stats');
    const hashtagStatsResult = await testEndpoint('GET', `/hashtags/${testHashtagId}/stats`, null, authToken);
    console.log('Hashtag stats result:', hashtagStatsResult.success ? '✅ PASS' : '❌ FAIL');
    if (!hashtagStatsResult.success) {
      console.log('Error:', hashtagStatsResult.error);
    }
  }
};

const cleanupTests = async () => {
  log('🧹 TESTING CLEANUP ENDPOINTS');

  if (!authToken) {
    console.log('❌ No auth token available, skipping cleanup tests');
    return;
  }

  // Test 1: Delete comment (if exists)
  if (testCommentId) {
    log('1. Testing delete comment');
    const deleteCommentResult = await testEndpoint('DELETE', `/comments/${testCommentId}`, null, authToken);
    console.log('Delete comment result:', deleteCommentResult.success ? '✅ PASS' : '❌ FAIL');
    if (!deleteCommentResult.success) {
      console.log('Error:', deleteCommentResult.error);
    }
  }

  // Test 2: Delete post (if exists)
  if (testPostId) {
    log('2. Testing delete post');
    const deletePostResult = await testEndpoint('DELETE', `/posts/${testPostId}`, null, authToken);
    console.log('Delete post result:', deletePostResult.success ? '✅ PASS' : '❌ FAIL');
    if (!deletePostResult.success) {
      console.log('Error:', deletePostResult.error);
    }
  }

  // Test 3: Logout
  log('3. Testing logout');
  const logoutResult = await testEndpoint('POST', '/auth/logout', null, authToken);
  console.log('Logout result:', logoutResult.success ? '✅ PASS' : '❌ FAIL');
  if (!logoutResult.success) {
    console.log('Error:', logoutResult.error);
  }
};

const healthTests = async () => {
  log('🏥 TESTING HEALTH ENDPOINTS');

  // Test 1: Health check
  log('1. Testing health check');
  const healthResult = await testEndpoint('GET', '/health');
  console.log('Health check result:', healthResult.success ? '✅ PASS' : '❌ FAIL');
  if (!healthResult.success) {
    console.log('Error:', healthResult.error);
  }

  // Test 2: Root endpoint
  log('2. Testing root endpoint');
  const rootResult = await testEndpoint('GET', '/');
  console.log('Root endpoint result:', rootResult.success ? '✅ PASS' : '❌ FAIL');
  if (!rootResult.success) {
    console.log('Error:', rootResult.error);
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('\n🚀 STARTING COMPREHENSIVE API ENDPOINT TESTS');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);

  try {
    // Run tests in order
    await healthTests();
    await authTests();
    await postTests();
    await commentTests();
    await likeTests();
    await hashtagTests();
    await cleanupTests();

    console.log('\n🎉 ALL TESTS COMPLETED!');
    console.log(`⏰ Finished at: ${new Date().toISOString()}`);
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testEndpoint,
  authTests,
  postTests,
  commentTests,
  likeTests,
  hashtagTests,
  healthTests,
  cleanupTests
}; 