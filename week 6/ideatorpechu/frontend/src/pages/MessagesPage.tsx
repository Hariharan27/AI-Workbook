import React, { useState, useEffect, useCallback } from 'react';
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
  Divider,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  Paper,
  Stack
} from '@mui/material';
import {
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Message as MessageIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  ThumbUp as ThumbUpIcon,
  Favorite as FavoriteIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import messagesAPI from '../services/messagesAPI';
import { searchAPI, usersAPI, User } from '../services/api';

// MessageInput component to prevent focus loss
const MessageInput = React.memo(({ 
  newMessage, 
  setNewMessage, 
  replyToMessage, 
  handleKeyPress, 
  handleSendMessage 
}: {
  newMessage: string;
  setNewMessage: (value: string) => void;
  replyToMessage: any;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleSendMessage: () => void;
}) => {
  const handleChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  }, [setNewMessage]);

  return (
    <Box sx={{ p: 2, backgroundColor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={replyToMessage ? "Reply to message..." : "Type a message..."}
          value={newMessage}
          onChange={handleChange}
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
  );
});

MessageInput.displayName = 'MessageInput';

// ChatInterface component to prevent re-renders
const ChatInterface = React.memo(({ 
  selectedConversation,
  replyToMessage,
  messages,
  newMessage,
  setNewMessage,
  setReplyToMessage,
  handleKeyPress,
  handleSendMessage,
  isMobile,
  getConversationAvatar,
  getConversationTitle,
  MessageBubble,
  onBackClick
}: {
  selectedConversation: any;
  replyToMessage: any;
  messages: any[];
  newMessage: string;
  setNewMessage: (value: string) => void;
  setReplyToMessage: (value: any) => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleSendMessage: () => void;
  isMobile: boolean;
  getConversationAvatar: (conv: any) => string | undefined;
  getConversationTitle: (conv: any) => string;
  MessageBubble: React.ComponentType<{ message: any }>;
  onBackClick: () => void;
}) => {
  console.log('ChatInterface re-rendered');
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat Header */}
      <AppBar position="static" elevation={1} sx={{ backgroundColor: 'background.paper' }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={onBackClick}
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
              {selectedConversation?.type === 'group' ? 'Group' : 'Online'}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2, backgroundColor: '#f5f5f5' }}>
        {replyToMessage && (
          <Paper sx={{ p: 1, mb: 2, backgroundColor: 'primary.light', color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                Replying to: {replyToMessage.content}
              </Typography>
              <IconButton size="small" onClick={() => setReplyToMessage(null)} sx={{ color: 'white' }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        )}

        {messages.map((message) => (
          <MessageBubble key={message._id} message={message} />
        ))}
      </Box>

      {/* Message Input */}
      <MessageInput 
        key="message-input"
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        replyToMessage={replyToMessage}
        handleKeyPress={handleKeyPress}
        handleSendMessage={handleSendMessage}
      />
    </Box>
  );
});

ChatInterface.displayName = 'ChatInterface';

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
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // User list states
  const [activeTab, setActiveTab] = useState(0);
  const [followingUsers, setFollowingUsers] = useState<User[]>([]);
  const [followerUsers, setFollowerUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Enhanced states for better UX
  const [creatingConversation, setCreatingConversation] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Message interaction states
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [messageMenuAnchor, setMessageMenuAnchor] = useState<null | HTMLElement>(null);
  const [replyToMessage, setReplyToMessage] = useState<any | null>(null);
  const [editingMessage, setEditingMessage] = useState<any | null>(null);

  // Group creation states
  const [groupName, setGroupName] = useState('');
  const [selectedGroupParticipants, setSelectedGroupParticipants] = useState<string[]>([]);

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
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  // Load users you can message
  useEffect(() => {
    const loadUsers = async () => {
      if (!user) return;
      
      try {
        setLoadingUsers(true);
        
        const followingResponse = await usersAPI.getFollowing(user._id, 1, 50);
        setFollowingUsers(followingResponse.users || []);
        
        const followersResponse = await usersAPI.getFollowers(user._id, 1, 50);
        setFollowerUsers(followersResponse.users || []);
        
      } catch (error) {
        console.error('Failed to load users:', error);
        setFollowingUsers([]);
        setFollowerUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, [user]);

  // Load messages when conversation is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) return;
      
      try {
        const response = await messagesAPI.getConversation(selectedConversation._id);
        setMessages(response.conversation.messages || []);
        
        socketService.joinConversation(selectedConversation._id);
      } catch (error) {
        console.error('Failed to load messages:', error);
        setMessages([]);
      }
    };

    loadMessages();
  }, [selectedConversation]);

  // Handle new messages from socket
  const handleNewMessage = useCallback((message: any) => {
    if (selectedConversation && message.conversationId === selectedConversation._id) {
      setMessages(prev => [...prev, message]);
    }
    // Only update conversations if the message is for a different conversation
    // to prevent unnecessary re-renders of the chat interface
    if (!selectedConversation || message.conversationId !== selectedConversation._id) {
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
    }
  }, [selectedConversation]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      socketService.connect(token);
    }

    socketService.onMessageReceived(handleNewMessage);

    return () => {
      socketService.removeMessageListener(handleNewMessage);
      socketService.disconnect();
    };
  }, [handleNewMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const messageData: any = {
        content: newMessage,
        messageType: 'text'
      };

      if (replyToMessage) {
        messageData.replyTo = replyToMessage._id;
      }

      const response = await messagesAPI.sendMessage(selectedConversation._id, messageData);
      
      setMessages(prev => [...prev, response.message]);
      setNewMessage('');
      setReplyToMessage(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      setSnackbar({
        open: true,
        message: 'Failed to send message',
        severity: 'error'
      });
    }
  }, [newMessage, selectedConversation, replyToMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleBackClick = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchingUsers(true);
      const response = await searchAPI.searchUsers(query, 1, 10);
      setSearchResults(response.users || []);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleUserSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setUserSearchQuery(query);
    searchUsers(query);
  };

  const startConversationWithUser = async (selectedUser: User) => {
    if (creatingConversation === selectedUser._id) return;
    
    try {
      setCreatingConversation(selectedUser._id);
      
      const response = await messagesAPI.createDirectConversation(selectedUser._id);
      const newConversation = response.conversation;
      
      setConversations(prev => {
        const filtered = prev.filter(Boolean).filter(conv => conv && conv._id);
        if (!newConversation || !newConversation._id) {
          return filtered;
        }
        const idx = filtered.findIndex(conv => conv._id === newConversation._id);
        if (idx !== -1) {
          const updated = [...filtered];
          updated[idx] = newConversation;
          return updated;
        }
        return [newConversation, ...filtered];
      });
      
      setSelectedConversation(newConversation);
      setShowNewConversation(false);
      setUserSearchQuery('');
      setSearchResults([]);
      
      setSnackbar({
        open: true,
        message: `Started conversation with ${selectedUser.firstName || selectedUser.username}`,
        severity: 'success'
      });
      
      setActiveTab(0);
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setSnackbar({
        open: true,
        message: 'Failed to start conversation. Please try again.',
        severity: 'error'
      });
    } finally {
      setCreatingConversation(null);
    }
  };

  const createGroupConversation = async () => {
    if (!groupName.trim() || selectedGroupParticipants.length < 2) {
      setSnackbar({
        open: true,
        message: 'Please enter a group name and select at least 2 participants',
        severity: 'error'
      });
      return;
    }

    try {
      const response = await messagesAPI.createGroupConversation({
        name: groupName,
        description: '',
        participants: selectedGroupParticipants,
        type: 'group'
      });

      const newConversation = response.conversation;
      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(newConversation);
      setShowCreateGroup(false);
      setGroupName('');
      setSelectedGroupParticipants([]);
      setActiveTab(0);

      setSnackbar({
        open: true,
        message: `Created group: ${groupName}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Failed to create group:', error);
      setSnackbar({
        open: true,
        message: 'Failed to create group',
        severity: 'error'
      });
    }
  };

  const addMessageReaction = async (messageId: string, reaction: string) => {
    try {
      await messagesAPI.addMessageReaction(messageId, reaction);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    try {
      await messagesAPI.editMessage(messageId, newContent);
      setEditingMessage(null);
    } catch (error) {
      console.error('Failed to edit message:', error);
      setSnackbar({
        open: true,
        message: 'Failed to edit message',
        severity: 'error'
      });
    }
  };

  const deleteMessage = async (messageId: string, deleteForEveryone: boolean = false) => {
    try {
      await messagesAPI.deleteMessage(messageId, deleteForEveryone);
      setMessageMenuAnchor(null);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete message',
        severity: 'error'
      });
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
    if (!conversation) return '';
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

  const filteredConversations = React.useMemo(() => 
    conversations.filter(conv => {
      if (!conv) return false;
      const title = getConversationTitle(conv);
      return title.toLowerCase().includes(searchQuery.toLowerCase());
    }), [conversations, searchQuery]
  );



  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleMessageMenuOpen = (event: React.MouseEvent<HTMLElement>, message: any) => {
    setMessageMenuAnchor(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMessageMenuClose = () => {
    setMessageMenuAnchor(null);
    setSelectedMessage(null);
  };

  const MessageBubble = ({ message }: { message: any }) => {
    const isOwnMessage = isMessageFromCurrentUser(message);
    const hasReactions = message.reactions && message.reactions.length > 0;
    const userReaction = message.reactions?.find((r: any) => r.user._id === user?._id);

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          mb: 2,
          position: 'relative'
        }}
      >
        <Paper
          elevation={1}
          sx={{
            maxWidth: '70%',
            backgroundColor: isOwnMessage ? 'primary.main' : 'background.paper',
            color: isOwnMessage ? 'white' : 'text.primary',
            borderRadius: 2,
            p: 1.5,
            position: 'relative',
            '&:hover': {
              '& .message-actions': {
                opacity: 1
              }
            }
          }}
        >
          {/* Reply indicator */}
          {message.replyTo && (
            <Box
              sx={{
                fontSize: '0.75rem',
                opacity: 0.7,
                mb: 0.5,
                borderLeft: 2,
                borderColor: 'primary.main',
                pl: 1
              }}
            >
              Replying to: {message.replyTo.content}
            </Box>
          )}

          {/* Message content */}
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {editingMessage?._id === message._id ? (
              <TextField
                fullWidth
                multiline
                value={editingMessage.content}
                onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    editMessage(message._id, editingMessage.content);
                  }
                }}
                autoFocus
                size="small"
                sx={{ mt: 1 }}
              />
            ) : (
              message.content
            )}
          </Typography>

          {/* Message metadata */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {formatTime(message.createdAt || message.timestamp)}
              {message.edited && ' (edited)'}
            </Typography>
            
            {/* Message actions */}
            <Box className="message-actions" sx={{ opacity: 0, transition: 'opacity 0.2s' }}>
              <IconButton
                size="small"
                onClick={(e) => handleMessageMenuOpen(e, message)}
                sx={{ color: 'inherit' }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Reactions */}
          {hasReactions && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
              {Object.entries(message.reactionCounts || {}).map(([reaction, count]) => (
                <Chip
                  key={reaction}
                  icon={reaction === 'like' ? <ThumbUpIcon /> : <FavoriteIcon />}
                  label={String(Number(count))}
                  size="small"
                  color={reaction === 'like' ? 'primary' : 'error'}
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          )}
        </Paper>

        {/* Reaction buttons */}
        <Box sx={{ display: 'flex', gap: 0.5, alignSelf: 'flex-end', ml: 1 }}>
          {!isOwnMessage && (
            <>
              <IconButton
                size="small"
                onClick={() => addMessageReaction(message._id, 'like')}
                color={userReaction?.reaction === 'like' ? 'primary' : 'default'}
              >
                <ThumbUpIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => addMessageReaction(message._id, 'love')}
                color={userReaction?.reaction === 'love' ? 'error' : 'default'}
              >
                <FavoriteIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      </Box>
    );
  };

  

  const UserList = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Messages
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<GroupIcon />}
              onClick={() => setShowCreateGroup(true)}
            >
              New Group
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setShowNewConversation(true)}
            >
              New Message
            </Button>
          </Box>
        </Box>
        
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

      {/* Tabs */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Conversations" />
        <Tab label="People" />
      </Tabs>

      {/* Tab Content */}
      {activeTab === 0 && (
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
      )}

      {activeTab === 1 && (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {loadingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Following ({followingUsers.length})
                </Typography>
                <List>
                  {followingUsers.map((userItem) => (
                    <ListItem key={userItem._id} disablePadding>
                      <ListItemButton onClick={() => startConversationWithUser(userItem)}>
                        <ListItemAvatar>
                          <Avatar src={userItem.avatar}>
                            {userItem.username?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2">
                              {userItem.firstName && userItem.lastName 
                                ? `${userItem.firstName} ${userItem.lastName}`
                                : userItem.username
                              }
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              @{userItem.username}
                            </Typography>
                          }
                        />
                        <Tooltip title="Send message">
                          <IconButton
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              startConversationWithUser(userItem);
                            }}
                            disabled={creatingConversation === userItem._id}
                            sx={{
                              position: 'relative',
                              '&:hover': {
                                backgroundColor: 'primary.light',
                                color: 'white'
                              }
                            }}
                          >
                            {creatingConversation === userItem._id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <MessageIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Divider />

              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Followers ({followerUsers.length})
                </Typography>
                <List>
                  {followerUsers.map((userItem) => (
                    <ListItem key={userItem._id} disablePadding>
                      <ListItemButton onClick={() => startConversationWithUser(userItem)}>
                        <ListItemAvatar>
                          <Avatar src={userItem.avatar}>
                            {userItem.username?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2">
                              {userItem.firstName && userItem.lastName 
                                ? `${userItem.firstName} ${userItem.lastName}`
                                : userItem.username
                              }
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              @{userItem.username}
                            </Typography>
                          }
                        />
                        <Tooltip title="Send message">
                          <IconButton
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              startConversationWithUser(userItem);
                            }}
                            disabled={creatingConversation === userItem._id}
                            sx={{
                              position: 'relative',
                              '&:hover': {
                                backgroundColor: 'primary.light',
                                color: 'white'
                              }
                            }}
                          >
                            {creatingConversation === userItem._id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <MessageIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex' }}>
        {/* Conversation List or User List */}
        <Box
          sx={{
            width: isMobile ? '100%' : 350,
            borderRight: 1,
            borderColor: 'divider',
            display: isMobile && selectedConversation ? 'none' : 'block'
          }}
        >
          <UserList />
        </Box>

                {/* Chat Interface */}
        {selectedConversation ? (
          <Box
            key={`chat-${selectedConversation._id}`}
            id="chat-interface"
            sx={{
              flexGrow: 1,
              display: isMobile && !selectedConversation ? 'none' : 'block'
            }}
          >
            <ChatInterface 
              selectedConversation={selectedConversation}
              replyToMessage={replyToMessage}
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              setReplyToMessage={setReplyToMessage}
              handleKeyPress={handleKeyPress}
              handleSendMessage={handleSendMessage}
              isMobile={isMobile}
              getConversationAvatar={getConversationAvatar}
              getConversationTitle={getConversationTitle}
              MessageBubble={MessageBubble}
              onBackClick={handleBackClick}
            />
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
            ) : searchResults.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <Typography color="text.secondary">
                  Search for users to start a conversation
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

      {/* Create Group Dialog */}
      <Dialog 
        open={showCreateGroup} 
        onClose={() => setShowCreateGroup(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Create New Group</Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            variant="outlined"
            label="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />

          <Typography variant="subtitle2" gutterBottom>
            Select Participants ({selectedGroupParticipants.length} selected)
          </Typography>
          
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {[...followingUsers, ...followerUsers].map((userItem) => (
              <ListItem key={userItem._id} disablePadding>
                <ListItemButton
                  onClick={() => {
                    const isSelected = selectedGroupParticipants.includes(userItem._id);
                    if (isSelected) {
                      setSelectedGroupParticipants(prev => prev.filter(id => id !== userItem._id));
                    } else {
                      setSelectedGroupParticipants(prev => [...prev, userItem._id]);
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={userItem.avatar}>
                      {userItem.username?.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2">
                        {userItem.firstName && userItem.lastName 
                          ? `${userItem.firstName} ${userItem.lastName}`
                          : userItem.username
                        }
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        @{userItem.username}
                      </Typography>
                    }
                  />
                  {selectedGroupParticipants.includes(userItem._id) && (
                    <IconButton color="primary">
                      <AddIcon />
                    </IconButton>
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateGroup(false)}>
            Cancel
          </Button>
          <Button 
            onClick={createGroupConversation}
            variant="contained"
            disabled={!groupName.trim() || selectedGroupParticipants.length < 2}
          >
            Create Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message Actions Menu */}
      <Menu
        anchorEl={messageMenuAnchor}
        open={Boolean(messageMenuAnchor)}
        onClose={handleMessageMenuClose}
      >
        {selectedMessage && !isMessageFromCurrentUser(selectedMessage) && (
          <MenuItem onClick={() => {
            setReplyToMessage(selectedMessage);
            handleMessageMenuClose();
          }}>
            <ReplyIcon sx={{ mr: 1 }} />
            Reply
          </MenuItem>
        )}
        
        {selectedMessage && isMessageFromCurrentUser(selectedMessage) && (
          <MenuItem onClick={() => {
            setEditingMessage(selectedMessage);
            handleMessageMenuClose();
          }}>
            <EditIcon sx={{ mr: 1 }} />
            Edit
          </MenuItem>
        )}
        
        {selectedMessage && isMessageFromCurrentUser(selectedMessage) && (
          <MenuItem onClick={() => {
            deleteMessage(selectedMessage._id, true);
          }}>
            <DeleteIcon sx={{ mr: 1 }} />
            Delete for Everyone
          </MenuItem>
        )}
      </Menu>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MessagesPage; 