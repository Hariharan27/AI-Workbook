const express = require('express');
const { body, param, query, validationResult } = require('express-validator');

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const socketService = require('../services/socketService');

const router = express.Router();

// Validation middleware
const validateConversation = [
  body('participants').isArray({ min: 1 }).withMessage('At least one participant is required'),
  body('participants.*').isMongoId().withMessage('Invalid participant ID'),
  body('type').optional().isIn(['direct', 'group']).withMessage('Invalid conversation type'),
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
];

const validateMessage = [
  body('content').isLength({ min: 1, max: 2000 }).withMessage('Message content must be between 1 and 2000 characters'),
  body('messageType').optional().isIn(['text', 'image', 'video', 'file', 'audio']).withMessage('Invalid message type'),
  body('replyTo').optional().isMongoId().withMessage('Invalid reply message ID')
];

// Get user conversations
router.get('/conversations', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('includeArchived').optional().isBoolean().withMessage('includeArchived must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { page = 1, limit = 20, includeArchived = false } = req.query;
    const userId = req.user._id;

    const conversations = await Conversation.getUserConversations(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      includeArchived: includeArchived === 'true'
    });

    res.json({
      success: true,
      data: { conversations },
      message: 'Conversations retrieved successfully'
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONVERSATIONS_ERROR',
        message: 'Failed to retrieve conversations'
      }
    });
  }
});

// Create or get direct conversation
router.post('/conversations/direct', [
  body('participantId').isMongoId().withMessage('Invalid participant ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { participantId } = req.body;
    const userId = req.user._id;

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Participant not found'
        }
      });
    }

    // Prevent self-conversation
    if (userId.toString() === participantId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARTICIPANT',
          message: 'Cannot create conversation with yourself'
        }
      });
    }

    const conversation = await Conversation.findOrCreateDirect(userId, participantId);
    
    // Populate participant data
    await conversation.populate('participants', 'username avatar firstName lastName onlineStatus lastSeen');

    res.json({
      success: true,
      data: { conversation },
      message: 'Direct conversation created/retrieved successfully'
    });
  } catch (error) {
    console.error('Create direct conversation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONVERSATION_ERROR',
        message: 'Failed to create direct conversation'
      }
    });
  }
});

// Create group conversation
router.post('/conversations/group', [
  body('name').isLength({ min: 1, max: 100 }).withMessage('Group name must be between 1 and 100 characters'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('participants').isArray({ min: 2 }).withMessage('At least 2 participants are required'),
  body('participants.*').isMongoId().withMessage('Invalid participant ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { name, description, participants, avatar } = req.body;
    const userId = req.user._id;

    // Add creator to participants if not already included
    if (!participants.includes(userId.toString())) {
      participants.push(userId.toString());
    }

    // Check if all participants exist
    const participantUsers = await User.find({ _id: { $in: participants } });
    if (participantUsers.length !== participants.length) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARTICIPANTS',
          message: 'One or more participants not found'
        }
      });
    }

    const conversation = await Conversation.createGroup({
      name,
      description,
      participants,
      createdBy: userId,
      avatar
    });

    await conversation.populate('participants', 'username avatar firstName lastName onlineStatus lastSeen');
    await conversation.populate('createdBy', 'username avatar firstName lastName');
    await conversation.populate('groupSettings.admins', 'username avatar firstName lastName');

    // Emit real-time update to all participants
    participants.forEach(participantId => {
      socketService.emitToUser(participantId, 'conversation:created', {
        conversation
      });
    });

    res.status(201).json({
      success: true,
      data: { conversation },
      message: 'Group conversation created successfully'
    });
  } catch (error) {
    console.error('Create group conversation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONVERSATION_ERROR',
        message: 'Failed to create group conversation'
      }
    });
  }
});

