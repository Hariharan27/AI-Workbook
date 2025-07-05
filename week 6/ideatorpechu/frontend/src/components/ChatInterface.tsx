import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  Badge,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Send as SendIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import messagesAPI, { Conversation, Message } from '../services/messagesAPI';
import socketService, { SocketMessage } from '../services/socketService';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadConversations();
      // Connect to socket
      const token = localStorage.getItem('token');
      if (token) {
        socketService.connect(token);
      }
    }
  }, [isOpen, user]);

  useEffect(() => {
    // Listen for new messages
    const handleNewMessage = (socketMessage: SocketMessage) => {
      if (selectedConversation && socketMessage.conversationId === selectedConversation._id) {
        const newMessage: Message = {
          _id: socketMessage.id,
          conversation: socketMessage.conversationId,
          sender: {
            _id: socketMessage.sender.id,
            username: socketMessage.sender.username,
            avatar: socketMessage.sender.avatar
          },
          content: socketMessage.content,
          messageType: socketMessage.messageType,
          replyTo: socketMessage.replyTo,
          readBy: [],
          deliveredTo: [],
          createdAt: socketMessage.createdAt,
          updatedAt: socketMessage.createdAt,
          edited: false,
          deleted: false
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };

    // Listen for typing indicators
    const handleTypingStart = (typing: any) => {
      if (selectedConversation && typing.conversationId === selectedConversation._id) {
        setTypingUsers(prev => [...prev.filter(u => u !== typing.username), typing.username]);
      }
    };

    const handleTypingStop = (typing: any) => {
      if (selectedConversation && typing.conversationId === selectedConversation._id) {
        setTypingUsers(prev => prev.filter(u => u !== typing.username));
      }
    };

    socketService.onMessageReceived(handleNewMessage);
    socketService.onTypingStart(handleTypingStart);
    socketService.onTypingStop(handleTypingStop);

    return () => {
      socketService.removeMessageListener(handleNewMessage);
      socketService.removeTypingListener(handleTypingStart);
      socketService.removeTypingStopListener(handleTypingStop);
    };
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getConversations();
      setConversations(response.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      setLoading(true);
      const response = await messagesAPI.getConversation(conversationId);
      setSelectedConversation(response.conversation);
      setMessages(response.conversation.messages);
      
      // Join conversation room
      socketService.joinConversation(conversationId);
      
      // Mark messages as read
      const unreadMessages = response.conversation.messages.filter(
        msg => !messagesAPI.isMessageRead(msg, user?._id || '')
      );
      if (unreadMessages.length > 0) {
        await messagesAPI.markMessagesAsRead(
          conversationId,
          unreadMessages.map(msg => msg._id)
        );
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await messagesAPI.sendMessage(selectedConversation._id, {
        content: newMessage.trim(),
        messageType: 'text'
      });

      // Add message to local state
      setMessages(prev => [...prev, response.message]);
      setNewMessage('');
      
      // Stop typing indicator
      socketService.emitMessageTypingStop(selectedConversation._id);
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      socketService.emitMessageTypingStart(selectedConversation?._id || '');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getConversationTitle = (conversation: Conversation) => {
    return messagesAPI.getConversationTitle(conversation, user?._id || '');
  };

  const getConversationAvatar = (conversation: Conversation) => {
    return messagesAPI.getConversationAvatar(conversation, user?._id || '');
  };

  const getUnreadCount = (conversation: Conversation) => {
    return messagesAPI.getUnreadCount(conversation, user?._id || '');
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: '80vh',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Messages</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, display: 'flex' }}>
        {/* Conversations List */}
        <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider' }}>
          <List sx={{ p: 0 }}>
            {conversations.map((conversation) => (
              <ListItem
                key={conversation._id}
                onClick={() => loadConversation(conversation._id)}
                sx={{ 
                  borderBottom: 1, 
                  borderColor: 'divider', 
                  cursor: 'pointer',
                  backgroundColor: selectedConversation?._id === conversation._id ? 'action.selected' : 'transparent'
                }}
              >
                <ListItemAvatar>
                  <Badge
                    badgeContent={getUnreadCount(conversation)}
                    color="primary"
                    invisible={getUnreadCount(conversation) === 0}
                  >
                    <Avatar src={getConversationAvatar(conversation)}>
                      {getConversationTitle(conversation).charAt(0).toUpperCase()}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={getConversationTitle(conversation)}
                  secondary={
                    conversation.lastMessage ? (
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {conversation.lastMessage.content}
                      </Typography>
                    ) : (
                      'No messages yet'
                    )
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Chat Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <Avatar src={getConversationAvatar(selectedConversation)} sx={{ mr: 2 }}>
                  {getConversationTitle(selectedConversation).charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">{getConversationTitle(selectedConversation)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedConversation.type === 'direct' ? 'Direct Message' : 'Group Chat'}
                  </Typography>
                </Box>
                <IconButton>
                  <MoreVertIcon />
                </IconButton>
              </Box>

              {/* Messages */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {messages.map((message) => (
                  <Box
                    key={message._id}
                    sx={{
                      display: 'flex',
                      justifyContent: messagesAPI.isMessageFromCurrentUser(message, user?._id || '') 
                        ? 'flex-end' 
                        : 'flex-start',
                      mb: 2
                    }}
                  >
                    <Paper
                      sx={{
                        p: 1.5,
                        maxWidth: '70%',
                        backgroundColor: messagesAPI.isMessageFromCurrentUser(message, user?._id || '')
                          ? 'primary.main'
                          : 'grey.100',
                        color: messagesAPI.isMessageFromCurrentUser(message, user?._id || '')
                          ? 'white'
                          : 'text.primary'
                      }}
                    >
                      <Typography variant="body1">{message.content}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {messagesAPI.formatMessageTime(message.createdAt)}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
                
                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                    <Paper sx={{ p: 1.5, backgroundColor: 'grey.100' }}>
                      <Typography variant="body2" color="text.secondary">
                        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                      </Typography>
                    </Paper>
                  </Box>
                )}
                
                <div ref={messagesEndRef} />
              </Box>

              {/* Message Input */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton size="small">
                    <AttachFileIcon />
                  </IconButton>
                  <IconButton size="small">
                    <EmojiIcon />
                  </IconButton>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyPress={handleKeyPress}
                    size="small"
                    multiline
                    maxRows={4}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="h6" color="text.secondary">
                Select a conversation to start messaging
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ChatInterface; 