import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Avatar,
  Button,
  Paper,
  Grid,
  Divider,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Snackbar,
  Skeleton,
  Tabs,
  Tab,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Edit,
  MoreVert,
  LocationOn,
  Language,
  CalendarToday,
  People,
  PhotoLibrary,
  Favorite,
  Comment,
  Share,
  Bookmark,
  Settings,
  Block,
  Flag
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import PostCard from '../components/PostCard';
import PostEditor from '../components/PostEditor';
import EditPostModal from '../components/EditPostModal';
import DeletePostModal from '../components/DeletePostModal';
import { usersAPI, User, Post } from '../services/api';

interface ProfilePageProps {
  currentUserId?: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ currentUserId }) => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [unfollowDialogOpen, setUnfollowDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Edit and Delete modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const tabLabels = ['Posts', 'Media', 'Likes', 'Saved'];

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user profile
        const userData = await usersAPI.getUser(userId);
        setUser(userData);
        
        // Fetch user posts
        const postsData = await usersAPI.getUserPosts(userId, 1, 10);
        setPosts(postsData.posts);
        
      } catch (err: any) {
        setError(err.message || 'Failed to load user profile');
        console.error('Profile error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFollow = async () => {
    if (!user || !currentUserId) return;

    if (user.isFollowing) {
      setUnfollowDialogOpen(true);
    } else {
      await handleFollowUser();
    }
  };

  const handleFollowUser = async () => {
    if (!user || !currentUserId) return;

    try {
      setFollowLoading(true);
      await usersAPI.followUser(user._id);
      setUser(prev => prev ? {
        ...prev,
        isFollowing: true,
        stats: {
          followersCount: (prev.stats?.followersCount || 0) + 1,
          followingCount: prev.stats?.followingCount || 0,
          postsCount: prev.stats?.postsCount || 0,
          profileViews: prev.stats?.profileViews || 0
        }
      } : null);
      setSnackbar({ open: true, message: 'Followed user', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to follow user', severity: 'error' });
      console.error('Follow error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollowUser = async () => {
    if (!user || !currentUserId) return;

    try {
      setFollowLoading(true);
      await usersAPI.unfollowUser(user._id);
      setUser(prev => prev ? {
        ...prev,
        isFollowing: false,
        stats: {
          followersCount: (prev.stats?.followersCount || 0) - 1,
          followingCount: prev.stats?.followingCount || 0,
          postsCount: prev.stats?.postsCount || 0,
          profileViews: prev.stats?.profileViews || 0
        }
      } : null);
      setSnackbar({ open: true, message: 'Unfollowed user', severity: 'success' });
      setUnfollowDialogOpen(false);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to unfollow user', severity: 'error' });
      console.error('Unfollow error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleEditProfile = () => {
    handleMenuClose();
    // TODO: Navigate to edit profile page or open edit modal
    console.log('Edit profile');
  };

  const handleBlockUser = () => {
    handleMenuClose();
    // TODO: Implement block user functionality
    console.log('Block user');
  };

  const handleReportUser = () => {
    handleMenuClose();
    // TODO: Implement report user functionality
    console.log('Report user');
  };

  const handleCreatePost = (data: any) => {
    // TODO: Implement post creation
    console.log('Creating post:', data);
    setShowPostEditor(false);
  };

  const handleEdit = (postId: string) => {
    const post = posts.find(p => p._id === postId);
    if (post) {
      setSelectedPost(post);
      setEditModalOpen(true);
    }
  };

  const handleDelete = (postId: string) => {
    const post = posts.find(p => p._id === postId);
    if (post) {
      setSelectedPost(post);
      setDeleteModalOpen(true);
    }
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(prev => prev.map(p => 
      p._id === updatedPost._id ? updatedPost : p
    ));
    
    setSnackbar({
      open: true,
      message: 'Post updated successfully!',
      severity: 'success'
    });
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
    
    setSnackbar({
      open: true,
      message: 'Post deleted successfully!',
      severity: 'success'
    });
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedPost(null);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setSelectedPost(null);
  };

  const isOwnProfile = currentUserId === userId;

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <Box>
          <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2 }} />
          <Box display="flex" alignItems="center" mb={2}>
            <Skeleton variant="circular" width={120} height={120} sx={{ mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width={200} height={30} />
              <Skeleton variant="text" width={150} height={20} />
            </Box>
          </Box>
          <Skeleton variant="text" width="100%" height={60} />
        </Box>
      </Container>
    );
  }

  if (error || !user) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <Alert severity="error">
          {error || 'User not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Cover Image */}
      <Box sx={{ position: 'relative', mb: 2 }}>
        <Box
          component="img"
          src={user.coverImage || '/default-cover.svg'}
          alt="Cover"
          sx={{
            width: '100%',
            height: 200,
            objectFit: 'cover',
            borderRadius: 2
          }}
        />
        {isOwnProfile && (
          <IconButton
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.7)'
              }
            }}
          >
            <Edit />
          </IconButton>
        )}
      </Box>

      {/* Profile Info */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
          <Avatar
            src={user.avatar}
            sx={{ width: 120, height: 120, border: 4, borderColor: 'background.paper' }}
          >
            {user.firstName[0]}{user.lastName[0]}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Typography variant="h4" fontWeight="bold">
                {user.firstName} {user.lastName}
              </Typography>
              {user.isVerified && (
                <Chip label="Verified" size="small" color="primary" />
              )}
              {user.isPrivate && (
                <Chip label="Private" size="small" color="warning" />
              )}
            </Box>
            
            <Typography variant="body1" color="text.secondary" mb={1}>
              @{user.username}
            </Typography>
            
            {user.bio && (
              <Typography variant="body1" sx={{ mb: 1 }}>
                {user.bio}
              </Typography>
            )}
            
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              {user.location && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <LocationOn fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {user.location}
                  </Typography>
                </Box>
              )}
              
              <Box display="flex" alignItems="center" gap={0.5}>
                <CalendarToday fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={3} mb={2}>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight="bold">
                  {user.stats?.postsCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Posts
                </Typography>
              </Box>
              
              <Box textAlign="center" sx={{ cursor: 'pointer' }}>
                <Typography variant="h6" fontWeight="bold">
                  {user.stats?.followersCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Followers
                </Typography>
              </Box>
              
              <Box textAlign="center" sx={{ cursor: 'pointer' }}>
                <Typography variant="h6" fontWeight="bold">
                  {user.stats?.followingCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Following
                </Typography>
              </Box>
            </Box>
          </Box>
          
          <Box>
            {isOwnProfile ? (
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={handleEditProfile}
              >
                Edit Profile
              </Button>
            ) : (
              <Button
                variant={user.isFollowing ? "outlined" : "contained"}
                onClick={handleFollow}
                disabled={followLoading}
                startIcon={followLoading ? <CircularProgress size={16} /> : undefined}
              >
                {followLoading ? 'Loading...' : (user.isFollowing ? 'Following' : 'Follow')}
              </Button>
            )}
            
            <IconButton onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Post Editor */}
      {showPostEditor && (
        <PostEditor
          onSubmit={handleCreatePost}
          onCancel={() => setShowPostEditor(false)}
          isLoading={false}
        />
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          {tabLabels.map((label, index) => (
            <Tab key={index} label={label} />
          ))}
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {isOwnProfile && (
            <Button
              variant="contained"
              fullWidth
              onClick={() => setShowPostEditor(true)}
              sx={{ mb: 2 }}
            >
              Create Post
            </Button>
          )}
          
          {posts.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {isOwnProfile ? 'No posts yet' : 'No posts available'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isOwnProfile 
                  ? 'Create your first post to get started!' 
                  : 'This user hasn\'t posted anything yet'
                }
              </Typography>
            </Box>
          ) : (
            posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                onLike={() => {}}
                onComment={() => {}}
                onShare={() => {}}
                onEdit={() => handleEdit(post._id)}
                onDelete={() => handleDelete(post._id)}
                currentUserId={currentUserId}
              />
            ))
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box textAlign="center" py={4}>
          <PhotoLibrary sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No media posts yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Posts with photos or videos will appear here
          </Typography>
        </Box>
      )}

      {activeTab === 2 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No liked posts yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Posts you like will appear here
          </Typography>
        </Box>
      )}

      {activeTab === 3 && (
        <Box textAlign="center" py={4}>
          <Bookmark sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No saved posts yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Posts you save will appear here
          </Typography>
        </Box>
      )}

      {/* Profile Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
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
        {isOwnProfile ? (
          <>
            <MenuItem onClick={handleEditProfile}>
              <ListItemIcon>
                <Edit fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => navigate('/settings')}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem onClick={handleBlockUser}>
              <ListItemIcon>
                <Block fontSize="small" />
              </ListItemIcon>
              <ListItemText>Block User</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleReportUser}>
              <ListItemIcon>
                <Flag fontSize="small" />
              </ListItemIcon>
              <ListItemText>Report User</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

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
            onClick={handleUnfollowUser}
            variant="contained" 
            color="error"
            disabled={followLoading}
          >
            {followLoading ? 'Unfollowing...' : 'Unfollow'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Post Modal */}
      {selectedPost && (
        <EditPostModal
          post={selectedPost}
          open={editModalOpen}
          onClose={handleCloseEditModal}
          onPostUpdated={handlePostUpdated}
        />
      )}

      {/* Delete Post Modal */}
      {selectedPost && (
        <DeletePostModal
          post={selectedPost}
          open={deleteModalOpen}
          onClose={handleCloseDeleteModal}
          onPostDeleted={handlePostDeleted}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
};

export default ProfilePage; 