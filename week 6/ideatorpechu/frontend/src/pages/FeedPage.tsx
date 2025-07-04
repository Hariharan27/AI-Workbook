import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Fab,
  Skeleton,
  Card,
  CardContent
} from '@mui/material';
import { Add, Refresh } from '@mui/icons-material';
import InfiniteScroll from 'react-infinite-scroll-component';
import PostCard from '../components/PostCard';
import PostEditor from '../components/PostEditor';
import { useNavigate } from 'react-router-dom';

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
  media?: string[];
  hashtags?: string[];
  mentions?: Array<{
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  }>;
  location?: string;
  isPublic: boolean;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FeedPageProps {
  currentUserId?: string;
}

const FeedPage: React.FC<FeedPageProps> = ({ currentUserId }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showPostEditor, setShowPostEditor] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for development - replace with actual API calls
  const mockPosts: Post[] = [
    {
      _id: '1',
      content: 'Just finished implementing the new feed system! 🚀 #coding #react #typescript',
      author: {
        _id: 'user1',
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'https://via.placeholder.com/40'
      },
      hashtags: ['coding', 'react', 'typescript'],
      isPublic: true,
      likes: 15,
      comments: 5,
      shares: 2,
      isLiked: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      updatedAt: new Date().toISOString()
    },
    {
      _id: '2',
      content: 'Working on the IdeatorPechu project with @johndoe. The backend is looking great!',
      author: {
        _id: 'user2',
        username: 'janedoe',
        firstName: 'Jane',
        lastName: 'Doe',
        avatar: 'https://via.placeholder.com/40'
      },
      mentions: [
        {
          _id: 'user1',
          username: 'johndoe',
          firstName: 'John',
          lastName: 'Doe'
        }
      ],
      isPublic: true,
      likes: 8,
      comments: 3,
      shares: 1,
      isLiked: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      updatedAt: new Date().toISOString()
    }
  ];

  // Simulate API call
  const fetchPosts = async (pageNum: number = 1, filter: string = 'latest') => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock API response
      const newPosts = mockPosts.map(post => ({
        ...post,
        _id: `${post._id}_${pageNum}`,
        createdAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24).toISOString()
      }));
      
      if (pageNum === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      
      setHasMore(pageNum < 3); // Mock: only 3 pages
      setPage(pageNum);
    } catch (err) {
      setError('Failed to load posts');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshFeed = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchPosts(1, ['latest', 'trending', 'following'][activeTab]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPosts(1, ['latest', 'trending', 'following'][activeTab]);
  }, [activeTab]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(1);
    setPosts([]);
    setHasMore(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(page + 1, ['latest', 'trending', 'following'][activeTab]);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      // TODO: Implement actual API call
      setPosts(prev => prev.map(post => 
        post._id === postId 
          ? { 
              ...post, 
              isLiked: !post.isLiked, 
              likes: post.isLiked ? post.likes - 1 : post.likes + 1 
            }
          : post
      ));
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleComment = (postId: string) => {
    // TODO: Navigate to post detail or open comment modal
    navigate(`/post/${postId}`);
  };

  const handleShare = async (postId: string) => {
    try {
      // TODO: Implement share functionality
      console.log('Sharing post:', postId);
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  const handleEdit = (postId: string) => {
    // TODO: Navigate to edit page or open edit modal
    navigate(`/post/${postId}/edit`);
  };

  const handleDelete = async (postId: string) => {
    try {
      // TODO: Implement delete functionality
      setPosts(prev => prev.filter(post => post._id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleReport = (postId: string) => {
    // TODO: Open report modal
    console.log('Reporting post:', postId);
  };

  const handleCreatePost = (data: any) => {
    // TODO: Implement post creation
    console.log('Creating post:', data);
    setShowPostEditor(false);
    // Refresh feed to show new post
    refreshFeed();
  };

  const tabLabels = ['Latest', 'Trending', 'Following'];

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Feed
        </Typography>
        
        {/* Filter Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            {tabLabels.map((label, index) => (
              <Tab key={index} label={label} />
            ))}
          </Tabs>
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

      {/* Feed Content */}
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && page === 1 ? (
          // Loading skeletons
          <Box>
            {[1, 2, 3].map((index) => (
              <Card key={index} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                    <Box>
                      <Skeleton variant="text" width={120} height={20} />
                      <Skeleton variant="text" width={80} height={16} />
                    </Box>
                  </Box>
                  <Skeleton variant="text" width="100%" height={60} />
                  <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <InfiniteScroll
            dataLength={posts.length}
            next={handleLoadMore}
            hasMore={hasMore}
            loader={
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress />
              </Box>
            }
            endMessage={
              <Typography variant="body2" textAlign="center" color="text.secondary" py={2}>
                No more posts to load
              </Typography>
            }
            refreshFunction={refreshFeed}
            pullDownToRefresh
            pullDownToRefreshThreshold={50}
            pullDownToRefreshContent={
              <Typography variant="body2" textAlign="center" color="text.secondary">
                Pull down to refresh
              </Typography>
            }
            releaseToRefreshContent={
              <Typography variant="body2" textAlign="center" color="text.secondary">
                Release to refresh
              </Typography>
            }
          >
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReport={handleReport}
                currentUserId={currentUserId}
              />
            ))}
          </InfiniteScroll>
        )}

        {posts.length === 0 && !loading && !error && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No posts yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeTab === 0 && "Follow some users to see their posts in your feed"}
              {activeTab === 1 && "No trending posts at the moment"}
              {activeTab === 2 && "You're not following anyone yet"}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="create post"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => setShowPostEditor(true)}
      >
        <Add />
      </Fab>
    </Container>
  );
};

export default FeedPage; 