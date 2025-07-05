import api from './api';

export interface Message {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    username: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'video' | 'file' | 'audio';
  media?: {
    url: string;
    filename: string;
    mimetype: string;
    size: number;
  };
  readBy: string[];
  deliveredTo: string[];
  replyTo?: {
    _id: string;
    content: string;
    sender: {
      _id: string;
      username: string;
    };
  };
  edited: boolean;
  editedAt?: string;
  deleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: Array<{
    _id: string;
    username: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
    onlineStatus?: 'online' | 'offline';
    lastSeen?: string;
  }>;
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  avatar?: string;
  createdBy: {
    _id: string;
    username: string;
    avatar?: string;
    firstName?: string;
    lastName?: string;
  };
  lastMessage?: {
    _id: string;
    content: string;
    messageType: string;
    sender: {
      _id: string;
      username: string;
    };
    createdAt: string;
  };
  lastMessageAt?: string;
  unreadCount: Record<string, number>;
  settings: {
    allowMedia: boolean;
    allowReplies: boolean;
    muted: Record<string, boolean>;
  };
  archived: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationData {
  participants: string[];
  type: 'direct' | 'group';
  name?: string;
  description?: string;
}

export interface CreateMessageData {
  content: string;
  messageType?: 'text' | 'image' | 'video' | 'file' | 'audio';
  replyTo?: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

class MessagesAPI {
  // Get user conversations
  async getConversations(params?: {
    page?: number;
    limit?: number;
    includeArchived?: boolean;
  }): Promise<{ conversations: Conversation[] }> {
    const response = await api.get('/messages/conversations', { params });
    return response.data;
  }

  // Create or get direct conversation
  async createDirectConversation(participantId: string): Promise<{ conversation: Conversation }> {
    const response = await api.post('/messages/conversations/direct', {
      participantId
    });
    return response.data;
  }

  // Create group conversation
  async createGroupConversation(data: CreateConversationData): Promise<{ conversation: Conversation }> {
    const response = await api.post('/messages/conversations/group', data);
    return response.data;
  }

  // Get conversation with messages
  async getConversation(
    conversationId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<{ conversation: ConversationWithMessages }> {
    const response = await api.get(`/messages/conversations/${conversationId}`, { params });
    return response.data;
  }

  // Send message
  async sendMessage(
    conversationId: string,
    data: CreateMessageData
  ): Promise<{ message: Message }> {
    const response = await api.post(`/messages/conversations/${conversationId}/messages`, data);
    return response.data;
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, messageIds: string[]): Promise<void> {
    await api.put(`/messages/conversations/${conversationId}/messages/read`, {
      messageIds
    });
  }

  // Delete message
  async deleteMessage(messageId: string): Promise<void> {
    await api.delete(`/messages/${messageId}`);
  }

  // Toggle conversation mute
  async toggleConversationMute(conversationId: string): Promise<{ muted: boolean }> {
    const response = await api.put(`/messages/conversations/${conversationId}/mute`);
    return response.data;
  }

  // Archive conversation
  async archiveConversation(conversationId: string): Promise<{ archived: boolean }> {
    const response = await api.put(`/messages/conversations/${conversationId}/archive`);
    return response.data;
  }

  // Get conversation title for display
  getConversationTitle(conversation: Conversation, currentUserId: string): string {
    if (conversation.name) {
      return conversation.name;
    }

    if (conversation.type === 'direct' && conversation.participants.length === 2) {
      const otherParticipant = conversation.participants.find(
        p => p._id !== currentUserId
      );
      return otherParticipant ? otherParticipant.username : 'Direct Message';
    }

    return 'Group Chat';
  }

  // Get conversation avatar
  getConversationAvatar(conversation: Conversation, currentUserId: string): string | undefined {
    if (conversation.avatar) {
      return conversation.avatar;
    }

    if (conversation.type === 'direct' && conversation.participants.length === 2) {
      const otherParticipant = conversation.participants.find(
        p => p._id !== currentUserId
      );
      return otherParticipant?.avatar;
    }

    return undefined;
  }

  // Get unread count for current user
  getUnreadCount(conversation: Conversation, currentUserId: string): number {
    return conversation.unreadCount[currentUserId] || 0;
  }

  // Check if conversation is muted for current user
  isConversationMuted(conversation: Conversation, currentUserId: string): boolean {
    return conversation.settings.muted[currentUserId] || false;
  }

  // Check if conversation is archived for current user
  isConversationArchived(conversation: Conversation, currentUserId: string): boolean {
    return conversation.archived[currentUserId] || false;
  }

  // Format message timestamp
  formatMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Check if message is from current user
  isMessageFromCurrentUser(message: Message, currentUserId: string): boolean {
    return message.sender._id === currentUserId;
  }

  // Check if message is read
  isMessageRead(message: Message, currentUserId: string): boolean {
    return message.readBy.includes(currentUserId);
  }

  // Check if message is delivered
  isMessageDelivered(message: Message, currentUserId: string): boolean {
    return message.deliveredTo.includes(currentUserId);
  }

  // Get message status
  getMessageStatus(message: Message, currentUserId: string): 'sent' | 'delivered' | 'read' | 'deleted' {
    if (message.deleted) return 'deleted';
    if (this.isMessageRead(message, currentUserId)) return 'read';
    if (this.isMessageDelivered(message, currentUserId)) return 'delivered';
    return 'sent';
  }
}

export default new MessagesAPI(); 