import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Button,
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Skeleton
} from '@mui/material';
import {
  Edit,
  MoreVert,
  LocationOn,
  CalendarToday,
  Link,
  People,
  PhotoLibrary,
  Bookmark,
  Settings,
  Block,
  Flag
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import PostEditor from '../components/PostEditor';
import { Post, User } from '../services/api';
import { formatDistanceToNow } from 'date-fns';

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

  const tabLabels = ['Posts', 'Media', 'Likes', 'Saved'];

  // Mock user data for development
  const mockUser: User = {
    _id: userId || '1',
    username: 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    avatar: 'https://via.placeholder.com/150',
    coverImage: 'https://via.placeholder.com/800x200',
    bio: 'Full-stack developer passionate about React, Node.js, and building amazing user experiences. 🚀',
    location: 'San Francisco, CA',
    website: 'https://johndoe.dev',
    joinedDate: '2023-01-15T00:00:00.000Z',
    isVerified: true,
    isPrivate: false,
    followersCount: 1250,
    followingCount: 890,
    postsCount: 45,
    isFollowing: false,
    isBlocked: false
  };

  // Mock posts data
  const mockPosts: Post[] = [
    {
      _id: '1',
      content: 'Just finished implementing the new feed system! 🚀 #coding #react #typescript',
      author: {
        _id: mockUser._id,
        username: mockUser.username,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        avatar: mockUser.avatar,
        joinedDate: mockUser.joinedDate,
        isVerified: mockUser.isVerified,
        isPrivate: mockUser.isPrivate,
        followersCount: mockUser.followersCount,
        followingCount: mockUser.followingCount,
        postsCount: mockUser.postsCount
      },
      hashtags: ['coding', 'react', 'typescript'],
      isPublic: true,
      likes: 15,
      comments: 5,
      shares: 2,
      isLiked: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: '2',
      content: 'Working on the IdeatorPechu project. The backend is looking great!',
      author: {
        _id: mockUser._id,
        username: mockUser.username,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        avatar: mockUser.avatar,
        joinedDate: mockUser.joinedDate,
        isVerified: mockUser.isVerified,
        isPrivate: mockUser.isPrivate,
        followersCount: mockUser.followersCount,
        followingCount: mockUser.followingCount,
        postsCount: mockUser.postsCount
      },
      isPublic: true,
      likes: 8,
      comments: 3,
      shares: 1,
      isLiked: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUser(mockUser);
        setPosts(mockPosts);
      } catch (err) {
        setError('Failed to load user profile');
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
    if (!user) return;

    try {
      // TODO: Implement follow/unfollow API call
      setUser(prev => prev ? {
        ...prev,
        isFollowing: !prev.isFollowing,
        followersCount: prev.isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
      } : null);
    } catch (err) {
      console.error('Follow error:', err);
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
    <Container maxWidth="md" sx={{ py: 2 }}>
      {/* Cover Image */}
      <Box sx={{ position: 'relative', mb: 2 }}>
        <Box
          component="img"
          src={user.coverImage}
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
                  Joined {formatDistanceToNow(new Date(user.joinedDate), { addSuffix: true })}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={3} mb={2}>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight="bold">
                  {user.postsCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Posts
                </Typography>
              </Box>
              
              <Box textAlign="center" sx={{ cursor: 'pointer' }}>
                <Typography variant="h6" fontWeight="bold">
                  {user.followersCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Followers
                </Typography>
              </Box>
              
              <Box textAlign="center" sx={{ cursor: 'pointer' }}>
                <Typography variant="h6" fontWeight="bold">
                  {user.followingCount}
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
              >
                {user.isFollowing ? 'Following' : 'Follow'}
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
    </Container>
  );
};

export default ProfilePage; 