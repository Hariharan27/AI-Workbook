const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'unfollow', 'mention', 'share', 'reply', 'message', 'new_post'],
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation'
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, type: 1 });

// Virtual for formatted time
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
});

// Ensure virtual fields are serialized
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return await this.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  );
};

// Static method to mark all notifications as read
notificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipient: userId,
    isRead: false
  });
};

// Pre-save middleware to generate title and message
notificationSchema.pre('save', function(next) {
  if (!this.title || !this.message) {
    const { type, sender } = this;
    
    switch (type) {
      case 'like':
        this.title = `${sender.firstName || sender.username} liked your post`;
        this.message = 'liked your post';
        break;
      case 'comment':
        this.title = `${sender.firstName || sender.username} commented on your post`;
        this.message = 'commented on your post';
        break;
      case 'follow':
        this.title = `${sender.firstName || sender.username} started following you`;
        this.message = 'started following you';
        break;
      case 'mention':
        this.title = `${sender.firstName || sender.username} mentioned you in a post`;
        this.message = 'mentioned you in a post';
        break;
      case 'share':
        this.title = `${sender.firstName || sender.username} shared your post`;
        this.message = 'shared your post';
        break;
      case 'reply':
        this.title = `${sender.firstName || sender.username} replied to your comment`;
        this.message = 'replied to your comment';
        break;
      case 'unfollow':
        this.title = `${sender.firstName || sender.username} unfollowed you`;
        this.message = 'unfollowed you';
        break;
      case 'message':
        this.title = `New message from ${sender.firstName || sender.username}`;
        this.message = 'sent you a message';
        break;
      case 'new_post':
        this.title = `${sender.firstName || sender.username} created a new post`;
        this.message = 'created a new post';
        break;
      default:
        this.title = 'New notification';
        this.message = 'You have a new notification';
    }
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema); 