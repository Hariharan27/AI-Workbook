# IdeatorPechu - Social Media Platform

A scalable social media platform with Tamil cultural integration, built with the MEAN stack (MongoDB, Express.js, Angular/React, Node.js).

## 🎯 Current Phase: 2A - User Management & Authentication

This phase implements comprehensive user management and authentication system including:
- User registration and login
- Email verification
- Password reset functionality
- JWT token management
- Profile management
- Social features (follow/unfollow)
- Privacy controls

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ideatorpechu
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3000

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/ideatorpechu

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

   # Redis Configuration
   REDIS_URL=redis://localhost:6379

   # Email Configuration (Optional for development)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

5. **Verify installation**
   ```bash
   curl http://localhost:3000/health
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isVerified": false,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 900
    }
  },
  "message": "User registered successfully. Please check your email to verify your account."
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "username": "john_doe",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isVerified": true,
      "isActive": true,
      "lastSeen": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 900
    }
  },
  "message": "Login successful"
}
```

#### Refresh Token
```http
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

#### Forgot Password
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Reset Password
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "newPassword": "NewSecurePass123"
}
```

#### Verify Email
```http
GET /auth/verify-email?token=verification_token
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "IdeatorPechu API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ideatorpechu` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_REFRESH_SECRET` | JWT refresh secret | Required |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `EMAIL_HOST` | SMTP host | Optional |
| `EMAIL_USER` | SMTP username | Optional |
| `EMAIL_PASS` | SMTP password | Optional |

### Security Features

- **Rate Limiting**: 100 requests per 15 minutes (global), 5 auth attempts per 15 minutes
- **Password Requirements**: Minimum 8 characters, uppercase, lowercase, number
- **Account Lockout**: 10 failed login attempts = 30-minute lockout
- **JWT Tokens**: 15-minute access tokens, 7-day refresh tokens
- **Email Verification**: Required for full account access
- **Password Reset**: Secure token-based reset with 1-hour expiry

## 🏗️ Project Structure

```
ideatorpechu/
├── config/
│   ├── database.js          # MongoDB connection
│   └── redis.js             # Redis client
├── middleware/
│   └── authenticate.js      # JWT authentication
├── models/
│   ├── User.js              # User schema
│   └── Relationship.js      # Follow/unfollow schema
├── routes/
│   └── auth.js              # Authentication routes
├── services/
│   └── emailService.js      # Email service
├── utils/
│   └── jwt.js               # JWT utilities
├── server.js                # Main server file
├── package.json             # Dependencies
├── env.example              # Environment template
└── README.md                # This file
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📝 Development

```bash
# Start development server with auto-reload
npm run dev

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🔒 Security Considerations

- All passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens are blacklisted on logout
- Rate limiting prevents brute force attacks
- Input validation on all endpoints
- CORS configured for security
- Helmet.js for security headers
- Account lockout after failed attempts

## 🌍 Tamil Cultural Integration

The platform includes Tamil cultural elements:
- Tamil language support in email templates
- Cultural greeting "வணக்கம்" (Vanakkam) in welcome emails
- Support for Tamil usernames and content
- Regional privacy and content preferences

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ideatorpechu
   JWT_SECRET=your-production-secret
   REDIS_URL=redis://your-redis-host:6379
   ```

2. **Process Manager**
   ```bash
   npm install -g pm2
   pm2 start server.js --name ideatorpechu
   ```

3. **Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 📊 Monitoring

- Health check endpoint: `/health`
- Logging with Morgan
- Error tracking and graceful shutdown
- Database connection monitoring
- Redis connection monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🗺️ Roadmap

### Phase 2A (Current) ✅
- [x] User registration and authentication
- [x] Email verification system
- [x] Password reset functionality
- [x] JWT token management
- [x] Basic profile management

### Phase 2B (Next)
- [ ] Content management system
- [ ] Post creation and management
- [ ] Media upload functionality
- [ ] Feed algorithm

### Phase 2C (Future)
- [ ] Real-time messaging
- [ ] Socket.io integration
- [ ] Live notifications

### Phase 2D (Future)
- [ ] Advanced features
- [ ] Analytics dashboard
- [ ] Content moderation

---

**Built with ❤️ for the Tamil community** 