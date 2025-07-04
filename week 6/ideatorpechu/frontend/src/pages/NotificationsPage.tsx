import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Alert,
  Snackbar,
  Skeleton,
  Tabs,
  Tab
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  NotificationsNone,
  NotificationsOff,
  Settings,
  MoreVert,
  CheckCircle,
  Block,
  Flag
} from '@mui/icons-material';
import NotificationCard from '../components/NotificationCard';
import UserCard from '../components/UserCard';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { User, Notification, notificationsAPI, usersAPI } from '../services/api';

interface NotificationsPageProps {
  currentUserId?: string;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ currentUserId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: ''
  });

  const tabLabels = ['All', 'Unread', 'Following', 'Mentions'];

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch notifications
        const notificationsData = await notificationsAPI.getNotifications(1, 50);
        setNotifications(notificationsData.notifications || []);
        setUnreadCount(notificationsData.notifications?.filter(n => !n.isRead).length || 0);
        
        // Fetch suggested users
        const suggestedUsersData = await notificationsAPI.getSuggestedUsers(5);
        setSuggestedUsers(suggestedUsersData.users || []);
        
      } catch (err: any) {
        setError(err.message || 'Failed to load notifications');
        console.error('Notifications error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to mark as read' });
      console.error('Mark as read error:', err);
    }
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
    // Update unread count if the deleted notification was unread
    const deletedNotification = notifications.find(n => n._id === notificationId);
    if (deletedNotification && !deletedNotification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await usersAPI.followUser(userId);
      setSuggestedUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, isFollowing: true } : user
      ));
      setSnackbar({ open: true, message: 'User followed successfully' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to follow user' });
      console.error('Follow user error:', err);
    }
  };

  const handleUnfollowUser = (userId: string) => {
    setSuggestedUsers(prev => 
      prev.map(user => 
        user._id === userId 
          ? { ...user, isFollowing: false }
          : user
      )
    );
  };

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 0: // All
        return notifications;
      case 1: // Unread
        return notifications.filter(n => !n.isRead);
      case 2: // Following
        return notifications.filter(n => n.type === 'follow');
      case 3: // Mentions
        return notifications.filter(n => n.type === 'mention');
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  // Convert API Notification to NotificationCard Notification
  const convertNotification = (apiNotification: Notification) => {
    return {
      _id: apiNotification._id,
      type: apiNotification.type === 'reply' ? 'comment' : apiNotification.type,
      title: apiNotification.title,
      message: apiNotification.message,
      sender: apiNotification.sender,
      post: apiNotification.post ? {
        _id: apiNotification.post._id,
        content: apiNotification.post.content,
        author: {
          _id: currentUserId || '',
          username: 'currentuser',
          firstName: 'Current',
          lastName: 'User'
        }
      } : undefined,
      comment: apiNotification.comment,
      isRead: apiNotification.isRead,
      createdAt: apiNotification.createdAt,
      updatedAt: apiNotification.updatedAt
    };
  };

  const convertedNotifications = filteredNotifications.map(convertNotification);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <Box>
          <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={100} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={100} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" width="100%" height={100} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" fontWeight="bold">
            Notifications
          </Typography>
          <Box display="flex" gap={1}>
            {unreadCount > 0 && (
              <Button
                variant="outlined"
                startIcon={<NotificationsActive />}
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Settings />}
            >
              Settings
            </Button>
          </Box>
        </Box>

        {/* Stats */}
        <Box display="flex" gap={2} mb={2}>
          <Chip
            icon={<Notifications />}
            label={`${notifications.length} total`}
            variant="outlined"
          />
          <Chip
            icon={<NotificationsActive />}
            label={`${unreadCount} unread`}
            color="primary"
            variant={unreadCount > 0 ? "filled" : "outlined"}
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          {tabLabels.map((label, index) => (
            <Tab 
              key={index} 
              label={label}
              icon={index === 1 && unreadCount > 0 ? <NotificationsActive /> : undefined}
              iconPosition="end"
            />
          ))}
        </Tabs>
      </Box>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <Box textAlign="center" py={4}>
          <NotificationsOff sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {activeTab === 1 ? 'No unread notifications' : 'No notifications yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeTab === 1 
              ? 'All caught up! Check back later for new notifications.' 
              : 'When you get notifications, they\'ll appear here.'
            }
          </Typography>
        </Box>
      ) : (
        <Box>
          {convertedNotifications.map(notification => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDeleteNotification}
              onFollow={handleFollowUser}
              onUnfollow={handleUnfollowUser}
            />
          ))}
        </Box>
      )}

      {/* Suggested Users Section */}
      {activeTab === 0 && suggestedUsers.length > 0 && (
        <>
          <Divider sx={{ my: 4 }} />
          <Box>
            <Typography variant="h6" gutterBottom>
              Suggested Users
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              People you might want to follow
            </Typography>
            {suggestedUsers.map(user => (
              <UserCard
                key={user._id}
                user={user}
                variant="suggestion"
                onFollow={handleFollowUser}
                onUnfollow={handleUnfollowUser}
                currentUserId={currentUserId}
              />
            ))}
          </Box>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ open: false, message: '' })}
      >
        <Alert onClose={() => setSnackbar({ open: false, message: '' })} severity="success">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotificationsPage; 