import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Container,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Group as GroupIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import ChatInterface from '../components/ChatInterface';
import socketService from '../services/socketService';
import messagesAPI from '../services/messagesAPI';

const ChatTestPage: React.FC = () => {
  const { user } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [socketStatus, setSocketStatus] = useState({
    main: false,
    social: false,
    messaging: false,
    notifications: false
  });

  const connectToSocket = () => {
    const token = localStorage.getItem('token');
    if (token) {
      socketService.connect(token);
      
      // Update status after a short delay
      setTimeout(() => {
        setSocketStatus({
          main: socketService.isConnected(),
          social: socketService.isSocialConnected(),
          messaging: socketService.isMessagingConnected(),
          notifications: socketService.isNotificationConnected()
        });
      }, 1000);
    }
  };

  const disconnectFromSocket = () => {
    socketService.disconnect();
    setSocketStatus({
      main: false,
      social: false,
      messaging: false,
      notifications: false
    });
  };

  const testTypingIndicator = () => {
    socketService.emitTypingStart('test-post-id');
    setTimeout(() => {
      socketService.emitTypingStop('test-post-id');
    }, 3000);
  };

  const features = [
    {
      title: 'Real-time Messaging',
      description: 'Direct and group conversations with instant message delivery',
      icon: <ChatIcon sx={{ fontSize: 40 }} />,
      features: [
        'Direct messaging between users',
        'Group chat functionality',
        'Message read receipts',
        'Typing indicators',
        'Message history persistence'
      ]
    },
    {
      title: 'Socket.io Integration',
      description: 'Real-time communication using Socket.io namespaces',
      icon: <SendIcon sx={{ fontSize: 40 }} />,
      features: [
        'Social namespace for posts/comments',
        'Messaging namespace for chats',
        'Notifications namespace',
        'Authentication middleware',
        'Connection state management'
      ]
    },
    {
      title: 'Live Notifications',
      description: 'Real-time notifications for user interactions',
      icon: <NotificationsIcon sx={{ fontSize: 40 }} />,
      features: [
        'Like notifications',
        'Comment notifications',
        'Follow notifications',
        'Message notifications',
        'Push notification support'
      ]
    }
  ];

  const socketNamespaces = [
    { name: 'Main Socket', status: socketStatus.main, color: 'primary' },
    { name: 'Social Namespace', status: socketStatus.social, color: 'secondary' },
    { name: 'Messaging Namespace', status: socketStatus.messaging, color: 'success' },
    { name: 'Notifications Namespace', status: socketStatus.notifications, color: 'info' }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Phase 2C: Real-Time Communication
      </Typography>
      
      <Typography variant="h6" color="text.secondary" align="center" gutterBottom>
        Socket.io Integration & Messaging System
      </Typography>

      {/* Socket Connection Status */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Socket.io Connection Status
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
          {socketNamespaces.map((namespace) => (
            <Card key={namespace.name}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2">{namespace.name}</Typography>
                  <Chip
                    label={namespace.status ? 'Connected' : 'Disconnected'}
                    color={namespace.status ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={connectToSocket}
            disabled={socketStatus.main}
          >
            Connect to Socket
          </Button>
          
          <Button
            variant="outlined"
            color="secondary"
            onClick={disconnectFromSocket}
            disabled={!socketStatus.main}
          >
            Disconnect
          </Button>
          
          <Button
            variant="outlined"
            onClick={testTypingIndicator}
            disabled={!socketStatus.social}
          >
            Test Typing Indicator
          </Button>
          
          <Button
            variant="contained"
            color="success"
            onClick={() => setIsChatOpen(true)}
            startIcon={<ChatIcon />}
          >
            Open Chat Interface
          </Button>
        </Box>
      </Paper>

      {/* Features Overview */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 4, mb: 4 }}>
        {features.map((feature, index) => (
          <Card key={index} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ mr: 2, color: 'primary.main' }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6">{feature.title}</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {feature.description}
              </Typography>
              
              <List dense>
                {feature.features.map((item, itemIndex) => (
                  <ListItem key={itemIndex} sx={{ py: 0.5 }}>
                    <ListItemText
                      primary={item}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Technical Implementation */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Technical Implementation
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Backend Components
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Socket.io Service (socketService.js)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Message Model (Message.js)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Conversation Model (Conversation.js)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Messaging Routes (messages.js)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Server Integration (server.js)" />
              </ListItem>
            </List>
          </Box>
          
          <Box>
            <Typography variant="h6" gutterBottom>
              Frontend Components
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Socket Service (socketService.ts)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Messages API (messagesAPI.ts)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Chat Interface (ChatInterface.tsx)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Real-time Event Handlers" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Typing Indicators" />
              </ListItem>
            </List>
          </Box>
        </Box>
      </Paper>

      {/* API Endpoints */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Messaging API Endpoints
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Conversations
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="GET /api/v1/messages/conversations"
                  secondary="Get user conversations"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="POST /api/v1/messages/conversations/direct"
                  secondary="Create direct conversation"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="POST /api/v1/messages/conversations/group"
                  secondary="Create group conversation"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="GET /api/v1/messages/conversations/:id"
                  secondary="Get conversation with messages"
                />
              </ListItem>
            </List>
          </Box>
          
          <Box>
            <Typography variant="h6" gutterBottom>
              Messages
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="POST /api/v1/messages/conversations/:id/messages"
                  secondary="Send message"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="PUT /api/v1/messages/conversations/:id/messages/read"
                  secondary="Mark messages as read"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="DELETE /api/v1/messages/:id"
                  secondary="Delete message"
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="PUT /api/v1/messages/conversations/:id/mute"
                  secondary="Toggle conversation mute"
                />
              </ListItem>
            </List>
          </Box>
        </Box>
      </Paper>

      {/* Chat Interface */}
      <ChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </Container>
  );
};

export default ChatTestPage; 