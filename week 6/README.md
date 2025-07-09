# IdeatorPechu - Social Media Platform

## 🚀 **Project Overview**

IdeatorPechu is a comprehensive, scalable social media platform built with modern web technologies. The platform features real-time messaging, content management, user interactions, and AI-powered recommendations, comparable to popular social media platforms like Facebook, Twitter, and WhatsApp.

---

## 📊 **Project Status**

| Phase | Status | Completion |
|-------|--------|------------|
| **Phase 1** | ✅ **COMPLETE** | 100% |
| **Phase 2** | ✅ **COMPLETE** | 100% |
| **Phase 3** | ✅ **COMPLETE** | 100% |

---

## 🏗️ **Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React.js)    │◄──►│   (Node.js)     │◄──►│   (MongoDB)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Real-time     │    │   GraphQL       │    │   Redis Cache   │
│   (Socket.io)   │    │   (Apollo)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **System Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  React.js Frontend  │  Mobile App  │  Web App  │  Admin Panel  │
└─────────────────────┴──────────────┴───────────┴────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Load Balancer  │  Rate Limiting  │  Authentication  │  CORS   │
└─────────────────┴─────────────────┴──────────────────┴──────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Express.js Server  │  GraphQL Server  │  Socket.io Server    │
│  REST APIs          │  Apollo Server   │  Real-time Events    │
└─────────────────────┴──────────────────┴───────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Auth Service  │  Media Service  │  Email Service  │  Cache    │
│  User Service  │  Post Service   │  Notification   │  Service  │
└─────────────────┴─────────────────┴─────────────────┴──────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  MongoDB (Primary)  │  Redis (Cache)  │  File Storage (S3)    │
│  User Data          │  Sessions       │  Media Files          │
│  Posts/Content      │  Real-time Data │  Documents            │
└─────────────────────┴─────────────────┴────────────────────────┘
```

---

## 🛠️ **Technology Stack**

### **Frontend**
- **React.js** with TypeScript
- **Material-UI** for component library
- **React Router** for navigation
- **Socket.io Client** for real-time features
- **Axios** for API communication

### **Backend**
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **Redis** for caching and sessions
- **Socket.io** for real-time communication
- **GraphQL** with Apollo Server
- **JWT** for authentication
- **New Relic** for monitoring

### **Infrastructure**
- **MongoDB Atlas** for database hosting
- **Redis Cloud** for caching
- **AWS S3** for file storage
- **Docker** for containerization
- **GitHub Actions** for CI/CD

---

## 🎯 **Core Features**

### **Phase 1: Foundation (100% Complete)**
- ✅ User authentication and authorization
- ✅ User profile management
- ✅ Basic post creation and management
- ✅ Follow/unfollow functionality
- ✅ Basic notifications system
- ✅ Real-time updates with Socket.io

### **Phase 2: Content & Social Features (100% Complete)**
- ✅ Enhanced post management (edit, delete, share)
- ✅ Comments and nested comments
- ✅ Separate like system for posts and comments
- ✅ Hashtag system and trending topics
- ✅ Advanced notifications with filtering
- ✅ User search and discovery
- ✅ Media upload and management
- ✅ Content moderation system

### **Phase 3: Advanced Chat Features (100% Complete)**
- ✅ Real-time messaging with status tracking
- ✅ Message reactions (like, love, haha, wow, sad, angry)
- ✅ Message replies and forwarding
- ✅ Message editing and deletion
- ✅ Group conversations with admin controls
- ✅ Pinned messages in conversations
- ✅ Message search functionality
- ✅ Conversation settings (mute, pin, archive)
- ✅ Enhanced conversation management

---

## 📁 **Project Structure**

```
ideatorpechu/
├── backend/                    # Backend server
│   ├── config/                # Configuration files
│   ├── models/                # MongoDB schemas
│   ├── routes/                # API routes
│   ├── middleware/            # Express middleware
│   ├── services/              # Business logic services
│   ├── graphql/               # GraphQL schema and resolvers
│   ├── test/                  # Test files
│   └── server.js              # Main server file
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── contexts/         # React contexts
│   │   └── utils/            # Utility functions
│   └── public/               # Static assets
├── docs/                     # Documentation
│   ├── architecture-design.md
│   ├── express-routes.md
│   ├── graphql-schema.md
│   ├── mongodb-schemas.md
│   ├── redis-caching.md
│   └── socketio-architecture.md
└── uploads/                  # File uploads
```

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Redis (v6 or higher)
- npm or yarn

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/Hariharan27/AI-Workbook.git
cd AI-Workbook/week\ 6/ideatorpechu
```

2. **Install dependencies**
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

3. **Environment Setup**
```bash
# Backend environment
cd backend
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

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

4. **Start the servers**
```bash
# Start backend server
cd backend
npm start

# Start frontend server (in new terminal)
cd frontend
npm start
```

5. **Access the application**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- GraphQL Playground: http://localhost:3000/graphql

---

## 📚 **API Documentation**

### **REST API Endpoints**

#### **Authentication**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh-token` - Refresh access token

