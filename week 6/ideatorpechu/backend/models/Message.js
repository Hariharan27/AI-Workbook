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
    enum: ['text', 'image', 'video', 'file', 'audio'],
    default: 'text'
  },
  media: {
    url: String,
    filename: String,
    mimetype: String,
    size: Number
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deliveredTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ readBy: 1 });

// Virtual for message status
messageSchema.virtual('status').get(function() {
  if (this.deleted) return 'deleted';
  if (this.readBy.length > 0) return 'read';
  if (this.deliveredTo.length > 0) return 'delivered';
  return 'sent';
});

// Pre-save middleware
messageSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.edited = true;
    this.editedAt = new Date();
  }
  next();
});

// Static method to get conversation messages
messageSchema.statics.getConversationMessages = async function(conversationId, options = {}) {
  const {
    page = 1,
    limit = 50,
    before = null,
    after = null
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

  const messages = await this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'username avatar firstName lastName')
    .populate('replyTo', 'content sender')
    .lean();

  return messages.reverse(); // Return in chronological order
};

// Instance method to mark as read
messageSchema.methods.markAsRead = async function(userId) {
  if (!this.readBy.includes(userId)) {
    this.readBy.push(userId);
    await this.save();
  }
  return this;
};

// Instance method to mark as delivered
messageSchema.methods.markAsDelivered = async function(userId) {
  if (!this.deliveredTo.includes(userId)) {
    this.deliveredTo.push(userId);
    await this.save();
  }
  return this;
};

// Instance method to soft delete
messageSchema.methods.softDelete = async function() {
  this.deleted = true;
  this.deletedAt = new Date();
  await this.save();
  return this;
};

module.exports = mongoose.model('Message', messageSchema); 