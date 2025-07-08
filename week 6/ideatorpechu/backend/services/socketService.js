const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // userId -> Set of socketIds
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3001",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupNamespaces();
    this.setupGlobalEvents();
  }

  setupMiddleware() {
    // Global middleware is now handled per namespace
    // This method is kept for compatibility but no longer needed
  }

  setupNamespaces() {
    // Social namespace for posts, likes, comments, etc.
    const socialNamespace = this.io.of('/social');
    socialNamespace.use(this.setupAuthMiddleware());
    this.setupSocialEvents(socialNamespace);

    // Messaging namespace for private messages
    const messagingNamespace = this.io.of('/messaging');
    messagingNamespace.use(this.setupAuthMiddleware());
    this.setupMessagingEvents(messagingNamespace);

    // Notifications namespace
    const notificationNamespace = this.io.of('/notifications');
    notificationNamespace.use(this.setupAuthMiddleware());
    this.setupNotificationEvents(notificationNamespace);
  }

  setupAuthMiddleware() {
    return async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error.message);
        next(new Error('Authentication error: Invalid token'));
      }
    };
  }

  setupSocialEvents(namespace) {
    namespace.on('connection', (socket) => {
      // Check if user is authenticated
      if (!socket.user || !socket.user._id) {
        console.error('Socket connection without authenticated user');
        socket.disconnect();
        return;
      }

      const userId = socket.user._id.toString();
      
      // Track connected user
      this.addConnectedUser(userId, socket.id);
      
      // Join user's personal room
      socket.join(`user:${userId}`);
      
      // Join user's followers' rooms for notifications
      socket.user.followers?.forEach(followerId => {
        socket.join(`user:${followerId}`);
      });

      console.log(`User ${socket.user.username} connected to social namespace`);

      // Handle typing indicators
      socket.on('typing:start', (data) => {
        socket.to(`post:${data.postId}`).emit('typing:start', {
          userId: userId,
          username: socket.user.username,
          postId: data.postId
        });
      });

      socket.on('typing:stop', (data) => {
        socket.to(`post:${data.postId}`).emit('typing:stop', {
          userId: userId,
          postId: data.postId
        });
      });

      // Handle post reactions
      socket.on('post:like', (data) => {
        this.handlePostLike(socket, data);
      });

      socket.on('post:comment', (data) => {
        this.handlePostComment(socket, data);
      });

      socket.on('post:share', (data) => {
        this.handlePostShare(socket, data);
      });

      // Handle user follow/unfollow
      socket.on('user:follow', (data) => {
        this.handleUserFollow(socket, data);
      });

      socket.on('disconnect', () => {
        this.removeConnectedUser(userId, socket.id);
        console.log(`User ${socket.user.username} disconnected from social namespace`);
      });
    });
  }

  setupMessagingEvents(namespace) {
    namespace.on('connection', (socket) => {
      // Check if user is authenticated
      if (!socket.user || !socket.user._id) {
        console.error('Socket connection without authenticated user');
        socket.disconnect();
        return;
      }

      const userId = socket.user._id.toString();
      
      console.log(`User ${socket.user.username} connected to messaging namespace`);

      // Join conversation
      socket.on('conversation:join', async (data) => {
        try {
          const conversation = await Conversation.findById(data.conversationId);
          if (conversation && conversation.participants.includes(userId)) {
            socket.join(`conversation:${data.conversationId}`);
            socket.emit('conversation:joined', { conversationId: data.conversationId });
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });

      // Leave conversation
      socket.on('conversation:leave', (data) => {
        socket.leave(`conversation:${data.conversationId}`);
        socket.emit('conversation:left', { conversationId: data.conversationId });
      });

      // Send message
      socket.on('message:send', async (data) => {
        try {
          const message = await this.handleMessageSend(socket, data);
          if (message) {
            socket.to(`conversation:${data.conversationId}`).emit('message:received', message);
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Typing indicators
      socket.on('message:typing:start', (data) => {
        socket.to(`conversation:${data.conversationId}`).emit('message:typing:start', {
          userId: userId,
          username: socket.user.username,
          conversationId: data.conversationId
        });
      });

      socket.on('message:typing:stop', (data) => {
        socket.to(`conversation:${data.conversationId}`).emit('message:typing:stop', {
          userId: userId,
          conversationId: data.conversationId
        });
      });

      // Mark message as read
      socket.on('message:read', async (data) => {
        try {
          await this.handleMessageRead(socket, data);
        } catch (error) {
          socket.emit('error', { message: 'Failed to mark message as read' });
        }
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.user.username} disconnected from messaging namespace`);
      });
    });
  }

  setupNotificationEvents(namespace) {
    namespace.on('connection', (socket) => {
      // Check if user is authenticated
      if (!socket.user || !socket.user._id) {
        console.error('Socket connection without authenticated user');
        socket.disconnect();
        return;
      }

      const userId = socket.user._id.toString();
      
      // Join user's notification room
      socket.join(`notifications:${userId}`);
      
      console.log(`User ${socket.user.username} connected to notifications namespace`);

      socket.on('disconnect', () => {
        console.log(`User ${socket.user.username} disconnected from notifications namespace`);
      });
    });
  }

  setupGlobalEvents() {
    this.io.on('connection', (socket) => {
      // Check if user is authenticated
      if (!socket.user || !socket.user._id) {
        console.error('Socket connection without authenticated user');
        socket.disconnect();
        return;
      }

      const userId = socket.user._id.toString();
      
      // Update user's online status
      this.updateUserStatus(userId, 'online');
      
      socket.on('disconnect', () => {
        this.updateUserStatus(userId, 'offline');
      });
    });
  }

  // Helper methods
  addConnectedUser(userId, socketId) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socketId);
    this.connectedUsers.set(socketId, userId);
  }

  removeConnectedUser(userId, socketId) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.connectedUsers.delete(socketId);
  }

  isUserOnline(userId) {
    return this.userSockets.has(userId);
  }

  async updateUserStatus(userId, status) {
    try {
      await User.findByIdAndUpdate(userId, {
        onlineStatus: status,
        lastSeen: status === 'offline' ? new Date() : undefined
      });

      // Emit status change to followers
      const user = await User.findById(userId);
      if (user && user.followers) {
        user.followers.forEach(followerId => {
          this.io.to(`user:${followerId}`).emit('user:status:change', {
            userId: userId,
            username: user.username,
            status: status,
            lastSeen: status === 'offline' ? new Date() : undefined
          });
        });
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  // Event handlers
  async handlePostLike(socket, data) {
    try {
      const { postId, action } = data;
      const userId = socket.user._id.toString();
      
      // Recalculate actual like count to ensure accuracy
      const Post = require('../models/Post');
      const actualLikeCount = await Post.recalculateLikeCount(postId);
      
      // Emit to post room with accurate count
      socket.to(`post:${postId}`).emit('post:like:update', {
        postId: postId,
        userId: userId,
        username: socket.user.username,
        action: action,
        newLikeCount: actualLikeCount,
        timestamp: new Date()
      });

      // Send notification to post author
      const post = await Post.findById(postId);
      if (post && post.author.toString() !== userId) {
        await this.sendNotification(post.author, {
          type: 'post_like',
          title: `${socket.user.username} liked your post`,
          message: `${socket.user.username} liked your post`,
          data: { postId, userId }
        });
      }
    } catch (error) {
      console.error('Error handling post like:', error);
    }
  }

  async handlePostComment(socket, data) {
    try {
      const { postId, comment } = data;
      const userId = socket.user._id.toString();
      
      // Emit to post room
      socket.to(`post:${postId}`).emit('post:comment:new', {
        postId: postId,
        comment: {
          ...comment,
          author: {
            id: userId,
            username: socket.user.username,
            avatar: socket.user.avatar
          }
        },
        timestamp: new Date()
      });

      // Send notification to post author
      const post = await require('../models/Post').findById(postId);
      if (post && post.author.toString() !== userId) {
        await this.sendNotification(post.author, {
          type: 'post_comment',
          title: `${socket.user.username} commented on your post`,
          message: `${socket.user.username}: ${comment.content.substring(0, 50)}...`,
          data: { postId, commentId: comment.id }
        });
      }
    } catch (error) {
      console.error('Error handling post comment:', error);
    }
  }

  async handlePostShare(socket, data) {
    try {
      const { postId } = data;
      const userId = socket.user._id.toString();
      
      // Emit to post room
      socket.to(`post:${postId}`).emit('post:share:new', {
        postId: postId,
        userId: userId,
        username: socket.user.username,
        timestamp: new Date()
      });

      // Send notification to post author
      const post = await require('../models/Post').findById(postId);
      if (post && post.author.toString() !== userId) {
        await this.sendNotification(post.author, {
          type: 'post_share',
          title: `${socket.user.username} shared your post`,
          message: `${socket.user.username} shared your post`,
          data: { postId, userId }
        });
      }
    } catch (error) {
      console.error('Error handling post share:', error);
    }
  }

  async handleUserFollow(socket, data) {
    try {
      const { targetUserId, action } = data;
      const userId = socket.user._id.toString();
      
      // Emit to target user
      socket.to(`user:${targetUserId}`).emit('user:follow:update', {
        followerId: userId,
        followerUsername: socket.user.username,
        action: action,
        timestamp: new Date()
      });

      // Send notification to target user
      if (action === 'follow') {
        await this.sendNotification(targetUserId, {
          type: 'user_follow',
          title: `${socket.user.username} started following you`,
          message: `${socket.user.username} started following you`,
          data: { followerId: userId }
        });
      }
    } catch (error) {
      console.error('Error handling user follow:', error);
    }
  }

  async handleMessageSend(socket, data) {
    try {
      const { conversationId, content, messageType = 'text', media } = data;
      const userId = socket.user._id.toString();

      // Create message in database
      const message = new Message({
        conversation: conversationId,
        sender: userId,
        content,
        messageType,
        media
      });
      await message.save();

      // Update conversation last message
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        lastMessageAt: new Date()
      });

      // Return message for emission
      return {
        id: message._id,
        conversationId: conversationId,
        sender: {
          id: userId,
          username: socket.user.username,
          avatar: socket.user.avatar
        },
        content,
        messageType,
        media,
        createdAt: message.createdAt
      };
    } catch (error) {
      console.error('Error handling message send:', error);
      return null;
    }
  }

  async handleMessageRead(socket, data) {
    try {
      const { conversationId, messageIds } = data;
      const userId = socket.user._id.toString();

      // Mark messages as read
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          conversation: conversationId,
          sender: { $ne: userId }
        },
        { readBy: { $addToSet: userId } }
      );

      // Emit read receipt
      socket.to(`conversation:${conversationId}`).emit('message:read:receipt', {
        conversationId,
        messageIds,
        readBy: userId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling message read:', error);
    }
  }

  async sendNotification(userId, notificationData) {
    try {
      // Create notification in database
      const notification = new Notification({
        recipient: userId,
        ...notificationData
      });
      await notification.save();

      // Emit to user's notification room
      this.io.to(`notifications:${userId}`).emit('notification:new', {
        id: notification._id,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        createdAt: notification.createdAt
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  // Public methods for external use
  emitToUser(userId, event, data) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  emitToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  joinRoom(socketId, room) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(room);
    }
  }

  leaveRoom(socketId, room) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.leave(room);
    }
  }
}

module.exports = new SocketService(); 