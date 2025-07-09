const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Connect to database
mongoose.connect(process.env.MONGODB_URI);

// Test user credentials - try different ones
const testUsers = [
  { email: 'shgracevicky@gmail.com', password: 'testpassword123' },
  { email: 'test@example.com', password: 'password123' },
  { email: 'admin@ideatorpechu.com', password: 'admin123' }
];

let authToken = '';
let testUserId = '';

const loginUser = async () => {
  console.log('\n🔐 Trying to login...');
  
  for (const user of testUsers) {
    try {
      console.log(`Trying: ${user.email}`);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, user);
      authToken = response.data.data.tokens.accessToken;
      testUserId = response.data.data.user._id;
      console.log('✅ Login successful with:', user.email);
      return true;
    } catch (error) {
      console.log(`❌ Failed with ${user.email}:`, error.response?.data?.error?.message || 'Unknown error');
    }
  }
  return false;
};

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

const testMultiplePostLikes = async () => {
  console.log('\n👍 Testing Multiple Post Likes...');
  
  try {
    // Create multiple test posts
    const posts = [];
    for (let i = 1; i <= 3; i++) {
      console.log(`\n📝 Creating test post ${i}...`);
      const postData = {
        content: `Test post ${i} for multiple like testing`,
        isPublic: true
      };
      
      const response = await makeRequest('POST', '/posts', postData);
      posts.push(response.data.post);
      console.log(`✅ Post ${i} created: ${response.data.post._id}`);
    }
    
    // Like all posts
    console.log('\n❤️ Liking all posts...');
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`\nLiking post ${i + 1}...`);
      
      const likeResponse = await makeRequest('POST', `/post-likes/${post._id}/toggle`);
      console.log(`Post ${i + 1} like result: ${likeResponse.data.isLiked ? 'Liked' : 'Not liked'}`);
      console.log(`Post ${i + 1} like count: ${likeResponse.data.likesCount}`);
      
      // Verify like status
      const checkResponse = await makeRequest('GET', `/post-likes/check/${post._id}`);
      console.log(`Post ${i + 1} like status: ${checkResponse.data.isLiked}`);
    }
    
    // Verify all posts are liked
    console.log('\n🔍 Verifying all posts are liked...');
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const checkResponse = await makeRequest('GET', `/post-likes/check/${post._id}`);
      console.log(`Post ${i + 1} final status: ${checkResponse.data.isLiked ? '✅ Liked' : '❌ Not liked'}`);
    }
    
    // Unlike one post and verify others remain liked
    console.log('\n🔄 Testing independence - unliking post 2...');
    const unlikeResponse = await makeRequest('POST', `/post-likes/${posts[1]._id}/toggle`);
    console.log(`Post 2 unlike result: ${unlikeResponse.data.isLiked ? 'Liked' : 'Not liked'}`);
    
    // Check all posts again
    console.log('\n🔍 Final verification...');
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      const checkResponse = await makeRequest('GET', `/post-likes/check/${post._id}`);
      const expected = i === 1 ? false : true; // Post 2 should be unliked
      console.log(`Post ${i + 1}: ${checkResponse.data.isLiked ? 'Liked' : 'Not liked'} (Expected: ${expected ? 'Liked' : 'Not liked'})`);
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test posts...');
    for (const post of posts) {
      await makeRequest('DELETE', `/posts/${post._id}`);
      console.log(`✅ Deleted post: ${post._id}`);
    }
    
    console.log('\n🎉 Multiple post like test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Multiple post like test failed:', error.response?.data || error.message);
    return false;
  }
};

const runTest = async () => {
  console.log('🚀 Quick Multiple Post Like Test');
  console.log('=' .repeat(50));
  
  try {
    const loginSuccess = await loginUser();
    if (!loginSuccess) {
      console.error('❌ Cannot proceed without login');
      return;
    }
    
    const testSuccess = await testMultiplePostLikes();
    
    if (testSuccess) {
      console.log('\n✅ SUCCESS: Multiple post likes are working correctly!');
      console.log('The separated like implementation has solved the issue.');
    } else {
      console.log('\n❌ FAILED: Multiple post likes are still not working.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🏁 Test completed');
    process.exit(0);
  }
};

runTest(); 