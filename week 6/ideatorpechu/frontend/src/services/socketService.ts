import { io, Socket } from 'socket.io-client';

export interface SocketMessage {
  id: string;
  conversationId: string;
  sender: {
    id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'video' | 'file' | 'audio';
  replyTo?: any;
  createdAt: string;
}

export interface SocketNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  createdAt: string;
}

export interface TypingIndicator {
  userId: string;
  username: string;
  postId?: string;
  conversationId?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private socialSocket: Socket | null = null;
  private messagingSocket: Socket | null = null;
  private notificationSocket: Socket | null = null;
  private authToken: string | null = null;

  // Event listeners
  private messageListeners: ((message: SocketMessage) => void)[] = [];
  private notificationListeners: ((notification: SocketNotification) => void)[] = [];
  private typingListeners: ((typing: TypingIndicator) => void)[] = [];
  private typingStopListeners: ((typing: TypingIndicator) => void)[] = [];
  private userStatusListeners: ((status: any) => void)[] = [];
  private postLikeListeners: ((data: any) => void)[] = [];
  private postCommentListeners: ((data: any) => void)[] = [];
  private postShareListeners: ((data: any) => void)[] = [];

  connect(token: string) {
    this.authToken = token;
    
    const socketOptions = {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true
    };

    // Connect to main namespace
    this.socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000', socketOptions);
    
    // Connect to social namespace
    this.socialSocket = io(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000'}/social`, socketOptions);
    
    // Connect to messaging namespace
    this.messagingSocket = io(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000'}/messaging`, socketOptions);
    
    // Connect to notifications namespace
    this.notificationSocket = io(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000'}/notifications`, socketOptions);

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Main socket events
    if (this.socket) {
      this.socket.on('connect', () => {
        console.log('Connected to main socket namespace');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from main socket namespace');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }

    // Social socket events
    if (this.socialSocket) {
      this.socialSocket.on('connect', () => {
        console.log('Connected to social socket namespace');
      });

      this.socialSocket.on('typing:start', (data: TypingIndicator) => {
        this.typingListeners.forEach(listener => listener(data));
      });

      this.socialSocket.on('typing:stop', (data: TypingIndicator) => {
        this.typingStopListeners.forEach(listener => listener(data));
      });

      this.socialSocket.on('post:like:update', (data: any) => {
        this.postLikeListeners.forEach(listener => listener(data));
      });

      this.socialSocket.on('post:comment:new', (data: any) => {
        this.postCommentListeners.forEach(listener => listener(data));
      });

      this.socialSocket.on('post:share:new', (data: any) => {
        this.postShareListeners.forEach(listener => listener(data));
      });

      this.socialSocket.on('user:status:change', (data: any) => {
        this.userStatusListeners.forEach(listener => listener(data));
      });
    }

    // Messaging socket events
    if (this.messagingSocket) {
      this.messagingSocket.on('connect', () => {
        console.log('Connected to messaging socket namespace');
      });

      this.messagingSocket.on('conversation:joined', (data: any) => {
        console.log('Joined conversation:', data.conversationId);
      });

      this.messagingSocket.on('conversation:left', (data: any) => {
        console.log('Left conversation:', data.conversationId);
      });

      this.messagingSocket.on('message:received', (message: SocketMessage) => {
        this.messageListeners.forEach(listener => listener(message));
      });

      this.messagingSocket.on('message:typing:start', (data: TypingIndicator) => {
        this.typingListeners.forEach(listener => listener(data));
      });

      this.messagingSocket.on('message:typing:stop', (data: TypingIndicator) => {
        this.typingStopListeners.forEach(listener => listener(data));
      });

      this.messagingSocket.on('message:read:receipt', (data: any) => {
        console.log('Message read receipt:', data);
      });

      this.messagingSocket.on('message:deleted', (data: any) => {
        console.log('Message deleted:', data);
      });
    }

    // Notification socket events
    if (this.notificationSocket) {
      this.notificationSocket.on('connect', () => {
        console.log('Connected to notification socket namespace');
      });

      this.notificationSocket.on('notification:new', (notification: SocketNotification) => {
        this.notificationListeners.forEach(listener => listener(notification));
      });
    }
  }

  // Social events
  emitTypingStart(postId: string) {
    if (this.socialSocket) {
      this.socialSocket.emit('typing:start', { postId });
    }
  }

  emitTypingStop(postId: string) {
    if (this.socialSocket) {
      this.socialSocket.emit('typing:stop', { postId });
    }
  }

  // Messaging events
  joinConversation(conversationId: string) {
    if (this.messagingSocket) {
      this.messagingSocket.emit('conversation:join', { conversationId });
    }
  }

  leaveConversation(conversationId: string) {
    if (this.messagingSocket) {
      this.messagingSocket.emit('conversation:leave', { conversationId });
    }
  }

  emitMessageTypingStart(conversationId: string) {
    if (this.messagingSocket) {
      this.messagingSocket.emit('message:typing:start', { conversationId });
    }
  }

  emitMessageTypingStop(conversationId: string) {
    if (this.messagingSocket) {
      this.messagingSocket.emit('message:typing:stop', { conversationId });
    }
  }

  sendMessage(messageData: {
    conversationId: string;
    content: string;
    messageType: 'text' | 'image' | 'video' | 'file' | 'audio';
  }) {
    if (this.messagingSocket) {
      this.messagingSocket.emit('message:send', messageData);
    }
  }

  // Event listeners
  onMessageReceived(callback: (message: SocketMessage) => void) {
    this.messageListeners.push(callback);
  }

  onNotificationReceived(callback: (notification: SocketNotification) => void) {
    this.notificationListeners.push(callback);
  }

  onTypingStart(callback: (typing: TypingIndicator) => void) {
    this.typingListeners.push(callback);
  }

  onTypingStop(callback: (typing: TypingIndicator) => void) {
    this.typingStopListeners.push(callback);
  }

  onUserStatusChange(callback: (status: any) => void) {
    this.userStatusListeners.push(callback);
  }

  onPostLike(callback: (data: any) => void) {
    this.postLikeListeners.push(callback);
  }

  onPostComment(callback: (data: any) => void) {
    this.postCommentListeners.push(callback);
  }

  onPostShare(callback: (data: any) => void) {
    this.postShareListeners.push(callback);
  }

  // Remove event listeners
  removeMessageListener(callback: (message: SocketMessage) => void) {
    this.messageListeners = this.messageListeners.filter(listener => listener !== callback);
  }

  removeNotificationListener(callback: (notification: SocketNotification) => void) {
    this.notificationListeners = this.notificationListeners.filter(listener => listener !== callback);
  }

  removeTypingListener(callback: (typing: TypingIndicator) => void) {
    this.typingListeners = this.typingListeners.filter(listener => listener !== callback);
  }

  removeTypingStopListener(callback: (typing: TypingIndicator) => void) {
    this.typingStopListeners = this.typingStopListeners.filter(listener => listener !== callback);
  }

  removeUserStatusListener(callback: (status: any) => void) {
    this.userStatusListeners = this.userStatusListeners.filter(listener => listener !== callback);
  }

  removePostLikeListener(callback: (data: any) => void) {
    this.postLikeListeners = this.postLikeListeners.filter(listener => listener !== callback);
  }

  removePostCommentListener(callback: (data: any) => void) {
    this.postCommentListeners = this.postCommentListeners.filter(listener => listener !== callback);
  }

  removePostShareListener(callback: (data: any) => void) {
    this.postShareListeners = this.postShareListeners.filter(listener => listener !== callback);
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.socialSocket) {
      this.socialSocket.disconnect();
      this.socialSocket = null;
    }
    if (this.messagingSocket) {
      this.messagingSocket.disconnect();
      this.messagingSocket = null;
    }
    if (this.notificationSocket) {
      this.notificationSocket.disconnect();
      this.notificationSocket = null;
    }

    // Clear all listeners
    this.messageListeners = [];
    this.notificationListeners = [];
    this.typingListeners = [];
    this.typingStopListeners = [];
    this.userStatusListeners = [];
    this.postLikeListeners = [];
    this.postCommentListeners = [];
    this.postShareListeners = [];

    this.authToken = null;
  }

  // Check connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  isSocialConnected(): boolean {
    return this.socialSocket?.connected || false;
  }

  isMessagingConnected(): boolean {
    return this.messagingSocket?.connected || false;
  }

  isNotificationConnected(): boolean {
    return this.notificationSocket?.connected || false;
  }
}

export default new SocketService(); 