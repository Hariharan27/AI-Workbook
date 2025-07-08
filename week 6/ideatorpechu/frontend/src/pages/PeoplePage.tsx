import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Button,
  Alert,
  Skeleton,
  Card,
  CardContent
} from '@mui/material';
import {
  Search as SearchIcon,
  People,
  PersonAdd,
  Refresh,
  Group
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { usersAPI, notificationsAPI, searchAPI, User } from '../services/api';
import UserCard from '../components/UserCard';

const PeoplePage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [followingUsers, setFollowingUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Load suggested users
  useEffect(() => {
    const loadSuggestedUsers = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await notificationsAPI.getSuggestedUsers(20);
        
        // The backend already filters out followed users, but ensure isFollowing is set correctly
        const suggestedUsersWithFlag = (response.users || []).map(user => ({
          ...user,
          isFollowing: user.isFollowing || false
        }));
        
        setSuggestedUsers(suggestedUsersWithFlag);
        
        // Log the response for debugging
        console.log('Suggested users response:', response);
        console.log('Suggested users count:', suggestedUsersWithFlag.length);
      } catch (err: any) {
        setError(err.message || 'Failed to load suggested users');
        console.error('Load suggested users error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSuggestedUsers();
  }, [currentUser]);

  // Load following users
  useEffect(() => {
    const loadFollowingUsers = async () => {
      if (!currentUser) return;
      
      try {
        setFollowingLoading(true);
        setError(null);
        const response = await usersAPI.getFollowing(currentUser._id, 1, 50);
        // Set isFollowing to true for all users in the following list
        const followingUsersWithFlag = (response.users || []).map(user => ({
          ...user,
          isFollowing: true
        }));
        setFollowingUsers(followingUsersWithFlag);
      } catch (err: any) {
        setError(err.message || 'Failed to load following users');
        console.error('Load following users error:', err);
      } finally {
        setFollowingLoading(false);
      }
    };

    loadFollowingUsers();
  }, [currentUser]);

  // Search users
  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentUser) return;

    try {
      setSearchLoading(true);
      setError(null);
      
      // Use the proper search API
      const response = await searchAPI.searchUsers(searchQuery, 1, 50);
      
      // Filter out users that are already being followed
      const filteredUsers = response.users.filter(user => !user.isFollowing);
      setSearchResults(filteredUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to search users');
      console.error('Search users error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFollowUser = async (userId: string) => {
    try {
      await usersAPI.followUser(userId);
      
      // Update suggested users
      setSuggestedUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, isFollowing: true } : user
      ));
      
      // Update search results
      setSearchResults(prev => prev.map(user => 
        user._id === userId ? { ...user, isFollowing: true } : user
      ));
      
      // Add to following users
      const userToAdd = suggestedUsers.find(u => u._id === userId) || searchResults.find(u => u._id === userId);
      if (userToAdd) {
        setFollowingUsers(prev => [userToAdd, ...prev]);
      }
      
      setSnackbar({ open: true, message: 'User followed successfully', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to follow user', severity: 'error' });
      console.error('Follow user error:', err);
    }
  };

  const handleUnfollowUser = async (userId: string) => {
    try {
      await usersAPI.unfollowUser(userId);
      
      // Update suggested users
      setSuggestedUsers(prev => prev.map(user => 
        user._id === userId ? { ...user, isFollowing: false } : user
      ));
      
      // Update search results
      setSearchResults(prev => prev.map(user => 
        user._id === userId ? { ...user, isFollowing: false } : user
      ));
      
      // Remove from following users
      setFollowingUsers(prev => prev.filter(user => user._id !== userId));
      
      setSnackbar({ open: true, message: 'User unfollowed successfully', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to unfollow user', severity: 'error' });
      console.error('Unfollow user error:', err);
    }
  };

  const handleRefresh = () => {
    setSearchQuery('');
    setSearchResults([]);
    // Reload suggested users
    window.location.reload();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const renderFollowingUsers = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          People You Follow
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={() => window.location.reload()}
          disabled={followingLoading}
        >
          Refresh
        </Button>
      </Box>

      {followingLoading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {[...Array(6)].map((_, index) => (
            <Card key={index}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Skeleton variant="circular" width={48} height={48} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="text" width="40%" height={16} />
                  </Box>
                  <Skeleton variant="rectangular" width={80} height={32} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : followingUsers.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Group sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Not following anyone yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Start following people to see them here and get updates from their posts.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => setActiveTab(0)}
            startIcon={<PersonAdd />}
          >
            Find People to Follow
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {followingUsers.map(user => (
            <UserCard
              key={user._id}
              user={user}
              variant="detailed"
              onFollow={handleFollowUser}
              onUnfollow={handleUnfollowUser}
              currentUserId={currentUser?._id}
              showActions={true}
            />
          ))}
        </Box>
      )}
    </Box>
  );

  const renderSuggestedUsers = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Suggested for You
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {[...Array(6)].map((_, index) => (
            <Card key={index}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Skeleton variant="circular" width={48} height={48} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="text" width="40%" height={16} />
                  </Box>
                  <Skeleton variant="rectangular" width={80} height={32} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : suggestedUsers.length === 0 ? (
        <Box textAlign="center" py={4}>
          <People sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No suggestions available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            You're already following most users! Try searching for specific users or check back later for new suggestions.
          </Typography>
          <Button 
            variant="outlined" 
            onClick={() => setActiveTab(1)}
            startIcon={<SearchIcon />}
          >
            Search Users
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {suggestedUsers.map(user => (
            <UserCard
              key={user._id}
              user={user}
              variant="detailed"
              onFollow={handleFollowUser}
              onUnfollow={handleUnfollowUser}
              currentUserId={currentUser?._id}
            />
          ))}
        </Box>
      )}
    </Box>
  );

  const renderSearchResults = () => (
    <Box>
      <Box display="flex" gap={2} mb={3}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search users by name, username, or bio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || searchLoading}
                >
                  Search
                </Button>
              </InputAdornment>
            )
          }}
        />
      </Box>

      {searchLoading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {[...Array(6)].map((_, index) => (
            <Card key={index}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Skeleton variant="circular" width={48} height={48} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="text" width="40%" height={16} />
                  </Box>
                  <Skeleton variant="rectangular" width={80} height={32} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : searchResults.length > 0 ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {searchResults.map(user => (
            <UserCard
              key={user._id}
              user={user}
              variant="detailed"
              onFollow={handleFollowUser}
              onUnfollow={handleUnfollowUser}
              currentUserId={currentUser?._id}
            />
          ))}
        </Box>
      ) : searchQuery ? (
        <Box textAlign="center" py={4}>
          <SearchIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No users found for "{searchQuery}"
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try different keywords or check the suggested users tab.
          </Typography>
        </Box>
      ) : (
        <Box textAlign="center" py={4}>
          <SearchIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Search for users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter a name, username, or bio to find users to follow.
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          People
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Discover and connect with people on IdeatorPechu
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Success/Error Snackbar */}
      {snackbar.open && (
        <Alert 
          severity={snackbar.severity} 
          sx={{ mb: 3 }} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab 
            label="Following" 
            icon={<Group />} 
            iconPosition="start"
          />
          <Tab 
            label="Suggested" 
            icon={<PersonAdd />} 
            iconPosition="start"
          />
          <Tab 
            label="Search" 
            icon={<SearchIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && renderFollowingUsers()}
      {activeTab === 1 && renderSuggestedUsers()}
      {activeTab === 2 && renderSearchResults()}
    </Container>
  );
};

export default PeoplePage; 