// Get conversation with messages
router.get('/conversations/:conversationId', [
  param('conversationId').isMongoId().withMessage('Invalid conversation ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    const conversation = await Conversation.getConversationWithMessages(conversationId, userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found'
        }
      });
    }

    // Reset unread count for this user
    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCount.${userId}`]: 0
    });

    res.json({
      success: true,
      data: { conversation },
      message: 'Conversation retrieved successfully'
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONVERSATION_ERROR',
        message: 'Failed to retrieve conversation'
      }
    });
  }
});

// Send message
router.post('/conversations/:conversationId/messages', [
  param('conversationId').isMongoId().withMessage('Invalid conversation ID'),
  ...validateMessage
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { conversationId } = req.params;
    const { content, messageType = 'text', replyTo } = req.body;
    const userId = req.user._id;

    // Check if user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      deleted: false
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found or access denied'
        }
      });
    }

    // Create message
    const message = new Message({
      conversation: conversationId,
      sender: userId,
      content,
      messageType,
      replyTo
    });

    await message.save();
    await message.populate('sender', 'username avatar firstName lastName');
    await message.populate('replyTo', 'content sender');

    // Update conversation last message
    await conversation.updateLastMessage(message._id);

    // Increment unread count for other participants and send notifications
    const otherParticipants = conversation.participants.filter(p => p.toString() !== userId.toString());
    for (const participantId of otherParticipants) {
      await conversation.incrementUnreadCount(participantId);
      
      // Send notification for new message
      try {
        const notification = await Notification.create({
          recipient: participantId,
          sender: userId,
          type: 'message',
          conversation: conversationId,
          title: `New message from ${req.user.firstName || req.user.username}`,
          message: 'sent you a message'
        });

        // Populate sender info for socket emission
        await notification.populate('sender', 'username firstName lastName avatar');

        // Emit real-time notification
        socketService.emitToUser(participantId, 'notification:new', {
          type: 'message',
          sender: notification.sender,
          conversation: conversationId,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt
        });
      } catch (notificationError) {
        console.error('Failed to create message notification:', notificationError);
        // Don't fail the message sending if notification fails
      }
    }

    // Emit to socket
    socketService.emitToRoom(`conversation:${conversationId}`, 'message:received', {
      id: message._id,
      conversationId: conversationId,
      sender: {
        id: message.sender._id,
        username: message.sender.username,
        avatar: message.sender.avatar
      },
      content: message.content,
      messageType: message.messageType,
      replyTo: message.replyTo,
      createdAt: message.createdAt
    });

    res.status(201).json({
      success: true,
      data: { message },
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MESSAGE_ERROR',
        message: 'Failed to send message'
      }
    });
  }
});

// Mark messages as read
router.put('/conversations/:conversationId/messages/read', [
  param('conversationId').isMongoId().withMessage('Invalid conversation ID'),
  body('messageIds').isArray({ min: 1 }).withMessage('At least one message ID is required'),
  body('messageIds.*').isMongoId().withMessage('Invalid message ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { conversationId } = req.params;
    const { messageIds } = req.body;
    const userId = req.user._id;

    // Check if user is participant in conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      deleted: false
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found or access denied'
        }
      });
    }

    // Mark messages as read
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        conversation: conversationId,
        sender: { $ne: userId }
      },
      { $addToSet: { readBy: userId } }
    );

    // Reset unread count
    await conversation.resetUnreadCount(userId);

    // Emit read receipt
    socketService.emitToRoom(`conversation:${conversationId}`, 'message:read:receipt', {
      conversationId,
      messageIds,
      readBy: userId,
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MESSAGE_ERROR',
        message: 'Failed to mark messages as read'
      }
    });
  }
});

// Add message reaction
router.post('/messages/:messageId/reactions', [
  param('messageId').isMongoId().withMessage('Invalid message ID'),
  body('reaction').isIn(['like', 'love', 'haha', 'wow', 'sad', 'angry']).withMessage('Invalid reaction type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { messageId } = req.params;
    const { reaction } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found'
        }
      });
    }

    // Check if user is participant in conversation
    const conversation = await Conversation.findById(message.conversation);
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You are not a participant in this conversation'
        }
      });
    }

    await message.addReaction(userId, reaction);
    await message.populate('reactions.user', 'username avatar firstName lastName');

    // Emit real-time update
    socketService.emitToRoom(`conversation:${message.conversation}`, 'message:reaction:added', {
      messageId: message._id,
      reaction: {
        user: message.reactions.find(r => r.user._id.toString() === userId.toString()),
        reaction: reaction
      }
    });

    res.json({
      success: true,
      data: { message },
      message: 'Reaction added successfully'
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REACTION_ERROR',
        message: 'Failed to add reaction'
      }
    });
  }
});

// Remove message reaction
router.delete('/messages/:messageId/reactions', [
  param('messageId').isMongoId().withMessage('Invalid message ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found'
        }
      });
    }

    await message.removeReaction(userId);

    // Emit real-time update
    socketService.emitToRoom(`conversation:${message.conversation}`, 'message:reaction:removed', {
      messageId: message._id,
      userId: userId
    });

    res.json({
      success: true,
      message: 'Reaction removed successfully'
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REACTION_ERROR',
        message: 'Failed to remove reaction'
      }
    });
  }
});

// Edit message
router.put('/messages/:messageId', [
  param('messageId').isMongoId().withMessage('Invalid message ID'),
  body('content').isLength({ min: 1, max: 2000 }).withMessage('Message content must be between 1 and 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found'
        }
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only edit your own messages'
        }
      });
    }

    await message.editMessage(content);
    await message.populate('sender', 'username avatar firstName lastName');

    // Emit real-time update
    socketService.emitToRoom(`conversation:${message.conversation}`, 'message:edited', {
      messageId: message._id,
      content: message.content,
      editedAt: message.editedAt
    });

    res.json({
      success: true,
      data: { message },
      message: 'Message edited successfully'
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EDIT_ERROR',
        message: 'Failed to edit message'
      }
    });
  }
});

// Delete message
router.delete('/messages/:messageId', [
  param('messageId').isMongoId().withMessage('Invalid message ID'),
  body('deleteForEveryone').optional().isBoolean().withMessage('deleteForEveryone must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { messageId } = req.params;
    const { deleteForEveryone = false } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found'
        }
      });
    }

    // Check permissions
    if (deleteForEveryone) {
      // Only sender can delete for everyone
      if (message.sender.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: 'You can only delete your own messages for everyone'
          }
        });
      }
    }

    await message.softDelete(userId);

    // Emit real-time update
    socketService.emitToRoom(`conversation:${message.conversation}`, 'message:deleted', {
      messageId: message._id,
      deleteForEveryone: deleteForEveryone,
      deletedBy: userId
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete message'
      }
    });
  }
});

// Forward message
router.post('/messages/:messageId/forward', [
  param('messageId').isMongoId().withMessage('Invalid message ID'),
  body('conversationIds').isArray({ min: 1 }).withMessage('At least one conversation ID is required'),
  body('conversationIds.*').isMongoId().withMessage('Invalid conversation ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { messageId } = req.params;
    const { conversationIds } = req.body;
    const userId = req.user._id;

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found'
        }
      });
    }

    const forwardedMessages = [];

    for (const conversationId of conversationIds) {
      // Check if user is participant in target conversation
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(userId)) {
        continue; // Skip if not participant
      }

      const forwardedMessage = await originalMessage.forwardTo(conversationId, userId);
      await forwardedMessage.populate('sender', 'username avatar firstName lastName');
      await forwardedMessage.populate('forwardedFrom.sender', 'username avatar firstName lastName');

      forwardedMessages.push(forwardedMessage);

      // Emit real-time update
      socketService.emitToRoom(`conversation:${conversationId}`, 'message:forwarded', {
        message: forwardedMessage
      });
    }

    res.json({
      success: true,
      data: { forwardedMessages },
      message: `Message forwarded to ${forwardedMessages.length} conversation(s)`
    });
  } catch (error) {
    console.error('Forward message error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FORWARD_ERROR',
        message: 'Failed to forward message'
      }
    });
  }
});

// Search messages
router.get('/messages/search', [
  query('q').isLength({ min: 1 }).withMessage('Search query is required'),
  query('conversationId').optional().isMongoId().withMessage('Invalid conversation ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { q: searchQuery, conversationId, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    const messages = await Message.searchMessages(userId, searchQuery, {
      page: parseInt(page),
      limit: parseInt(limit),
      conversationId
    });

    res.json({
      success: true,
      data: { messages },
      message: 'Messages found successfully'
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SEARCH_ERROR',
        message: 'Failed to search messages'
      }
    });
  }
});

// Pin message
router.post('/conversations/:conversationId/pin/:messageId', [
  param('conversationId').isMongoId().withMessage('Invalid conversation ID'),
  param('messageId').isMongoId().withMessage('Invalid message ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { conversationId, messageId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found'
        }
      });
    }

    await conversation.pinMessage(messageId, userId);
    await conversation.populate('pinnedMessages.message', 'content sender createdAt');
    await conversation.populate('pinnedMessages.pinnedBy', 'username avatar firstName lastName');

    // Emit real-time update
    socketService.emitToRoom(`conversation:${conversationId}`, 'message:pinned', {
      messageId: messageId,
      pinnedBy: userId
    });

    res.json({
      success: true,
      data: { conversation },
      message: 'Message pinned successfully'
    });
  } catch (error) {
    console.error('Pin message error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PIN_ERROR',
        message: error.message || 'Failed to pin message'
      }
    });
  }
});

// Unpin message
router.delete('/conversations/:conversationId/pin/:messageId', [
  param('conversationId').isMongoId().withMessage('Invalid conversation ID'),
  param('messageId').isMongoId().withMessage('Invalid message ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { conversationId, messageId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found'
        }
      });
    }

    await conversation.unpinMessage(messageId, userId);

    // Emit real-time update
    socketService.emitToRoom(`conversation:${conversationId}`, 'message:unpinned', {
      messageId: messageId,
      unpinnedBy: userId
    });

    res.json({
      success: true,
      message: 'Message unpinned successfully'
    });
  } catch (error) {
    console.error('Unpin message error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UNPIN_ERROR',
        message: error.message || 'Failed to unpin message'
      }
    });
  }
});

// Toggle conversation mute
router.put('/conversations/:conversationId/mute', [
  param('conversationId').isMongoId().withMessage('Invalid conversation ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      deleted: false
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found or access denied'
        }
      });
    }

    await conversation.toggleMute(userId);

    res.json({
      success: true,
      data: { muted: conversation.settings.muted.get(userId.toString()) },
      message: 'Conversation mute toggled successfully'
    });
  } catch (error) {
    console.error('Toggle conversation mute error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONVERSATION_ERROR',
        message: 'Failed to toggle conversation mute'
      }
    });
  }
});

// Archive conversation
router.put('/conversations/:conversationId/archive', [
  param('conversationId').isMongoId().withMessage('Invalid conversation ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      deleted: false
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found or access denied'
        }
      });
    }

    await conversation.toggleArchive(userId);

    res.json({
      success: true,
      data: { archived: conversation.archived.get(userId.toString()) },
      message: 'Conversation archive toggled successfully'
    });
  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CONVERSATION_ERROR',
        message: 'Failed to archive conversation'
      }
    });
  }
});

// Toggle conversation settings
router.put('/conversations/:conversationId/settings', [
  param('conversationId').isMongoId().withMessage('Invalid conversation ID'),
  body('action').isIn(['mute', 'pin', 'archive']).withMessage('Invalid action')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { conversationId } = req.params;
    const { action } = req.body;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found'
        }
      });
    }

    let result;
    switch (action) {
      case 'mute':
        result = await conversation.toggleMute(userId);
        break;
      case 'pin':
        result = await conversation.togglePin(userId);
        break;
      case 'archive':
        result = await conversation.toggleArchive(userId);
        break;
    }

    res.json({
      success: true,
      data: { conversation: result },
      message: `Conversation ${action}d successfully`
    });
  } catch (error) {
    console.error('Toggle conversation settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SETTINGS_ERROR',
        message: 'Failed to update conversation settings'
      }
    });
  }
});

module.exports = router; 