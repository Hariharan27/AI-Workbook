const axios = require('axios');
const { MongoClient } = require('mongodb');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ideatorpechu';

// Test data
let testUsers = [];
let testConversations = [];
let testMessages = [];
let authTokens = {};

// Helper functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const makeAuthenticatedRequest = async (method, endpoint, data = null, userId = null) => {
  const token = userId ? authTokens[userId] : Object.values(authTokens)[0];
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method} ${endpoint} failed:`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testUserCreation = async () => {
  console.log('\n🔧 Creating test users...');
  
  const users = [
    { username: 'testuser1', email: 'test1@example.com', password: 'password123', firstName: 'Test', lastName: 'User1' },
    { username: 'testuser2', email: 'test2@example.com', password: 'password123', firstName: 'Test', lastName: 'User2' },
    { username: 'testuser3', email: 'test3@example.com', password: 'password123', firstName: 'Test', lastName: 'User3' }
  ];
  
  for (const userData of users) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, userData);
      testUsers.push(response.data.user);
      console.log(`✅ Created user: ${userData.username}`);
    } catch (error) {
      if (error.response?.data?.error?.code === 'USER_EXISTS') {
        // User already exists, try to login
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: userData.email,
          password: userData.password
        });
        testUsers.push(loginResponse.data.user);
        authTokens[loginResponse.data.user._id] = loginResponse.data.token;
        console.log(`✅ Logged in existing user: ${userData.username}`);
      } else {
        throw error;
      }
    }
  }
  
  // Login all users to get tokens
  for (const user of testUsers) {
    if (!authTokens[user._id]) {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: user.email,
        password: 'password123'
      });
      authTokens[user._id] = loginResponse.data.token;
    }
  }
  
  console.log(`✅ Created/Logged in ${testUsers.length} test users`);
};

const testDirectConversation = async () => {
  console.log('\n💬 Testing direct conversation creation...');
  
  const user1 = testUsers[0];
  const user2 = testUsers[1];
  
  const response = await makeAuthenticatedRequest('POST', '/messages/conversations/direct', {
    participantId: user2._id
  }, user1._id);
  
  testConversations.push(response.data.conversation);
  console.log(`✅ Created direct conversation between ${user1.username} and ${user2.username}`);
  
  return response.data.conversation;
};

const testGroupConversation = async () => {
  console.log('\n👥 Testing group conversation creation...');
  
  const user1 = testUsers[0];
  const participants = testUsers.slice(1).map(u => u._id);
  
  const response = await makeAuthenticatedRequest('POST', '/messages/conversations/group', {
    name: 'Test Group Chat',
    description: 'A test group conversation for Phase 3 features',
    participants: participants
  }, user1._id);
  
  testConversations.push(response.data.conversation);
  console.log(`✅ Created group conversation: ${response.data.conversation.name}`);
  
  return response.data.conversation;
};

const testMessageSending = async (conversationId, senderId, content) => {
  const response = await makeAuthenticatedRequest('POST', `/messages/conversations/${conversationId}/messages`, {
    content: content,
    messageType: 'text'
  }, senderId);
  
  testMessages.push(response.data.message);
  return response.data.message;
};

const testMessageReactions = async () => {
  console.log('\n😀 Testing message reactions...');
  
  const conversation = testConversations[0];
  const user1 = testUsers[0];
  const user2 = testUsers[1];
  
  // Send a message
  const message = await testMessageSending(conversation._id, user1._id, 'Hello! This is a test message for reactions!');
  
  // Add reactions
  const reactions = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];
  
  for (const reaction of reactions) {
    await makeAuthenticatedRequest('POST', `/messages/${message._id}/reactions`, {
      reaction: reaction
    }, user2._id);
    console.log(`✅ Added ${reaction} reaction to message`);
  }
  
  // Remove a reaction
  await makeAuthenticatedRequest('DELETE', `/messages/${message._id}/reactions`, null, user2._id);
  console.log(`✅ Removed reaction from message`);
  
  // Get conversation to verify reactions
  const conversationResponse = await makeAuthenticatedRequest('GET', `/messages/conversations/${conversation._id}`, null, user1._id);
  const updatedMessage = conversationResponse.data.conversation.messages.find(m => m._id === message._id);
  
  console.log(`✅ Message has ${updatedMessage.reactions.length} reactions`);
};

const testMessageEditing = async () => {
  console.log('\n✏️ Testing message editing...');
  
  const conversation = testConversations[0];
  const user1 = testUsers[0];
  
  // Send a message
  const message = await testMessageSending(conversation._id, user1._id, 'This message will be edited');
  
  // Edit the message
  const editResponse = await makeAuthenticatedRequest('PUT', `/messages/${message._id}`, {
    content: 'This message has been edited!'
  }, user1._id);
  
  console.log(`✅ Message edited: "${editResponse.data.message.content}"`);
  console.log(`✅ Message shows as edited: ${editResponse.data.message.edited}`);
};

const testMessageDeletion = async () => {
  console.log('\n🗑️ Testing message deletion...');
  
  const conversation = testConversations[0];
  const user1 = testUsers[0];
  
  // Send a message
  const message = await testMessageSending(conversation._id, user1._id, 'This message will be deleted');
  
  // Delete the message
  await makeAuthenticatedRequest('DELETE', `/messages/${message._id}`, {
    deleteForEveryone: true
  }, user1._id);
  
  console.log(`✅ Message deleted for everyone`);
  
  // Verify message is not in conversation
  const conversationResponse = await makeAuthenticatedRequest('GET', `/messages/conversations/${conversation._id}`, null, user1._id);
  const deletedMessage = conversationResponse.data.conversation.messages.find(m => m._id === message._id);
  
  if (!deletedMessage) {
    console.log(`✅ Message successfully removed from conversation`);
  } else {
    console.log(`❌ Message still appears in conversation`);
  }
};

const testMessageForwarding = async () => {
  console.log('\n📤 Testing message forwarding...');
  
  const conversation1 = testConversations[0];
  const conversation2 = testConversations[1];
  const user1 = testUsers[0];
  
  // Send a message in first conversation
  const message = await testMessageSending(conversation1._id, user1._id, 'This message will be forwarded');
  
  // Forward to second conversation
  const forwardResponse = await makeAuthenticatedRequest('POST', `/messages/${message._id}/forward`, {
    conversationIds: [conversation2._id]
  }, user1._id);
  
  console.log(`✅ Message forwarded to ${forwardResponse.data.forwardedMessages.length} conversation(s)`);
  
  // Verify forwarded message in second conversation
  const conversationResponse = await makeAuthenticatedRequest('GET', `/messages/conversations/${conversation2._id}`, null, user1._id);
  const forwardedMessage = conversationResponse.data.conversation.messages.find(m => m.forwardedFrom);
  
  if (forwardedMessage) {
    console.log(`✅ Forwarded message found in target conversation`);
  } else {
    console.log(`❌ Forwarded message not found in target conversation`);
  }
};

const testMessageSearch = async () => {
  console.log('\n🔍 Testing message search...');
  
  const user1 = testUsers[0];
  
  // Search for messages containing "test"
  const searchResponse = await makeAuthenticatedRequest('GET', '/messages/search?q=test', null, user1._id);
  
  console.log(`✅ Found ${searchResponse.data.messages.length} messages containing "test"`);
  
  // Search in specific conversation
  const conversation = testConversations[0];
  const conversationSearchResponse = await makeAuthenticatedRequest('GET', `/messages/search?q=test&conversationId=${conversation._id}`, null, user1._id);
  
  console.log(`✅ Found ${conversationSearchResponse.data.messages.length} messages containing "test" in conversation`);
};

const testMessagePinning = async () => {
  console.log('\n📌 Testing message pinning...');
  
  const conversation = testConversations[0];
  const user1 = testUsers[0];
  
  // Send a message
  const message = await testMessageSending(conversation._id, user1._id, 'This is an important message that should be pinned');
  
  // Pin the message
  await makeAuthenticatedRequest('POST', `/conversations/${conversation._id}/pin/${message._id}`, null, user1._id);
  console.log(`✅ Message pinned`);
  
  // Get conversation to verify pinned message
  const conversationResponse = await makeAuthenticatedRequest('GET', `/messages/conversations/${conversation._id}`, null, user1._id);
  const pinnedMessages = conversationResponse.data.conversation.pinnedMessages;
  
  console.log(`✅ Conversation has ${pinnedMessages.length} pinned messages`);
  
  // Unpin the message
  await makeAuthenticatedRequest('DELETE', `/conversations/${conversation._id}/pin/${message._id}`, null, user1._id);
  console.log(`✅ Message unpinned`);
};

const testConversationSettings = async () => {
  console.log('\n⚙️ Testing conversation settings...');
  
  const conversation = testConversations[0];
  const user1 = testUsers[0];
  
  // Toggle mute
  await makeAuthenticatedRequest('PUT', `/conversations/${conversation._id}/settings`, {
    action: 'mute'
  }, user1._id);
  console.log(`✅ Conversation muted`);
  
  // Toggle pin
  await makeAuthenticatedRequest('PUT', `/conversations/${conversation._id}/settings`, {
    action: 'pin'
  }, user1._id);
  console.log(`✅ Conversation pinned`);
  
  // Toggle archive
  await makeAuthenticatedRequest('PUT', `/conversations/${conversation._id}/settings`, {
    action: 'archive'
  }, user1._id);
  console.log(`✅ Conversation archived`);
};

const testGroupManagement = async () => {
  console.log('\n👥 Testing group management...');
  
  const groupConversation = testConversations.find(c => c.type === 'group');
  const user1 = testUsers[0];
  const user2 = testUsers[1];
  
  // Get group info
  const groupResponse = await makeAuthenticatedRequest('GET', `/messages/conversations/${groupConversation._id}`, null, user1._id);
  console.log(`✅ Group has ${groupResponse.data.conversation.participants.length} participants`);
  console.log(`✅ Group has ${groupResponse.data.conversation.groupSettings.admins.length} admins`);
  
  // Add new participant (if we have more users)
  if (testUsers.length > 3) {
    const user3 = testUsers[2];
    try {
      await makeAuthenticatedRequest('POST', `/conversations/${groupConversation._id}/participants`, {
        userId: user3._id
      }, user1._id);
      console.log(`✅ Added participant to group`);
    } catch (error) {
      console.log(`ℹ️ Could not add participant (may not be implemented yet)`);
    }
  }
};

const cleanupTestData = async () => {
  console.log('\n🧹 Cleaning up test data...');
  
  // Connect to MongoDB
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  
  const db = client.db();
  
  // Delete test messages
  if (testMessages.length > 0) {
    const messageIds = testMessages.map(m => m._id);
    await db.collection('messages').deleteMany({ _id: { $in: messageIds } });
    console.log(`✅ Deleted ${testMessages.length} test messages`);
  }
  
  // Delete test conversations
  if (testConversations.length > 0) {
    const conversationIds = testConversations.map(c => c._id);
    await db.collection('conversations').deleteMany({ _id: { $in: conversationIds } });
    console.log(`✅ Deleted ${testConversations.length} test conversations`);
  }
  
  // Delete test users (optional - uncomment if you want to clean up users too)
  // if (testUsers.length > 0) {
  //   const userIds = testUsers.map(u => u._id);
  //   await db.collection('users').deleteMany({ _id: { $in: userIds } });
  //   console.log(`✅ Deleted ${testUsers.length} test users`);
  // }
  
  await client.close();
};

// Main test runner
const runPhase3Tests = async () => {
  console.log('🚀 Starting Phase 3 Chat Features Test Suite');
  console.log('=' .repeat(60));
  
  try {
    // Setup
    await testUserCreation();
    
    // Test conversations
    await testDirectConversation();
    await testGroupConversation();
    
    // Test message features
    await testMessageReactions();
    await testMessageEditing();
    await testMessageDeletion();
    await testMessageForwarding();
    await testMessageSearch();
    await testMessagePinning();
    
    // Test conversation features
    await testConversationSettings();
    await testGroupManagement();
    
    console.log('\n🎉 All Phase 3 tests completed successfully!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Cleanup
    await cleanupTestData();
    console.log('\n✨ Test suite finished');
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runPhase3Tests();
}

module.exports = {
  runPhase3Tests,
  testUserCreation,
  testDirectConversation,
  testGroupConversation,
  testMessageReactions,
  testMessageEditing,
  testMessageDeletion,
  testMessageForwarding,
  testMessageSearch,
  testMessagePinning,
  testConversationSettings,
  testGroupManagement
}; 