import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Skeleton
} from '@mui/material';
import {
  Person,
  Tag,
  Article,
  TrendingUp,
  LocationOn,
  AccessTime
} from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import SearchBar from '../components/SearchBar';
import PostCard from '../components/PostCard';

interface SearchResult {
  _id: string;
  type: 'user' | 'hashtag' | 'post';
  title: string;
  subtitle?: string;
  avatar?: string;
  count?: number;
  content?: string;
  author?: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  hashtags?: string[];
  likes?: number;
  comments?: number;
  shares?: number;
  isLiked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface SearchPageProps {
  currentUserId?: string;
}

const SearchPage: React.FC<SearchPageProps> = ({ currentUserId }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const tabLabels = ['All', 'Posts', 'Users', 'Hashtags'];

  // Mock search results for development
  const mockSearchResults: SearchResult[] = [
    {
      _id: '1',
      type: 'user',
      title: 'John Doe',
      subtitle: '@johndoe',
      avatar: 'https://via.placeholder.com/40',
      count: 1250
    },
    {
      _id: '2',
      type: 'hashtag',
      title: '#react',
      subtitle: '1.2K posts',
      count: 1200
    },
    {
      _id: '3',
      type: 'post',
      title: 'React Development Tips',
      subtitle: 'By @johndoe',
      content: 'Here are some amazing React development tips that will help you build better applications...',
      author: {
        _id: '1',
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        avatar: 'https://via.placeholder.com/40'
      },
      hashtags: ['react', 'development', 'tips'],
      likes: 45,
      comments: 12,
      shares: 5,
      isLiked: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    }
  ];

  const performSearch = async (searchQuery: string, type?: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter results based on type
      let filteredResults = mockSearchResults;
      if (type && type !== 'all') {
        filteredResults = mockSearchResults.filter(result => result.type === type);
      }
      
      setResults(filteredResults);
    } catch (err) {
      setError('Failed to perform search');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query) {
      performSearch(query, ['all', 'post', 'user', 'hashtag'][activeTab]);
    }
  }, [query, activeTab]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setSearchParams({ q: searchQuery });
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'user':
        navigate(`/profile/${result._id}`);
        break;
      case 'hashtag':
        navigate(`/hashtag/${result.title.replace('#', '')}`);
        break;
      case 'post':
        navigate(`/post/${result._id}`);
        break;
    }
  };

  const renderUserResult = (result: SearchResult) => (
    <ListItem key={result._id} disablePadding>
      <ListItemButton onClick={() => handleResultClick(result)}>
        <ListItemAvatar>
          <Avatar src={result.avatar}>
            {result.title[0]}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={result.title}
          secondary={result.subtitle}
        />
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={`${result.count} followers`}
            size="small"
            variant="outlined"
          />
          <Button variant="outlined" size="small">
            Follow
          </Button>
        </Box>
      </ListItemButton>
    </ListItem>
  );

  const renderHashtagResult = (result: SearchResult) => (
    <ListItem key={result._id} disablePadding>
      <ListItemButton onClick={() => handleResultClick(result)}>
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <Tag />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={result.title}
          secondary={result.subtitle}
        />
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={`${result.count} posts`}
            size="small"
            variant="outlined"
          />
          <Button variant="outlined" size="small">
            Follow
          </Button>
        </Box>
      </ListItemButton>
    </ListItem>
  );

  const renderPostResult = (result: SearchResult) => {
    if (!result.author) return null;

    const postData = {
      _id: result._id,
      content: result.content || '',
      author: result.author,
      hashtags: result.hashtags || [],
      isPublic: true,
      likes: result.likes || 0,
      comments: result.comments || 0,
      shares: result.shares || 0,
      isLiked: result.isLiked || false,
      createdAt: result.createdAt || '',
      updatedAt: result.updatedAt || ''
    };

    return (
      <Box key={result._id} sx={{ mb: 2 }}>
        <PostCard
          post={postData}
          onLike={() => {}}
          onComment={() => {}}
          onShare={() => {}}
          currentUserId={currentUserId}
        />
      </Box>
    );
  };

  const renderResults = () => {
    if (loading) {
      return (
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
              </CardContent>
            </Card>
          ))}
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    if (results.length === 0 && query) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No results found for "{query}"
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search terms or browse trending topics
          </Typography>
        </Box>
      );
    }

    if (activeTab === 0) {
      // All results
      const users = results.filter(r => r.type === 'user');
      const hashtags = results.filter(r => r.type === 'hashtag');
      const posts = results.filter(r => r.type === 'post');

      return (
        <Box>
          {users.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Users ({users.length})
              </Typography>
              <List>
                {users.map(renderUserResult)}
              </List>
            </Box>
          )}

          {hashtags.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Hashtags ({hashtags.length})
              </Typography>
              <List>
                {hashtags.map(renderHashtagResult)}
              </List>
            </Box>
          )}

          {posts.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Posts ({posts.length})
              </Typography>
              {posts.map(renderPostResult)}
            </Box>
          )}
        </Box>
      );
    }

    if (activeTab === 1) {
      // Posts only
      const posts = results.filter(r => r.type === 'post');
      return posts.map(renderPostResult);
    }

    if (activeTab === 2) {
      // Users only
      const users = results.filter(r => r.type === 'user');
      return (
        <List>
          {users.map(renderUserResult)}
        </List>
      );
    }

    if (activeTab === 3) {
      // Hashtags only
      const hashtags = results.filter(r => r.type === 'hashtag');
      return (
        <List>
          {hashtags.map(renderHashtagResult)}
        </List>
      );
    }

    return null;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Search Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Search
        </Typography>
        <SearchBar
          placeholder="Search posts, users, hashtags..."
          onSearch={handleSearch}
          suggestions={[]}
          isLoading={loading}
        />
      </Box>

      {/* Search Results */}
      {query && (
        <Box>
          {/* Results Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              {tabLabels.map((label, index) => (
                <Tab key={index} label={label} />
              ))}
            </Tabs>
          </Box>

          {/* Results Count */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2" color="text.secondary">
              {loading ? 'Searching...' : `${results.length} results found`}
            </Typography>
            {results.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                Showing results for "{query}"
              </Typography>
            )}
          </Box>

          {/* Results Content */}
          {renderResults()}
        </Box>
      )}

      {/* Empty State */}
      {!query && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Start searching to discover content
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Search for posts, users, or hashtags to get started
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default SearchPage; 