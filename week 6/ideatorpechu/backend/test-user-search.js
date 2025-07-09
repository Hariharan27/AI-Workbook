const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Connect to database
mongoose.connect(process.env.MONGODB_URI);

// Test user credentials
const testUsers = [
  { email: 'shgracevicky@gmail.com', password: 'testpassword123' },
  { email: 'test@example.com', password: 'password123' },
  { email: 'admin@ideatorpechu.com', password: 'admin123' }
];

let authToken = '';

const loginUser = async () => {
  console.log('\n🔐 Trying to login...');
  
  for (const user of testUsers) {
    try {
      console.log(`Trying: ${user.email}`);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, user);
      authToken = response.data.data.tokens.accessToken;
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

const testUserSearch = async () => {
  console.log('\n🔍 Testing User Search...');
  
  try {
    // Test 1: Search for users with empty query
    console.log('\n1️⃣ Testing empty search query...');
    const emptySearch = await makeRequest('GET', '/search/users?q=');
    console.log('Empty search response:', emptySearch);
    
    // Test 2: Search for users with a simple query
    console.log('\n2️⃣ Testing search with query "test"...');
    const testSearch = await makeRequest('GET', '/search/users?q=test');
    console.log('Test search response:', testSearch);
    
    // Test 3: Search for users with a specific username
    console.log('\n3️⃣ Testing search with query "shgracevicky"...');
    const specificSearch = await makeRequest('GET', '/search/users?q=shgracevicky');
    console.log('Specific search response:', specificSearch);
    
    // Test 4: Check all users in database
    console.log('\n4️⃣ Checking all users in database...');
    const User = require('./models/User');
    const allUsers = await User.find({}, 'username firstName lastName email isActive');
    console.log('All users in database:', allUsers.map(u => ({
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      isActive: u.isActive
    })));
    
    console.log('\n✅ User search test completed!');
    return true;
    
  } catch (error) {
    console.error('❌ User search test failed:', error.response?.data || error.message);
    return false;
  }
};

const runTest = async () => {
  console.log('🚀 User Search Test');
  console.log('=' .repeat(50));
  
  try {
    const loginSuccess = await loginUser();
    if (!loginSuccess) {
      console.error('❌ Cannot proceed without login');
      return;
    }
    
    const testSuccess = await testUserSearch();
    
    if (testSuccess) {
      console.log('\n✅ SUCCESS: User search is working correctly!');
    } else {
      console.log('\n❌ FAILED: User search is not working.');
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