import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Skeleton,
  Alert,
  Pagination
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Tag as TagIcon,
  Article as ArticleIcon,
  TrendingUp as TrendingUpIcon,
  LocationOn as LocationOnIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import PostCard from '../components/PostCard';
import UserCard from '../components/UserCard';
import { searchAPI, usersAPI } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../contexts/AuthContext';

interface SearchResult {
  _id: string;
  type: 'user' | 'hashtag' | 'post';
  title: string;
  subtitle: string;
  avatar?: string;
  content?: string;
  count?: number;
}

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search results state
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [hashtags, setHashtags] = useState<any[]>([]);
  
  // Pagination state
  const [postsPage, setPostsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);
  const [usersTotal, setUsersTotal] = useState(0);
  
  const debouncedQuery = useDebounce(searchQuery, 500);

  // Perform search based on active tab
  const performSearch = async (query: string, tab: number, page: number = 1) => {
    if (!query.trim()) {
      setPosts([]);
      setUsers([]);
      setHashtags([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      switch (tab) {
        case 0: // Global search
          const globalResults = await searchAPI.globalSearch(query, 10);
          // Global search returns results array, we need to filter by type
          const globalPosts = globalResults.results.filter((r: any) => r.type === 'post');
          const globalUsers = globalResults.results.filter((r: any) => r.type === 'user');
          const globalHashtags = globalResults.results.filter((r: any) => r.type === 'hashtag');
          setPosts(globalPosts);
          setUsers(globalUsers);
          setHashtags(globalHashtags);
          break;
          
        case 1: // Posts
          const postsResults = await searchAPI.searchPosts(query, page, 20);
          setPosts(postsResults.posts || []);
          setPostsTotal(postsResults.total || 0);
          break;
          
        case 2: // Users
          const usersResults = await searchAPI.searchUsers(query, page, 20);
          setUsers(usersResults.users || []);
          setUsersTotal(usersResults.total || 0);
          break;
          
        case 3: // Hashtags
          const hashtagsResults = await searchAPI.searchHashtags(query, 20);
          setHashtags(hashtagsResults.hashtags || []);
          break;
      }
    } catch (err: any) {
      setError(err.message || 'Search failed');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Effect to handle URL parameters on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const queryParam = urlParams.get('q');
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [location.search]);

  // Effect to trigger search when query changes
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery, activeTab, activeTab === 1 ? postsPage : activeTab === 2 ? usersPage : 1);
    }
  }, [debouncedQuery, activeTab]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (debouncedQuery) {
      performSearch(debouncedQuery, newValue, newValue === 1 ? postsPage : newValue === 2 ? usersPage : 1);
    }
  };

  // Handle pagination
  const handlePostsPageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setPostsPage(page);
    if (debouncedQuery) {
      performSearch(debouncedQuery, 1, page);
    }
  };

  const handleUsersPageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setUsersPage(page);
    if (debouncedQuery) {
      performSearch(debouncedQuery, 2, page);
    }
  };

  // Handle navigation
  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleHashtagClick = (hashtag: string) => {
    navigate(`/hashtag/${hashtag}`);
  };

  const handlePostClick = (postId: string) => {
    // Navigate to post detail or scroll to post in feed
    navigate(`/post/${postId}`);
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await usersAPI.followUser(userId);
      // Update the user in the list to show as following
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, isFollowing: true } : user
      ));
    } catch (err: any) {
      console.error('Follow user error:', err);
    }
  };

  const handleUnfollowUser = async (userId: string) => {
    try {
      await usersAPI.unfollowUser(userId);
      // Update the user in the list to show as not following
      setUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, isFollowing: false } : user
      ));
    } catch (err: any) {
      console.error('Unfollow user error:', err);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Search
      </Typography>

      {/* Search Input */}
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search for posts, users, or hashtags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
      </Box>

      {/* Search Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="All" />
          <Tab label="Posts" />
          <Tab label="Users" />
          <Tab label="Hashtags" />
        </Tabs>
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search Results */}
      {!searchQuery ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Enter a search query to get started
          </Typography>
        </Box>
      ) : loading ? (
        <Box>
          {[...Array(3)].map((_, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="80%" />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Box>
          {/* Global Search Results */}
          {activeTab === 0 && (
            <Box>
              {/* Posts Section */}
              {posts.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Posts ({posts.length})
                  </Typography>
                  {posts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onLike={() => {}}
                      onComment={() => {}}
                      onShare={() => {}}
                    />
                  ))}
                </Box>
              )}

              {/* Users Section */}
              {users.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Users ({users.length})
                  </Typography>
                  <Box>
                    {users.map((user) => (
                      <UserCard
                        key={user._id}
                        user={user}
                        variant="compact"
                        onFollow={handleFollowUser}
                        onUnfollow={handleUnfollowUser}
                        currentUserId={currentUser?._id}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Hashtags Section */}
              {hashtags.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Hashtags ({hashtags.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {hashtags.map((hashtag) => (
                      <Chip
                        key={hashtag._id}
                        label={`#${hashtag.name}`}
                        clickable
                        onClick={() => handleHashtagClick(hashtag.name)}
                        icon={<TagIcon />}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* No Results */}
              {posts.length === 0 && users.length === 0 && hashtags.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary">
                    No results found for "{searchQuery}"
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Posts Tab */}
          {activeTab === 1 && (
            <Box>
              {posts.length > 0 ? (
                <>
                  {posts.map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onLike={() => {}}
                      onComment={() => {}}
                      onShare={() => {}}
                    />
                  ))}
                  {postsTotal > 20 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination
                        count={Math.ceil(postsTotal / 20)}
                        page={postsPage}
                        onChange={handlePostsPageChange}
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary">
                    No posts found for "{searchQuery}"
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Users Tab */}
          {activeTab === 2 && (
            <Box>
              {users.length > 0 ? (
                <>
                  <Box>
                    {users.map((user) => (
                      <UserCard
                        key={user._id}
                        user={user}
                        variant="compact"
                        onFollow={handleFollowUser}
                        onUnfollow={handleUnfollowUser}
                        currentUserId={currentUser?._id}
                      />
                    ))}
                  </Box>
                  {usersTotal > 20 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination
                        count={Math.ceil(usersTotal / 20)}
                        page={usersPage}
                        onChange={handleUsersPageChange}
                      />
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary">
                    No users found for "{searchQuery}"
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Hashtags Tab */}
          {activeTab === 3 && (
            <Box>
              {hashtags.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {hashtags.map((hashtag) => (
                    <Card key={hashtag._id} sx={{ minWidth: 200 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <TagIcon sx={{ mr: 1 }} />
                          <Typography variant="h6">
                            #{hashtag.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {hashtag.postsCount || 0} posts
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleHashtagClick(hashtag.name)}
                        >
                          View Posts
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.secondary">
                    No hashtags found for "{searchQuery}"
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default SearchPage; 