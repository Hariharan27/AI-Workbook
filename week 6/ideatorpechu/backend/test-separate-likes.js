const axios = require('axios');
const mongoose = require('mongoose');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';
let authToken = '';
let testUserId = '';
let testPostId = '';
let testCommentId = '';

// Test user credentials
const testUser = {
  email: 'shgracevicky@gmail.com',
  password: 'testpassword123'
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Request failed: ${method} ${endpoint}`);
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const loginUser = async () => {
  console.log('\n🔐 Logging in test user...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, testUser);
    authToken = response.data.data.tokens.accessToken;
    testUserId = response.data.data.user._id;
    console.log('✅ Login successful');
    console.log(`User ID: ${testUserId}`);
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
};

const createTestPost = async () => {
  console.log('\n📝 Creating test post...');
  try {
    const postData = {
      content: 'This is a test post for like functionality testing',
      isPublic: true
    };
    
    const response = await makeRequest('POST', '/posts', postData);
    testPostId = response.data.post._id;
    console.log('✅ Test post created');
    console.log(`Post ID: ${testPostId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create test post:', error.response?.data || error.message);
    return false;
  }
};

const createTestComment = async () => {
  console.log('\n💬 Creating test comment...');
  try {
    const commentData = {
      content: 'This is a test comment for like functionality testing',
      post: testPostId
    };
    
    const response = await makeRequest('POST', '/comments', commentData);
    testCommentId = response.data.comment._id;
    console.log('✅ Test comment created');
    console.log(`Comment ID: ${testCommentId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create test comment:', error.response?.data || error.message);
    return false;
  }
};

const testPostLikeFunctionality = async () => {
  console.log('\n👍 Testing Post Like Functionality...');
  
  try {
    // Test 1: Check initial like status
    console.log('\n1️⃣ Checking initial post like status...');
    const initialCheck = await makeRequest('GET', `/post-likes/check/${testPostId}`);
    console.log(`Initial like status: ${initialCheck.data.isLiked}`);
    
    // Test 2: Like the post
    console.log('\n2️⃣ Liking the post...');
    const likeResponse = await makeRequest('POST', `/post-likes/${testPostId}/toggle`);
    console.log(`Like response: ${likeResponse.data.isLiked ? 'Liked' : 'Not liked'}`);
    console.log(`Like count: ${likeResponse.data.likesCount}`);
    
    // Test 3: Check like status after liking
    console.log('\n3️⃣ Checking like status after liking...');
    const afterLikeCheck = await makeRequest('GET', `/post-likes/check/${testPostId}`);
    console.log(`Like status after liking: ${afterLikeCheck.data.isLiked}`);
    
    // Test 4: Unlike the post
    console.log('\n4️⃣ Unliking the post...');
    const unlikeResponse = await makeRequest('POST', `/post-likes/${testPostId}/toggle`);
    console.log(`Unlike response: ${unlikeResponse.data.isLiked ? 'Liked' : 'Not liked'}`);
    console.log(`Like count: ${unlikeResponse.data.likesCount}`);
    
    // Test 5: Check like status after unliking
    console.log('\n5️⃣ Checking like status after unliking...');
    const afterUnlikeCheck = await makeRequest('GET', `/post-likes/check/${testPostId}`);
    console.log(`Like status after unliking: ${afterUnlikeCheck.data.isLiked}`);
    
    // Test 6: Get post likes list
    console.log('\n6️⃣ Getting post likes list...');
    const likesList = await makeRequest('GET', `/post-likes/${testPostId}`);
    console.log(`Likes list count: ${likesList.data.pagination.total}`);
    
    console.log('✅ Post like functionality tests completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Post like functionality test failed:', error.response?.data || error.message);
    return false;
  }
};

const testCommentLikeFunctionality = async () => {
  console.log('\n👍 Testing Comment Like Functionality...');
  
  try {
    // Test 1: Check initial like status
    console.log('\n1️⃣ Checking initial comment like status...');
    const initialCheck = await makeRequest('GET', `/comment-likes/check/${testCommentId}`);
    console.log(`Initial like status: ${initialCheck.data.isLiked}`);
    
    // Test 2: Like the comment
    console.log('\n2️⃣ Liking the comment...');
    const likeResponse = await makeRequest('POST', `/comment-likes/${testCommentId}/toggle`);
    console.log(`Like response: ${likeResponse.data.isLiked ? 'Liked' : 'Not liked'}`);
    console.log(`Like count: ${likeResponse.data.likesCount}`);
    
    // Test 3: Check like status after liking
    console.log('\n3️⃣ Checking like status after liking...');
    const afterLikeCheck = await makeRequest('GET', `/comment-likes/check/${testCommentId}`);
    console.log(`Like status after liking: ${afterLikeCheck.data.isLiked}`);
    
    // Test 4: Unlike the comment
    console.log('\n4️⃣ Unliking the comment...');
    const unlikeResponse = await makeRequest('POST', `/comment-likes/${testCommentId}/toggle`);
    console.log(`Unlike response: ${unlikeResponse.data.isLiked ? 'Liked' : 'Not liked'}`);
    console.log(`Like count: ${unlikeResponse.data.likesCount}`);
    
    // Test 5: Check like status after unliking
    console.log('\n5️⃣ Checking like status after unliking...');
    const afterUnlikeCheck = await makeRequest('GET', `/comment-likes/check/${testCommentId}`);
    console.log(`Like status after unliking: ${afterUnlikeCheck.data.isLiked}`);
    
    // Test 6: Get comment likes list
    console.log('\n6️⃣ Getting comment likes list...');
    const likesList = await makeRequest('GET', `/comment-likes/${testCommentId}`);
    console.log(`Likes list count: ${likesList.data.pagination.total}`);
    
    console.log('✅ Comment like functionality tests completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Comment like functionality test failed:', error.response?.data || error.message);
    return false;
  }
};

const testIndependentFunctionality = async () => {
  console.log('\n🔄 Testing Independent Functionality...');
  
  try {
    // Test 1: Like both post and comment
    console.log('\n1️⃣ Liking both post and comment...');
    const postLike = await makeRequest('POST', `/post-likes/${testPostId}/toggle`);
    const commentLike = await makeRequest('POST', `/comment-likes/${testCommentId}/toggle`);
    
    console.log(`Post like: ${postLike.data.isLiked}, Count: ${postLike.data.likesCount}`);
    console.log(`Comment like: ${commentLike.data.isLiked}, Count: ${commentLike.data.likesCount}`);
    
    // Test 2: Check both like statuses
    console.log('\n2️⃣ Checking both like statuses...');
    const postCheck = await makeRequest('GET', `/post-likes/check/${testPostId}`);
    const commentCheck = await makeRequest('GET', `/comment-likes/check/${testCommentId}`);
    
    console.log(`Post like status: ${postCheck.data.isLiked}`);
    console.log(`Comment like status: ${commentCheck.data.isLiked}`);
    
    // Test 3: Unlike post only
    console.log('\n3️⃣ Unliking post only...');
    const postUnlike = await makeRequest('POST', `/post-likes/${testPostId}/toggle`);
    const commentCheckAfter = await makeRequest('GET', `/comment-likes/check/${testCommentId}`);
    
    console.log(`Post like after unlike: ${postUnlike.data.isLiked}`);
    console.log(`Comment like status (should still be liked): ${commentCheckAfter.data.isLiked}`);
    
    // Test 4: Unlike comment only
    console.log('\n4️⃣ Unliking comment only...');
    const commentUnlike = await makeRequest('POST', `/comment-likes/${testCommentId}/toggle`);
    const postCheckAfter = await makeRequest('GET', `/post-likes/check/${testPostId}`);
    
    console.log(`Comment like after unlike: ${commentUnlike.data.isLiked}`);
    console.log(`Post like status (should still be unliked): ${postCheckAfter.data.isLiked}`);
    
    console.log('✅ Independent functionality tests completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Independent functionality test failed:', error.response?.data || error.message);
    return false;
  }
};

const cleanup = async () => {
  console.log('\n🧹 Cleaning up test data...');
  try {
    // Delete test comment
    if (testCommentId) {
      await makeRequest('DELETE', `/comments/${testCommentId}`);
      console.log('✅ Test comment deleted');
    }
    
    // Delete test post
    if (testPostId) {
      await makeRequest('DELETE', `/posts/${testPostId}`);
      console.log('✅ Test post deleted');
    }
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.response?.data || error.message);
  }
};

// Main test execution
const runTests = async () => {
  console.log('🚀 Starting Separate Like Functionality Tests...');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Login
    const loginSuccess = await loginUser();
    if (!loginSuccess) {
      console.error('❌ Cannot proceed without login');
      return;
    }
    
    // Step 2: Create test data
    const postCreated = await createTestPost();
    if (!postCreated) {
      console.error('❌ Cannot proceed without test post');
      return;
    }
    
    const commentCreated = await createTestComment();
    if (!commentCreated) {
      console.error('❌ Cannot proceed without test comment');
      return;
    }
    
    // Step 3: Test post likes
    const postLikesSuccess = await testPostLikeFunctionality();
    
    // Step 4: Test comment likes
    const commentLikesSuccess = await testCommentLikeFunctionality();
    
    // Step 5: Test independent functionality
    const independentSuccess = await testIndependentFunctionality();
    
    // Step 6: Cleanup
    await cleanup();
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Post Likes: ${postLikesSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Comment Likes: ${commentLikesSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Independent Functionality: ${independentSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (postLikesSuccess && commentLikesSuccess && independentSuccess) {
      console.log('\n🎉 ALL TESTS PASSED! Like functionality is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    console.log('\n🏁 Test execution completed');
    process.exit(0);
  }
};

// Run the tests
runTests(); 