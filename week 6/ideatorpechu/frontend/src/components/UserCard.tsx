import React from 'react';
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
  Tooltip
} from '@mui/material';
import {
  Person,
  LocationOn,
  CalendarToday,
  MoreVert,
  CheckCircle,
  Block
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
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
  joinedDate: string;
  isVerified: boolean;
  isPrivate: boolean;
  followersCount: number;
  followingCount: number;
  postsCount: number;
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
  currentUserId
}) => {
  const navigate = useNavigate();
  const isOwnProfile = currentUserId === user._id;

  const handleCardClick = () => {
    navigate(`/profile/${user._id}`);
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user.isFollowing) {
      onUnfollow?.(user._id);
    } else {
      onFollow?.(user._id);
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
          <Avatar src={user.avatar} sx={{ width: 40, height: 40 }}>
            {user.firstName[0]}{user.lastName[0]}
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
            >
              {user.isFollowing ? 'Following' : 'Follow'}
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
          <Avatar src={user.avatar} sx={{ width: 60, height: 60 }}>
            {user.firstName[0]}{user.lastName[0]}
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
                  Joined {formatDistanceToNow(new Date(user.joinedDate), { addSuffix: true })}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={3} mb={1}>
              <Box textAlign="center">
                <Typography variant="subtitle2" fontWeight="bold">
                  {user.postsCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Posts
                </Typography>
              </Box>
              
              <Box textAlign="center">
                <Typography variant="subtitle2" fontWeight="bold">
                  {user.followersCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Followers
                </Typography>
              </Box>
              
              <Box textAlign="center">
                <Typography variant="subtitle2" fontWeight="bold">
                  {user.followingCount}
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
              >
                {user.isFollowing ? 'Following' : 'Follow'}
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
        </Box>
      </CardContent>
    </Card>
  );

  const renderSuggestion = () => (
    <Card sx={{ mb: 1, cursor: 'pointer' }} onClick={handleCardClick}>
      <CardContent sx={{ py: 1.5 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={user.avatar} sx={{ width: 40, height: 40 }}>
            {user.firstName[0]}{user.lastName[0]}
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
              @{user.username} • {user.followersCount} followers
            </Typography>
          </Box>

          {showActions && !isOwnProfile && (
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                size="small"
                variant={user.isFollowing ? "outlined" : "contained"}
                onClick={handleFollowClick}
              >
                {user.isFollowing ? 'Following' : 'Follow'}
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

  switch (variant) {
    case 'compact':
      return renderCompact();
    case 'suggestion':
      return renderSuggestion();
    case 'detailed':
    default:
      return renderDetailed();
  }
};

export default UserCard; 