# Socket.io Event Architecture

## Namespace Structure

### Main Namespaces
```
/social - Main social events (posts, likes, comments, follows)
/messaging - Private messaging and group chats
/notifications - Real-time notifications
/admin - Admin events and moderation
```

## Event Definitions

### Social Events (/social)

#### Connection Events
```javascript
// User connects to social namespace
'socket:connect'
Payload: {
  userId: string,
  username: string,
  avatar: string
}

// User disconnects from social namespace
'socket:disconnect'
Payload: {
  userId: string,
  reason: string
}

// User starts typing in post comments
'socket:typing'
Payload: {
  postId: string,
  userId: string,
  username: string
}
```

#### Post Events
```javascript
// New post created
'post:create'
Payload: {
  post: {
    id: string,
    author: {
      id: string,
      username: string,
      avatar: string
    },
    content: string,
    media: array,
    hashtags: array,
    createdAt: string
  }
}

// Post updated
'post:update'
Payload: {
  postId: string,
  content: string,
  hashtags: array,
  updatedAt: string
}

// Post deleted
'post:delete'
Payload: {
  postId: string,
  authorId: string
}

// Post liked/unliked
'post:like'
Payload: {
  postId: string,
  userId: string,
  username: string,
  action: 'like' | 'unlike',
  likesCount: number
}

// New comment on post
'post:comment'
Payload: {
  postId: string,
  comment: {
    id: string,
    author: {
      id: string,
      username: string,
      avatar: string
    },
    content: string,
    createdAt: string
  },
  commentsCount: number
}

// Post shared
'post:share'
Payload: {
  postId: string,
  userId: string,
  username: string,
  sharesCount: number
}
```

#### User Events
```javascript
// User followed/unfollowed
'user:follow'
Payload: {
  followerId: string,
  followerUsername: string,
  followingId: string,
  followingUsername: string,
  action: 'follow' | 'unfollow',
  followersCount: number
}

// User comes online
'user:online'
Payload: {
  userId: string,
  username: string,
  avatar: string,
  lastSeen: string
}

// User goes offline
'user:offline'
Payload: {
  userId: string,
  username: string,
  lastSeen: string
}

// User typing in comments
'user:typing'
Payload: {
  postId: string,
  userId: string,
  username: string,
  action: 'start' | 'stop'
}
```

### Messaging Events (/messaging)

#### Connection Events
```javascript
// Join conversation room
'message:join'
Payload: {
  conversationId: string,
  userId: string
}

// Leave conversation room
'message:leave'
Payload: {
  conversationId: string,
  userId: string
}

// User typing in conversation
'message:typing'
Payload: {
  conversationId: string,
  userId: string,
  username: string,
  action: 'start' | 'stop'
}
```

#### Message Events
```javascript
// Send new message
'message:send'
Payload: {
  conversationId: string,
  message: {
    id: string,
    sender: {
      id: string,
      username: string,
      avatar: string
    },
    content: string,
    messageType: 'text' | 'image' | 'video' | 'file',
    media: object,
    createdAt: string
  }
}

// Message delivered
'message:delivered'
Payload: {
  messageId: string,
  conversationId: string,
  deliveredTo: string,
  deliveredAt: string
}

// Message read
'message:read'
Payload: {
  messageId: string,
  conversationId: string,
  readBy: string,
  readAt: string
}

// Edit message
'message:edit'
Payload: {
  messageId: string,
  conversationId: string,
  content: string,
  editedAt: string
}

// Delete message
'message:delete'
Payload: {
  messageId: string,
  conversationId: string,
  deletedBy: string
}
```

#### Conversation Events
```javascript
// New conversation created
'conversation:create'
Payload: {
  conversation: {
    id: string,
    type: 'direct' | 'group',
    name: string,
    participants: array,
    createdAt: string
  }
}

// Conversation updated
'conversation:update'
Payload: {
  conversationId: string,
  updates: object,
  updatedAt: string
}

// Conversation deleted
'conversation:delete'
Payload: {
  conversationId: string,
  deletedBy: string
}
```

### Notification Events (/notifications)

#### Real-time Notifications
```javascript
// New notification
'notification:new'
Payload: {
  notification: {
    id: string,
    type: 'like' | 'comment' | 'follow' | 'mention' | 'message' | 'friend_request',
    sender: {
      id: string,
      username: string,
      avatar: string
    },
    recipient: string,
    post: object,
    comment: object,
    message: object,
    conversation: object,
    createdAt: string
  }
}

// Notification read
'notification:read'
Payload: {
  notificationId: string,
  readAt: string
}

// All notifications read
'notification:read-all'
Payload: {
  userId: string,
  readAt: string
}

// Notification deleted
'notification:delete'
Payload: {
  notificationId: string,
  deletedBy: string
}
```

