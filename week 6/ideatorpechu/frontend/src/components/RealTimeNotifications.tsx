import React, { useEffect, useState } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Favorite as LikeIcon,
  Comment as CommentIcon,
  PersonAdd as FollowIcon,
  Share as ShareIcon,
  Reply as ReplyIcon,
  AlternateEmail as MentionIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import socketService, { SocketNotification } from '../services/socketService';

interface NotificationItem extends SocketNotification {
  isVisible: boolean;
}

const RealTimeNotifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<NotificationItem | null>(null);

  useEffect(() => {
    if (!user) return;

    // Listen for new notifications
    const handleNewNotification = (notification: SocketNotification) => {
      const newNotification: NotificationItem = {
        ...notification,
        isVisible: true
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10
      setCurrentNotification(newNotification);
      setOpen(true);

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setOpen(false);
        setCurrentNotification(null);
      }, 5000);
    };

    // Listen for real-time social events
    const handlePostLike = (data: any) => {
      if (data.userId !== user._id) {
        const notification: NotificationItem = {
          id: `like-${Date.now()}`,
          type: 'like',
          title: 'New Like',
          message: `${data.username} liked your post`,
          data: data,
          createdAt: new Date().toISOString(),
          isVisible: true
        };
        setCurrentNotification(notification);
        setOpen(true);
      }
    };

    const handlePostComment = (data: any) => {
      if (data.authorId !== user._id) {
        const notification: NotificationItem = {
          id: `comment-${Date.now()}`,
          type: 'comment',
          title: 'New Comment',
          message: `${data.username} commented on your post`,
          data: data,
          createdAt: new Date().toISOString(),
          isVisible: true
        };
        setCurrentNotification(notification);
        setOpen(true);
      }
    };

    const handlePostShare = (data: any) => {
      if (data.userId !== user._id) {
        const notification: NotificationItem = {
          id: `share-${Date.now()}`,
          type: 'share',
          title: 'Post Shared',
          message: `${data.username} shared your post`,
          data: data,
          createdAt: new Date().toISOString(),
          isVisible: true
        };
        setCurrentNotification(notification);
        setOpen(true);
      }
    };

    // Register event listeners
    socketService.onNotificationReceived(handleNewNotification);
    socketService.onPostLike(handlePostLike);
    socketService.onPostComment(handlePostComment);
    socketService.onPostShare(handlePostShare);

    return () => {
      // Cleanup listeners
      socketService.removeNotificationListener(handleNewNotification);
      socketService.removePostLikeListener(handlePostLike);
      socketService.removePostCommentListener(handlePostComment);
      socketService.removePostShareListener(handlePostShare);
    };
  }, [user]);

  const handleClose = () => {
    setOpen(false);
    setCurrentNotification(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <LikeIcon sx={{ color: '#e91e63' }} />;
      case 'comment':
        return <CommentIcon sx={{ color: '#2196f3' }} />;
      case 'follow':
        return <FollowIcon sx={{ color: '#4caf50' }} />;
      case 'share':
        return <ShareIcon sx={{ color: '#ff9800' }} />;
      case 'reply':
        return <ReplyIcon sx={{ color: '#9c27b0' }} />;
      case 'mention':
        return <MentionIcon sx={{ color: '#607d8b' }} />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationSeverity = (type: string) => {
    switch (type) {
      case 'like':
        return 'info';
      case 'comment':
        return 'info';
      case 'follow':
        return 'success';
      case 'share':
        return 'warning';
      case 'mention':
        return 'info';
      default:
        return 'info';
    }
  };

  if (!currentNotification) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ zIndex: 9999 }}
    >
      <Alert
        onClose={handleClose}
        severity={getNotificationSeverity(currentNotification.type)}
        sx={{
          width: '100%',
          maxWidth: 400,
          '& .MuiAlert-icon': {
            alignItems: 'center'
          }
        }}
        action={
          <IconButton
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getNotificationIcon(currentNotification.type)}
          <Box sx={{ flex: 1 }}>
            <AlertTitle sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 0.5 }}>
              {currentNotification.title}
            </AlertTitle>
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              {currentNotification.message}
            </Typography>
            {currentNotification.data?.postId && (
              <Chip
                label="View Post"
                size="small"
                sx={{ mt: 1, fontSize: '0.7rem' }}
                onClick={() => {
                  // Navigate to post
                  window.location.href = `/post/${currentNotification.data.postId}`;
                }}
              />
            )}
          </Box>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default RealTimeNotifications; 