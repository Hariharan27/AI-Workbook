import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Collapse,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Favorite as LikeIcon,
  FavoriteBorder as LikeOutlineIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  TrendingUp as TrendingIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import socketService from '../services/socketService';
import { Post } from '../services/api';

interface LiveFeedProps {
  posts: Post[];
  onPostUpdate: (postId: string, updates: Partial<Post>) => void;
}

interface LiveActivity {
  id: string;
  type: 'like' | 'comment' | 'share' | 'view';
  postId: string;
  userId: string;
  username: string;
  avatar?: string;
  timestamp: Date;
  content?: string;
}

const LiveFeed: React.FC<LiveFeedProps> = ({ posts, onPostUpdate }) => {
  const { user } = useAuth();
  const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([]);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    // Listen for real-time post interactions
    const handlePostLike = (data: any) => {
      const activity: LiveActivity = {
        id: `like-${Date.now()}-${Math.random()}`,
        type: 'like',
        postId: data.postId,
        userId: data.userId,
        username: data.username,
        avatar: data.avatar,
        timestamp: new Date()
      };

      setLiveActivities(prev => [activity, ...prev.slice(0, 19)]); // Keep last 20 activities

      // Update post like count with accurate count from backend
      onPostUpdate(data.postId, {
        stats: {
          likesCount: data.newLikeCount || data.likesCount || 0,
          commentsCount: 0,
          sharesCount: 0,
          viewsCount: 0
        },
        isLiked: data.userId === user._id ? data.isLiked : undefined
      });

      // Auto-remove activity after 10 seconds
      setTimeout(() => {
        setLiveActivities(prev => prev.filter(a => a.id !== activity.id));
      }, 10000);
    };

    const handlePostComment = (data: any) => {
      const activity: LiveActivity = {
        id: `comment-${Date.now()}-${Math.random()}`,
        type: 'comment',
        postId: data.postId,
        userId: data.authorId,
        username: data.username,
        avatar: data.avatar,
        timestamp: new Date(),
        content: data.content
      };

      setLiveActivities(prev => [activity, ...prev.slice(0, 19)]);

      // Update post comment count
      onPostUpdate(data.postId, {
        stats: {
          likesCount: 0,
          commentsCount: data.newCommentCount,
          sharesCount: 0,
          viewsCount: 0
        }
      });

      // Auto-remove activity after 15 seconds
      setTimeout(() => {
        setLiveActivities(prev => prev.filter(a => a.id !== activity.id));
      }, 15000);
    };

    const handlePostShare = (data: any) => {
      const activity: LiveActivity = {
        id: `share-${Date.now()}-${Math.random()}`,
        type: 'share',
        postId: data.postId,
        userId: data.userId,
        username: data.username,
        avatar: data.avatar,
        timestamp: new Date()
      };

      setLiveActivities(prev => [activity, ...prev.slice(0, 19)]);

      // Update post share count
      onPostUpdate(data.postId, {
        stats: {
          likesCount: 0,
          commentsCount: 0,
          sharesCount: data.newShareCount,
          viewsCount: 0
        }
      });

      // Auto-remove activity after 12 seconds
      setTimeout(() => {
        setLiveActivities(prev => prev.filter(a => a.id !== activity.id));
      }, 12000);
    };

    // Register event listeners
    socketService.onPostLike(handlePostLike);
    socketService.onPostComment(handlePostComment);
    socketService.onPostShare(handlePostShare);

    return () => {
      // Cleanup listeners
      socketService.removePostLikeListener(handlePostLike);
      socketService.removePostCommentListener(handlePostComment);
      socketService.removePostShareListener(handlePostShare);
    };
  }, [user, onPostUpdate]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <LikeIcon sx={{ color: '#e91e63', fontSize: 16 }} />;
      case 'comment':
        return <CommentIcon sx={{ color: '#2196f3', fontSize: 16 }} />;
      case 'share':
        return <ShareIcon sx={{ color: '#ff9800', fontSize: 16 }} />;
      case 'view':
        return <ViewIcon sx={{ color: '#607d8b', fontSize: 16 }} />;
      default:
        return <TrendingIcon sx={{ color: '#4caf50', fontSize: 16 }} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'like':
        return '#e91e63';
      case 'comment':
        return '#2196f3';
      case 'share':
        return '#ff9800';
      case 'view':
        return '#607d8b';
      default:
        return '#4caf50';
    }
  };

  const getActivityMessage = (activity: LiveActivity) => {
    switch (activity.type) {
      case 'like':
        return `${activity.username} liked a post`;
      case 'comment':
        return `${activity.username} commented on a post`;
      case 'share':
        return `${activity.username} shared a post`;
      case 'view':
        return `${activity.username} viewed a post`;
      default:
        return `${activity.username} interacted with a post`;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
  };

  const toggleActivityExpansion = (activityId: string) => {
    setExpandedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  if (liveActivities.length === 0) {
    return null;
  }

  return (
    <Box sx={{ position: 'fixed', top: 80, right: 20, zIndex: 1000, maxWidth: 350 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
        Live Activity
      </Typography>
      
      {liveActivities.map((activity) => (
        <Card
          key={activity.id}
          sx={{
            mb: 1,
            border: `2px solid ${getActivityColor(activity.type)}`,
            borderRadius: 2,
            boxShadow: 3,
            animation: 'slideIn 0.3s ease-out',
            '@keyframes slideIn': {
              '0%': {
                transform: 'translateX(100%)',
                opacity: 0
              },
              '100%': {
                transform: 'translateX(0)',
                opacity: 1
              }
            }
          }}
        >
          <CardContent sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={activity.avatar}
                sx={{ width: 32, height: 32 }}
              >
                {activity.username.charAt(0).toUpperCase()}
              </Avatar>
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  {getActivityMessage(activity)}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getActivityIcon(activity.type)}
                  <Typography variant="caption" color="text.secondary">
                    {formatTimeAgo(activity.timestamp)}
                  </Typography>
                </Box>

                {activity.content && (
                  <Collapse in={expandedActivities.has(activity.id)}>
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 1,
                        p: 1,
                        backgroundColor: 'grey.50',
                        borderRadius: 1,
                        fontStyle: 'italic'
                      }}
                    >
                      "{activity.content}"
                    </Typography>
                  </Collapse>
                )}
              </Box>

              {activity.content && (
                <IconButton
                  size="small"
                  onClick={() => toggleActivityExpansion(activity.id)}
                >
                  <Typography variant="caption" color="primary">
                    {expandedActivities.has(activity.id) ? 'Hide' : 'Show'}
                  </Typography>
                </IconButton>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default LiveFeed; 