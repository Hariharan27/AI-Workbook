import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import socketService, { SocketMessage, TypingIndicator } from '../services/socketService';

interface ChatMessage extends SocketMessage {
  isOwn: boolean;
}

interface RealTimeChatProps {
  conversationId: string;
  participants: Array<{
    id: string;
    username: string;
    avatar?: string;
  }>;
  onClose?: () => void;
}

const RealTimeChat: React.FC<RealTimeChatProps> = ({
  conversationId,
  participants,
  onClose
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !conversationId) return;

    // Join conversation
    socketService.joinConversation(conversationId);
    setIsConnected(true);

    // Listen for new messages
    const handleNewMessage = (message: SocketMessage) => {
      if (message.conversationId === conversationId) {
        const chatMessage: ChatMessage = {
          ...message,
          isOwn: message.sender.id === user._id
        };
        setMessages(prev => [...prev, chatMessage]);
      }
    };

    // Listen for typing indicators
    const handleTypingStart = (typing: TypingIndicator) => {
      if (typing.conversationId === conversationId && typing.userId !== user._id) {
        setTypingUsers(prev => {
          if (!prev.includes(typing.userId)) {
            return [...prev, typing.userId];
          }
          return prev;
        });
      }
    };

    const handleTypingStop = (typing: TypingIndicator) => {
      if (typing.conversationId === conversationId) {
        setTypingUsers(prev => prev.filter(id => id !== typing.userId));
      }
    };

    // Register event listeners
    socketService.onMessageReceived(handleNewMessage);
    socketService.onTypingStart(handleTypingStart);
    socketService.onTypingStop(handleTypingStop);

    return () => {
      // Cleanup
      socketService.leaveConversation(conversationId);
      socketService.removeMessageListener(handleNewMessage);
      socketService.removeTypingListener(handleTypingStart);
      socketService.removeTypingStopListener(handleTypingStop);
    };
  }, [user, conversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isConnected) return;

    try {
      const messageData = {
        conversationId,
        content: newMessage.trim(),
        messageType: 'text' as const
      };

      // Send message through socket
      socketService.sendMessage(messageData);

      // Clear input
      setNewMessage('');
      setIsTyping(false);

      // Stop typing indicator
      socketService.emitMessageTypingStop(conversationId);
    } catch (error) {
      setError('Failed to send message');
      console.error('Send message error:', error);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    
    // Handle typing indicators
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      socketService.emitMessageTypingStart(conversationId);
    } else if (isTyping && !value.trim()) {
      setIsTyping(false);
      socketService.emitMessageTypingStop(conversationId);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    if (value.trim()) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketService.emitMessageTypingStop(conversationId);
      }, 2000);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getParticipantName = (userId: string) => {
    const participant = participants.find(p => p.id === userId);
    return participant?.username || 'Unknown User';
  };

  const getParticipantAvatar = (userId: string) => {
    const participant = participants.find(p => p.id === userId);
    return participant?.avatar;
  };

  return (
    <Paper
      elevation={3}
      sx={{
        height: '500px',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '400px',
        width: '100%'
      }}
    >
      {/* Chat Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Avatar
          src={participants[0]?.avatar}
          sx={{ width: 32, height: 32 }}
        >
          {participants[0]?.username?.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {participants.map(p => p.username).join(', ')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isConnected ? 'Online' : 'Connecting...'}
          </Typography>
        </Box>
        <IconButton size="small">
          <MoreIcon />
        </IconButton>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.isOwn ? 'flex-end' : 'flex-start',
              mb: 1
            }}
          >
            <Box
              sx={{
                maxWidth: '70%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.isOwn ? 'flex-end' : 'flex-start'
              }}
            >
              {!message.isOwn && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>
                  {getParticipantName(message.sender.id)}
                </Typography>
              )}
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  backgroundColor: message.isOwn ? 'primary.main' : 'grey.100',
                  color: message.isOwn ? 'white' : 'text.primary',
                  borderRadius: 2,
                  wordBreak: 'break-word'
                }}
              >
                <Typography variant="body2">
                  {message.content}
                </Typography>
              </Paper>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {formatTime(message.createdAt)}
              </Typography>
            </Box>
          </Box>
        ))}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              {typingUsers.map(id => getParticipantName(id)).join(', ')} typing...
            </Typography>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1
        }}
      >
        <IconButton size="small">
          <AttachFileIcon />
        </IconButton>
        <IconButton size="small">
          <EmojiIcon />
        </IconButton>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!isConnected}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2
            }
          }}
        />
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || !isConnected}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default RealTimeChat; 