import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  InputAdornment,
  Skeleton,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  TrendingUp,
  TrendingDown,
  Person,
  Share,
  Favorite,
  FavoriteBorder,
  Comment,
  Visibility,
  PhotoLibrary,
  People
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import PostCard from '../components/PostCard';
import PostEditor from '../components/PostEditor';
import { hashtagsAPI, Hashtag, Post, searchAPI } from '../services/api';

interface HashtagPageProps {
  currentUserId?: string;
}

const HashtagPage: React.FC<HashtagPageProps> = ({ currentUserId }) => {
  const { hashtagName } = useParams<{ hashtagName: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [hashtag, setHashtag] = useState<Hashtag | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: ''
  });

  const tabLabels = ['Top', 'Latest', 'Media', 'People'];

  useEffect(() => {
    const fetchHashtagData = async () => {
      if (!hashtagName) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch hashtag details
        const hashtagData = await hashtagsAPI.getHashtag(hashtagName);
        setHashtag(hashtagData);
        
        // Fetch posts with this hashtag
        const postsData = await searchAPI.searchPosts(`#${hashtagName}`, 1, 10);
        setPosts(postsData.posts);
        
      } catch (err: any) {
        setError(err.message || 'Failed to load hashtag data');
        console.error('Hashtag error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHashtagData();
  }, [hashtagName]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleFollow = async () => {
    if (!hashtag) return;

    try {
      setFollowLoading(true);
      if (hashtag.isFollowing) {
        await hashtagsAPI.unfollowHashtag(hashtag._id);
        setHashtag(prev => prev ? {
          ...prev,
          isFollowing: false,
          followersCount: prev.followersCount - 1
        } : null);
        setSnackbar({ open: true, message: 'Unfollowed hashtag' });
      } else {
        await hashtagsAPI.followHashtag(hashtag._id);
        setHashtag(prev => prev ? {
          ...prev,
          isFollowing: true,
          followersCount: prev.followersCount + 1
        } : null);
        setSnackbar({ open: true, message: 'Followed hashtag' });
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to follow/unfollow hashtag' });
      console.error('Follow hashtag error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCreatePost = (data: any) => {
    // TODO: Implement post creation with hashtag
    console.log('Creating post with hashtag:', data);
    setShowPostEditor(false);
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp color="success" />;
      case 'down':
        return <TrendingDown color="error" />;
      default:
        return <TrendingUp color="action" />;
    }
  };

  const getTrendText = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'Trending Up';
      case 'down':
        return 'Trending Down';
      default:
        return 'Stable';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <Box>
          <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
          <Skeleton variant="text" width={400} height={20} sx={{ mb: 3 }} />
          <Skeleton variant="rectangular" width="100%" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="100%" height={200} />
        </Box>
      </Container>
    );
  }

  if (error || !hashtag) {
    return (
      <Container maxWidth="md" sx={{ py: 2 }}>
        <Alert severity="error">
          {error || 'Hashtag not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {/* Hashtag Header */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60 }}>
            #
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight="bold">
              #{hashtag.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {hashtag.trending && getTrendIcon(hashtag.trendDirection)}
              <Typography variant="body2" color="text.secondary">
                {getTrendText(hashtag.trendDirection)}
              </Typography>
            </Box>
          </Box>
          <Button
            variant={hashtag.isFollowing ? "outlined" : "contained"}
            onClick={handleFollow}
            disabled={followLoading}
          >
            {followLoading ? <CircularProgress size={20} /> : (hashtag.isFollowing ? 'Following' : 'Follow')}
          </Button>
        </Box>

        {hashtag.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {hashtag.description}
          </Typography>
        )}

        <Box display="flex" alignItems="center" gap={3} mb={2}>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold">
              {hashtag.postsCount.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Posts
            </Typography>
          </Box>
          
          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold">
              {hashtag.followersCount.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Followers
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          fullWidth
          onClick={() => setShowPostEditor(true)}
          sx={{ mb: 2 }}
        >
          Create Post with #{hashtag.name}
        </Button>
      </Box>

      {/* Post Editor */}
      {showPostEditor && (
        <PostEditor
          onSubmit={handleCreatePost}
          onCancel={() => setShowPostEditor(false)}
          isLoading={false}
          initialHashtags={[hashtag.name]}
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
          {posts.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No top posts yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Be the first to create a trending post with #{hashtag?.name}
              </Typography>
            </Box>
          ) : (
            posts.map((post: Post) => (
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
        <Box>
          {posts.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No recent posts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create a post with #{hashtag?.name} to get started
              </Typography>
            </Box>
          ) : (
            posts.map((post: Post) => (
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

      {activeTab === 2 && (
        <Box textAlign="center" py={4}>
          <PhotoLibrary sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No media posts yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Posts with photos or videos using #{hashtag.name} will appear here
          </Typography>
        </Box>
      )}

      {activeTab === 3 && (
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Contributors
              </Typography>
              <Typography variant="body2" color="text.secondary">
                People who post most frequently with #{hashtag.name}
              </Typography>
              <Box textAlign="center" py={4}>
                <People sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  No contributor data available yet
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Related Hashtags */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Related Hashtags
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          <Chip
            label="#typescript"
            clickable
            onClick={() => navigate('/hashtag/typescript')}
          />
          <Chip
            label="#javascript"
            clickable
            onClick={() => navigate('/hashtag/javascript')}
          />
          <Chip
            label="#webdev"
            clickable
            onClick={() => navigate('/hashtag/webdev')}
          />
          <Chip
            label="#frontend"
            clickable
            onClick={() => navigate('/hashtag/frontend')}
          />
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ open: false, message: '' })}
      >
        <Alert onClose={() => setSnackbar({ open: false, message: '' })} severity="success">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default HashtagPage; 