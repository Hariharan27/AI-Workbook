const express = require('express');
const { body, param, query, validationResult } = require('express-validator');

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
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
router.post('/conversations/group', validateConversation, async (req, res) => {
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

    const { participants, name, description } = req.body;
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

    const conversation = new Conversation({
      type: 'group',
      participants,
      name,
      description,
      createdBy: userId
    });

    await conversation.save();
    await conversation.populate('participants', 'username avatar firstName lastName onlineStatus lastSeen');
    await conversation.populate('createdBy', 'username avatar firstName lastName');

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

    // Increment unread count for other participants
    const otherParticipants = conversation.participants.filter(p => p.toString() !== userId.toString());
    for (const participantId of otherParticipants) {
      await conversation.incrementUnreadCount(participantId);
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

// Delete message
router.delete('/:messageId', [
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

    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
      deleted: false
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found or access denied'
        }
      });
    }

    // Soft delete message
    await message.softDelete();

    // Emit delete event
    socketService.emitToRoom(`conversation:${message.conversation}`, 'message:deleted', {
      messageId: message._id,
      conversationId: message.conversation
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
        code: 'MESSAGE_ERROR',
        message: 'Failed to delete message'
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

module.exports = router; 