## Socket.io Implementation Structure

### Connection Management
```typescript
// Socket user interface
interface SocketUser {
  userId: string;
  socketId: string;
  username: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: Date;
  activeConversations: string[];
  activeRooms: string[];
}

// Socket connection store
class SocketManager {
  private connections: Map<string, SocketUser> = new Map();
  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]
  
  // Add connection
  addConnection(socketId: string, user: SocketUser): void {
    this.connections.set(socketId, user);
    
    if (!this.userSockets.has(user.userId)) {
      this.userSockets.set(user.userId, []);
    }
    this.userSockets.get(user.userId)!.push(socketId);
  }
  
  // Remove connection
  removeConnection(socketId: string): SocketUser | null {
    const user = this.connections.get(socketId);
    if (user) {
      this.connections.delete(socketId);
      
      const userSocketIds = this.userSockets.get(user.userId);
      if (userSocketIds) {
        const index = userSocketIds.indexOf(socketId);
        if (index > -1) {
          userSocketIds.splice(index, 1);
        }
        if (userSocketIds.length === 0) {
          this.userSockets.delete(user.userId);
        }
      }
    }
    return user || null;
  }
  
  // Get user's socket IDs
  getUserSockets(userId: string): string[] {
    return this.userSockets.get(userId) || [];
  }
  
  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}
```

### Room Management
```javascript
// Room naming conventions
const rooms = {
  // User-specific room
  user: (userId) => `user:${userId}`,
  
  // Conversation room
  conversation: (conversationId) => `conversation:${conversationId}`,
  
  // Post room for real-time updates
  post: (postId) => `post:${postId}`,
  
  // Admin room
  admin: 'admin',
  
  // Public room for general announcements
  public: 'public'
};

// Room management functions
const roomManager = {
  // Join user to their personal room
  joinUserRoom: (socket, userId) => {
    const roomName = rooms.user(userId);
    socket.join(roomName);
    return roomName;
  },
  
  // Join conversation room
  joinConversation: (socket, conversationId) => {
    const roomName = rooms.conversation(conversationId);
    socket.join(roomName);
    return roomName;
  },
  
  // Leave conversation room
  leaveConversation: (socket, conversationId) => {
    const roomName = rooms.conversation(conversationId);
    socket.leave(roomName);
    return roomName;
  },
  
  // Join post room for real-time updates
  joinPostRoom: (socket, postId) => {
    const roomName = rooms.post(postId);
    socket.join(roomName);
    return roomName;
  }
};
```

### Event Handlers
```javascript
// Social namespace event handlers
const socialNamespace = io.of('/social');

socialNamespace.on('connection', (socket) => {
  const { userId, username, avatar } = socket.handshake.auth;
  
  // Store connection
  socketManager.addConnection(socket.id, {
    userId,
    socketId: socket.id,
    username,
    avatar,
    isOnline: true,
    lastSeen: new Date(),
    activeConversations: [],
    activeRooms: []
  });
  
  // Join user's personal room
  const userRoom = roomManager.joinUserRoom(socket, userId);
  socket.activeRooms.push(userRoom);
  
  // Emit user online event
  socket.broadcast.emit('user:online', {
    userId,
    username,
    avatar,
    lastSeen: new Date().toISOString()
  });
  
  // Handle post creation
  socket.on('post:create', async (data) => {
    try {
      // Save post to database
      const post = await postService.createPost(userId, data);
      
      // Emit to followers
      const followers = await userService.getFollowers(userId);
      followers.forEach(follower => {
        const followerSockets = socketManager.getUserSockets(follower.id);
        followerSockets.forEach(socketId => {
          socket.to(socketId).emit('post:create', { post });
        });
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to create post' });
    }
  });
  
  // Handle post like
  socket.on('post:like', async (data) => {
    try {
      const { postId, action } = data;
      
      if (action === 'like') {
        await postService.likePost(userId, postId);
      } else {
        await postService.unlikePost(userId, postId);
      }
      
      // Emit to post room
      socket.to(rooms.post(postId)).emit('post:like', {
        postId,
        userId,
        username,
        action,
        likesCount: await postService.getLikesCount(postId)
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to like/unlike post' });
    }
  });
  
  // Handle typing events
  socket.on('user:typing', (data) => {
    const { postId, action } = data;
    socket.to(rooms.post(postId)).emit('user:typing', {
      postId,
      userId,
      username,
      action
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    const user = socketManager.removeConnection(socket.id);
    if (user && !socketManager.isUserOnline(user.userId)) {
      // User is completely offline
      socket.broadcast.emit('user:offline', {
        userId: user.userId,
        username: user.username,
        lastSeen: new Date().toISOString()
      });
    }
  });
});
```

