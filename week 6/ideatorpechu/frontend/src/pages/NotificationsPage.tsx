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

  const tabLabels = ['All', 'Unread', 'Following', 'Mentions', 'New Posts'];

  // Function to get notification type based on tab
  const getNotificationType = (tabIndex: number): string | undefined => {
    switch (tabIndex) {
      case 0: return undefined; // All
      case 1: return undefined; // Unread (handled by backend)
      case 2: return 'follow'; // Following
      case 3: return 'mention'; // Mentions
      case 4: return 'new_post'; // New Posts
      default: return undefined;
    }
  };

  // Function to fetch notifications with proper API integration
  const fetchNotifications = async (tabIndex: number = activeTab) => {
    try {
      setLoading(true);
      setError(null);
      
      const notificationType = getNotificationType(tabIndex);
      console.log(`[NOTIFICATIONS] Fetching notifications for tab ${tabIndex} (${tabLabels[tabIndex]}), type: ${notificationType || 'all'}`);
      
      // Fetch notifications with proper filtering
      const notificationsData = await notificationsAPI.getNotifications(1, 50, notificationType);
      console.log(`[NOTIFICATIONS] Received ${notificationsData.notifications?.length || 0} notifications`);
      console.log(`[NOTIFICATIONS] Notification types:`, notificationsData.notifications?.map(n => n.type));
      
      let finalNotifications = notificationsData.notifications || [];
      
      // For unread tab, we need to filter client-side since backend doesn't support unread-only
      if (tabIndex === 1) {
        const unreadNotifications = finalNotifications.filter(n => !n.isRead);
        console.log(`[NOTIFICATIONS] Filtered to ${unreadNotifications.length} unread notifications`);
        finalNotifications = unreadNotifications;
      }
      
      setNotifications(finalNotifications);
      
      // Update unread count from total notifications (always get from "all" notifications)
      if (tabIndex !== 0) {
        // Get total unread count by fetching all notifications
        const allNotificationsData = await notificationsAPI.getNotifications(1, 50);
        const totalUnreadCount = allNotificationsData.notifications?.filter(n => !n.isRead).length || 0;
        setUnreadCount(totalUnreadCount);
      } else {
        // For "All" tab, calculate unread count from current notifications
        const totalUnreadCount = finalNotifications.filter(n => !n.isRead).length;
        setUnreadCount(totalUnreadCount);
      }
      
      // Fetch suggested users only for "All" tab
      if (tabIndex === 0) {
        try {
          const suggestedUsersData = await notificationsAPI.getSuggestedUsers(5);
          setSuggestedUsers(suggestedUsersData.users || []);
          console.log(`[NOTIFICATIONS] Fetched ${suggestedUsersData.users?.length || 0} suggested users`);
        } catch (suggestedError) {
          console.error('Failed to fetch suggested users:', suggestedError);
          // Don't fail the whole page for suggested users
        }
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
      console.error('Notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle tab changes with API calls
  const handleTabChange = async (event: React.SyntheticEvent, newValue: number) => {
    console.log(`[NOTIFICATIONS] Tab changed from ${activeTab} to ${newValue}`);
    setActiveTab(newValue);
    
    // Fetch notifications for the new tab
    await fetchNotifications(newValue);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      console.log(`[NOTIFICATIONS] Marking notification ${notificationId} as read`);
      await notificationsAPI.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      setSnackbar({ open: true, message: 'Notification marked as read' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to mark as read' });
      console.error('Mark as read error:', err);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      console.log(`[NOTIFICATIONS] Deleting notification ${notificationId}`);
      await notificationsAPI.deleteNotification(notificationId);
      
      // Update local state
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      const deletedNotification = notifications.find(n => n._id === notificationId);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      setSnackbar({ open: true, message: 'Notification deleted' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to delete notification' });
      console.error('Delete notification error:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log(`[NOTIFICATIONS] Marking all notifications as read`);
      await notificationsAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
      
      setSnackbar({ open: true, message: 'All notifications marked as read' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to mark all as read' });
      console.error('Mark all as read error:', err);
    }
  };

  const handleFollowUser = async (userId: string) => {
    try {
      console.log(`[NOTIFICATIONS] Following user ${userId}`);
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

  const handleUnfollowUser = async (userId: string) => {
    try {
      console.log(`[NOTIFICATIONS] Unfollowing user ${userId}`);
      await usersAPI.unfollowUser(userId);
      
      setSuggestedUsers(prev => 
        prev.map(user => 
          user._id === userId 
            ? { ...user, isFollowing: false }
            : user
        )
      );
      setSnackbar({ open: true, message: 'User unfollowed successfully' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to unfollow user' });
      console.error('Unfollow user error:', err);
    }
  };

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

  const convertedNotifications = notifications.map(convertNotification);

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
        <Button 
          variant="contained" 
          onClick={() => fetchNotifications()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
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
            label={`${notifications.length} ${tabLabels[activeTab].toLowerCase()}`}
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
      {convertedNotifications.length === 0 ? (
        <Box textAlign="center" py={4}>
          <NotificationsOff sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {activeTab === 1 ? 'No unread notifications' : `No ${tabLabels[activeTab].toLowerCase()} notifications`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {activeTab === 1 
              ? 'All caught up! Check back later for new notifications.' 
              : `No ${tabLabels[activeTab].toLowerCase()} notifications found.`
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