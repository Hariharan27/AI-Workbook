const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'file', 'audio', 'location', 'contact'],
    default: 'text'
  },
  media: {
    url: String,
    filename: String,
    mimetype: String,
    size: Number,
    thumbnail: String,
    duration: Number, // For audio/video
    dimensions: {
      width: Number,
      height: Number
    }
  },
  // Enhanced status tracking
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
    default: 'sending'
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Message reactions (like WhatsApp/Telegram)
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reaction: {
      type: String,
      enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // Forwarded message information
  forwardedFrom: {
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Message editing
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Message deletion
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Message expiration (for self-destructing messages)
  expiresAt: Date,
  // Message priority (for important messages)
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  // Message metadata
  metadata: {
    clientMessageId: String, // For deduplication
    deviceInfo: String, // Device that sent the message
    appVersion: String // App version
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ 'readBy.user': 1 });
messageSchema.index({ 'reactions.user': 1 });
messageSchema.index({ replyTo: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for expired messages

// Virtual for message status
messageSchema.virtual('displayStatus').get(function() {
  if (this.deleted) return 'deleted';
  if (this.expiresAt && this.expiresAt < new Date()) return 'expired';
  return this.status;
});

// Virtual for reaction counts
messageSchema.virtual('reactionCounts').get(function() {
  const counts = {};
  this.reactions.forEach(reaction => {
    counts[reaction.reaction] = (counts[reaction.reaction] || 0) + 1;
  });
  return counts;
});

// Pre-save middleware
messageSchema.pre('save', function(next) {
  // Handle content editing
  if (this.isModified('content') && !this.isNew) {
    this.edited = true;
    this.editedAt = new Date();
    
    // Store edit history
    if (!this.editHistory) this.editHistory = [];
    this.editHistory.push({
      content: this.content,
      editedAt: this.editedAt
    });
  }
  
  // Set initial status
  if (this.isNew) {
    this.status = 'sending';
  }
  
  next();
});

// Static method to get conversation messages
messageSchema.statics.getConversationMessages = async function(conversationId, options = {}) {
  const {
    page = 1,
    limit = 50,
    before = null,
    after = null,
    search = null
  } = options;

  const query = {
    conversation: conversationId,
    deleted: false
  };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  } else if (after) {
    query.createdAt = { $gt: new Date(after) };
  }

  // Add search functionality
  if (search) {
    query.content = { $regex: search, $options: 'i' };
  }

  const messages = await this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'username avatar firstName lastName')
    .populate('replyTo', 'content sender')
    .populate('reactions.user', 'username avatar firstName lastName')
    .populate('readBy.user', 'username avatar firstName lastName')
    .populate('deliveredTo.user', 'username avatar firstName lastName')
    .lean();

  return messages.reverse(); // Return in chronological order
};

// Static method to search messages
messageSchema.statics.searchMessages = async function(userId, searchQuery, options = {}) {
  const {
    page = 1,
    limit = 20,
    conversationId = null
  } = options;

  const query = {
    deleted: false,
    $or: [
      { content: { $regex: searchQuery, $options: 'i' } },
      { 'media.filename': { $regex: searchQuery, $options: 'i' } }
    ]
  };

  // If searching in specific conversation
  if (conversationId) {
    query.conversation = conversationId;
  }

  const messages = await this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'username avatar firstName lastName')
    .populate('conversation', 'name type')
    .populate('replyTo', 'content sender')
    .lean();

  return messages;
};

// Instance method to mark as read
messageSchema.methods.markAsRead = async function(userId) {
  const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());
  if (!existingRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
    this.status = 'read';
    await this.save();
  }
  return this;
};

// Instance method to mark as delivered
messageSchema.methods.markAsDelivered = async function(userId) {
  const existingDelivery = this.deliveredTo.find(delivery => delivery.user.toString() === userId.toString());
  if (!existingDelivery) {
    this.deliveredTo.push({
      user: userId,
      deliveredAt: new Date()
    });
    if (this.status === 'sent') {
      this.status = 'delivered';
    }
    await this.save();
  }
  return this;
};

// Instance method to add reaction
messageSchema.methods.addReaction = async function(userId, reaction) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    reaction: reaction,
    createdAt: new Date()
  });
  
  await this.save();
  return this;
};

// Instance method to remove reaction
messageSchema.methods.removeReaction = async function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  await this.save();
  return this;
};

// Instance method to soft delete
messageSchema.methods.softDelete = async function(userId) {
  this.deleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  await this.save();
  return this;
};

// Instance method to edit message
messageSchema.methods.editMessage = async function(newContent) {
  if (this.messageType !== 'text') {
    throw new Error('Only text messages can be edited');
  }
  
  this.content = newContent;
  this.edited = true;
  this.editedAt = new Date();
  
  if (!this.editHistory) this.editHistory = [];
  this.editHistory.push({
    content: newContent,
    editedAt: this.editedAt
  });
  
  await this.save();
  return this;
};

// Instance method to forward message
messageSchema.methods.forwardTo = async function(targetConversationId, senderId) {
  const Message = require('./Message');
  
  const forwardedMessage = new Message({
    conversation: targetConversationId,
    sender: senderId,
    content: this.content,
    messageType: this.messageType,
    media: this.media,
    forwardedFrom: {
      message: this._id,
      conversation: this.conversation,
      sender: this.sender
    }
  });
  
  await forwardedMessage.save();
  return forwardedMessage;
};

module.exports = mongoose.model('Message', messageSchema); 