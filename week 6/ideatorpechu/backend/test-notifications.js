const jwtService = require('./utils/jwt');
const User = require('./models/User');
const mongoose = require('mongoose');

async function testNotifications() {
  try {
    // Connect to database
    await mongoose.connect('mongodb://localhost:27017/ideatorpechu');
    console.log('Connected to database');

    // Get first user
    const user = await User.findOne();
    if (!user) {
      console.log('No users found in database');
      return;
    }

    console.log('Testing with user:', user.username);

    // Generate JWT token using the proper service
    const tokenPayload = jwtService.getTokenPayload(user);
    const tokens = jwtService.generateTokens(tokenPayload);
    const token = tokens.accessToken;

    console.log('Generated token:', token);

    // Test notifications endpoint
    const response = await fetch('http://localhost:3000/api/v1/notifications?page=1&limit=50', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    // Test suggested-users endpoint
    const suggestedResponse = await fetch('http://localhost:3000/api/v1/notifications/suggested-users?limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const suggestedData = await suggestedResponse.json();
    console.log('\nSuggested users response status:', suggestedResponse.status);
    console.log('Suggested users response data:', JSON.stringify(suggestedData, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testNotifications(); 