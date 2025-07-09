const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api/v1';
let authToken = '';
let testPostId = '';

// Test user credentials
const testUser = {
  email: 'shgracevicky@gmail.com',
  password: 'testpassword123'
};

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, testUser);
    authToken = response.data.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function createTestPost() {
  try {
    console.log('📝 Creating test post...');
    
    const formData = new FormData();
    formData.append('content', 'This is a test post for edit/delete functionality');
    formData.append('isPublic', 'true');
    
    // Add a test image if available
    const testImagePath = path.join(__dirname, '../uploads/test.txt');
    if (fs.existsSync(testImagePath)) {
      formData.append('media', fs.createReadStream(testImagePath));
    }
    
    const response = await axios.post(`${BASE_URL}/posts`, formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      }
    });
    
    testPostId = response.data.data.post._id;
    console.log('✅ Test post created:', testPostId);
    return true;
  } catch (error) {
    console.error('❌ Failed to create test post:', error.response?.data || error.message);
    return false;
  }
}

async function testEditPost() {
  try {
    console.log('✏️ Testing edit post...');
    
    const formData = new FormData();
    formData.append('content', 'This post has been edited! Updated content with #testing and @mentions');
    formData.append('isPublic', 'true');
    formData.append('location', 'Test Location');
    
    const response = await axios.put(`${BASE_URL}/posts/${testPostId}`, formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ Post edited successfully');
    console.log('📄 Updated content:', response.data.data.post.content);
    console.log('📍 Location:', response.data.data.post.location);
    console.log('✏️ Is edited:', response.data.data.post.isEdited);
    console.log('📜 Edit history length:', response.data.data.post.editHistory.length);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to edit post:', error.response?.data || error.message);
    return false;
  }
}

async function testGetPost() {
  try {
    console.log('📖 Testing get post...');
    
    const response = await axios.get(`${BASE_URL}/posts/${testPostId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Post retrieved successfully');
    console.log('📄 Content:', response.data.data.post.content);
    console.log('✏️ Is edited:', response.data.data.post.isEdited);
    console.log('📜 Edit history:', response.data.data.post.editHistory.length, 'entries');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to get post:', error.response?.data || error.message);
    return false;
  }
}

async function testDeletePost() {
  try {
    console.log('🗑️ Testing delete post...');
    
    const response = await axios.delete(`${BASE_URL}/posts/${testPostId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Post deleted successfully');
    console.log('📢 Message:', response.data.message);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to delete post:', error.response?.data || error.message);
    return false;
  }
}

async function testPostNotFound() {
  try {
    console.log('🔍 Testing post not found after deletion...');
    
    await axios.get(`${BASE_URL}/posts/${testPostId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('❌ Post still exists (should not)');
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Post correctly not found after deletion');
      return true;
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
      return false;
    }
  }
}

async function testUnauthorizedEdit() {
  try {
    console.log('🚫 Testing unauthorized edit...');
    
    const formData = new FormData();
    formData.append('content', 'Unauthorized edit attempt');
    
    await axios.put(`${BASE_URL}/posts/${testPostId}`, formData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('❌ Unauthorized edit succeeded (should not)');
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Correctly got 404 for deleted post');
      return true;
    } else {
      console.error('❌ Unexpected error:', error.response?.data || error.message);
      return false;
    }
  }
}

async function runTests() {
  console.log('🚀 Starting Edit/Delete Post Tests\n');
  
  // Login
  if (!(await login())) {
    console.log('❌ Cannot proceed without login');
    return;
  }
  
  // Create test post
  if (!(await createTestPost())) {
    console.log('❌ Cannot proceed without test post');
    return;
  }
  
  // Test edit functionality
  if (!(await testEditPost())) {
    console.log('❌ Edit test failed');
    return;
  }
  
  // Test get post after edit
  if (!(await testGetPost())) {
    console.log('❌ Get post test failed');
    return;
  }
  
  // Test delete functionality
  if (!(await testDeletePost())) {
    console.log('❌ Delete test failed');
    return;
  }
  
  // Test post not found after deletion
  if (!(await testPostNotFound())) {
    console.log('❌ Post not found test failed');
    return;
  }
  
  // Test unauthorized edit on deleted post
  if (!(await testUnauthorizedEdit())) {
    console.log('❌ Unauthorized edit test failed');
    return;
  }
  
  console.log('\n🎉 All tests passed! Edit and delete functionality is working correctly.');
}

// Run the tests
runTests().catch(console.error); 