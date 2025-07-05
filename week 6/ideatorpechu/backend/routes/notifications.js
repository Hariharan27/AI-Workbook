const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Relationship = require('../models/Relationship');

// Get user's notifications
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { recipient: req.user._id };
    if (type) {
      query.type = type;
    }
    
    const notifications = await Notification.find(query)
      .populate('sender', 'username firstName lastName avatar')
      .populate('post', 'content')
      .populate('comment', 'content')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Notification.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        notifications,
        total,
        hasMore: skip + notifications.length < total
      },
      message: 'Notifications retrieved successfully'
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'NOTIFICATIONS_ERROR',
        message: 'Failed to retrieve notifications'
      }
    });
  }
});

// Mark notification as read
router.put('/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: req.user._id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: { notification },
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'NOTIFICATION_UPDATE_ERROR',
        message: 'Failed to mark notification as read'
      }
    });
  }
});

// Mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'NOTIFICATIONS_UPDATE_ERROR',
        message: 'Failed to mark all notifications as read'
      }
    });
  }
});

// Get unread notifications count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });
    
    res.json({
      success: true,
      data: { count },
      message: 'Unread count retrieved successfully'
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UNREAD_COUNT_ERROR',
        message: 'Failed to get unread count'
      }
    });
  }
});

// Delete notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user._id
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found'
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'NOTIFICATION_DELETE_ERROR',
        message: 'Failed to delete notification'
      }
    });
  }
});

// Get suggested users for notifications
router.get('/suggested-users', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    // Get users that the current user doesn't follow using Relationship model
    const followingRelationships = await Relationship.find({
      follower: req.user._id,
      status: 'accepted'
    }).select('following');
    
    const followingIds = followingRelationships.map(rel => rel.following);
    
    // Only get users that the current user doesn't follow
    const suggestedUsers = await User.find({
      _id: { $nin: [...followingIds, req.user._id] },
      isPrivate: false
    })
    .select('username firstName lastName avatar bio followersCount createdAt lastSeen')
    .sort({ followersCount: -1 })
    .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: { 
        users: suggestedUsers,
        message: suggestedUsers.length === 0 ? 'No users available for suggestions' : 'Suggested users retrieved successfully'
      },
      message: 'Suggested users retrieved successfully'
    });
  } catch (error) {
    console.error('Get suggested users error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUGGESTED_USERS_ERROR',
        message: 'Failed to get suggested users'
      }
    });
  }
});

module.exports = router; 