#### **Users**
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/:userId` - Get user by ID
- `POST /api/v1/users/:userId/follow` - Follow user
- `DELETE /api/v1/users/:userId/follow` - Unfollow user

#### **Posts**
- `GET /api/v1/posts` - Get posts feed
- `POST /api/v1/posts` - Create new post
- `GET /api/v1/posts/:postId` - Get post by ID
- `PUT /api/v1/posts/:postId` - Update post
- `DELETE /api/v1/posts/:postId` - Delete post

#### **Comments**
- `GET /api/v1/posts/:postId/comments` - Get post comments
- `POST /api/v1/posts/:postId/comments` - Add comment
- `PUT /api/v1/comments/:commentId` - Update comment
- `DELETE /api/v1/comments/:commentId` - Delete comment

#### **Messages**
- `GET /api/v1/messages/conversations` - Get user conversations
- `POST /api/v1/messages/conversations/direct` - Create direct conversation
- `POST /api/v1/messages/conversations/group` - Create group conversation
- `GET /api/v1/messages/conversations/:conversationId` - Get conversation with messages
- `POST /api/v1/messages/conversations/:conversationId/messages` - Send message

#### **Notifications**
- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/:notificationId/read` - Mark notification as read
- `PUT /api/v1/notifications/read-all` - Mark all notifications as read
- `GET /api/v1/notifications/unread-count` - Get unread count

### **GraphQL API**

The platform also provides a comprehensive GraphQL API with the following operations:

#### **Queries**
- `me` - Get current user
- `users` - Get users with pagination
- `posts` - Get posts feed
- `notifications` - Get user notifications
- `conversations` - Get user conversations
- `search` - Search across users, posts, and hashtags

#### **Mutations**
- `register` - User registration
- `login` - User login
- `createPost` - Create new post
- `likePost` - Like/unlike post
- `createComment` - Add comment
- `sendMessage` - Send message
- `followUser` - Follow/unfollow user

---

## 🔧 **Real-time Features**

### **Socket.io Events**

#### **Social Events**
- `post:created` - New post created
- `post:liked` - Post liked/unliked
- `comment:created` - New comment added
- `user:followed` - User followed/unfollowed

#### **Chat Events**
- `message:received` - New message received
- `message:edited` - Message edited
- `message:deleted` - Message deleted
- `message:reaction:added` - Message reaction added
- `message:reaction:removed` - Message reaction removed
- `conversation:created` - New conversation created
- `conversation:updated` - Conversation updated

#### **Notification Events**
- `notification:new` - New notification received
- `notification:read` - Notification marked as read

---

## 🧪 **Testing**

### **Run Tests**
```bash
# Backend tests
cd backend
npm test

# Run specific test suites
npm run test:auth
npm run test:posts
npm run test:messages
```

### **Test Coverage**
- ✅ Authentication tests
- ✅ User management tests
- ✅ Post and comment tests
- ✅ Message and conversation tests
- ✅ Notification tests
- ✅ Real-time feature tests

---

## 📊 **Performance & Monitoring**

### **Caching Strategy**
- **Redis** for session management
- **Query caching** for frequently accessed data
- **Response caching** for static content
- **Real-time data caching** for live features

### **Monitoring**
- **New Relic** for application performance monitoring
- **Custom monitoring service** for health checks
- **Error tracking** and logging
- **Performance metrics** collection

### **Optimization**
- **Database indexing** for fast queries
- **Pagination** for large datasets
- **Image optimization** and compression
- **CDN integration** for static assets

---

## 🔒 **Security Features**

- **JWT-based authentication** with refresh tokens
- **Password hashing** with bcrypt
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization
- **CORS configuration** for cross-origin requests
- **Helmet.js** for security headers
- **Content moderation** system

---

## 🚀 **Deployment**

### **Environment Variables**
```bash
# Production environment variables
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ideatorpechu
REDIS_URL=redis://your-redis-url:6379
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
```

### **Docker Deployment**
```bash
# Build and run with Docker
docker-compose up --build
```

### **Cloud Deployment**
- **Backend**: Deploy to AWS EC2, Heroku, or DigitalOcean
- **Frontend**: Deploy to Vercel, Netlify, or AWS S3
- **Database**: Use MongoDB Atlas
- **Cache**: Use Redis Cloud

---

## 📈 **Future Enhancements**

### **Planned Features**
- 🔄 **AI-powered content recommendations**
- 🔄 **Advanced analytics dashboard**
- 🔄 **Video calling integration**
- 🔄 **Story/Status feature**
- 🔄 **Advanced search with Elasticsearch**
- 🔄 **Push notifications**
- 🔄 **Multi-language support**
- 🔄 **Dark mode theme**

### **Technical Improvements**
- 🔄 **Microservices architecture**
- 🔄 **Event-driven architecture**
- 🔄 **Advanced caching strategies**
- 🔄 **Performance optimization**
- 🔄 **Mobile app development**

---

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 **Team**

- **Hariharan S** - Full Stack Developer
- **Ideas2IT** - Development Team

---

## 📞 **Support**

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation in the `docs/` folder

---

## 🎉 **Acknowledgments**

- **Node.js** and **Express.js** community
- **React.js** and **Material-UI** teams
- **MongoDB** and **Redis** communities
- **Socket.io** and **GraphQL** teams

---

**Built with ❤️ by the IdeatorPechu Team** 