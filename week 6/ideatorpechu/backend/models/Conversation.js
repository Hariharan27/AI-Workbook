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
  // Enhanced unread count tracking
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  // Group conversation specific fields
  groupSettings: {
    admins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    joinByInvite: {
      type: Boolean,
      default: true
    },
    onlyAdminsCanSend: {
      type: Boolean,
      default: false
    },
    onlyAdminsCanEdit: {
      type: Boolean,
      default: false
    }
  },
  // Conversation settings per user
  settings: {
    allowMedia: {
      type: Boolean,
      default: true
    },
    allowReplies: {
      type: Boolean,
      default: true
    },
    allowReactions: {
      type: Boolean,
      default: true
    },
    allowForwarding: {
      type: Boolean,
      default: true
    },
    muted: {
      type: Map,
      of: Boolean,
      default: new Map()
    },
    pinned: {
      type: Map,
      of: Boolean,
      default: new Map()
    },
    archived: {
      type: Map,
      of: Boolean,
      default: new Map()
    },
    blocked: {
      type: Map,
      of: Boolean,
      default: new Map()
    }
  },
  // Pinned messages
  pinnedMessages: [{
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pinnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Conversation theme
  theme: {
    primaryColor: {
      type: String,
      default: '#1976d2'
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    textColor: {
      type: String,
      default: '#000000'
    }
  },
  // Conversation metadata
  metadata: {
    totalMessages: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    createdFrom: {
      type: String,
      enum: ['direct', 'group_creation', 'forwarded'],
      default: 'direct'
    }
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
conversationSchema.index({ 'settings.pinned': 1 });
conversationSchema.index({ 'settings.archived': 1 });
conversationSchema.index({ 'groupSettings.admins': 1 });

// Virtual for conversation title
conversationSchema.virtual('title').get(function() {
  if (this.name) return this.name;
  if (this.type === 'direct' && this.participants.length === 2) {
    return 'Direct Message'; // Will be populated with actual user data
  }
  return 'Group Chat';
});

// Virtual for conversation avatar
conversationSchema.virtual('displayAvatar').get(function() {
  if (this.avatar) return this.avatar;
  if (this.type === 'direct' && this.participants.length === 2) {
    return undefined; // Will be populated with other participant's avatar
  }
  return this.avatar;
});

// Pre-save middleware
conversationSchema.pre('save', function(next) {
  // Ensure participants are unique
  this.participants = [...new Set(this.participants)];
  
  // For direct conversations, ensure only 2 participants
  if (this.type === 'direct' && this.participants.length !== 2) {
    return next(new Error('Direct conversations must have exactly 2 participants'));
  }
  
  // For group conversations, ensure at least 3 participants
  if (this.type === 'group' && this.participants.length < 3) {
    return next(new Error('Group conversations must have at least 3 participants'));
  }
  
  // Ensure creator is in participants
  if (!this.participants.includes(this.createdBy)) {
    this.participants.push(this.createdBy);
  }
  
  // For group conversations, ensure creator is admin
  if (this.type === 'group' && !this.groupSettings.admins.includes(this.createdBy)) {
    this.groupSettings.admins.push(this.createdBy);
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

// Static method to create group conversation
conversationSchema.statics.createGroup = async function(data) {
  const {
    name,
    description,
    participants,
    createdBy,
    avatar
  } = data;

  const conversation = new this({
    type: 'group',
    name,
    description,
    participants,
    createdBy,
    avatar,
    groupSettings: {
      admins: [createdBy]
    }
  });

  await conversation.save();
  return conversation;
};

// Static method to get user conversations
conversationSchema.statics.getUserConversations = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    includeArchived = false,
    includePinned = true,
    search = null
  } = options;

  const query = {
    participants: userId,
    deleted: false
  };

  if (!includeArchived) {
    query[`settings.archived.${userId}`] = { $ne: true };
  }

  // Add search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const conversations = await this.find(query)
    .sort({ 
      [`settings.pinned.${userId}`]: -1, // Pinned conversations first
      lastMessageAt: -1 
    })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('participants', 'username avatar firstName lastName onlineStatus lastSeen')
    .populate('lastMessage', 'content messageType sender createdAt')
    .populate('createdBy', 'username avatar firstName lastName')
    .populate('groupSettings.admins', 'username avatar firstName lastName')
    .populate('pinnedMessages.message', 'content sender createdAt')
    .populate('pinnedMessages.pinnedBy', 'username avatar firstName lastName')
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
  .populate('groupSettings.admins', 'username avatar firstName lastName')
  .populate('pinnedMessages.message', 'content sender createdAt')
  .populate('pinnedMessages.pinnedBy', 'username avatar firstName lastName')
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

// Instance method to add participant (group only)
conversationSchema.methods.addParticipant = async function(userId, addedBy) {
  if (this.type === 'direct') {
    throw new Error('Cannot add participants to direct conversations');
  }
  
  // Check if user is admin (for group conversations)
  if (!this.groupSettings.admins.includes(addedBy)) {
    throw new Error('Only admins can add participants to group conversations');
  }
  
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    await this.save();
  }
  return this;
};

// Instance method to remove participant (group only)
conversationSchema.methods.removeParticipant = async function(userId, removedBy) {
  if (this.type === 'direct') {
    throw new Error('Cannot remove participants from direct conversations');
  }
  
  // Check if user is admin (for group conversations)
  if (!this.groupSettings.admins.includes(removedBy)) {
    throw new Error('Only admins can remove participants from group conversations');
  }
  
  // Cannot remove the last admin
  if (this.groupSettings.admins.includes(userId) && this.groupSettings.admins.length === 1) {
    throw new Error('Cannot remove the last admin from group conversation');
  }
  
  this.participants = this.participants.filter(p => p.toString() !== userId.toString());
  
  // Remove from admins if they were an admin
  this.groupSettings.admins = this.groupSettings.admins.filter(a => a.toString() !== userId.toString());
  
  await this.save();
  return this;
};

// Instance method to add admin (group only)
conversationSchema.methods.addAdmin = async function(userId, addedBy) {
  if (this.type === 'direct') {
    throw new Error('Direct conversations do not have admins');
  }
  
  // Check if user is admin
  if (!this.groupSettings.admins.includes(addedBy)) {
    throw new Error('Only admins can add other admins');
  }
  
  // Check if user is participant
  if (!this.participants.includes(userId)) {
    throw new Error('User must be a participant to become an admin');
  }
  
  if (!this.groupSettings.admins.includes(userId)) {
    this.groupSettings.admins.push(userId);
    await this.save();
  }
  return this;
};

// Instance method to remove admin (group only)
conversationSchema.methods.removeAdmin = async function(userId, removedBy) {
  if (this.type === 'direct') {
    throw new Error('Direct conversations do not have admins');
  }
  
  // Check if user is admin
  if (!this.groupSettings.admins.includes(removedBy)) {
    throw new Error('Only admins can remove other admins');
  }
  
  // Cannot remove the last admin
  if (this.groupSettings.admins.length === 1) {
    throw new Error('Cannot remove the last admin from group conversation');
  }
  
  this.groupSettings.admins = this.groupSettings.admins.filter(a => a.toString() !== userId.toString());
  await this.save();
  return this;
};

// Instance method to pin message
conversationSchema.methods.pinMessage = async function(messageId, pinnedBy) {
  // Check if user is participant
  if (!this.participants.includes(pinnedBy)) {
    throw new Error('User must be a participant to pin messages');
  }
  
  // Check if user is admin (for group conversations)
  if (this.type === 'group' && !this.groupSettings.admins.includes(pinnedBy)) {
    throw new Error('Only admins can pin messages in group conversations');
  }
  
  // Check if message is already pinned
  const alreadyPinned = this.pinnedMessages.find(pm => pm.message.toString() === messageId.toString());
  if (alreadyPinned) {
    throw new Error('Message is already pinned');
  }
  
  this.pinnedMessages.push({
    message: messageId,
    pinnedBy: pinnedBy,
    pinnedAt: new Date()
  });
  
  await this.save();
  return this;
};

// Instance method to unpin message
conversationSchema.methods.unpinMessage = async function(messageId, unpinnedBy) {
  // Check if user is participant
  if (!this.participants.includes(unpinnedBy)) {
    throw new Error('User must be a participant to unpin messages');
  }
  
  // Check if user is admin (for group conversations)
  if (this.type === 'group' && !this.groupSettings.admins.includes(unpinnedBy)) {
    throw new Error('Only admins can unpin messages in group conversations');
  }
  
  this.pinnedMessages = this.pinnedMessages.filter(pm => pm.message.toString() !== messageId.toString());
  await this.save();
  return this;
};

// Instance method to update settings
conversationSchema.methods.updateSettings = async function(userId, settings) {
  // Check if user is participant
  if (!this.participants.includes(userId)) {
    throw new Error('User must be a participant to update settings');
  }
  
  // For group conversations, only admins can update group settings
  if (this.type === 'group' && settings.groupSettings && !this.groupSettings.admins.includes(userId)) {
    throw new Error('Only admins can update group settings');
  }
  
  Object.assign(this.settings, settings);
  await this.save();
  return this;
};

// Instance method to toggle mute
conversationSchema.methods.toggleMute = async function(userId) {
  const currentMuted = this.settings.muted.get(userId) || false;
  this.settings.muted.set(userId, !currentMuted);
  await this.save();
  return this;
};

// Instance method to toggle pin
conversationSchema.methods.togglePin = async function(userId) {
  const currentPinned = this.settings.pinned.get(userId) || false;
  this.settings.pinned.set(userId, !currentPinned);
  await this.save();
  return this;
};

// Instance method to toggle archive
conversationSchema.methods.toggleArchive = async function(userId) {
  const currentArchived = this.settings.archived.get(userId) || false;
  this.settings.archived.set(userId, !currentArchived);
  await this.save();
  return this;
};

// Instance method to block user (for direct conversations)
conversationSchema.methods.blockUser = async function(userId, blockedBy) {
  if (this.type !== 'direct') {
    throw new Error('Can only block users in direct conversations');
  }
  
  if (!this.participants.includes(blockedBy)) {
    throw new Error('User must be a participant to block others');
  }
  
  this.settings.blocked.set(userId, true);
  await this.save();
  return this;
};

// Instance method to unblock user (for direct conversations)
conversationSchema.methods.unblockUser = async function(userId, unblockedBy) {
  if (this.type !== 'direct') {
    throw new Error('Can only unblock users in direct conversations');
  }
  
  if (!this.participants.includes(unblockedBy)) {
    throw new Error('User must be a participant to unblock others');
  }
  
  this.settings.blocked.set(userId, false);
  await this.save();
  return this;
};

module.exports = mongoose.model('Conversation', conversationSchema); 