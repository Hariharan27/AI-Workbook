const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  avatar: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  settings: {
    allowMedia: {
      type: Boolean,
      default: true
    },
    allowReplies: {
      type: Boolean,
      default: true
    },
    muted: {
      type: Map,
      of: Boolean,
      default: new Map()
    }
  },
  archived: {
    type: Map,
    of: Boolean,
    default: new Map()
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ type: 1, participants: 1 });

// Virtual for conversation title
conversationSchema.virtual('title').get(function() {
  if (this.name) return this.name;
  if (this.type === 'direct' && this.participants.length === 2) {
    // For direct messages, show other participant's name
    return 'Direct Message'; // Will be populated with actual user data
  }
  return 'Group Chat';
});

// Pre-save middleware
conversationSchema.pre('save', function(next) {
  // Ensure participants are unique
  this.participants = [...new Set(this.participants)];
  
  // For direct conversations, ensure only 2 participants
  if (this.type === 'direct' && this.participants.length !== 2) {
    return next(new Error('Direct conversations must have exactly 2 participants'));
  }
  
  next();
});

// Static method to find or create direct conversation
conversationSchema.statics.findOrCreateDirect = async function(userId1, userId2) {
  const participants = [userId1, userId2].sort();
  
  let conversation = await this.findOne({
    type: 'direct',
    participants: participants,
    deleted: false
  });

  if (!conversation) {
    conversation = new this({
      type: 'direct',
      participants: participants,
      createdBy: userId1
    });
    await conversation.save();
  }

  return conversation;
};

// Static method to get user conversations
conversationSchema.statics.getUserConversations = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    includeArchived = false
  } = options;

  const query = {
    participants: userId,
    deleted: false
  };

  if (!includeArchived) {
    query[`archived.${userId}`] = { $ne: true };
  }

  const conversations = await this.find(query)
    .sort({ lastMessageAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('participants', 'username avatar firstName lastName onlineStatus lastSeen')
    .populate('lastMessage', 'content messageType sender createdAt')
    .populate('createdBy', 'username avatar firstName lastName')
    .lean();

  return conversations;
};

// Static method to get conversation with messages
conversationSchema.statics.getConversationWithMessages = async function(conversationId, userId, options = {}) {
  const conversation = await this.findOne({
    _id: conversationId,
    participants: userId,
    deleted: false
  })
  .populate('participants', 'username avatar firstName lastName onlineStatus lastSeen')
  .populate('lastMessage', 'content messageType sender createdAt')
  .populate('createdBy', 'username avatar firstName lastName')
  .lean();

  if (!conversation) {
    return null;
  }

  // Get messages
  const Message = require('./Message');
  const messages = await Message.getConversationMessages(conversationId, options);

  return {
    ...conversation,
    messages
  };
};

// Instance method to add participant
conversationSchema.methods.addParticipant = async function(userId) {
  if (this.type === 'direct') {
    throw new Error('Cannot add participants to direct conversations');
  }
  
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    await this.save();
  }
  return this;
};

// Instance method to remove participant
conversationSchema.methods.removeParticipant = async function(userId) {
  if (this.type === 'direct') {
    throw new Error('Cannot remove participants from direct conversations');
  }
  
  this.participants = this.participants.filter(p => p.toString() !== userId.toString());
  await this.save();
  return this;
};

// Instance method to update last message
conversationSchema.methods.updateLastMessage = async function(messageId) {
  this.lastMessage = messageId;
  this.lastMessageAt = new Date();
  await this.save();
  return this;
};

// Instance method to increment unread count
conversationSchema.methods.incrementUnreadCount = async function(userId) {
  const currentCount = this.unreadCount.get(userId.toString()) || 0;
  this.unreadCount.set(userId.toString(), currentCount + 1);
  await this.save();
  return this;
};

// Instance method to reset unread count
conversationSchema.methods.resetUnreadCount = async function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  await this.save();
  return this;
};

// Instance method to toggle mute
conversationSchema.methods.toggleMute = async function(userId) {
  const currentMuted = this.settings.muted.get(userId.toString()) || false;
  this.settings.muted.set(userId.toString(), !currentMuted);
  await this.save();
  return this;
};

// Instance method to toggle archive
conversationSchema.methods.toggleArchive = async function(userId) {
  const currentArchived = this.archived.get(userId.toString()) || false;
  this.archived.set(userId.toString(), !currentArchived);
  await this.save();
  return this;
};

module.exports = mongoose.model('Conversation', conversationSchema); 