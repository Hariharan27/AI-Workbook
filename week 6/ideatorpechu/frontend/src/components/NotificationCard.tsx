import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  IconButton,
  Chip,
  Divider,
  Skeleton
} from '@mui/material';
import {
  Favorite,
  Comment,
  Share,
  PersonAdd,
  Tag,
  Article,
  MoreVert,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

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

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
  isLoading?: boolean;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onFollow,
  onUnfollow,
  isLoading = false
}) => {
  const navigate = useNavigate();

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'like':
        return <Favorite color="error" />;
      case 'comment':
        return <Comment color="primary" />;
      case 'share':
        return <Share color="success" />;
      case 'follow':
        return <PersonAdd color="info" />;
      case 'mention':
        return <Article color="warning" />;
      case 'hashtag':
        return <Tag color="secondary" />;
      case 'post':
        return <Article color="primary" />;
      default:
        return <Article />;
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'like':
        return 'error';
      case 'comment':
        return 'primary';
      case 'share':
        return 'success';
      case 'follow':
        return 'info';
      case 'mention':
        return 'warning';
      case 'hashtag':
        return 'secondary';
      case 'post':
        return 'primary';
      default:
        return 'default';
    }
  };

  const handleCardClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'share':
        if (notification.post) {
          navigate(`/post/${notification.post._id}`);
        }
        break;
      case 'follow':
        if (notification.sender) {
          navigate(`/profile/${notification.sender._id}`);
        }
        break;
      case 'mention':
        if (notification.post) {
          navigate(`/post/${notification.post._id}`);
        }
        break;
      case 'hashtag':
        if (notification.hashtag) {
          navigate(`/hashtag/${notification.hashtag.name}`);
        }
        break;
      case 'post':
        if (notification.post) {
          navigate(`/post/${notification.post._id}`);
        }
        break;
    }
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.sender) {
      if (notification.sender._id) {
        // Check if following (you might need to add this to the notification data)
        onFollow?.(notification.sender._id);
      }
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(notification._id);
  };

  if (isLoading) {
    return (
      <Card sx={{ mb: 1, opacity: 0.7 }}>
        <CardContent>
          <Box display="flex" alignItems="flex-start" gap={2}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="40%" height={16} />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        mb: 1,
        cursor: 'pointer',
        backgroundColor: notification.isRead ? 'background.paper' : 'action.hover',
        borderLeft: `4px solid ${notification.isRead ? 'transparent' : 'primary.main'}`,
        '&:hover': {
          backgroundColor: 'action.hover',
          transform: 'translateY(-1px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ py: 2 }}>
        <Box display="flex" alignItems="flex-start" gap={2}>
          {/* Avatar */}
          <Avatar
            src={notification.sender?.avatar}
            sx={{ width: 40, height: 40, mt: 0.5 }}
          >
            {notification.sender ? 
              `${notification.sender.firstName[0]}${notification.sender.lastName[0]}` : 
              'U'
            }
          </Avatar>

          {/* Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Box sx={{ color: `${getNotificationColor()}.main` }}>
                {getNotificationIcon()}
              </Box>
              <Typography variant="body2" component="span">
                <strong>
                  {notification.sender ? 
                    `${notification.sender.firstName} ${notification.sender.lastName}` : 
                    'Someone'
                  }
                </strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" component="span">
                {notification.message}
              </Typography>
            </Box>

            {/* Post preview for relevant notifications */}
            {(notification.type === 'like' || notification.type === 'comment' || notification.type === 'share' || notification.type === 'mention') && notification.post && (
              <Box
                sx={{
                  backgroundColor: 'background.default',
                  borderRadius: 1,
                  p: 1,
                  mt: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="body2" color="text.secondary" noWrap>
                  "{notification.post.content.substring(0, 100)}..."
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  — {notification.post.author.firstName} {notification.post.author.lastName}
                </Typography>
              </Box>
            )}

            {/* Comment preview */}
            {notification.type === 'comment' && notification.comment && (
              <Box
                sx={{
                  backgroundColor: 'background.default',
                  borderRadius: 1,
                  p: 1,
                  mt: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  "{notification.comment.content.substring(0, 100)}..."
                </Typography>
              </Box>
            )}

            {/* Timestamp and actions */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </Typography>

              <Box display="flex" alignItems="center" gap={1}>
                {/* Follow/Unfollow button for follow notifications */}
                {notification.type === 'follow' && notification.sender && (
                  <Chip
                    label="Follow"
                    size="small"
                    variant="outlined"
                    onClick={handleFollowClick}
                    sx={{ cursor: 'pointer' }}
                  />
                )}

                {/* Action buttons */}
                <IconButton
                  size="small"
                  onClick={handleDeleteClick}
                  sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationCard; 