import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  Chip,
  IconButton,
  Skeleton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Person,
  LocationOn,
  CalendarToday,
  MoreVert,
  CheckCircle,
  Block
} from '@mui/icons-material';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

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
  isVerified: boolean;
  isPrivate: boolean;
  isActive: boolean;
  lastSeen: string;
  stats?: {
    followersCount: number;
    followingCount: number;
    postsCount: number;
    profileViews: number;
  };
  preferences?: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'friends' | 'private';
      allowMessages: 'everyone' | 'friends' | 'none';
    };
    language: 'en' | 'ta' | 'hi';
    theme: 'light' | 'dark' | 'auto';
  };
  createdAt: string;
  updatedAt: string;
  isFollowing?: boolean;
  isBlocked?: boolean;
}

interface UserCardProps {
  user: User;
  variant?: 'compact' | 'detailed' | 'suggestion';
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
  onBlock?: (userId: string) => void;
  onUnblock?: (userId: string) => void;
  onRemove?: (userId: string) => void;
  showActions?: boolean;
  isLoading?: boolean;
  currentUserId?: string;
  showUnfollowConfirmation?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  variant = 'detailed',
  onFollow,
  onUnfollow,
  onBlock,
  onUnblock,
  onRemove,
  showActions = true,
  isLoading = false,
  currentUserId,
  showUnfollowConfirmation = true
}) => {
  const navigate = useNavigate();
  const isOwnProfile = currentUserId === user._id;
  const [followLoading, setFollowLoading] = useState(false);
  const [unfollowDialogOpen, setUnfollowDialogOpen] = useState(false);

  const handleCardClick = () => {
    navigate(`/profile/${user._id}`);
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (followLoading) return;
    
    if (user.isFollowing) {
      if (showUnfollowConfirmation) {
        setUnfollowDialogOpen(true);
      } else {
        await handleUnfollow();
      }
    } else {
      await handleFollow();
    }
  };

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      await onFollow?.(user._id);
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setFollowLoading(true);
    try {
      await onUnfollow?.(user._id);
      setUnfollowDialogOpen(false);
    } catch (error) {
      console.error('Unfollow error:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleBlockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user.isBlocked) {
      onUnblock?.(user._id);
    } else {
      onBlock?.(user._id);
    }
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(user._id);
  };

  if (isLoading) {
    return (
      <Card sx={{ mb: 1 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <Skeleton variant="circular" width={48} height={48} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="40%" height={16} />
            </Box>
            <Skeleton variant="rectangular" width={80} height={32} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const renderCompact = () => (
    <Card sx={{ mb: 1, cursor: 'pointer' }} onClick={handleCardClick}>
      <CardContent sx={{ py: 1.5 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar 
            src={user.avatar} 
            sx={{ 
              width: 40, 
              height: 40,
              bgcolor: `hsl(${(user.username?.charCodeAt(0) || 0) * 7 % 360}, 70%, 50%)`
            }}
          >
            {user.firstName?.[0]}{user.lastName?.[0]}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle2" noWrap>
                {user.firstName} {user.lastName}
              </Typography>
              {user.isVerified && (
                <CheckCircle fontSize="small" color="primary" />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" noWrap>
              @{user.username}
            </Typography>
          </Box>

          {showActions && !isOwnProfile && (
            <Button
              size="small"
              variant={user.isFollowing ? "outlined" : "contained"}
              onClick={handleFollowClick}
              disabled={followLoading}
              startIcon={followLoading ? <CircularProgress size={16} /> : undefined}
            >
              {followLoading ? 'Loading...' : (user.isFollowing ? 'Following' : 'Follow')}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const renderDetailed = () => (
    <Card sx={{ mb: 2, cursor: 'pointer' }} onClick={handleCardClick}>
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Avatar 
            src={user.avatar} 
            sx={{ 
              width: 60, 
              height: 60,
              bgcolor: `hsl(${(user.username?.charCodeAt(0) || 0) * 7 % 360}, 70%, 50%)`
            }}
          >
            {user.firstName?.[0]}{user.lastName?.[0]}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography variant="h6" noWrap>
                {user.firstName} {user.lastName}
              </Typography>
              {user.isVerified && (
                <CheckCircle fontSize="small" color="primary" />
              )}
              {user.isPrivate && (
                <Chip label="Private" size="small" color="warning" />
              )}
            </Box>
            
            <Typography variant="body2" color="text.secondary" mb={1}>
              @{user.username}
            </Typography>
            
            {user.bio && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                {user.bio}
              </Typography>
            )}
            
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              {user.location && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    {user.location}
                  </Typography>
                </Box>
              )}
              
              <Box display="flex" alignItems="center" gap={0.5}>
                <CalendarToday fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {user.createdAt && isValid(new Date(user.createdAt)) 
                    ? `Joined ${formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}`
                    : 'Recently joined'
                  }
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={3} mb={1}>
              <Box textAlign="center">
                <Typography variant="subtitle2" fontWeight="bold">
                  {user.stats?.postsCount || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Posts
                </Typography>
              </Box>
              
              <Box textAlign="center">
                <Typography variant="subtitle2" fontWeight="bold">
                  {user.stats?.followersCount || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Followers
                </Typography>
              </Box>
              
              <Box textAlign="center">
                <Typography variant="subtitle2" fontWeight="bold">
                  {user.stats?.followingCount || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Following
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {showActions && !isOwnProfile && (
            <Box display="flex" flexDirection="column" gap={1}>
              <Button
                size="small"
                variant={user.isFollowing ? "outlined" : "contained"}
                onClick={handleFollowClick}
                disabled={followLoading}
                startIcon={followLoading ? <CircularProgress size={16} /> : undefined}
              >
                {followLoading ? 'Loading...' : (user.isFollowing ? 'Following' : 'Follow')}
              </Button>
              
              <Tooltip title={user.isBlocked ? "Unblock" : "Block"}>
                <IconButton
                  size="small"
                  onClick={handleBlockClick}
                  color={user.isBlocked ? "error" : "default"}
                >
                  <Block fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          
          {!showActions && user.isFollowing && !isOwnProfile && (
            <Chip 
              label="Following" 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ alignSelf: 'flex-start' }}
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const renderSuggestion = () => (
    <Card sx={{ mb: 1, cursor: 'pointer' }} onClick={handleCardClick}>
      <CardContent sx={{ py: 1.5 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar 
            src={user.avatar} 
            sx={{ 
              width: 40, 
              height: 40,
              bgcolor: `hsl(${(user.username?.charCodeAt(0) || 0) * 7 % 360}, 70%, 50%)`
            }}
          >
            {user.firstName?.[0]}{user.lastName?.[0]}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="subtitle2" noWrap>
                {user.firstName} {user.lastName}
              </Typography>
              {user.isVerified && (
                <CheckCircle fontSize="small" color="primary" />
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" noWrap>
              @{user.username} • {user.stats?.followersCount || 0} followers
            </Typography>
          </Box>

          {showActions && !isOwnProfile && (
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                size="small"
                variant={user.isFollowing ? "outlined" : "contained"}
                onClick={handleFollowClick}
                disabled={followLoading}
                startIcon={followLoading ? <CircularProgress size={16} /> : undefined}
              >
                {followLoading ? 'Loading...' : (user.isFollowing ? 'Following' : 'Follow')}
              </Button>
              
              {onRemove && (
                <Tooltip title="Remove">
                  <IconButton size="small" onClick={handleRemoveClick}>
                    <MoreVert fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <>
      {(() => {
        switch (variant) {
          case 'compact':
            return renderCompact();
          case 'suggestion':
            return renderSuggestion();
          case 'detailed':
          default:
            return renderDetailed();
        }
      })()}

      {/* Unfollow Confirmation Dialog */}
      <Dialog
        open={unfollowDialogOpen}
        onClose={() => setUnfollowDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Unfollow User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to unfollow <strong>{user.firstName} {user.lastName}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            You won't see their posts in your feed anymore.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnfollowDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleUnfollow}
            variant="contained" 
            color="error"
            disabled={followLoading}
          >
            {followLoading ? 'Unfollowing...' : 'Unfollow'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserCard; 