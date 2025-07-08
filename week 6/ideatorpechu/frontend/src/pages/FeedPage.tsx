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
import CommentSection from '../components/CommentSection';
import ShareModal from '../components/ShareModal';
import { postsAPI, likesAPI, sharesAPI } from '../services/api';
import { Post } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface FeedPageProps {
  currentUserId?: string;
  showPostEditor?: boolean;
  setShowPostEditor?: (show: boolean) => void;
}

const FeedPage: React.FC<FeedPageProps> = ({ currentUserId, showPostEditor, setShowPostEditor }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  // State for share modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedPostForShare, setSelectedPostForShare] = useState<Post | null>(null);

  // State for notifications
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Real API call to fetch posts
  const fetchPosts = async (pageNum: number = 1, filter: string = 'latest') => {
    try {
      setLoading(true);
      setError(null);
      
      let response: { posts: Post[]; total: number; hasMore: boolean };
      
      // Call different API endpoints based on the filter
      switch (filter) {
        case 'latest':
          // Latest: Get feed (includes your posts + posts from people you follow)
          response = await postsAPI.getFeed(pageNum, 20);
          break;
        case 'trending':
          // Trending: Get trending posts based on engagement
          response = await postsAPI.getTrendingPosts(pageNum, 20);
          break;
        case 'following':
          // Following: Get posts only from people you follow
          response = await postsAPI.getFollowingPosts(pageNum, 20);
          break;
        default:
          response = await postsAPI.getFeed(pageNum, 20);
      }
      
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

  // Listen for real-time feed updates
  useEffect(() => {
    if (!currentUser) return;

    const handleFeedUpdate = (data: any) => {
      console.log('Feed update received:', data);
      
      // Update post in the current feed
      setPosts(prev => prev.map(post => {
        if (post._id === data.postId) {
          return {
            ...post,
            stats: {
              ...post.stats,
              likesCount: data.newLikeCount || post.stats.likesCount
            }
          };
        }
        return post;
      }));
    };

    // Listen for feed updates using the socket service
    const socketService = require('../services/socketService').default;
    socketService.onFeedUpdate(handleFeedUpdate);

    return () => {
      socketService.removeFeedUpdateListener(handleFeedUpdate);
    };
  }, [currentUser]);

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
    const post = posts.find(p => p._id === postId);
    if (!post) return;

    // Use the new toggle API
    const result = await likesAPI.togglePostLike(postId);

    // Update local state based on the response with actual like count from backend
    setPosts(prev => prev.map(p => 
      p._id === postId 
        ? { 
            ...p, 
            isLiked: result.isLiked, 
            stats: {
              ...p.stats,
              likesCount: result.likesCount // Use actual count from backend
            }
          }
        : p
    ));

    setSnackbar({
      open: true,
      message: result.message,
      severity: 'success'
    });

    return result;
  };

  const handleComment = (postId: string) => {
    // Toggle comment section visibility
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  const handleShare = (postId: string) => {
    const post = posts.find(p => p._id === postId);
    if (post) {
      setSelectedPostForShare(post);
      setShareModalOpen(true);
    }
  };

  const handleShareToUser = async (userId: string, message?: string) => {
    if (!selectedPostForShare) return;
    
    try {
      await sharesAPI.sharePost(selectedPostForShare._id, { message });
      
      // Update local state
      setPosts(prev => prev.map(p => 
        p._id === selectedPostForShare._id 
          ? { 
              ...p, 
              stats: {
                ...p.stats,
                sharesCount: p.stats.sharesCount + 1
              }
            }
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

  const handleShareToPlatform = (platform: string, url: string) => {
    setSnackbar({
      open: true,
      message: `Shared to ${platform}!`,
      severity: 'success'
    });
  };

  const handleCloseShareModal = () => {
    setShareModalOpen(false);
    setSelectedPostForShare(null);
  };

  const handleEdit = (postId: string) => {
    // TODO: Open edit modal
    console.log('Edit post:', postId);
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

      {/* Share Modal */}
      {selectedPostForShare && (
        <ShareModal
          open={shareModalOpen}
          onClose={handleCloseShareModal}
          post={selectedPostForShare}
          currentUserId={currentUserId}
          onShareToUser={handleShareToUser}
          onShareToPlatform={handleShareToPlatform}
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
              <Box key={post._id}>
                <PostCard
                  post={post}
                  onLike={handleLike}
                  onComment={handleComment}
                  onShare={handleShare}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReport={handleReport}
                  currentUserId={currentUserId}
                />
                {expandedComments.has(post._id) && (
                  <CommentSection
                    postId={post._id}
                    currentUserId={currentUserId}
                    currentUser={currentUser}
                    onCommentAdded={() => {
                      // Refresh the post to update comment count
                      setPosts(prev => prev.map(p => 
                        p._id === post._id 
                          ? { 
                              ...p, 
                              stats: {
                                ...p.stats,
                                commentsCount: p.stats.commentsCount + 1
                              }
                            }
                          : p
                      ));
                    }}
                  />
                )}
              </Box>
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