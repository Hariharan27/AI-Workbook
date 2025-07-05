import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Avatar,
  IconButton,
  Chip,
  Box,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Comment,
  Share,
  MoreVert,
  Edit,
  Delete,
  Flag,
  LocationOn,
  AccessTime
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Post, likesAPI, User } from '../services/api';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import CircularProgress from '@mui/material/CircularProgress';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onReport?: (postId: string) => void;
  currentUserId?: string;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
  onReport,
  currentUserId
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const [likesUsers, setLikesUsers] = useState<User[]>([]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(post._id);
  };

  const handleComment = () => {
    onComment(post._id);
  };

  const handleShare = () => {
    onShare(post._id);
  };

  const handleEdit = () => {
    handleMenuClose();
    onEdit?.(post._id);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDelete?.(post._id);
  };

  const handleReport = () => {
    handleMenuClose();
    onReport?.(post._id);
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleHashtagClick = (hashtag: string) => {
    navigate(`/hashtag/${hashtag.replace('#', '')}`);
  };

  const handleMentionClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const isAuthor = currentUserId === post.author._id;

  const handleOpenLikesModal = async () => {
    setLikesModalOpen(true);
    setLikesLoading(true);
    try {
      const res = await likesAPI.getPostLikes(post._id);
      setLikesUsers(res.users);
    } catch (err) {
      setLikesUsers([]);
    } finally {
      setLikesLoading(false);
    }
  };

  const handleCloseLikesModal = () => {
    setLikesModalOpen(false);
    setLikesUsers([]);
  };

  return (
    <Card sx={{ mb: 2, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      {/* Post Header */}
      <CardContent sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => handleUserClick(post.author._id)}>
            <Avatar
              src={post.author.avatar}
              sx={{ 
                width: 40, 
                height: 40, 
                mr: 2,
                bgcolor: `hsl(${(post.author.username?.charCodeAt(0) || 0) * 7 % 360}, 70%, 50%)`
              }}
            >
              {post.author.firstName?.[0]}{post.author.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {post.author.firstName} {post.author.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{post.author.username}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center">
            {post.location && (
              <Tooltip title={post.location}>
                <IconButton size="small" sx={{ mr: 1 }}>
                  <LocationOn fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              <AccessTime fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </Typography>
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      </CardContent>

      {/* Post Content */}
      <CardContent sx={{ pt: 0, pb: 1 }}>
        <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
          {post.content.split(' ').map((word, index) => {
            if (word.startsWith('#')) {
              return (
                <Chip
                  key={index}
                  label={word}
                  size="small"
                  sx={{ mr: 0.5, mb: 0.5, cursor: 'pointer' }}
                  onClick={() => handleHashtagClick(word)}
                />
              );
            }
            if (word.startsWith('@')) {
              const mention = post.mentions?.find(m => `@${m.username}` === word);
              if (mention) {
                return (
                  <Chip
                    key={index}
                    label={word}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 0.5, mb: 0.5, cursor: 'pointer' }}
                    onClick={() => handleMentionClick(mention._id)}
                  />
                );
              }
            }
            return word + ' ';
          })}
        </Typography>

        {/* Media Display */}
        {post.media && post.media.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: post.media.length === 1 ? '1fr' : '1fr 1fr',
                gap: 1
              }}
            >
              {post.media.map((mediaUrl, index) => (
                <Box
                  key={index}
                  component="img"
                  src={mediaUrl}
                  alt={`Post media ${index + 1}`}
                  sx={{
                    width: '100%',
                    height: post.media!.length === 1 ? 300 : 150,
                    objectFit: 'cover',
                    borderRadius: 1,
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {post.hashtags.map((hashtag, index) => (
              <Chip
                key={index}
                label={hashtag}
                size="small"
                sx={{ mr: 0.5, mb: 0.5, cursor: 'pointer' }}
                onClick={() => handleHashtagClick(hashtag)}
              />
            ))}
          </Box>
        )}
      </CardContent>

      <Divider />

      {/* Engagement Stats */}
      <CardContent sx={{ py: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={handleOpenLikesModal}>
              {post.stats.likesCount} likes
            </span>
            {' • '}{post.stats.commentsCount} comments • {post.stats.sharesCount} shares
          </Typography>
          {!post.isPublic && (
            <Chip label="Private" size="small" color="warning" />
          )}
        </Box>
      </CardContent>

      <Divider />

      {/* Action Buttons */}
      <CardActions sx={{ justifyContent: 'space-around', py: 1 }}>
        <Tooltip title={isLiked ? 'Unlike' : 'Like'}>
          <IconButton
            onClick={handleLike}
            color={isLiked ? 'error' : 'default'}
            sx={{ 
              '&:hover': { 
                backgroundColor: isLiked ? 'error.light' : 'action.hover' 
              } 
            }}
          >
            {isLiked ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
        </Tooltip>

        <Tooltip title="Comment">
          <IconButton onClick={handleComment}>
            <Comment />
          </IconButton>
        </Tooltip>

        <Tooltip title="Share">
          <IconButton onClick={handleShare}>
            <Share />
          </IconButton>
        </Tooltip>
      </CardActions>

      {/* Post Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {isAuthor && (
          <>
            <MenuItem onClick={handleEdit}>
              <ListItemIcon>
                <Edit fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Post</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDelete}>
              <ListItemIcon>
                <Delete fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete Post</ListItemText>
            </MenuItem>
          </>
        )}
        <MenuItem onClick={handleReport}>
          <ListItemIcon>
            <Flag fontSize="small" />
          </ListItemIcon>
          <ListItemText>Report Post</ListItemText>
        </MenuItem>
      </Menu>

      {/* Likes Modal */}
      <Dialog open={likesModalOpen} onClose={handleCloseLikesModal} maxWidth="xs" fullWidth>
        <DialogTitle>Liked by</DialogTitle>
        <DialogContent>
          {likesLoading ? (
            <Box display="flex" justifyContent="center" p={2}><CircularProgress /></Box>
          ) : likesUsers.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" py={2}>
              No likes yet
            </Typography>
          ) : (
            <List>
              {likesUsers.map(user => (
                <ListItem key={user._id}>
                  <ListItemAvatar>
                    <Avatar src={user.avatar}>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${user.firstName} ${user.lastName}`}
                    secondary={`@${user.username}`}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PostCard; 