# IdeatorPechu - Social Media Platform

A scalable social media platform with Tamil cultural integration, built with the MERN stack (MongoDB, Express.js, React, Node.js).

## 🏗️ Project Structure

```
week 6/
├── ideatorpechu/           # Main project folder
│   ├── backend/           # Node.js + Express + MongoDB API
│   └── frontend/          # React.js + TypeScript UI
├── docs/                  # Architecture documentation
├── text-files/            # Planning and implementation docs
└── html/                  # HTML viewers
```

## 🎯 Current Phase: 2C - Real-Time Communication ✅ COMPLETE

### Backend ✅ Complete
- User registration and authentication
- JWT token management
- Email verification and password reset
- Profile management
- Security middleware and validation
- **Socket.io infrastructure with multi-namespace support**
- **Real-time messaging and notifications**
- **Live social interactions**

### Frontend ✅ Complete
- React app with TypeScript
- Material-UI components with purple theme
- Facebook-like UI design
- Authentication pages (Login, Register, Profile)
- **Real-time notification system**
- **Live activity feed**
- **Real-time chat interface**
- **Socket service integration**

## 🚀 Quick Start

### Backend Setup
```bash
cd ideatorpechu/backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### Frontend Setup
```bash
cd ideatorpechu/frontend
npm install
npm start
```

## 🎨 Design Theme

**Modern Purple Theme:**
- Primary: `#6366F1` (Indigo)
- Secondary: `#8B5CF6` (Purple)
- Accent: `#EC4899` (Pink)
- Background: `#F8FAFC` (Light gray)
- Text: `#1E293B` (Dark slate)

## 📚 Documentation

- [Architecture Design](docs/architecture-design.md)
- [API Documentation](docs/express-routes.md)
- [Database Schema](docs/mongodb-schemas.md)
- [Phase 2A Implementation](text-files/phase2a-user-management-implementation.txt)

## 🔧 Technology Stack

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- Redis for caching
- JWT authentication
- Socket.io (planned)

### Frontend
- React.js + TypeScript
- Material-UI components
- Redux Toolkit for state management
- React Router for navigation
- Axios for API calls

## 📋 Development Phases

- ✅ **Phase 2A**: User Management & Authentication (Complete)
- ✅ **Phase 2B**: Content Management System (Complete)
- ✅ **Phase 2C**: Real-time Communication (Complete)
- 🔄 **Phase 2D**: Advanced Features & AI Integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details 