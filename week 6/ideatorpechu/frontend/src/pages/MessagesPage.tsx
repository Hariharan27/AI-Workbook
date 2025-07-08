import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  IconButton,
  Badge,
  Chip,
  useTheme,
  useMediaQuery,
  AppBar,
  Toolbar,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ListItemButton,
  Divider
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import messagesAPI from '../services/messagesAPI';
import { searchAPI, User } from '../services/api';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // New conversation states
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Load conversations from API
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await messagesAPI.getConversations();
        setConversations(response.conversations || []);
      } catch (error) {
        console.error('Failed to load conversations:', error);
        // Fallback to empty array
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  // Load messages when conversation is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) return;
      
      try {
        const response = await messagesAPI.getConversation(selectedConversation._id);
        setMessages(response.conversation.messages || []);
        
        // Join conversation for real-time updates
        socketService.joinConversation(selectedConversation._id);
      } catch (error) {
        console.error('Failed to load messages:', error);
        setMessages([]);
      }
    };

    loadMessages();
  }, [selectedConversation]);

  useEffect(() => {
    // Connect to messaging socket
    const token = localStorage.getItem('token');
    if (token) {
      socketService.connect(token);
    }

    // Listen for real-time messages
    const handleNewMessage = (message: any) => {
      if (selectedConversation && message.conversationId === selectedConversation._id) {
        setMessages(prev => [...prev, message]);
      }
      // Update conversation list to show new message
      setConversations(prev => prev.map(conv => {
        if (conv._id === message.conversationId) {
          return {
            ...conv,
            lastMessage: {
              content: message.content,
              sender: message.sender._id,
              timestamp: message.createdAt
            }
          };
        }
        return conv;
      }));
    };

    socketService.onMessageReceived(handleNewMessage);

    return () => {
      socketService.removeMessageListener(handleNewMessage);
      socketService.disconnect();
    };
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await messagesAPI.sendMessage(selectedConversation._id, {
        content: newMessage,
        messageType: 'text'
      });
      
      setMessages(prev => [...prev, response.message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Search users for new conversation
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchingUsers(true);
      const response = await searchAPI.searchUsers(query, 1, 20);
      // Filter out current user and users already in conversations
      const filteredUsers = response.users.filter(user => 
        user._id !== user?._id && 
        !conversations.some(conv => 
          conv.type === 'direct' && 
          conv.participants.some((p: any) => p._id === user._id)
        )
      );
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Handle user search input change
  const handleUserSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setUserSearchQuery(query);
    searchUsers(query);
  };

  // Start conversation with user
  const startConversationWithUser = async (selectedUser: User) => {
    try {
      const response = await messagesAPI.createDirectConversation(selectedUser._id);
      const newConversation = response.conversation;
      
      // Add to conversations list
      setConversations(prev => [newConversation, ...prev]);
      
      // Select the new conversation
      setSelectedConversation(newConversation);
      
      // Close dialog
      setShowNewConversation(false);
      setUserSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getConversationTitle = (conversation: any) => {
    if (conversation.name) return conversation.name;
    
    if (conversation.type === 'direct' && conversation.participants?.length === 2) {
      const otherParticipant = conversation.participants.find((p: any) => p._id !== user?._id);
      return otherParticipant ? `${otherParticipant.firstName || otherParticipant.username}` : 'Direct Message';
    }
    
    return 'Group Chat';
  };

  const getConversationAvatar = (conversation: any) => {
    if (conversation.avatar) return conversation.avatar;
    
    if (conversation.type === 'direct' && conversation.participants?.length === 2) {
      const otherParticipant = conversation.participants.find((p: any) => p._id !== user?._id);
      return otherParticipant?.avatar;
    }
    
    return undefined;
  };

  const getUnreadCount = (conversation: any) => {
    if (!conversation.unreadCount || !user?._id) return 0;
    return conversation.unreadCount[user._id] || 0;
  };

  const isMessageFromCurrentUser = (message: any) => {
    return message.sender?._id === user?._id;
  };

  const filteredConversations = conversations.filter(conv => {
    const title = getConversationTitle(conv);
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const ChatInterface = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat Header */}
      <AppBar position="static" elevation={1} sx={{ backgroundColor: 'background.paper' }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setSelectedConversation(null)}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          
          <Avatar
            src={getConversationAvatar(selectedConversation)}
            sx={{ mr: 2, width: 40, height: 40 }}
          >
            {getConversationTitle(selectedConversation)?.charAt(0)}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {getConversationTitle(selectedConversation)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {socketService.isMessagingConnected() ? 'Online' : 'Offline'}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, backgroundColor: '#f5f5f5' }}>
        {messages.map((message) => {
          const isOwnMessage = isMessageFromCurrentUser(message);
          return (
            <Box
              key={message._id}
              sx={{
                display: 'flex',
                justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                mb: 2
              }}
            >
              <Box
                sx={{
                  maxWidth: '70%',
                  backgroundColor: isOwnMessage ? 'primary.main' : 'white',
                  color: isOwnMessage ? 'white' : 'text.primary',
                  borderRadius: 2,
                  p: 1.5,
                  boxShadow: 1
                }}
              >
                <Typography variant="body2">{message.content}</Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 0.5,
                    opacity: 0.7,
                    textAlign: isOwnMessage ? 'right' : 'left'
                  }}
                >
                  {formatTime(message.createdAt || message.timestamp)}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 2, backgroundColor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            size="small"
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
    </Box>
  );

  const ConversationList = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with New Message button */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Messages
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowNewConversation(true)}
          >
            New Message
          </Button>
        </Box>
        
        {/* Search conversations */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Box>

      {/* Conversations */}
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredConversations.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <Typography color="text.secondary">
              No conversations found
            </Typography>
          </Box>
        ) : (
          filteredConversations.map((conversation) => {
            const isSelected = selectedConversation?._id === conversation._id;
            const unreadCount = getUnreadCount(conversation);
            
            return (
              <ListItem
                key={conversation._id}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'primary.light' : 'transparent',
                  '&:hover': {
                    backgroundColor: isSelected ? 'primary.light' : 'action.hover'
                  }
                }}
                onClick={() => setSelectedConversation(conversation)}
              >
                <ListItemAvatar>
                  <Badge
                    badgeContent={unreadCount}
                    color="error"
                    invisible={unreadCount === 0}
                  >
                    <Avatar src={getConversationAvatar(conversation)}>
                      {getConversationTitle(conversation)?.charAt(0)}
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {getConversationTitle(conversation)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {conversation.lastMessage ? formatTime(conversation.lastMessage.createdAt || conversation.lastMessage.timestamp) : ''}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '70%'
                        }}
                      >
                        {conversation.lastMessage?.content || 'No messages yet'}
                      </Typography>
                      {unreadCount > 0 && (
                        <Chip
                          label={unreadCount}
                          size="small"
                          color="primary"
                          sx={{ minWidth: 20, height: 20 }}
                        />
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          })
        )}
      </List>
    </Box>
  );

  return (
    <>
      <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex' }}>
        {/* Conversation List */}
        <Box
          sx={{
            width: isMobile ? '100%' : 350,
            borderRight: 1,
            borderColor: 'divider',
            display: isMobile && selectedConversation ? 'none' : 'block'
          }}
        >
          <ConversationList />
        </Box>

        {/* Chat Interface */}
        {selectedConversation ? (
          <Box
            sx={{
              flexGrow: 1,
              display: isMobile && !selectedConversation ? 'none' : 'block'
            }}
          >
            <ChatInterface />
          </Box>
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f5f5f5'
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Select a conversation to start messaging
            </Typography>
          </Box>
        )}
      </Box>

      {/* New Conversation Dialog */}
      <Dialog 
        open={showNewConversation} 
        onClose={() => setShowNewConversation(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">New Message</Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search users..."
            value={userSearchQuery}
            onChange={handleUserSearchChange}
            size="small"
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {searchingUsers ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : searchResults.length === 0 && userSearchQuery ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <Typography color="text.secondary">
                  No users found
                </Typography>
              </Box>
            ) : (
              <List>
                {searchResults.map((user) => (
                  <ListItem key={user._id} disablePadding>
                    <ListItemButton onClick={() => startConversationWithUser(user)}>
                      <ListItemAvatar>
                        <Avatar src={user.avatar}>
                          {user.username?.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle2">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.username
                            }
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            @{user.username}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewConversation(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MessagesPage; 