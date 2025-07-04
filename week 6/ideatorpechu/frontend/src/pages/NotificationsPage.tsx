import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Skeleton,
  Chip
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  NotificationsOff,
  ClearAll,
  Settings
} from '@mui/icons-material';
import NotificationCard from '../components/NotificationCard';
import UserCard from '../components/UserCard';

interface Notification {
  _id: string;
  type: 'like' | 'comment' | 'share' | 'follow' | 'mention' | 'hashtag' | 'post';
  title: string;
  message: string;
  sender?: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  post?: {
    _id: string;
    content: string;
    author: {
      _id: string;
      username: string;
      firstName: string;
      lastName: string;
    };
  };
  comment?: {
    _id: string;
    content: string;
  };
  hashtag?: {
    name: string;
  };
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  dateOfBirth?: string;
  joinedDate: string;
  isVerified: boolean;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowing?: boolean;
  isBlocked?: boolean;
}

interface NotificationsPageProps {
  currentUserId?: string;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ currentUserId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const tabLabels = ['All', 'Unread', 'Following', 'Mentions'];

  // Mock notifications data for development
  const mockNotifications: Notification[] = [
    {
      _id: '1',
      type: 'like',
      title: 'John Doe liked your post',
      message: 'liked your post',
      sender: {
        _id: '1',
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'https://via.placeholder.com/40'
      },
      post: {
        _id: '1',
        content: 'Just finished implementing the new feed system! 🚀 #coding #react #typescript',
        author: {
          _id: currentUserId || 'current',
          username: 'currentuser',
          firstName: 'Current',
          lastName: 'User'
        }
      },
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: '2',
      type: 'comment',
      title: 'Jane Smith commented on your post',
      message: 'commented on your post',
      sender: {
        _id: '2',
        username: 'janesmith',
        firstName: 'Jane',
        lastName: 'Smith',
        avatar: 'https://via.placeholder.com/40'
      },
      post: {
        _id: '1',
        content: 'Just finished implementing the new feed system! 🚀 #coding #react #typescript',
        author: {
          _id: currentUserId || 'current',
          username: 'currentuser',
          firstName: 'Current',
          lastName: 'User'
        }
      },
      comment: {
        _id: '1',
        content: 'Great work! The implementation looks solid.'
      },
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: '3',
      type: 'follow',
      title: 'New User started following you',
      message: 'started following you',
      sender: {
        _id: '3',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        avatar: 'https://via.placeholder.com/40'
      },
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Mock suggested users data
  const mockSuggestedUsers: User[] = [
    {
      _id: '4',
      username: 'developer1',
      firstName: 'Alex',
      lastName: 'Johnson',
      email: 'alex@example.com',
      avatar: 'https://via.placeholder.com/40',
      coverImage: undefined,
      bio: 'Full-stack developer passionate about React and Node.js',
      location: 'San Francisco, CA',
      website: 'https://alexjohnson.dev',
      dateOfBirth: undefined,
      joinedDate: '2023-03-15T00:00:00.000Z',
      isVerified: true,
      isPrivate: false,
      followersCount: 1250,
      followingCount: 450,
      postsCount: 89,
      isFollowing: false,
      isBlocked: false
    },
    {
      _id: '5',
      username: 'designer1',
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'sarah@example.com',
      avatar: 'https://via.placeholder.com/40',
      coverImage: undefined,
      bio: 'UI/UX Designer creating beautiful user experiences',
      location: 'New York, NY',
      website: 'https://sarahwilson.design',
      dateOfBirth: undefined,
      joinedDate: '2023-02-20T00:00:00.000Z',
      isVerified: false,
      isPrivate: false,
      followersCount: 890,
      followingCount: 320,
      postsCount: 45,
      isFollowing: true,
      isBlocked: false
    }
  ];

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setNotifications(mockNotifications);
        setSuggestedUsers(mockSuggestedUsers);
        setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
      } catch (err) {
        setError('Failed to load notifications');
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

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification._id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
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

  const handleFollowUser = (userId: string) => {
    setSuggestedUsers(prev => 
      prev.map(user => 
        user._id === userId 
          ? { ...user, isFollowing: true }
          : user
      )
    );
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
          {filteredNotifications.map(notification => (
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
    </Container>
  );
};

export default NotificationsPage; 