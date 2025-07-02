# MongoDB Schema Design with Relationships

## User Schema
```javascript
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  avatar: { type: String, default: null },
  bio: { type: String, maxLength: 500 },
  location: { type: String },
  website: { type: String },
  isVerified: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
      allowMessages: { type: String, enum: ['everyone', 'friends', 'none'], default: 'friends' }
    }
  },
  stats: {
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});
```

## Post Schema
```javascript
const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true, maxLength: 5000 },
  media: [{
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true },
    thumbnail: { type: String },
    metadata: {
      size: { type: Number },
      duration: { type: Number }, // for videos
      dimensions: { width: Number, height: Number }
    }
  }],
  hashtags: [{ type: String, index: true }],
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number] // [longitude, latitude]
  },
  isPublic: { type: Boolean, default: true },
  isEdited: { type: Boolean, default: false },
  editHistory: [{
    content: String,
    editedAt: { type: Date, default: Date.now }
  }],
  stats: {
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 }
  },
  moderation: {
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    flagged: { type: Boolean, default: false },
    flaggedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }
}, {
  timestamps: true
});
```

## Relationship Schema (Friends/Followers)
```javascript
const relationshipSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'blocked'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});
```

## Comment Schema
```javascript
const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxLength: 1000 },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }, // for nested comments
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isEdited: { type: Boolean, default: false },
  editHistory: [{
    content: String,
    editedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});
```

## Message Schema
```javascript
const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image', 'video', 'file'], default: 'text' },
  media: {
    url: String,
    thumbnail: String,
    metadata: {
      size: Number,
      duration: Number,
      dimensions: { width: Number, height: Number }
    }
  },
  readBy: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  deliveredTo: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveredAt: { type: Date, default: Date.now }
  }],
  isEdited: { type: Boolean, default: false },
  editHistory: [{
    content: String,
    editedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});
```

## Conversation Schema
```javascript
const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  type: { type: String, enum: ['direct', 'group'], default: 'direct' },
  name: { type: String }, // for group chats
  avatar: { type: String }, // for group chats
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});
```

## Notification Schema
```javascript
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: ['like', 'comment', 'follow', 'mention', 'message', 'friend_request'],
    required: true 
  },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' },
  isRead: { type: Boolean, default: false },
  isSeen: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});
```

## Indexes for Performance
```javascript
// User indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'stats.followersCount': -1 });
userSchema.index({ createdAt: -1 });

// Post indexes
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ 'moderation.status': 1 });
postSchema.index({ location: '2dsphere' }); // for geospatial queries

// Relationship indexes
relationshipSchema.index({ follower: 1, following: 1 }, { unique: true });
relationshipSchema.index({ following: 1, status: 1 });

// Comment indexes
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });

// Message indexes
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// Notification indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1 });
``` 