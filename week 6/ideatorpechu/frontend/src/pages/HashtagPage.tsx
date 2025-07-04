import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Chip,
  Tabs,
  Tab,
  Button,
  Avatar,
  Card,
  CardContent,
  Skeleton,
  Alert
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  PhotoLibrary
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import PostEditor from '../components/PostEditor';
import { Post, User } from '../services/api';

interface Hashtag {
  _id: string;
  name: string;
  description?: string;
  postsCount: number;
  followersCount: number;
  isFollowing: boolean;
  trending: boolean;
  trendDirection: 'up' | 'down' | 'stable';
  topPosts: Post[];
  recentPosts: Post[];
  mediaPosts: Post[];
}

interface HashtagPageProps {
  currentUserId?: string;
}

const HashtagPage: React.FC<HashtagPageProps> = ({ currentUserId }) => {
  const { hashtagName } = useParams<{ hashtagName: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [hashtag, setHashtag] = useState<Hashtag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPostEditor, setShowPostEditor] = useState(false);

  const tabLabels = ['Top', 'Latest', 'Media', 'People'];

  // Mock hashtag data for development
  const mockHashtag: Hashtag = {
    _id: '1',
    name: hashtagName || 'react',
    description: 'React is a JavaScript library for building user interfaces. Share your React projects, tips, and experiences!',
    postsCount: 12500,
    followersCount: 8900,
    isFollowing: false,
    trending: true,
    trendDirection: 'up',
    topPosts: [
      {
        _id: '1',
        content: 'Just finished building an amazing React app with TypeScript! The new hooks are incredible. #react #typescript #webdev',
        author: {
          _id: '1',
          username: 'johndoe',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          avatar: 'https://via.placeholder.com/40',
          joinedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
          isVerified: true,
          isPrivate: false,
          followersCount: 1200,
          followingCount: 800,
          postsCount: 45
        },
        hashtags: ['react', 'typescript', 'webdev'],
        isPublic: true,
        likes: 156,
        comments: 23,
        shares: 12,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        content: 'React 18 is a game changer! The new concurrent features are mind-blowing. #react #react18 #frontend',
        author: {
          _id: '2',
          username: 'janedoe',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          avatar: 'https://via.placeholder.com/40',
          joinedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 300).toISOString(),
          isVerified: true,
          isPrivate: false,
          followersCount: 800,
          followingCount: 600,
          postsCount: 32
        },
        hashtags: ['react', 'react18', 'frontend'],
        isPublic: true,
        likes: 89,
        comments: 15,
        shares: 8,
        isLiked: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    recentPosts: [
      {
        _id: '3',
        content: 'Learning React hooks today! useState and useEffect are so powerful. #react #hooks #learning',
        author: {
          _id: '3',
          username: 'newbie',
          firstName: 'New',
          lastName: 'User',
          email: 'newbie@example.com',
          avatar: 'https://via.placeholder.com/40',
          joinedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          isVerified: false,
          isPrivate: false,
          followersCount: 15,
          followingCount: 25,
          postsCount: 3
        },
        hashtags: ['react', 'hooks', 'learning'],
        isPublic: true,
        likes: 12,
        comments: 3,
        shares: 1,
        isLiked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    mediaPosts: []
  };

  useEffect(() => {
    const fetchHashtagData = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setHashtag(mockHashtag);
      } catch (err) {
        setError('Failed to load hashtag data');
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
      // TODO: Implement follow/unfollow hashtag API call
      setHashtag(prev => prev ? {
        ...prev,
        isFollowing: !prev.isFollowing,
        followersCount: prev.isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
      } : null);
    } catch (err) {
      console.error('Follow hashtag error:', err);
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
          >
            {hashtag.isFollowing ? 'Following' : 'Follow'}
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
          {hashtag.topPosts.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No top posts yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Be the first to create a trending post with #{hashtag.name}
              </Typography>
            </Box>
          ) : (
            hashtag.topPosts.map(post => (
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
          {hashtag.recentPosts.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No recent posts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create a post with #{hashtag.name} to get started
              </Typography>
            </Box>
          ) : (
            hashtag.recentPosts.map(post => (
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
    </Container>
  );
};

export default HashtagPage; 