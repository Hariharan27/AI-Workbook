import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Popper,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Chip,
  Typography,
  Divider,
  CircularProgress,
  Avatar
} from '@mui/material';
import {
  Search,
  Clear,
  History,
  TrendingUp,
  Person,
  Tag,
  Article
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../hooks/useDebounce';

interface SearchSuggestion {
  _id: string;
  type: 'user' | 'hashtag' | 'post';
  title: string;
  subtitle?: string;
  avatar?: string;
  count?: number;
}

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string, type?: string) => void;
  suggestions?: SearchSuggestion[];
  isLoading?: boolean;
  searchHistory?: string[];
  onClearHistory?: () => void;
  trendingSearches?: string[];
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search posts, users, hashtags...",
  onSearch,
  suggestions = [],
  isLoading = false,
  searchHistory = [],
  onClearHistory,
  trendingSearches = []
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      setIsOpen(true);
      onSearch?.(debouncedQuery);
    } else {
      setIsOpen(false);
    }
  }, [debouncedQuery, onSearch]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    if (event.target.value.length >= 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setAnchorEl(event.currentTarget);
    if (query.length >= 2 || searchHistory.length > 0 || trendingSearches.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow for clicks on suggestions
    setTimeout(() => setIsOpen(false), 200);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.title);
    setIsOpen(false);
    
    switch (suggestion.type) {
      case 'user':
        navigate(`/profile/${suggestion._id}`);
        break;
      case 'hashtag':
        navigate(`/hashtag/${suggestion.title.replace('#', '')}`);
        break;
      case 'post':
        navigate(`/post/${suggestion._id}`);
        break;
    }
  };

  const handleHistoryClick = (historyItem: string) => {
    setQuery(historyItem);
    setIsOpen(false);
    onSearch?.(historyItem);
  };

  const handleTrendingClick = (trendingItem: string) => {
    setQuery(trendingItem);
    setIsOpen(false);
    onSearch?.(trendingItem);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      onSearch?.(query.trim());
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Person fontSize="small" />;
      case 'hashtag':
        return <Tag fontSize="small" />;
      case 'post':
        return <Article fontSize="small" />;
      default:
        return <Search fontSize="small" />;
    }
  };

  const renderSuggestions = () => (
    <List sx={{ p: 0 }}>
      {suggestions.map((suggestion, index) => (
        <ListItem key={`${suggestion._id}-${index}`} disablePadding>
          <ListItemButton onClick={() => handleSuggestionClick(suggestion)}>
            <ListItemIcon>
              {suggestion.type === 'user' && suggestion.avatar ? (
                <Avatar src={suggestion.avatar} sx={{ width: 24, height: 24 }}>
                  {suggestion.title[0]}
                </Avatar>
              ) : (
                getSuggestionIcon(suggestion.type)
              )}
            </ListItemIcon>
            <ListItemText
              primary={suggestion.title}
              secondary={suggestion.subtitle}
            />
            {suggestion.count && (
              <Chip
                label={suggestion.count}
                size="small"
                variant="outlined"
                sx={{ ml: 1 }}
              />
            )}
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );

  const renderSearchHistory = () => (
    <>
      <Box sx={{ p: 2, pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="text.secondary">
            Recent Searches
          </Typography>
          <IconButton size="small" onClick={onClearHistory}>
            <Clear fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <List sx={{ p: 0 }}>
        {searchHistory.slice(0, 5).map((historyItem, index) => (
          <ListItem key={index} disablePadding>
            <ListItemButton onClick={() => handleHistoryClick(historyItem)}>
              <ListItemIcon>
                <History fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={historyItem} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  const renderTrendingSearches = () => (
    <>
      <Divider />
      <Box sx={{ p: 2, pb: 1 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Trending Searches
        </Typography>
      </Box>
      <Box sx={{ p: 2, pt: 0 }}>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {trendingSearches.slice(0, 8).map((trendingItem, index) => (
            <Chip
              key={index}
              label={trendingItem}
              size="small"
              icon={<TrendingUp fontSize="small" />}
              onClick={() => handleTrendingClick(trendingItem)}
              clickable
              variant="outlined"
            />
          ))}
        </Box>
      </Box>
    </>
  );

  const renderEmptyState = () => (
    <Box sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary">
        {query.length >= 2 ? 'No results found' : 'Start typing to search...'}
      </Typography>
    </Box>
  );

  const shouldShowSuggestions = suggestions.length > 0;
  const shouldShowHistory = searchHistory.length > 0 && query.length < 2;
  const shouldShowTrending = trendingSearches.length > 0 && query.length < 2;

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <form onSubmit={handleSearch}>
        <TextField
          ref={inputRef}
          fullWidth
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {isLoading && <CircularProgress size={20} />}
                {query && (
                  <IconButton size="small" onClick={handleClear}>
                    <Clear fontSize="small" />
                  </IconButton>
                )}
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: 'background.paper'
            }
          }}
        />
      </form>

      <Popper
        open={isOpen}
        anchorEl={anchorEl}
        placement="bottom-start"
        style={{ zIndex: 1300, width: anchorEl?.offsetWidth }}
      >
        <Paper
          elevation={8}
          sx={{
            mt: 1,
            maxHeight: 400,
            overflow: 'auto',
            borderRadius: 2
          }}
        >
          {shouldShowSuggestions && renderSuggestions()}
          {shouldShowHistory && renderSearchHistory()}
          {shouldShowTrending && renderTrendingSearches()}
          {!shouldShowSuggestions && !shouldShowHistory && !shouldShowTrending && renderEmptyState()}
        </Paper>
      </Popper>
    </Box>
  );
};

export default SearchBar; 