import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close,
  Search,
  Share,
  Facebook,
  Twitter,
  LinkedIn,
  WhatsApp,
  Email,
  Link,
  ContentCopy,
  CheckCircle
} from '@mui/icons-material';
import { useDebounce } from '../hooks/useDebounce';

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isFollowing?: boolean;
}

interface Post {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  hashtags?: string[];
  createdAt: string;
}

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  post: Post;
  currentUserId?: string;
  onShareToUser?: (userId: string, message?: string) => void;
  onShareToPlatform?: (platform: string, url: string) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({
  open,
  onClose,
  post,
  currentUserId,
  onShareToUser,
  onShareToPlatform
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Mock users data for development
  const mockUsers: User[] = [
    {
      _id: '1',
      username: 'johndoe',
      firstName: 'John',
      lastName: 'Doe',
      avatar: 'https://via.placeholder.com/40',
      isFollowing: true
    },
    {
      _id: '2',
      username: 'janesmith',
      firstName: 'Jane',
      lastName: 'Smith',
      avatar: 'https://via.placeholder.com/40',
      isFollowing: false
    },
    {
      _id: '3',
      username: 'alexjohnson',
      firstName: 'Alex',
      lastName: 'Johnson',
      avatar: 'https://via.placeholder.com/40',
      isFollowing: true
    }
  ];

  useEffect(() => {
    if (open) {
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setSelectedUsers([]);
      setShareMessage('');
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (debouncedSearch) {
      const filtered = users.filter(user =>
        user.firstName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.lastName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        user.username.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [debouncedSearch, users]);

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShareToUsers = () => {
    selectedUsers.forEach(userId => {
      onShareToUser?.(userId, shareMessage);
    });
    onClose();
  };

  const handleShareToPlatform = (platform: string) => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    const message = shareMessage || `Check out this post by ${post.author.firstName} ${post.author.lastName}`;
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}&quote=${encodeURIComponent(message)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(message)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + postUrl)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=Check out this post&body=${encodeURIComponent(message + '\n\n' + postUrl)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
    
    onShareToPlatform?.(platform, postUrl);
  };

  const handleCopyLink = async () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const socialPlatforms = [
    { name: 'Facebook', icon: <Facebook />, color: '#1877F2' },
    { name: 'Twitter', icon: <Twitter />, color: '#1DA1F2' },
    { name: 'LinkedIn', icon: <LinkedIn />, color: '#0077B5' },
    { name: 'WhatsApp', icon: <WhatsApp />, color: '#25D366' },
    { name: 'Email', icon: <Email />, color: '#EA4335' }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            Share Post
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Post Preview */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Avatar src={post.author.avatar} sx={{ width: 24, height: 24 }}>
              {post.author.firstName[0]}{post.author.lastName[0]}
            </Avatar>
            <Typography variant="body2" fontWeight="bold">
              {post.author.firstName} {post.author.lastName}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {post.content.substring(0, 100)}...
          </Typography>
          {post.hashtags && post.hashtags.length > 0 && (
            <Box display="flex" flexWrap="wrap" gap={0.5}>
              {post.hashtags.slice(0, 3).map(hashtag => (
                <Chip
                  key={hashtag}
                  label={`#${hashtag}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          )}
        </Box>

        {/* Share Message */}
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Add a message to your share..."
          value={shareMessage}
          onChange={(e) => setShareMessage(e.target.value)}
          sx={{ mb: 3 }}
        />

        {/* Social Platforms */}
        <Typography variant="subtitle2" gutterBottom>
          Share to social media
        </Typography>
        <Box display="flex" gap={1} mb={3}>
          {socialPlatforms.map(platform => (
            <IconButton
              key={platform.name}
              onClick={() => handleShareToPlatform(platform.name.toLowerCase())}
              sx={{
                backgroundColor: platform.color,
                color: 'white',
                '&:hover': { backgroundColor: platform.color, opacity: 0.8 }
              }}
            >
              {platform.icon}
            </IconButton>
          ))}
        </Box>

        {/* Copy Link */}
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <Button
            variant="outlined"
            startIcon={copied ? <CheckCircle /> : <Link />}
            onClick={handleCopyLink}
            color={copied ? 'success' : 'primary'}
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Share with Users */}
        <Typography variant="subtitle2" gutterBottom>
          Share with users
        </Typography>

        {/* Search Users */}
        <TextField
          fullWidth
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
          sx={{ mb: 2 }}
        />

        {/* Users List */}
        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : filteredUsers.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
              No users found
            </Typography>
          ) : (
            <List>
              {filteredUsers.map(user => (
                <ListItem key={user._id} disablePadding>
                  <ListItemButton
                    onClick={() => handleUserSelect(user._id)}
                    selected={selectedUsers.includes(user._id)}
                  >
                    <ListItemAvatar>
                      <Avatar src={user.avatar}>
                        {user.firstName[0]}{user.lastName[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${user.firstName} ${user.lastName}`}
                      secondary={`@${user.username}`}
                    />
                    {selectedUsers.includes(user._id) && (
                      <CheckCircle color="primary" />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<Share />}
          onClick={handleShareToUsers}
          disabled={selectedUsers.length === 0}
        >
          Share with {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShareModal; 