### Messaging Namespace
```javascript
// Messaging namespace event handlers
const messagingNamespace = io.of('/messaging');

messagingNamespace.on('connection', (socket) => {
  const { userId, username, avatar } = socket.handshake.auth;
  
  // Handle joining conversation
  socket.on('message:join', async (data) => {
    const { conversationId } = data;
    
    // Verify user is part of conversation
    const isParticipant = await conversationService.isParticipant(userId, conversationId);
    if (!isParticipant) {
      socket.emit('error', { message: 'Not authorized to join this conversation' });
      return;
    }
    
    // Join conversation room
    const roomName = roomManager.joinConversation(socket, conversationId);
    socket.activeConversations.push(conversationId);
    socket.activeRooms.push(roomName);
    
    socket.emit('message:joined', { conversationId });
  });
  
  // Handle sending message
  socket.on('message:send', async (data) => {
    try {
      const { conversationId, content, messageType, media } = data;
      
      // Save message to database
      const message = await messageService.createMessage(userId, conversationId, {
        content,
        messageType,
        media
      });
      
      // Emit to conversation room
      socket.to(rooms.conversation(conversationId)).emit('message:send', {
        conversationId,
        message
      });
      
      // Update conversation last activity
      await conversationService.updateLastActivity(conversationId);
      
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle typing events
  socket.on('message:typing', (data) => {
    const { conversationId, action } = data;
    socket.to(rooms.conversation(conversationId)).emit('message:typing', {
      conversationId,
      userId,
      username,
      action
    });
  });
  
  // Handle leaving conversation
  socket.on('message:leave', (data) => {
    const { conversationId } = data;
    const roomName = roomManager.leaveConversation(socket, conversationId);
    
    const index = socket.activeConversations.indexOf(conversationId);
    if (index > -1) {
      socket.activeConversations.splice(index, 1);
    }
    
    const roomIndex = socket.activeRooms.indexOf(roomName);
    if (roomIndex > -1) {
      socket.activeRooms.splice(roomIndex, 1);
    }
  });
});
```

### Notification Namespace
```javascript
// Notification namespace event handlers
const notificationNamespace = io.of('/notifications');

notificationNamespace.on('connection', (socket) => {
  const { userId } = socket.handshake.auth;
  
  // Join user's notification room
  const userRoom = roomManager.joinUserRoom(socket, userId);
  socket.activeRooms.push(userRoom);
  
  // Send unread notifications count
  socket.on('notification:get-count', async () => {
    try {
      const count = await notificationService.getUnreadCount(userId);
      socket.emit('notification:count', { count });
    } catch (error) {
      socket.emit('error', { message: 'Failed to get notification count' });
    }
  });
  
  // Mark notification as read
  socket.on('notification:read', async (data) => {
    try {
      const { notificationId } = data;
      await notificationService.markAsRead(notificationId, userId);
      socket.emit('notification:read', { notificationId });
    } catch (error) {
      socket.emit('error', { message: 'Failed to mark notification as read' });
    }
  });
});
```

### Error Handling
```javascript
// Global error handler for all namespaces
const handleSocketError = (socket, error) => {
  console.error('Socket error:', error);
  
  socket.emit('error', {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
};

// Apply error handling to all namespaces
[socialNamespace, messagingNamespace, notificationNamespace].forEach(namespace => {
  namespace.on('connection', (socket) => {
    socket.on('error', (error) => handleSocketError(socket, error));
  });
});
```

### Performance Optimization
```javascript
// Socket connection pooling
const connectionPool = {
  maxConnections: 1000,
  currentConnections: 0,
  
  canAcceptConnection: () => {
    return connectionPool.currentConnections < connectionPool.maxConnections;
  },
  
  incrementConnections: () => {
    connectionPool.currentConnections++;
  },
  
  decrementConnections: () => {
    connectionPool.currentConnections--;
  }
};

// Rate limiting for socket events
const socketRateLimit = {
  windowMs: 60000, // 1 minute
  maxEvents: 100, // max 100 events per minute per socket
  
  limits: new Map(), // socketId -> { count: number, resetTime: number }
  
  checkLimit: (socketId) => {
    const now = Date.now();
    const limit = socketRateLimit.limits.get(socketId);
    
    if (!limit || now > limit.resetTime) {
      socketRateLimit.limits.set(socketId, { count: 1, resetTime: now + socketRateLimit.windowMs });
      return true;
    }
    
    if (limit.count >= socketRateLimit.maxEvents) {
      return false;
    }
    
    limit.count++;
    return true;
  }
};
```

This Socket.io architecture provides a comprehensive real-time communication system for the social media platform with proper event handling, room management, and performance optimization. 