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
  CardContent,
  Snackbar,
  Dialog,
  DialogContent
} from '@mui/material';
import { Add } from '@mui/icons-material';
import InfiniteScroll from 'react-infinite-scroll-component';
import PostCard from '../components/PostCard';
import PostEditor from '../components/PostEditor';
import { useNavigate } from 'react-router-dom';
import { postsAPI, likesAPI, sharesAPI } from '../services/api';
import { Post } from '../services/api';

interface FeedPageProps {
  currentUserId?: string;
  showPostEditor?: boolean;
  setShowPostEditor?: (show: boolean) => void;
}

const FeedPage: React.FC<FeedPageProps> = ({ currentUserId, showPostEditor, setShowPostEditor }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // State for notifications
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Real API call to fetch posts
  const fetchPosts = async (pageNum: number = 1, filter: string = 'latest') => {
    try {
      setLoading(true);
      setError(null);
      
      // Call the backend feed API
      const response = await postsAPI.getFeed(pageNum, 20);
      
      if (pageNum === 1) {
        setPosts(response.posts);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
      }
      
      setHasMore(response.hasMore);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load posts');
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
      const post = posts.find(p => p._id === postId);
      if (!post) return;

      if (post.isLiked) {
        await likesAPI.unlikePost(postId);
      } else {
        await likesAPI.likePost(postId);
      }

      // Update local state
      setPosts(prev => prev.map(p => 
        p._id === postId 
          ? { 
              ...p, 
              isLiked: !p.isLiked, 
              likes: p.isLiked ? p.likes - 1 : p.likes + 1 
            }
          : p
      ));

      setSnackbar({
        open: true,
        message: post.isLiked ? 'Post unliked' : 'Post liked!',
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Error liking post:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to like post',
        severity: 'error'
      });
    }
  };

  const handleComment = (postId: string) => {
    // TODO: Navigate to post detail or open comment modal
    navigate(`/post/${postId}`);
  };

  const handleShare = async (postId: string) => {
    try {
      await sharesAPI.sharePost(postId);
      
      // Update local state
      setPosts(prev => prev.map(p => 
        p._id === postId 
          ? { ...p, shares: p.shares + 1 }
          : p
      ));

      setSnackbar({
        open: true,
        message: 'Post shared successfully!',
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Error sharing post:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to share post',
        severity: 'error'
      });
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

  const handleCreatePost = async (data: any) => {
    try {
      await postsAPI.createPost(data);
      setShowPostEditor?.(false);
      
      // Refresh feed to show new post
      await refreshFeed();
      
      setSnackbar({
        open: true,
        message: 'Post created successfully!',
        severity: 'success'
      });
    } catch (err: any) {
      console.error('Error creating post:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to create post',
        severity: 'error'
      });
    }
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

      {/* Post Editor Modal */}
      <Dialog
        open={showPostEditor === true}
        onClose={() => setShowPostEditor?.(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            elevation: 24
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <PostEditor
            onSubmit={handleCreatePost}
            onCancel={() => setShowPostEditor?.(false)}
            isLoading={false}
          />
        </DialogContent>
      </Dialog>

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
        onClick={() => setShowPostEditor?.(true)}
      >
        <Add />
      </Fab>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default FeedPage; 